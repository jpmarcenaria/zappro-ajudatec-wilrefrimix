#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

async function sampleBytes(url) {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-1048575', 'User-Agent': 'Mozilla/5.0', Accept: 'application/pdf,*/*' }, redirect: 'follow' })
    if (!r.ok) return ''
    const buf = await r.arrayBuffer()
    const s = Buffer.from(buf).toString('latin1')
    return s
  } catch { return '' }
}

function heuristicScore(text) {
  const t = text.toLowerCase()
  const pos = [
    'service manual','manual de serviço','manual de servico','installation manual','manual de instalação','operation manual','manual de operação','troubleshooting','diagnostic','error code','código de erro','wiring diagram','diagrama elétrico','pcb','compressor inverter','r410a','r32','btu','evaporator','condensador','refrigeração','capacitor','sensor','fan motor','outdoor unit','indoor unit','unidade externa','unidade interna'
  ]
  const neg = ['brochure','catálogo','catalogo','marketing','datasheet','spec sheet','press release','promo','imagem','foto','gallery']
  let score = 0
  for (const k of pos) if (t.includes(k)) score += 1
  for (const k of neg) if (t.includes(k)) score -= 1
  const len = text.length
  if (len > 300000) score += 1
  return score
}

async function classifyWithOpenAI(text) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { label: 'unknown', confidence: 0 }
  const prompt = `Classifique o conteúdo como uma das opções: service_manual, engineering_doc, marketing, other. Responda em JSON {label, confidence}. Texto:
${text.slice(0, 6000)}`
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Você é um classificador conciso.' }, { role: 'user', content: prompt }], max_tokens: 60, temperature: 0 })
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
  const dir = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes'))
  const validPath = resolve(join(dir, 'valid_links.json'))
  const blacklistPath = resolve(join(dir, 'blacklist.json'))
  const scanPath = resolve(join(dir, 'scan_results.json'))
  mkdirSync(dir, { recursive: true })
  const valid = existsSync(validPath) ? JSON.parse(readFileSync(validPath, 'utf8')) : []
  const blacklist = existsSync(blacklistPath) ? JSON.parse(readFileSync(blacklistPath, 'utf8')) : []
  const negSet = new Set(blacklist.map(b => b.url.toLowerCase()))
  const results = []
  for (const v of valid.slice(0, 40)) {
    if (negSet.has(v.url.toLowerCase())) continue
    const text = await sampleBytes(v.url)
    const hscore = heuristicScore(text)
    let label = hscore >= 2 ? 'service_manual' : hscore <= -1 ? 'marketing' : 'unknown'
    let confidence = Math.min(1, Math.max(0, (hscore + 2) / 4))
    if (label === 'unknown') {
      const ai = await classifyWithOpenAI(text)
      label = ai.label
      confidence = ai.confidence
    }
    results.push({ brand: v.brand, model: v.model, url: v.url, label, confidence })
    if (label !== 'service_manual') blacklist.push({ url: v.url, reason: label })
  }
  writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 2))
  writeFileSync(scanPath, JSON.stringify({ count: results.length, items: results }, null, 2))
  console.log(JSON.stringify({ count: results.length, service_manual: results.filter(r => r.label === 'service_manual').length }))
}

run()

