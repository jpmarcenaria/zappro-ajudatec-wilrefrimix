#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
async function searchTavily(q, apiKey) {
  if (!apiKey) return []
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ query: q, max_results: 10, include_answer: false })
    })
    if (!res.ok) return []
    const data = await res.json()
    const results = Array.isArray(data?.results) ? data.results : []
    return results.map(r => ({ title: r.title || '', url: r.url || '', score: r.score }))
  } catch { return [] }
}

async function searchBrave(q, apiKey) {
  if (!apiKey) return []
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=10`
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey } })
    if (!res.ok) return []
    const data = await res.json()
    const web = Array.isArray(data?.web?.results) ? data.web.results : []
    return web.map(r => ({ title: r.title || '', url: r.url || '', score: r.languageScore }))
  } catch { return [] }
}

async function crawlFirecrawl(url, apiKey) {
  if (!apiKey) return []
  try {
    const mod = await import('@mendable/firecrawl-js')
    const app = new mod.FirecrawlApp({ apiKey })
    const resp = await app.extractUrls({ url })
    const links = Array.isArray(resp?.urls) ? resp.urls : []
    return links
  } catch { return [] }
}

async function aggregateSearch(q) {
  const tavilyKey = process.env.TAVILY_API_KEY || ''
  const braveKey = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY || ''
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || ''
  const base = [
    ...(await searchTavily(q, tavilyKey)),
    ...(await searchBrave(q, braveKey))
  ]
  const results = [...base]
  for (const r of base.slice(0, 3)) {
    if (!/\.(pdf)$/i.test(r.url)) {
      const urls = await crawlFirecrawl(r.url, firecrawlKey)
      for (const u of urls) { if (/\.(pdf)$/i.test(u)) results.push({ title: 'PDF', url: u }) }
    }
  }
  const seen = new Set()
  const out = []
  for (const r of results) { const key = r.url.toLowerCase(); if (seen.has(key)) continue; seen.add(key); out.push(r) }
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

async function head(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8'
  }
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers })
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const len = Number(r.headers.get('content-length') || 0)
    return { ok: r.status >= 200 && r.status < 400, ct, len }
  } catch {
    return { ok: false, ct: '', len: 0 }
  }
}

async function sampleHash(url) {
  try {
    const r = await fetch(url, { headers: { 'Range': 'bytes=0-524287' } })
    if (!r.ok || !r.body) return ''
    const buf = await r.arrayBuffer()
    const h = createHash('sha256').update(Buffer.from(buf)).digest('hex')
    return h
  } catch {
    return ''
  }
}

async function run() {
  const root = resolve(process.cwd(), '..', '..')
  const paths = [join(root, 'apps', 'saas', '.env'), join(root, '.env')]
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
  const args = process.argv.slice(2)
  let csvArg = ''
  for (let i = 0; i < args.length; i++) { if (args[i] === '--csv') { csvArg = args[i + 1] || '' } }
  const defaultCsv = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'biblioteca_completa_otimizada_llm.csv'))
  const csvPath = resolve(csvArg || defaultCsv)
  const dir = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes'))
  mkdirSync(dir, { recursive: true })
  const text = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
  const { data } = parseCsv(text)
  const pairs = data.map(r => ({ brand: r.MARCA || r.BRAND || '', model: r.MODELO_SÉRIE || r.MODELO || r.MODEL || '' })).filter(x => x.brand && x.model)
  const blacklistPath = resolve(join(dir, 'blacklist.json'))
  const validPath = resolve(join(dir, 'valid_links.json'))
  const validCsvPath = resolve(join(dir, 'valid_links.csv'))
  const registryPath = resolve(join(dir, 'download_registry.json'))
  const blacklist = existsSync(blacklistPath) ? JSON.parse(readFileSync(blacklistPath, 'utf8')) : []
  const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : []
  const negSet = new Set(blacklist.map(b => b.url.toLowerCase()))
  const valid = []
  let checked = 0
  const trusted = [
    'daikin.com.br','daikincomfort.com','daikin.eu','daikin.pt','daikinindia.com','daikintech.co.uk',
    'lg.com','samsung.com','fujitsu-general.com','toshiba-hvacspares.com','carrierdobrasil.com.br','komeco.com.br',
    'leverosintegra.com.br','webarcondicionado.com.br','poloar.com.br','adeo.com','master.ca','media.adeo.com'
  ]
  function isTrusted(u) { try { const host = new URL(u).hostname.replace(/^www\./,'').toLowerCase(); return trusted.some(d => host.endsWith(d)) } catch { return false } }
  for (const p of pairs.slice(0, 120)) {
    const q = `${p.brand} ${p.model} (\"manual\" OR \"manual de serviço\") filetype:pdf`
    const results = await aggregateSearch(q)
    for (const r of results) {
      const u = r.url
      if (negSet.has(u.toLowerCase())) continue
      if (!/\.pdf$/i.test(u)) continue
      if (!isTrusted(u)) { blacklist.push({ url: u, reason: 'untrusted_domain' }); continue }
      const h = await head(u)
      checked++
      const isPdfCT = h.ct.includes('pdf') || h.ct.includes('octet-stream')
      if (!h.ok || !isPdfCT || h.len < 150000) { blacklist.push({ url: u, reason: !h.ok ? 'http' : h.len < 150000 ? 'too_small' : 'content_type' }); continue }
      const hash = await sampleHash(u)
      const dup = registry.find(x => x.len === h.len || (hash && x.hash === hash))
      if (dup) { blacklist.push({ url: u, reason: 'duplicate' }); continue }
      valid.push({ brand: p.brand, model: p.model, url: u, len: h.len, hash })
      registry.push({ url: u, brand: p.brand, model: p.model, len: h.len, hash })
    }
  }
  writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 2))
  writeFileSync(registryPath, JSON.stringify(registry, null, 2))
  writeFileSync(validPath, JSON.stringify(valid, null, 2))
  const headCsv = 'brand,model,url,len,hash\n'
  const csv = headCsv + valid.map(v => `${JSON.stringify(v.brand)},${JSON.stringify(v.model)},${JSON.stringify(v.url)},${v.len},${v.hash}`).join('\n')
  writeFileSync(validCsvPath, csv)
  console.log(JSON.stringify({ checked, valid: valid.length, blacklist: blacklist.length, files: { valid_json: validPath, valid_csv: validCsvPath, blacklist_json: blacklistPath, registry_json: registryPath } }))
}

run()
