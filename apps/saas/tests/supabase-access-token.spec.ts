import { test, expect, APIResponse } from '@playwright/test'

const BASE = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || ''

async function withRetry(fn: () => Promise<APIResponse>, max = Number(process.env.RETRY_MAX || 5), baseDelay = 250, timeoutMs = Number(process.env.RETRY_TIMEOUT_MS || 30000)) {
  const start = Date.now()
  let attempt = 0
  let last: APIResponse | null = null
  while (attempt < max && Date.now() - start < timeoutMs) {
    try {
      last = await fn()
      if (last.ok() || [200, 201, 204].includes(last.status())) return last
    } catch {}
    await new Promise(r => setTimeout(r, Math.min(timeoutMs, baseDelay * Math.pow(2, attempt))))
    attempt++
  }
  return last as APIResponse
}

test.describe('Integração SUPABASE_ACCESS_TOKEN', () => {
  test.skip(!BASE || !SERVICE_KEY, 'Env Supabase ausente')

  const restBase = `${BASE.replace(/\/$/, '')}/rest/v1`
  const headers = { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }

  test('CRUD completo com RLS e limpeza', async ({ request }) => {
    const t0 = Date.now()

    // 1) CREATE (POST) - 201
    const createBody = [{ text_field: 'integ_token', num_field: 7 }]
    const create = await withRetry(() => request.post(`${restBase}/integration_test.test_table`, {
      data: createBody,
      headers: { ...headers, Prefer: 'return=representation' }
    }))
    expect(create.status()).toBe(201)
    const created = await create.json()
    expect(Array.isArray(created)).toBeTruthy()
    const row = created[0]
    expect(row.id).toBeTruthy()

    // 2) READ (GET) - 200
    const read = await withRetry(() => request.get(`${restBase}/integration_test.test_table?id=eq.${row.id}`, { headers }))
    expect(read.status()).toBe(200)
    const readJson = await read.json()
    expect(Array.isArray(readJson)).toBeTruthy()
    expect(readJson[0]?.text_field).toBe('integ_token')

    // 3) UPDATE (PATCH) - 200
    const upd = await withRetry(() => request.patch(`${restBase}/integration_test.test_table?id=eq.${row.id}`, {
      data: { text_field: 'integ_token_ok', num_field: 8 },
      headers: { ...headers, Prefer: 'return=representation' }
    }))
    expect(upd.status()).toBe(200)
    const updJson = await upd.json()
    expect(updJson[0]?.text_field).toBe('integ_token_ok')

    // 4) DELETE (DELETE) - 204
    const del = await withRetry(() => request.delete(`${restBase}/integration_test.test_table?id=eq.${row.id}`, {
      headers: { ...headers, Prefer: 'return=minimal' }
    }))
    expect(del.status()).toBe(204)

    // RLS validação: tentar inserir com anon deve falhar (403/401)
    const badHeaders = { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`, 'Content-Type': 'application/json' }
    const bad = await request.post(`${restBase}/integration_test.test_table`, { data: [{ text_field: 'deny', num_field: 1 }], headers: { ...badHeaders, Prefer: 'return=minimal' } })
    expect([401, 403]).toContain(bad.status())

    // Limpeza final via função
    const cleanup = await withRetry(() => request.post(`${restBase}/rpc/test_cleanup`, { data: {}, headers }))
    expect([200, 204]).toContain(cleanup.status())

    const dur = Date.now() - t0
    console.log(JSON.stringify({ ok: true, timings_ms: { total: dur } }))
  })
})
