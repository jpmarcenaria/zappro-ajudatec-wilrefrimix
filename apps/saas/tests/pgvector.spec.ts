import { test, expect } from '@playwright/test'

test('RPC match_manual_chunks responde (skip se env ausente)', async ({ request }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY, 'Env Supabase ausente')
  const { createClient } = await import('@supabase/supabase-js')
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const vec = Array(1536).fill(0.0)
  const { data, error } = await supa.rpc('match_manual_chunks', { query_embedding: vec, filter_brand: null, filter_model: null, match_threshold: 0.0, match_count: 1 })
  expect(error).toBeNull()
  expect(Array.isArray(data)).toBeTruthy()
})
