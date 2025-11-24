'use client'
import WebLanding from '../components/WebLanding'
import { useRouter } from 'next/navigation'
import { getSupabase } from '../lib/supabaseClient'

export default function Page() {
  const router = useRouter()
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID

  const onStartTrial = () => { router.push('/chat') }
  const onLogin = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/` } })
  }

  return (
    <main className="min-h-screen bg-white">
      <WebLanding onStartTrial={onStartTrial} onLogin={onLogin} />
      {publishableKey && pricingTableId && (
        <section className="max-w-5xl mx-auto p-8">
          <stripe-pricing-table pricing-table-id={pricingTableId} publishable-key={publishableKey}></stripe-pricing-table>
        </section>
      )}
    </main>
  )
}
