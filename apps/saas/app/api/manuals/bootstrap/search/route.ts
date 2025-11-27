import { NextResponse } from 'next/server'
import { aggregateSearch } from '@/lib/websearch'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type Row = { MARCA?: string; BRAND?: string; MODELO?: string; MODEL?: string }

function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let cur: string[] = []
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
  return data as Row[]
}

async function head(url: string) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8'
  }
  const r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers })
  const ct = (r.headers.get('content-type') || '').toLowerCase()
  const len = Number(r.headers.get('content-length') || 0)
  return { ok: r.status >= 200 && r.status < 400, ct, len }
}

async function sampleHash(url: string) {
  const r = await fetch(url, { headers: { 'Range': 'bytes=0-524287' } })
  if (!r.ok || !r.body) return ''
  const buf = await r.arrayBuffer()
  const h = createHash('sha256').update(Buffer.from(buf)).digest('hex')
  return h
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const brand = body.brand as string | undefined
    const model = body.model as string | undefined
    const csvPath = join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'biblioteca_completa_otimizada_llm.csv')
    const text = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
    const rows = parseCsv(text)
    const pairs = rows.map(r => ({ brand: r.MARCA || r.BRAND || '', model: r.MODELO || r.MODEL || '' }))
      .filter(x => x.brand && x.model)
    const target = (brand && model) ? pairs.filter(p => p.brand === brand && p.model === model) : pairs

    const blacklistPath = join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'blacklist.json')
    const validPath = join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'valid_links.json')
    const validCsvPath = join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'valid_links.csv')
    const registryPath = join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'download_registry.json')
    mkdirSync(join(process.cwd(), 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes'), { recursive: true })

    const blacklist: Array<{ url: string; reason: string }> = existsSync(blacklistPath) ? JSON.parse(readFileSync(blacklistPath, 'utf8')) : []
    const registry: Array<{ url: string; brand: string; model: string; len: number; hash: string }> = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : []
    const negSet = new Set(blacklist.map(b => b.url.toLowerCase()))
    const trusted = [
      'daikin.com.br','daikincomfort.com','daikin.eu','daikin.pt','daikinindia.com','daikintech.co.uk',
      'lg.com','samsung.com','fujitsu-general.com','toshiba-hvacspares.com','carrierdobrasil.com.br','komeco.com.br',
      'leverosintegra.com.br','webarcondicionado.com.br','poloar.com.br','adeo.com','master.ca','media.adeo.com'
    ]
    function isTrusted(u: string): boolean {
      try {
        const host = new URL(u).hostname.replace(/^www\./, '').toLowerCase()
        return trusted.some(d => host.endsWith(d))
      } catch { return false }
    }

    const valid: Array<{ brand: string; model: string; url: string; len: number; hash: string }> = []
    let checked = 0
    for (const p of target.slice(0, 60)) {
      const q = `${p.brand} ${p.model} ("manual" OR "manual de serviço") filetype:pdf`
      const results = await aggregateSearch(q)
      for (const r of results) {
        const u = r.url
        if (negSet.has(u.toLowerCase())) continue
        if (!/\.pdf$/i.test(u)) continue
        if (!u.startsWith('https://')) { blacklist.push({ url: u, reason: 'non_https' }); continue }
        if (!isTrusted(u)) { blacklist.push({ url: u, reason: 'untrusted_domain' }); continue }
        const h = await head(u)
        checked++
        const isPdfCT = h.ct.includes('pdf') || h.ct.includes('octet-stream')
        if (!h.ok || !isPdfCT || h.len < 150000) {
          blacklist.push({ url: u, reason: !h.ok ? 'http' : h.len < 150000 ? 'too_small' : 'content_type' })
          continue
        }
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

    const summary = { checked, valid: valid.length, blacklist: blacklist.length }
    return NextResponse.json({ summary, files: { valid_json: validPath, valid_csv: validCsvPath, blacklist_json: blacklistPath, registry_json: registryPath } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}
