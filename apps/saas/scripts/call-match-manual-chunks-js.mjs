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
  const { createClient } = await import('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    console.error(JSON.stringify({ ok: false, error: 'missing_supabase_env' }))
    process.exit(1)
  }
  const supa = createClient(url, key)
  const vec = Array(1536).fill(0.0)
  const { data, error } = await supa.rpc('match_manual_chunks_arr', { query_embedding: vec, filter_brand: null, filter_model: null, match_threshold: 0.0, match_count: 1 })
  console.log(JSON.stringify({ ok: !error, error: error?.message || '', rows: Array.isArray(data) ? data.length : -1 }))
}

main()
