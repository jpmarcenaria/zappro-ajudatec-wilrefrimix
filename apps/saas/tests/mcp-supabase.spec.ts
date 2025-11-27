import { test, expect, request } from '@playwright/test'

async function listProjects(token: string) {
  const api = await request.newContext({
    baseURL: 'https://api.supabase.com/v1',
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
  const res = await api.get('/projects')
  const ok = res.ok()
  let json: any = null
  try { json = await res.json() } catch {}
  await api.dispose()
  return { ok, json }
}

test.describe('MCP Supabase – Access Token', () => {
  test('list projects with SUPABASE_ACCESS_TOKEN', async () => {
    const token = process.env.SUPABASE_ACCESS_TOKEN || ''
    test.skip(!token, 'SUPABASE_ACCESS_TOKEN ausente')

    const projs = await listProjects(token)
    expect(projs.ok).toBeTruthy()
    expect(Array.isArray(projs.json)).toBeTruthy()
    const hasAny = ((projs.json as any[]) || []).length > 0
    expect(hasAny).toBeTruthy()

    console.log(JSON.stringify({ ok: true, projects_count: (projs.json as any[])?.length || 0 }))
  })
})
