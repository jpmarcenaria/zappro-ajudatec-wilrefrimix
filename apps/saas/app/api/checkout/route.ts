import Stripe from 'stripe'

export async function POST(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return new Response('forbidden', { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
  const body = await req.json()
  const priceId = body?.priceId
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: priceId ? [{ price: priceId, quantity: 1 }] : [],
    success_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/subscribe/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/`,
  })

  const dur = Date.now() - t0
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ route: '/api/checkout', status: 200, duration_ms: dur }))
  }
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/checkout', dur })
  return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200, headers })
}

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
