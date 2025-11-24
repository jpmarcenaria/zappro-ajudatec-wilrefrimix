import { test, expect } from '@playwright/test'

const opts = { method: 'OPTIONS' as const }

test('OPTIONS preflight presente e com headers em /api/openai/chat', async ({ request }) => {
  const r = await request.fetch('/api/openai/chat', opts)
  expect(r.status()).toBe(204)
  expect(r.headers()['access-control-allow-methods']).toContain('POST')
  expect(r.headers()['access-control-allow-headers']).toContain('Content-Type')
})

test('OPTIONS preflight presente e com headers em /api/openai/tts', async ({ request }) => {
  const r = await request.fetch('/api/openai/tts', opts)
  expect(r.status()).toBe(204)
  expect(r.headers()['access-control-allow-methods']).toContain('POST')
  expect(r.headers()['access-control-allow-headers']).toContain('Content-Type')
})

test('OPTIONS preflight presente e com headers em /api/openai/transcribe', async ({ request }) => {
  const r = await request.fetch('/api/openai/transcribe', opts)
  expect(r.status()).toBe(204)
  expect(r.headers()['access-control-allow-methods']).toContain('POST')
  expect(r.headers()['access-control-allow-headers']).toContain('Content-Type')
})

test('OPTIONS preflight presente e com headers em /api/checkout', async ({ request }) => {
  const r = await request.fetch('/api/checkout', opts)
  expect(r.status()).toBe(204)
  expect(r.headers()['access-control-allow-methods']).toContain('POST')
  expect(r.headers()['access-control-allow-headers']).toContain('Content-Type')
})

test('Server-Timing presente em POST /api/openai/chat', async ({ request }) => {
  const r = await request.post('/api/openai/chat', { data: { text: 'compliance', attachments: [] } })
  expect(r.status()).toBe(200)
  const st = r.headers()['server-timing']
  expect(st).toBeTruthy()
  const acao = r.headers()['access-control-allow-origin']
  expect(acao).not.toBeUndefined()
})

test('Server-Timing presente em GET /api/search/professors', async ({ request }) => {
  const r = await request.get('/api/search/professors')
  expect(r.status()).toBe(200)
  const st = r.headers()['server-timing']
  expect(st).toBeTruthy()
  const acao = r.headers()['access-control-allow-origin']
  expect(acao).not.toBeUndefined()
})

test('Access-Control-Allow-Origin igual ao baseURL em GET /api/search/professors', async ({ request }) => {
  const r = await request.get('/api/search/professors')
  expect(r.status()).toBe(200)
  const acao = r.headers()['access-control-allow-origin']
  const base = process.env.BASE_URL || 'http://localhost:3001'
  const expected = (() => { try { return new URL(base).origin } catch { return base } })()
  expect(acao).toBe(expected)
})

test('Origin divergente retorna 403 em POST /api/checkout', async ({ request }) => {
  const r = await request.post('/api/checkout', { data: { priceId: null }, headers: { origin: 'http://localhost:8080' } })
  expect(r.status()).toBe(403)
})

test('Healthcheck via GET /api/search/professors responde com 200 e headers', async ({ request }) => {
  const r = await request.get('/api/search/professors')
  expect(r.status()).toBe(200)
  const st = r.headers()['server-timing']
  expect(st).toBeTruthy()
  const acao = r.headers()['access-control-allow-origin']
  const base = process.env.BASE_URL || 'http://localhost:3001'
  const expected = (() => { try { return new URL(base).origin } catch { return base } })()
  expect(acao).toBe(expected)
})

test('GET /api/health responde com 200 OK', async ({ request }) => {
  const r = await request.get('/api/health');
  expect(r.status()).toBe(200);
});
