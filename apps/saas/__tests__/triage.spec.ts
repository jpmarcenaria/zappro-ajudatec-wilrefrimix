import { describe, it, expect, vi } from 'vitest'

describe('Manuals triage API', () => {
  it('classifies service manuals by text heuristics', async () => {
    const buf = Buffer.from(('manual de serviço troubleshooting código de erro ').repeat(50))
    vi.resetModules()
    vi.doMock('pdf-parse', () => ({ default: async () => ({ text: 'manual de serviço troubleshooting código de erro' }) }))
    const triage = await import('../app/api/manuals/triage/route')
    const req = new Request('http://localhost:3001/api/manuals/triage', { method: 'POST', body: buf })
    const res = await triage.POST(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.classification.type).toBe('service_manual')
  })
})
