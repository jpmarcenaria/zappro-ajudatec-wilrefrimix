import Stripe from 'stripe'
import { record } from '../../../lib/monitor'

/**
 * Rota de API para criar Stripe Checkout Session
 * Suporta pagamento único de R$ 99,90
 */
export async function POST(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  const requestId = Math.random().toString(36).slice(2)
  if (allowed && origin && origin !== allowed) {
    return new Response('forbidden', { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  try {
    const secret = process.env.STRIPE_API_KEY
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || ''
    if (!secret || !baseUrl) {
      const dur = Date.now() - t0
      const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
      return new Response(JSON.stringify({ error: 'missing env', missing: { STRIPE_API_KEY: !secret, NEXT_PUBLIC_WEBSITE_URL: !baseUrl } }), { status: 500, headers })
    }
    const stripe = new Stripe(secret!, {
      apiVersion: '2024-06-20',
    })

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ''
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'ZapPRO - Plano Mensal',
              description: 'Acesso completo à plataforma ZapPRO com diagnósticos ilimitados',
            },
            unit_amount: 9990,
            recurring: { interval: 'month' as Stripe.PriceCreateParams.Recurring.Interval },
          },
          quantity: 1,
        }

    // Criar Checkout Session com assinatura mensal de R$ 99,90
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: { source: 'web_checkout', timestamp: new Date().toISOString() },
    })

    const dur = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({ route: '/api/checkout', status: 200, duration_ms: dur, session_id: session.id, request_id: requestId }))
    }
    const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}`, 'X-Request-Id': requestId }
    if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/checkout', dur })
    record('/api/checkout', dur, 200)
    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200, headers })
  } catch (error: any) {
    console.error('❌ Erro ao criar Checkout Session:', error)
    const dur = Date.now() - t0
    record('/api/checkout', dur, 500)
    return new Response(
      JSON.stringify({ error: 'Erro ao criar sessão de pagamento', message: error.message, request_id: requestId }),
      { status: 500, headers: { 'Access-Control-Allow-Origin': allowed, 'X-Request-Id': requestId } }
    )
  }
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
