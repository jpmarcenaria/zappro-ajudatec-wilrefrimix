'use client'
import { getSupabase } from '../lib/supabaseClient'

export default function AuthButtons() {
  const signInGoogle = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/` } })
  }
  const signInGithub = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/` } })
  }
  const signOut = async () => {
    const supabase = getSupabase()
    if (!supabase) return
    await supabase.auth.signOut()
  }
  return (
    <div className="flex gap-3">
      <button className="px-4 py-2 bg-black text-white rounded" onClick={signInGoogle}>Entrar Google</button>
      <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={signInGithub}>Entrar GitHub</button>
      <button className="px-4 py-2 bg-slate-200 rounded" onClick={signOut}>Sair</button>
    </div>
  )
}
