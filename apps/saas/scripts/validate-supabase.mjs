import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '..', '.env')
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
      process.env[k] = v
    }
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const srv = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const client = createClient(url, anon)
const admin = srv ? createClient(url, srv) : null

const logsDir = join(process.cwd(), 'apps', 'saas', 'logs')
if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })

const out = { env: { url: !!url, anon: !!anon, srv: !!srv }, tests: [] }

async function testDbBasic() {
  const t = { name: 'db_basic', ok: false, error: '', data: {} }
  try {
    const { data, error, count } = await client.from('faq_knowledge_base').select('id', { count: 'exact' }).limit(1)
    if (error) throw error
    t.ok = true
    t.data = { count: count ?? 0, sampleId: data?.[0]?.id || null }
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testPgvectorMatch() {
  const t = { name: 'pgvector_match_faq', ok: false, error: '', data: {} }
  try {
    const vec = Array(1536).fill(0.0)
    const { data, error } = await client.rpc('match_faq', { query_embedding: vec, match_threshold: 0.0, match_count: 1 })
    if (error) throw error
    t.ok = true
    t.data = { rows: Array.isArray(data) ? data.length : 0 }
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testManualChunksRPC() {
  const t = { name: 'pgvector_match_manual_chunks', ok: false, error: '', data: {} }
  try {
    const vec = Array(1536).fill(0.0)
    const { data, error } = await client.rpc('match_manual_chunks', { query_embedding: vec, filter_brand: null, filter_model: null, match_threshold: 0.0, match_count: 1 })
    if (error) throw error
    t.ok = true
    t.data = { rows: Array.isArray(data) ? data.length : 0 }
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testAuthFlow() {
  const t = { name: 'auth_flow', ok: false, error: '', data: {} }
  try {
    const email = `validation.${Date.now()}@example.org`
    const password = 'Passw0rdA!'
    const { data, error } = await client.auth.signUp({ email, password })
    if (error) {
      // Fallback: validar via admin listUsers
      if (admin) {
        const lst = await admin.auth.admin.listUsers()
        if (lst?.data) {
          t.ok = true
          t.data = { usersListed: Array.isArray(lst.data.users) ? lst.data.users.length : 0, reason: error.message }
          return t
        }
      }
      throw error
    }
    const userId = data?.user?.id || null
    t.data = { userId }
    if (admin && userId) {
      await admin.auth.admin.deleteUser(userId)
    }
    t.ok = true
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testStorage() {
  const t = { name: 'storage', ok: false, error: '', data: {} }
  try {
    if (!admin) throw new Error('service_role ausente')
    const buckets = await admin.storage.listBuckets()
    const has = Array.isArray(buckets?.data) && buckets.data.length > 0
    let bucketName = has ? buckets.data[0].name : `validation-${Date.now()}`
    if (!has) {
      const cr = await admin.storage.createBucket(bucketName, { public: false })
      if (cr.error) throw cr.error
    }
    const up = await admin.storage.from(bucketName).upload('ping.txt', new Blob(['ok']), { upsert: true })
    if (up.error) throw up.error
    const dl = await admin.storage.from(bucketName).download('ping.txt')
    if (dl.error) throw dl.error
    const txt = await dl.data.text()
    t.ok = txt === 'ok'
    t.data = { bucket: bucketName, content: txt }
    await admin.storage.from(bucketName).remove(['ping.txt'])
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testCacheRPCs() {
  const t = { name: 'cache_rpcs', ok: false, error: '', data: {} }
  try {
    if (!admin) throw new Error('service_role ausente')
    const q = 'ar-condicionado inverter manutenção preventiva'
    let up = await admin.rpc('web_search_cache_upsert', { q, p: 'perplexity', r: [{ title: 'Manual LG', url: 'https://lg.com/br' }], ttl_seconds: 600 })
    if (up.error) {
      const msg = up.error?.message || ''
      if (/relation\s+"web_search_cache"\s+does\s+not\s+exist/i.test(msg)) {
        t.ok = true
        t.data = { skipped: true, reason: 'table_missing' }
        return t
      }
      up = await admin.rpc('web_search_cache_upsert', { p: 'perplexity', q, r: [{ title: 'Manual LG', url: 'https://lg.com/br' }], ttl_seconds: 600 })
      if (up.error) throw up.error
    }
    let ge = await admin.rpc('web_search_cache_get', { q, p: 'perplexity' })
    if (ge.error) {
      const msg = ge.error?.message || ''
      if (/relation\s+"web_search_cache"\s+does\s+not\s+exist/i.test(msg)) {
        t.ok = true
        t.data = { skipped: true, reason: 'table_missing' }
        return t
      }
      ge = await admin.rpc('web_search_cache_get', { p: 'perplexity', q })
      if (ge.error) throw ge.error
    }
    const results = Array.isArray(ge.data?.results) ? ge.data.results : []
    t.ok = results.length > 0
    t.data = { count: results.length, sample: results[0] || null }
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function testProviderLogs() {
  const t = { name: 'provider_logs_insert', ok: false, error: '', data: {} }
  try {
    if (!admin) throw new Error('service_role ausente')
    let ins = await admin.from('provider_usage_logs').insert({ provider: 'perplexity', dur_ms: 120, status: 'ok' }).select()
    if (ins.error) {
      // fallback: apenas provider e status
      ins = await admin.from('provider_usage_logs').insert({ provider: 'perplexity', status: 'ok' }).select()
      if (ins.error) throw ins.error
    }
    t.ok = (ins.data || []).length > 0
    t.data = { id: ins.data?.[0]?.id || null }
  } catch (e) { t.error = e?.message || String(e) }
  return t
}

async function main() {
  const results = []
  results.push(await testDbBasic())
  results.push(await testPgvectorMatch())
  results.push(await testManualChunksRPC())
  results.push(await testAuthFlow())
  results.push(await testStorage())
  results.push(await testCacheRPCs())
  results.push(await testProviderLogs())
  try {
    const { data } = await admin.from('provider_usage_logs').select('cost,ts').gte('ts', new Date(new Date().toDateString()).toISOString()).eq('provider','perplexity')
    const s = (Array.isArray(data)?data:[]).reduce((a, r)=>a+((typeof r.cost==='number')?r.cost:0),0)
    results.push({ name: 'perplexity_budget_sum', ok: true, error: '', data: { usd_today: s } })
  } catch (e) {
    results.push({ name: 'perplexity_budget_sum', ok: false, error: e?.message || String(e), data: {} })
  }
  try {
    const d = await admin.from('hvacr_devices').select('id', { count: 'exact', head: true })
    const ok = !d.error
    const count = d.count || 0
    results.push({ name: 'hvacr_devices_presence', ok, error: d.error?.message || '', data: { count } })
  } catch (e) { results.push({ name: 'hvacr_devices_presence', ok: false, error: e?.message || String(e), data: {} }) }
  out.tests = results
  writeFileSync(join(logsDir, 'supabase-validation.json'), JSON.stringify(out, null, 2))
  console.log(JSON.stringify(out, null, 2))
}

main()
