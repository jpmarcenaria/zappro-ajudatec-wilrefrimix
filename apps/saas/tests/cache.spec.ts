import { test, expect } from '@playwright/test'

test.describe('Cache Upstash', () => {
  test('GET /api/cache/test retorna ok=true e headers', async ({ request }) => {
    test.skip(!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN, 'Upstash env ausente')
    const r = await request.get('/api/cache/test')
    expect(r.status()).toBe(200)
    const j = await r.json()
    expect(j.ok).toBe(true)
    expect(j.value).toBe('ok')
    const acao = r.headers()['access-control-allow-origin']
    const st = r.headers()['server-timing']
    expect(acao).toBeTruthy()
    expect(st).toBeTruthy()
  })
})
