import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST() {
  try {
    const key = process.env.STRIPE_API_KEY
    if (!key) return NextResponse.json({ error: 'missing STRIPE_API_KEY' }, { status: 500 })
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' })

    // Buscar produto existente por nome
    const products = await stripe.products.list({ limit: 100, active: true })
    let product = products.data.find(p => p.name === 'ZapPro')
    if (!product) {
      product = await stripe.products.create({
        name: 'ZapPro',
        type: 'service',
        metadata: { app: 'zappro', plan: 'pro', billing: 'monthly' },
      })
    }

    // Buscar price mensal em BRL
    const prices = await stripe.prices.list({ limit: 100, product: product.id, active: true })
    let price = prices.data.find(pr => pr.currency === 'brl' && pr.recurring?.interval === 'month' && pr.unit_amount === 9990)
    if (!price) {
      price = await stripe.prices.create({
        currency: 'brl',
        unit_amount: 9990,
        recurring: { interval: 'month' },
        product: product.id,
        metadata: { tier: 'pro', country: 'BR' },
      })
    }

    return NextResponse.json({ product_id: product.id, price_id: price.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'bootstrap error' }, { status: 500 })
  }
}
