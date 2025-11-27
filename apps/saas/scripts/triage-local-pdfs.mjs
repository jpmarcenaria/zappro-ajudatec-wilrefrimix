#!/usr/bin/env node
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

function loadEnv() {
  const root = resolve(process.cwd(), '..', '..')
  for (const p of [join(root, 'apps', 'saas', '.env'), join(root, '.env')]) {
    if (!existsSync(p)) continue
    const txt = readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      const k = m[1]
      let v = m[2]
      v = v.replace(/^"|"$/g, '')
      if (!process.env[k]) process.env[k] = v
    }
  }
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (/\.pdf$/i.test(name)) out.push({ path: p, size: st.size })
  }
  return out
}

function heuristicScore(buf) {
  const t = buf.toString('latin1').toLowerCase()
  const pos = ['service manual','manual de serviço','installation manual','operation manual','troubleshooting','error code','wiring diagram','pcb','compressor inverter','evaporator','unidade externa','unidade interna']
  const neg = ['brochure','catálogo','catalogo','marketing','datasheet','spec sheet','press release']
  let s = 0
  for (const k of pos) if (t.includes(k)) s += 1
  for (const k of neg) if (t.includes(k)) s -= 1
  if (buf.length > 400000) s += 1
  return s
}

async function classifyWithOpenAI(text) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { label: 'unknown', confidence: 0 }
  const prompt = `Classifique o PDF como service_manual, engineering_doc, marketing ou other. Responda em JSON {label, confidence}. Texto:\n${text.slice(0, 6000)}`
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Você é um classificador conciso.' }, { role: 'user', content: prompt }], max_tokens: 60, temperature: 0 })
    })
    if (!r.ok) return { label: 'unknown', confidence: 0 }
    const j = await r.json()
    const txt = j?.choices?.[0]?.message?.content || ''
    const m = txt.match(/\{\s*"label"\s*:\s*"([a-z_]+)"\s*,\s*"confidence"\s*:\s*(\d+(?:\.\d+)?)\s*\}/i)
    if (m) return { label: m[1], confidence: Number(m[2]) }
    return { label: 'unknown', confidence: 0 }
  } catch { return { label: 'unknown', confidence: 0 } }
}

async function run() {
  loadEnv()
  const root = resolve(process.cwd(), '..', '..')
  const dataDir = resolve(join(root, 'data', 'manuals'))
  const reportDir = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes'))
  mkdirSync(reportDir, { recursive: true })
  const files = existsSync(dataDir) ? walk(dataDir) : []
  const results = []
  for (const f of files) {
    const buf = readFileSync(f.path, { flag: 'r' })
    const slice = buf.slice(0, Math.min(buf.length, 1048576))
    const hscore = heuristicScore(slice)
    let label = hscore >= 2 ? 'service_manual' : hscore <= -1 ? 'marketing' : 'unknown'
    let confidence = Math.min(1, Math.max(0, (hscore + 2) / 4))
    if (label === 'unknown') {
      const ai = await classifyWithOpenAI(slice.toString('latin1'))
      label = ai.label
      confidence = ai.confidence
    }
    const uni = f.path.replace(/\\/g, '/')
    const m = uni.match(/\bdata\/manuals\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+\.pdf)$/i)
    const manufacturer = m?.[1] || ''
    const brand = m?.[2] || ''
    const model = m?.[3] || ''
    const filename = m?.[4] || ''
    results.push({ path: f.path, size: f.size, label, confidence, manufacturer, brand, model, filename })
  }
  const reportPath = join(reportDir, 'local_scan_results.json')
  writeFileSync(reportPath, JSON.stringify({ count: results.length, items: results }, null, 2))
  console.log(JSON.stringify({ count: results.length, service_manual: results.filter(r => r.label === 'service_manual').length }))
}

run()
