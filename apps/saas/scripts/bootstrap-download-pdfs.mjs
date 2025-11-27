#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pipeline as pipe } from 'node:stream/promises'

function loadDotEnv() {
  const envPath = join(process.cwd(), 'apps', 'saas', '.env')
  if (existsSync(envPath)) {
    const txt = readFileSync(envPath, 'utf8')
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

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { csv: '', outDir: 'data/manuals', parallel: 4 }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--csv') out.csv = args[++i] || ''
    else if (a === '--out') out.outDir = args[++i] || out.outDir
    else if (a === '--parallel') out.parallel = Number(args[++i] || out.parallel) || out.parallel
  }
  return out
}

function parseCsv(text) {
  const rows = []
  let cur = []
  let cell = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') { inQ = false } else { cell += ch }
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { cur.push(cell); cell = '' }
      else if (ch === '\n') { cur.push(cell); rows.push(cur); cur = []; cell = '' }
      else if (ch === '\r') { }
      else { cell += ch }
    }
  }
  if (cell.length || cur.length) { cur.push(cell); rows.push(cur) }
  const header = rows[0] || []
  const data = rows.slice(1).map(r => Object.fromEntries(header.map((h, idx) => [h.trim(), (r[idx] || '').trim()])))
  return { header, data }
}

async function headOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const ok = r.status === 200 || r.status === 206
    const isPdf = ct.includes('pdf') || url.toLowerCase().endsWith('.pdf')
    return ok && isPdf
  } catch { return false }
}

async function downloadTo(url, filePath) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`http ${res.status}`)
  const ws = createWriteStream(filePath)
  await pipe(res.body, ws)
  return filePath
}

function safeName(s) {
  return String(s || '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_\-\.]/g, '')
    .slice(0, 80)
}

async function upsertDevice(supa, brand, model, manufacturer) {
  const { data } = await supa.from('hvacr_devices').select('id').eq('brand', brand).eq('model', model).limit(1)
  let id = data?.[0]?.id
  if (!id) {
    const ins = await supa.from('hvacr_devices').insert({ brand, model, manufacturer }).select('id')
    if (ins.error) throw ins.error
    id = ins.data?.[0]?.id
  }
  return id
}

async function upsertManual(supa, deviceId, title, source, pdfUrl) {
  const { data: existing } = await supa
    .from('manuals')
    .select('id')
    .eq('device_id', deviceId)
    .eq('title', title)
    .limit(1)
    .maybeSingle()
  if (existing?.id) return existing.id
  const ins = await supa.from('manuals').insert({ device_id: deviceId, title, source, pdf_url: pdfUrl, language: 'pt-BR' }).select('id').single()
  if (ins.error) throw ins.error
  return ins.data?.id
}

async function run() {
  loadDotEnv()
  const args = parseArgs()
  const csvPath = resolve(args.csv || join('pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'biblioteca_completa_otimizada_llm.csv'))
  const outDir = resolve(args.outDir || 'data/manuals')
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openai = process.env.OPENAI_API_KEY
  if (!supaUrl || !supaKey || !openai) {
    console.error('missing env SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/OPENAI_API_KEY')
    process.exit(1)
  }
  const supa = createClient(supaUrl, supaKey)
  const text = readFileSync(csvPath, 'utf8')
  const { data } = parseCsv(text)
  const queue = [...data]
  const results = []
  const workers = Math.max(1, Math.min(10, args.parallel))
  async function worker() {
    while (queue.length) {
      const row = queue.shift()
      const brand = row.MARCA || row.BRAND || ''
      const model = row.MODELO || row.MODEL || ''
      const url = row.LINK_MANUAL || row.URL || ''
      const fonte = row.FONTE || 'fabricante'
      const manuType = row.TIPO_MANUAL || 'servico'
      if (!brand || !model || !url) { results.push({ brand, model, url, status: 'skip' }); continue }
      const ok = await headOk(url)
      if (!ok) { results.push({ brand, model, url, status: 'invalid' }); continue }
      const manuDir = join(outDir, safeName(brand), safeName(brand), safeName(model))
      const fileName = safeName(model) + '.pdf'
      const filePath = join(manuDir, fileName)
      try {
        await downloadTo(url, filePath)
        const deviceId = await upsertDevice(supa, brand, model, brand)
        await upsertManual(supa, deviceId, 'Manual de Serviço', fonte, url)
        results.push({ brand, model, url, path: filePath, status: 'ok', type: manuType })
      } catch (e) {
        results.push({ brand, model, url, error: e?.message || String(e), status: 'error' })
      }
    }
  }
  const tasks = []
  for (let i = 0; i < workers; i++) tasks.push(worker())
  await Promise.all(tasks)
  const reportPath = resolve(join('pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'bootstrap_report.json'))
  mkdirSync(dirname(reportPath), { recursive: true })
  readFileSync // prevent tree-shaking
  require('fs').writeFileSync(reportPath, JSON.stringify({ count: results.length, ok: results.filter(r => r.status === 'ok').length, invalid: results.filter(r => r.status === 'invalid').length, error: results.filter(r => r.status === 'error').length, items: results }, null, 2))
  console.log(JSON.stringify({ report: reportPath, summary: { ok: results.filter(r => r.status === 'ok').length, invalid: results.filter(r => r.status === 'invalid').length, error: results.filter(r => r.status === 'error').length } }))
}

run()

