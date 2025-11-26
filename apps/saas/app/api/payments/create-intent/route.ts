import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST() {
  try {
    const key = process.env.STRIPE_API_KEY || ''
    const base = process.env.NEXT_PUBLIC_WEBSITE_URL || ''
    if (!key || !base) return NextResponse.json({ error: 'missing env' }, { status: 500 })
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
    const intent = await stripe.paymentIntents.create({
      amount: 9990,
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
    })
    return NextResponse.json({ client_secret: intent.client_secret, id: intent.id, return_url: `${base}/success` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'intent error' }, { status: 500 })
  }
}
