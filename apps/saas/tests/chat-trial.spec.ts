import { test, expect } from '@playwright/test'

test.describe('Trial Chat Limits', () => {
  test('bloqueia anexos no trial com CTA', async ({ request }) => {
    const payload = {
      text: 'Ajuda com erro E1',
      attachments: [
        { mimeType: 'application/pdf', data: 'ZmFrZQ==', name: 'manual.pdf' }
      ],
      useSearch: true
    }
    const res = await request.post('/api/openai/chat', {
      headers: { 'Content-Type': 'application/json', 'x-plan': 'trial' },
      data: payload
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(String(data.text)).toContain('Teste grátis sem anexos')
  })

  test('limita 3 mensagens por dia com CTA de upgrade', async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10)
    const payload = { text: 'Mensagem 4', attachments: [], useSearch: false }
    const res = await request.post('/api/openai/chat', {
      headers: {
        'Content-Type': 'application/json',
        'x-plan': 'trial',
        'cookie': `trial_date=${today}; trial_count=3`
      },
      data: payload
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(String(data.text)).toContain('Limite do teste atingido')
  })
})

