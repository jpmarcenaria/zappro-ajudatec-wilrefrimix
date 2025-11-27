#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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

async function searchTavily(q, apiKey) {
  if (!apiKey) return []
  try {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ query: q, max_results: 10, include_answer: false }) })
    if (!res.ok) return []
    const data = await res.json()
    const results = Array.isArray(data?.results) ? data.results : []
    return results.map(r => ({ title: r.title || '', url: r.url || '' }))
  } catch { return [] }
}

async function head(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/pdf,*/*' } })
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    const len = Number(r.headers.get('content-length') || 0)
    return { ok: r.status >= 200 && r.status < 400, ct, len }
  } catch { return { ok: false, ct: '', len: 0 } }
}

async function run() {
  loadEnv()
  const root = resolve(process.cwd(), '..', '..')
  const dir = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes'))
  mkdirSync(dir, { recursive: true })
  const csvPath = resolve(join(dir, 'biblioteca_completa_otimizada_llm.csv'))
  const validPath = resolve(join(dir, 'valid_links.json'))
  const scanPrimary = resolve(join(dir, 'local_scan_results.json'))
  const scanFallback = resolve(join(dir, 'scan_results.json'))
  const blacklistPath = resolve(join(dir, 'blacklist.json'))
  const valid = existsSync(validPath) ? JSON.parse(readFileSync(validPath, 'utf8')) : []
  const scans = existsSync(scanPrimary)
    ? (JSON.parse(readFileSync(scanPrimary, 'utf8')).items || [])
    : (existsSync(scanFallback) ? (JSON.parse(readFileSync(scanFallback, 'utf8')).items || []) : [])
  const blacklist = existsSync(blacklistPath) ? JSON.parse(readFileSync(blacklistPath, 'utf8')) : []
  const negSet = new Set(blacklist.map(b => b.url?.toLowerCase()).filter(Boolean))
  const okPairs = new Set(scans.filter(s => s.label === 'service_manual').map(s => `${(s.brand||'').trim()}::${(s.model||'').trim()}`))

  const text = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
  const lines = text.split(/\r?\n/)
  const header = (lines[0] || '').split(',')
  const idxBrand = header.findIndex(h => /marca|brand/i.test(h))
  const idxModel = header.findIndex(h => /modelo|model/i.test(h))
  const pairs = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const brand = (cols[idxBrand] || '').trim()
    const model = (cols[idxModel] || '').trim()
    if (!brand || !model) continue
    pairs.push({ brand, model })
  }

  const missing = pairs.filter(p => !okPairs.has(`${p.brand}::${p.model}`))
  const tavilyKey = process.env.TAVILY_API_KEY || ''
  for (const p of missing.slice(0, 50)) {
    const q = `${p.brand} ${p.model} ("manual de serviço" OR "service manual" OR "installation manual") filetype:pdf`
    const results = await searchTavily(q, tavilyKey)
    for (const r of results) {
      const u = r.url
      if (!/\.pdf$/i.test(u)) continue
      if (negSet.has(u.toLowerCase())) continue
      const h = await head(u)
      const isPdfCT = h.ct.includes('pdf') || h.ct.includes('octet-stream')
      if (!h.ok || !isPdfCT || h.len < 150000) continue
      valid.push({ brand: p.brand, model: p.model, url: u, len: h.len, hash: '' })
    }
  }
  writeFileSync(validPath, JSON.stringify(valid, null, 2))
  console.log(JSON.stringify({ added: valid.length }))
}

run()
