#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '..', '.env'),
    join(process.cwd(), 'apps', 'saas', '.env')
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    const txt = readFileSync(p, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const i = s.indexOf('=')
      if (i <= 0) continue
      const k = s.slice(0, i).trim()
      let v = s.slice(i + 1).trim()
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    }
  }
}

async function main() {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !anon) {
    console.error(JSON.stringify({ ok: false, error: 'missing_supabase_env' }))
    process.exit(1)
  }

  const args = process.argv.slice(2)
  let brand = null
  let model = null
  let threshold = 0.72
  let count = 5
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--brand') brand = args[++i] || null
    else if (a === '--model') model = args[++i] || null
    else if (a === '--threshold') threshold = Number(args[++i] || threshold)
    else if (a === '--count') count = Number(args[++i] || count)
  }

  const vec = Array(1536).fill(0.0)
  const body = {
    query_embedding: vec,
    filter_brand: brand,
    filter_model: model,
    match_threshold: threshold,
    match_count: count
  }

  const base = url.replace(/\/$/, '') + '/rest/v1/rpc/'
  const tryCall = async (fn) => {
    const res = await fetch(base + fn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anon,
        'Authorization': `Bearer ${anon}`
      },
      body: JSON.stringify(body)
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  }
  let first = await tryCall('match_manual_chunks_arr')
  if (!first.ok) first = await tryCall('match_manual_chunks')
  const { ok, status, text } = first
  let arr = null
  try { arr = JSON.parse(text) } catch { arr = null }
  console.log(JSON.stringify({ ok, status, body: text.slice(0, 200), data_len: Array.isArray(arr) ? arr.length : -1 }))
}

main()

