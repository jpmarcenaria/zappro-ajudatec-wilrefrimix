#!/usr/bin/env node
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import pdfDefault from 'pdf-parse/lib/pdf-parse.js'
const pdf = typeof pdfDefault === 'function' ? pdfDefault : (pdfDefault?.default || pdfDefault)
import { createClient } from '@supabase/supabase-js'

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
    else if (/\.pdf$/i.test(name)) out.push(p)
  }
  return out
}

function parseMeta(p) {
  const uni = p.replace(/\\/g, '/')
  const m = uni.match(/\bdata\/manuals\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+\.pdf)$/i)
  return { manufacturer: m?.[1] || '', brand: m?.[2] || '', model: m?.[3] || '', filename: m?.[4] || '' }
}

function chunk(text, target = 1800, overlap = 300) {
  const clean = text.replace(/\u0000/g, ' ').replace(/\s+\n/g, '\n').trim()
  const out = []
  let i = 0
  while (i < clean.length) {
    const end = Math.min(clean.length, i + target)
    const seg = clean.slice(i, end)
    out.push(seg)
    i = end - overlap
    if (i < 0) i = 0
    if (i >= clean.length) break
  }
  return out.map((c, idx) => ({ content: c, page: idx + 1, section: 'Auto' }))
}

async function embed(text, apiKey) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  })
  if (!r.ok) throw new Error('embedding_failed')
  const j = await r.json()
  return j?.data?.[0]?.embedding || []
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

async function hasChunks(supa, manualId) {
  const { count, error } = await supa.from('manual_chunks').select('id', { count: 'exact', head: true }).eq('manual_id', manualId)
  if (error) return false
  return (count || 0) > 0
}

async function run() {
  loadEnv()
  const root = resolve(process.cwd(), '..', '..')
  const dataDir = resolve(join(root, 'data', 'manuals'))
  const args = process.argv.slice(2)
  let triageReport = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--triage-report' && args[i + 1]) { triageReport = resolve(args[i + 1]); break }
  }
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!existsSync(dataDir) || !supaUrl || !supaKey || !apiKey) {
    console.error(JSON.stringify({ error: 'missing_env_or_data_dir' }))
    process.exit(1)
  }
  const supa = createClient(supaUrl, supaKey)
  let files = walk(dataDir)
  if (triageReport && existsSync(triageReport)) {
    try {
      const t = JSON.parse(readFileSync(triageReport, 'utf8'))
      const allowed = new Set(((t?.items)||[]).filter(x => x?.label === 'service_manual').map(x => String(x.path).replace(/\\/g,'/')))
      files = files.filter(p => allowed.has(String(p).replace(/\\/g,'/')))
    } catch {}
  }
  const results = []
  for (const p of files) {
    try {
      const meta = parseMeta(p)
      if (!meta.brand || !meta.model) { results.push({ path: p, status: 'skip_meta' }); continue }
      const deviceId = await upsertDevice(supa, meta.brand, meta.model, meta.manufacturer || meta.brand)
      const title = 'Manual de Serviço'
      const manualId = await upsertManual(supa, deviceId, title, 'fabricante', null)
      const already = await hasChunks(supa, manualId)
      if (already) { results.push({ path: p, status: 'skip_existing', manual_id: manualId }); continue }
      const buf = readFileSync(p)
      const parsed = await pdf(buf)
      const text = String(parsed.text || '')
      const parts = chunk(text)
      const rows = []
      for (const part of parts) {
        const emb = await embed(part.content, apiKey)
        rows.push({ manual_id: manualId, page: part.page, section: part.section, content: part.content, embedding: emb })
      }
      if (rows.length > 0) {
        const { error } = await supa.from('manual_chunks').insert(rows)
        if (error) throw error
      }
      results.push({ path: p, status: 'ok', manual_id: manualId, chunks: rows.length })
    } catch (e) {
      results.push({ path: p, status: 'error', error: e?.message || String(e) })
    }
  }
  console.log(JSON.stringify({ processed: results.length, ok: results.filter(r => r.status === 'ok').length }))
}

run()
