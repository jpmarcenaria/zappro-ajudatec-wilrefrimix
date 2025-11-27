#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pipeline as pipe } from 'node:stream/promises'
import { spawn } from 'node:child_process'
let playwright = null
async function ensurePlaywright() {
  if (playwright) return playwright
  try { playwright = await import('playwright'); return playwright } catch {}
  try { playwright = await import('playwright-core'); return playwright } catch {}
  return null
}

function loadDotEnv() {
  const root = resolve(process.cwd(), '..', '..')
  const paths = [join(process.cwd(), 'apps', 'saas', '.env'), join(root, '.env')]
  for (const envPath of paths) {
    if (!existsSync(envPath)) continue
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
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8'
  }
  async function tryOnce(method) {
    const init = { method, redirect: 'follow', headers }
    if (method === 'GET') init.headers = { ...headers, Range: 'bytes=0-0' }
    const r = await fetch(url, init)
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const ok = r.status >= 200 && r.status < 400
    const isPdf = ct.includes('pdf') || url.toLowerCase().endsWith('.pdf')
    return ok && isPdf
  }
  try {
    const h = await tryOnce('HEAD')
    if (h) return true
    return await tryOnce('GET')
  } catch { return url.toLowerCase().endsWith('.pdf') }
}

async function downloadTo(url, filePath) {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8'
    },
    redirect: 'follow'
  })
  if (!res.ok || !res.body) throw new Error(`http ${res.status}`)
  const ws = createWriteStream(filePath)
  await pipe(res.body, ws)
  return filePath
}

function downloadViaCurl(url, filePath) {
  return new Promise((resolve, reject) => {
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const args = ['-L', '--fail', '--silent', '--show-error', '-A', 'Mozilla/5.0', '-o', filePath, url]
    const p = spawn('curl', args)
    let err = ''
    p.stderr.on('data', d => { err += d.toString() })
    p.on('close', code => {
      if (code === 0 && existsSync(filePath)) resolve(filePath)
      else reject(new Error(err || `curl exit ${code}`))
    })
  })
}

async function downloadViaPlaywright(url, filePath) {
  const pw = await ensurePlaywright()
  if (!pw) throw new Error('playwright_missing')
  const { chromium } = pw
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ acceptDownloads: false, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' })
  const page = await context.newPage()
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (!resp) { await browser.close(); throw new Error('no_response') }
  const ct = (resp.headers()['content-type'] || '').toLowerCase()
  if (!ct.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) { await browser.close(); throw new Error('not_pdf') }
  const buf = await resp.body()
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  await new Promise((res, rej) => { try { const ws = createWriteStream(filePath); ws.write(buf); ws.end(); ws.on('finish', res); ws.on('error', rej) } catch (e) { rej(e) } })
  await browser.close()
  return filePath
}

function downloadViaPowerShell(url, filePath) {
  return new Promise((resolve, reject) => {
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    const cmd = `Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -OutFile '${filePath.replace(/'/g, "''")}' -Headers @{ 'User-Agent'='${ua}' } -UseBasicParsing`
    const p = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', cmd])
    let err = ''
    p.stderr.on('data', d => { err += d.toString() })
    p.on('close', code => { if (code === 0 && existsSync(filePath)) resolve(filePath); else reject(new Error(err || `powershell exit ${code}`)) })
  })
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
  const validJson = resolve(join('pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'valid_links.json'))
  const root = resolve(process.cwd(), '..', '..')
  const validJsonRoot = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'valid_links.json'))
  const csvPath = resolve(args.csv || join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'biblioteca_completa_otimizada_llm.csv'))
  const outDir = resolve(args.outDir || join(root, 'data', 'manuals'))
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openai = process.env.OPENAI_API_KEY
  if (!supaUrl || !supaKey || !openai) {
    console.error('missing env SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/OPENAI_API_KEY')
    process.exit(1)
  }
  const supa = createClient(supaUrl, supaKey)
  let queue = []
  const sourceJson = existsSync(validJsonRoot) ? validJsonRoot : validJson
  if (existsSync(sourceJson)) {
    const items = JSON.parse(readFileSync(sourceJson, 'utf8')) || []
    queue = items.map(x => ({ BRAND: x.brand, MODEL: x.model, URL: x.url }))
  } else {
    const text = readFileSync(csvPath, 'utf8')
    const { data } = parseCsv(text)
    queue = data
  }
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
        try {
          await downloadTo(url, filePath)
        } catch (e1) {
          try {
            await downloadViaCurl(url, filePath)
          } catch (e2) {
            try { await downloadViaPowerShell(url, filePath) } catch (e3) { await downloadViaPlaywright(url, filePath) }
          }
        }
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
  writeFileSync(reportPath, JSON.stringify({ count: results.length, ok: results.filter(r => r.status === 'ok').length, invalid: results.filter(r => r.status === 'invalid').length, error: results.filter(r => r.status === 'error').length, items: results }, null, 2))
  console.log(JSON.stringify({ report: reportPath, summary: { ok: results.filter(r => r.status === 'ok').length, invalid: results.filter(r => r.status === 'invalid').length, error: results.filter(r => r.status === 'error').length } }))
}

run()
