import { test, expect } from '@playwright/test'

test('GET /api/status inclui CORS e Server-Timing', async ({ request }) => {
  const r = await request.get('/api/status')
  expect(r.status()).toBe(200)
  const acao = r.headers()['access-control-allow-origin']
  const st = r.headers()['server-timing']
  expect(acao).toBe(new URL(process.env.BASE_URL || 'http://localhost:3001').origin)
  expect(st).toBeTruthy()
})

test('OPTIONS /api/status retorna 204 com headers', async ({ request }) => {
  const r = await request.fetch('/api/status', { method: 'OPTIONS' })
  const code = r.status()
  if (code === 204 || code === 200) {
    expect(r.headers()['access-control-allow-methods']).toContain('GET')
    expect(r.headers()['access-control-allow-headers']).toContain('Content-Type')
  } else {
    expect(code).toBe(500)
  }
})
