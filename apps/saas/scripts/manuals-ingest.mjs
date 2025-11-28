#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'

function loadEnv() {
  const root = process.cwd()
  const candidates = [join(root, 'apps', 'saas', '.env'), join(root, '.env')]
  for (const p of candidates) {
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

function safeName(s) {
  return String(s || '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_\-\.]/g, '')
    .slice(0, 80)
}

function hashBuf(buf) { return createHash('sha1').update(buf).digest('hex') }

async function head(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' })
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const len = parseInt(r.headers.get('content-length') || '0', 10)
    return { ok: r.ok, ct, len }
  } catch { return { ok: false, ct: '', len: 0 } }
}

async function download(url, filePath) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`download_failed_${r.status}`)
  const ct = (r.headers.get('content-type') || '').toLowerCase()
  if (!ct.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) throw new Error('not_pdf')
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const buf = new Uint8Array(await r.arrayBuffer())
  await new Promise((res, rej) => { try { const ws = createWriteStream(filePath); ws.write(buf); ws.end(); ws.on('finish', res); ws.on('error', rej) } catch (e) { rej(e) } })
  return { filePath, hash: hashBuf(buf), len: buf.length }
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean)
  const header = (lines[0] || '').split(',')
  const idxBrand = header.findIndex(h => /marca|brand/i.test(h))
  const idxModel = header.findIndex(h => /modelo|model/i.test(h))
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const brand = (cols[idxBrand] || '').trim()
    const model = (cols[idxModel] || '').trim()
    if (brand && model) out.push({ brand, model })
  }
  return out
}

const TRUSTED = [
  'daikin.com.br','daikincomfort.com','daikin.eu','daikin.pt','daikinindia.com','daikintech.co.uk',
  'lg.com','samsung.com','fujitsu-general.com','toshiba-hvacspares.com','carrierdobrasil.com.br','komeco.com.br',
  'leverosintegra.com.br','webarcondicionado.com.br','poloar.com.br','media.adeo.com','master.ca'
]
function isTrusted(u) { try { const h = new URL(u).hostname.replace(/^www\./,'').toLowerCase(); return TRUSTED.some(d => h.endsWith(d)) } catch { return false } }

async function searchLinks(brand, model) {
  const q = `${brand} ${model} ("manual de serviço" OR "service manual" OR "manual tecnico") filetype:pdf`
  const items = []
  const fire = process.env.FIRECRAWL_API_KEY || ''
  const tavily = process.env.TAVILY_API_KEY || ''
  const brave = process.env.BRAVE_API_KEY || ''
  async function pushFrom(res) { for (const it of Array.isArray(res) ? res : []) { const u = typeof it?.url === 'string' ? it.url : it; if (u) items.push(u) } }
  try { if (tavily) { const r = await fetch('https://api.tavily.com/search', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${tavily}`}, body: JSON.stringify({ query:q, search_depth:'advanced', max_results:10 }) }); const j = await r.json().catch(()=>null); await pushFrom(j?.results) } } catch {}
  try { if (brave) { const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`, { headers: { 'Accept':'application/json','X-Subscription-Token':brave } }); const j = await r.json().catch(()=>null); await pushFrom(j?.web?.results?.map(x=>x.url)) } } catch {}
  try { if (fire) { const r = await fetch('https://api.firecrawl.dev/v1/search', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${fire}`}, body: JSON.stringify({ query:q, limit:10 }) }); const j = await r.json().catch(()=>null); await pushFrom(j?.results?.map(x=>x.url)) } } catch {}
  const unique = Array.from(new Set(items.map(u => u.trim()))).filter(u => u.startsWith('https://') && isTrusted(u) && /\.pdf$/i.test(u))
  const out = []
  for (const u of unique) { const h = await head(u); if (h.ok && (h.ct.includes('pdf') || h.ct.includes('octet-stream')) && h.len >= 150000) out.push({ url: u, len: h.len }) }
  return out
}

async function extractPdfText(filePath) {
  try {
    const pdfParse = await import('pdf-parse')
    const buf = readFileSync(filePath)
    const data = await pdfParse.default(buf)
    return String(data.text || '')
  } catch { return '' }
}

async function ingestViaApi(brand, model, text) {
  const base = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT||3001}`
  const url = `${base}/api/manuals/ingest`
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brand, model, title:'Manual de Serviço', source:'web', content: text }) })
  const j = await res.json().catch(()=>null)
  if (!res.ok) throw new Error(`ingest_api_error_${res.status}`)
  return j
}

async function main() {
  loadEnv()
  const root = process.cwd()
  const csvPath = resolve(join(root, 'rascunho', 'biblioteca_absoluta_completa_brasil.csv'))
  const outDir = resolve(join(root, 'data', 'manuals'))
  mkdirSync(outDir, { recursive: true })
  const reportDir = resolve(join(root, 'rascunho'))
  mkdirSync(reportDir, { recursive: true })

  const text = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
  const pairs = parseCsv(text)
  const args = process.argv.slice(2)
  if (args.includes('--plan-only')) {
    writeFileSync(resolve(join(reportDir, 'pairs.json')), JSON.stringify(pairs, null, 2))
    console.log(JSON.stringify({ total: pairs.length, plan: 'rascunho/pairs.json' }))
    return
  }
  const report = { total: pairs.length, downloaded: 0, ingested: 0, errors: [] }

  for (const { brand, model } of pairs) {
    try {
      const links = await searchLinks(brand, model)
      if (!links.length) { report.errors.push({ brand, model, error:'links_not_found' }); continue }
      const fileName = `${safeName(model)}.pdf`
      const dest = resolve(join(outDir, safeName(brand), safeName(brand), safeName(model), fileName))
      const d = await download(links[0].url, dest)
      report.downloaded++
      const text = await extractPdfText(dest)
      if (!text || text.length < 1000) { report.errors.push({ brand, model, error:'low_text' }); continue }
      const j = await ingestViaApi(brand, model, text)
      if (j?.chunks > 0) report.ingested++
    } catch (e) {
      report.errors.push({ brand, model, error: String(e?.message || e) })
    }
  }

  writeFileSync(resolve(join(reportDir, 'ingest_report.json')), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
}

main().catch(e => { console.error(e); process.exit(1) })

