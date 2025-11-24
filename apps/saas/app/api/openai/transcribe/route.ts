export async function OPTIONS() {
  const origin = (() => { try { return new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || '').origin } catch { return '' } })()
  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return new Response(JSON.stringify({ text: '' }), { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
  const { base64Audio, mimeType } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ text: '' }), { status: 500, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  try {
    const buffer = Buffer.from(base64Audio, 'base64')
    const blob = new Blob([buffer], { type: mimeType || 'audio/webm' })
    const form = new FormData()
    form.append('file', blob, 'audio')
    form.append('model', 'gpt-4o-mini-transcribe')
    form.append('response_format', 'json')
    form.append('language', 'pt')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: form,
    })

    if (!res.ok) {
      return new Response(JSON.stringify({ text: '' }), { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
    }

    const data = await res.json()
    const text = (data?.text || '').trim()
    const dur = Date.now() - t0
    const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
    if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/openai/transcribe', dur })
    return new Response(JSON.stringify({ text }), { status: 200, headers })
  } catch {
    return new Response(JSON.stringify({ text: '' }), { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
}
