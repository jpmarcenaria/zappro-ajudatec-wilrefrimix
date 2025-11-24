import Stripe from 'stripe'

export async function POST(request: Request) {
  const t0 = Date.now()
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const sig = request.headers.get('stripe-signature') || ''
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch {
    return new Response('invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_succeeded':
      break
    default:
      break
  }

  const dur = Date.now() - t0
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ route: '/api/webhook/stripe', status: 200, duration_ms: dur }))
  }
  return new Response('ok', { status: 200 })
}
