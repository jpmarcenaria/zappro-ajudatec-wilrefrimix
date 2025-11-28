import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Manuals list API', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WEBSITE_URL = 'http://localhost:3001'
    process.env.ALLOWED_ORIGIN = ''
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('returns 200 with missing_env when envs absent', async () => {
    vi.resetModules()
    const manualsList = await import('../app/api/manuals/list/route')
    const req = new Request('http://localhost:3001/api/manuals/list', { headers: { origin: 'http://localhost:3001' } })
    const res = await manualsList.GET(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.error).toBe('missing_env')
  })

  it('aggregates brands/models using anon fallback', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.local'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    vi.resetModules()
    vi.doMock('@supabase/supabase-js', () => {
      const hvData = [{ id: 'd1', brand: 'Daikin', model: 'FTXV' }]
      const manData = [{ id: 'm1', title: 'Manual de Serviço', device_id: 'd1', pdf_url: 'http://x' }]
      const hvBuilder: any = {
        order() { return this },
        then(r: any) { return Promise.resolve(r({ data: hvData, error: null })) }
      }
      const manBuilder: any = {
        then(r: any) { return Promise.resolve(r({ data: manData, error: null })) }
      }
      return {
        createClient: () => ({
          from(tbl: string) {
            if (tbl === 'hvacr_devices') {
              return { select() { return hvBuilder } }
            }
            if (tbl === 'manuals') {
              return { select() { return manBuilder } }
            }
            return { select() { return { then: (r: any) => Promise.resolve(r({ data: [], error: null })) } } }
          }
        })
      }
    })
    const manualsList = await import('../app/api/manuals/list/route')
    const req = new Request('http://localhost:3001/api/manuals/list', { headers: { origin: 'http://localhost:3001' } })
    const res = await manualsList.GET(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.totalDevices).toBe(1)
    expect(j.brands[0].brand).toBe('Daikin')
    expect(j.brands[0].models[0].manuals.length).toBe(1)
  })
})
