import { test, expect } from '@playwright/test'

test.describe('Manuals Ingest', () => {
  test('POST /api/manuals/ingest cria manual e chunks, depois cleanup', async ({ request }) => {
    test.skip(!process.env.OPENAI_API_KEY || !(process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)), 'Env OPENAI/Supabase ausente')
    const base = process.env.BASE_URL || 'http://localhost:3001'
    const title = `Teste Playwright ${Date.now()}`
    const body = {
      brand: 'LG',
      model: 'Dual Inverter Split',
      title,
      source: 'e2e',
      content: 'linha 1\nlinha 2\nlinha 3\nconteúdo de teste para chunking e embedding'
    }
    const r = await request.post('/api/manuals/ingest', { data: body })
    expect(r.status()).toBe(200)
    const j = await r.json()
    expect(j.manual_id).toBeTruthy()
    expect(j.chunks).toBeGreaterThan(0)

    // Cleanup: excluir manual e chunks
    const { createClient } = await import('@supabase/supabase-js')
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await supa.from('manual_chunks').delete().eq('manual_id', j.manual_id)
    await supa.from('manuals').delete().eq('id', j.manual_id)
  })
})
