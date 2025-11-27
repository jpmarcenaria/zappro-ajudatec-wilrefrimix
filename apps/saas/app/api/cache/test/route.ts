import { record } from '../../../../lib/monitor'

export async function GET(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const restUrl = process.env.UPSTASH_REDIS_REST_URL || ''
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  const ttl = Number(process.env.CACHE_TTL_SECONDS || 900)
  const headers: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': allowed } : {}

  if (!restUrl || !restToken) {
    record('/api/cache/test', Date.now() - t0, 500)
    return new Response(JSON.stringify({ ok: false, error: 'missing_upstash_env' }), { status: 500, headers })
  }

  const key = `smoke:${Date.now()}`
  let setOk = false
  let getOk = false
  let val = ''
  try {
    const payload = encodeURIComponent('ok')
    const sr = await fetch(`${restUrl}/set/${encodeURIComponent(key)}/${payload}?EX=${ttl}`, { method: 'POST', headers: { Authorization: `Bearer ${restToken}` } })
    setOk = sr.ok
    const gr = await fetch(`${restUrl}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${restToken}` } })
    if (gr.ok) {
      const tx = await gr.text()
      let obj: any = null
      try { obj = JSON.parse(tx) } catch { obj = null }
      const result = obj && typeof obj === 'object' && 'result' in obj ? String(obj.result) : tx
      val = result
      getOk = result === 'ok'
    }
  } catch {
    setOk = false
    getOk = false
  }

  const dur = Date.now() - t0
  const status = setOk && getOk ? 200 : 500
  record('/api/cache/test', dur, status)
  headers['Server-Timing'] = `total;dur=${dur}`
  return new Response(JSON.stringify({ ok: setOk && getOk, setOk, getOk, value: val, ttl }), { status, headers })
}

