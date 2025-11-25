'use client'
import WebLanding from '../components/WebLanding'

export default function Page() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID

  return (
    <main id="main" className="min-h-screen bg-white">
      <WebLanding />
      {publishableKey && pricingTableId && (
        <section id="pricing" className="max-w-5xl mx-auto p-8 bg-slate-50 rounded-2xl my-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Planos Flexíveis</h2>
            <p className="text-slate-600">Escolha a melhor opção para o seu dia a dia.</p>
          </div>
          <stripe-pricing-table pricing-table-id={pricingTableId} publishable-key={publishableKey}></stripe-pricing-table>
        </section>
      )}
    </main>
  )
}
