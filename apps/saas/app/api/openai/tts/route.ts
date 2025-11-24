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
    return new Response(JSON.stringify({ audioBase64: null }), { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
  const { text } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ audioBase64: null }), { status: 500, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return new Response(JSON.stringify({ audioBase64: null }), { status: 200 })
  }

  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/`/g, '')
    .replace(/⚠️/g, 'Atenção: ')
    .replace(/🛠️/g, '')
    .replace(/❄️/g, '')

  let speakText = cleanText.slice(0, 4000)
  if (cleanText.length > 4000) {
    const punct = Math.max(
      speakText.lastIndexOf('.'),
      speakText.lastIndexOf('!'),
      speakText.lastIndexOf('?'),
      speakText.lastIndexOf('\n')
    )
    if (punct > 0) speakText = speakText.slice(0, punct + 1)
  }

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      input: speakText,
      format: 'wav',
    }),
  })

  if (!res.ok) {
    return new Response(JSON.stringify({ audioBase64: null }), { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  const arrayBuffer = await res.arrayBuffer()
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64')
  const dur = Date.now() - t0
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/openai/tts', dur })
  return new Response(JSON.stringify({ audioBase64 }), { status: 200, headers })
}
