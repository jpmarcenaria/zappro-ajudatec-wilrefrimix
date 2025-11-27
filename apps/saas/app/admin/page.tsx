import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken, getAdminUsername } from '@/lib/adminAuth'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('admin_session')?.value || ''
  const ok = cookie && verifyAdminToken(cookie)
  if (!ok) redirect('/admin/login')

  const user = getAdminUsername()

  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'
  const statusRes = await fetch(new URL('/api/status', baseUrl).toString(), { cache: 'no-store' })
  let statusData: any = null
  try { statusData = await statusRes.json() } catch { statusData = null }
  const metrics = statusData?.metrics || {}
  const lastLogs: Array<{ ts: number; level: string; msg: string }> = statusData?.samples?.lastLogs || []
  const cacheHits = lastLogs.filter(l => typeof l?.msg === 'string' && l.msg.includes('rag_cache hit')).length
  const cacheMiss = lastLogs.filter(l => typeof l?.msg === 'string' && l.msg.includes('rag_cache miss')).length

  return (
    <div className="min-h-screen bg-[#0f1115] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Área Administrativa</h1>
          <form action="/api/admin/logout" method="POST">
            <button className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">Sair</button>
          </form>
        </div>
        <div className="rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-gray-800 to-gray-900">
          <p className="text-gray-300">Usuário autenticado: <span className="font-semibold text-white">{user}</span></p>
          <p className="text-gray-400 mt-2">Use esta área para tarefas administrativas.</p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-sm text-gray-400">Req/s</p>
              <p className="text-2xl font-bold text-white">{metrics.reqPerSec ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-sm text-gray-400">Latência média (ms)</p>
              <p className="text-2xl font-bold text-white">{metrics.avgLatencyMs ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-sm text-gray-400">Erros (1m)</p>
              <p className="text-2xl font-bold text-white">{metrics.errors1m ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-black/20 border border-white/10">
              <p className="text-sm text-gray-400">Cache Hit/Miss</p>
              <p className="text-2xl font-bold text-white">{cacheHits}/{cacheMiss}</p>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-2">Últimos Logs</h2>
            <div className="space-y-2 max-h-64 overflow-auto">
              {lastLogs.slice().reverse().map((l, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/20 border border-white/10">
                  <p className="text-xs text-gray-400">{new Date(l.ts).toLocaleTimeString('pt-BR')}</p>
                  <p className="text-sm text-white">[{l.level}] {l.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
