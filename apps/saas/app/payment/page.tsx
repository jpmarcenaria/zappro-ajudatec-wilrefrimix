"use client"
import { useEffect, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

export default function PaymentPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        setErr(null)
        const res = await fetch('/api/payments/create-intent', { method: 'POST' })
        if (!res.ok) throw new Error('intent request failed')
        const { client_secret, return_url } = await res.json()
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
        const stripe = await loadStripe(pk)
        if (!stripe) throw new Error('stripe load failed')
        const elements = stripe.elements({ clientSecret: client_secret })
        const paymentElement = elements.create('payment')
        if (mounted && containerRef.current) {
          paymentElement.mount(containerRef.current)
          ;(containerRef.current as any).elements = elements
          ;(containerRef.current as any).stripe = stripe
          ;(containerRef.current as any).return_url = return_url
          setReady(true)
        }
      } catch (e: any) {
        setErr(e.message || 'init error')
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  async function onPay() {
    try {
      if (!containerRef.current) return
      const elements: any = (containerRef.current as any).elements
      const stripe: any = (containerRef.current as any).stripe
      const return_url: string = (containerRef.current as any).return_url
      const res = await stripe.confirmPayment({ elements, confirmParams: { return_url } })
      if (res.error) setErr(res.error.message || 'payment error')
    } catch (e: any) {
      setErr(e.message || 'payment error')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-white text-xl font-semibold">Pagamento</h1>
      <div ref={containerRef} className="mt-4 bg-black/20 rounded p-4" />
      <button disabled={!ready} onClick={onPay} className="mt-4 px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
        Pagar R$ 99,90
      </button>
      {err && <p className="text-red-400 mt-3 text-sm">{err}</p>}
    </div>
  )
}
