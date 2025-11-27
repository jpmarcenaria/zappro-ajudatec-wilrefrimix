'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ChevronRight, Loader2, Search } from 'lucide-react'

type Manual = { id: string; title: string; pdf_url?: string | null; source?: string | null }
type ModelItem = { model: string; device_id: string; manuals: Manual[] }
type BrandGroup = { brand: string; models: ModelItem[] }

export default function ManualsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<BrandGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeBrand, setActiveBrand] = useState<string>('')
  const [activeModel, setActiveModel] = useState<string>('')
  const [query, setQuery] = useState('')
  const [stats, setStats] = useState({ brands: 0, models: 0, manuals: 0 })
  const [typesDist, setTypesDist] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const r = await fetch('/api/manuals/list')
        if (!r.ok) throw new Error('failed_list')
        const j = await r.json()
        const groups: BrandGroup[] = (j?.brands || [])
        setBrands(groups)
        if (groups.length) setActiveBrand(groups[0].brand)
        const firstModels = groups[0]?.models || []
        if (firstModels.length) setActiveModel(firstModels[0].model)
        const totalBrands = groups.length
        const totalModels = groups.reduce((a, b) => a + (b.models?.length || 0), 0)
        const totalManuals = groups.reduce((a, b) => a + (b.models || []).reduce((x, m) => x + (m.manuals?.length || 0), 0), 0)
        setStats({ brands: totalBrands, models: totalModels, manuals: totalManuals })
        function unitType(s: string) {
          const t = s.toLowerCase()
          if (/cassete|cassette/.test(t)) return 'Split Cassete'
          if (/piso\s*\/\s*teto|piso.*teto|floor|ceiling/.test(t)) return 'Piso/Teto'
          if (/janela|window/.test(t)) return 'Janela'
          if (/coluna|floor\s*standing/.test(t)) return 'Coluna'
          if (/multi|outdoor\s*units|multi-split/.test(t)) return 'Multi-Split Externo'
          return 'Split High Wall'
        }
        const dist: Record<string, number> = {}
        for (const b of groups) {
          for (const m of b.models || []) {
            const base = unitType(m.model)
            dist[base] = (dist[base] || 0) + 1
          }
        }
        setTypesDist(dist)
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar biblioteca')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredModels = useMemo(() => {
    const brand = brands.find(b => b.brand === activeBrand)
    const list = brand?.models || []
    const q = query.trim().toLowerCase()
    if (!q) return list
    function sim(a: string, b: string) {
      const s = a.toLowerCase()
      const t = b.toLowerCase()
      if (!s || !t) return 0
      if (t.includes(s)) return Math.min(1, s.length / t.length + 0.4)
      const dp = Array(s.length + 1).fill(0).map(() => Array(t.length + 1).fill(0))
      for (let i = 0; i <= s.length; i++) dp[i][0] = i
      for (let j = 0; j <= t.length; j++) dp[0][j] = j
      for (let i = 1; i <= s.length; i++) {
        for (let j = 1; j <= t.length; j++) {
          const cost = s[i - 1] === t[j - 1] ? 0 : 1
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
      }
      const d = dp[s.length][t.length]
      const n = Math.max(s.length, t.length)
      return 1 - d / n
    }
    const scored = list.map(m => {
      const base = Math.max(sim(q, m.model), sim(q, brand?.brand || ''))
      const manScore = Math.max(0, ...(m.manuals || []).map(mm => sim(q, mm.title || '')))
      return { m, score: Math.max(base, manScore) }
    })
    return scored.filter(s => s.score > 0.35).sort((a, b) => b.score - a.score).map(s => s.m)
  }, [brands, activeBrand, query])

  const globalSuggestions = useMemo(() => {
    const all: Array<{ brand: string; model: string; manuals: Manual[]; device_id: string }> = []
    for (const b of brands) for (const m of b.models) all.push({ brand: b.brand, model: m.model, manuals: m.manuals, device_id: m.device_id })
    const q = query.trim().toLowerCase()
    if (!q) return [] as Array<{ brand: string; model: string; score: number; device_id: string }>
    function sim(a: string, b: string) {
      const s = a.toLowerCase()
      const t = b.toLowerCase()
      if (!s || !t) return 0
      if (t.includes(s)) return Math.min(1, s.length / t.length + 0.4)
      const dp = Array(s.length + 1).fill(0).map(() => Array(t.length + 1).fill(0))
      for (let i = 0; i <= s.length; i++) dp[i][0] = i
      for (let j = 0; j <= t.length; j++) dp[0][j] = j
      for (let i = 1; i <= s.length; i++) {
        for (let j = 1; j <= t.length; j++) {
          const cost = s[i - 1] === t[j - 1] ? 0 : 1
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
      }
      const d = dp[s.length][t.length]
      const n = Math.max(s.length, t.length)
      return 1 - d / n
    }
    const scored = all.map(x => {
      const base = Math.max(sim(q, x.model), sim(q, x.brand))
      const manScore = Math.max(0, ...(x.manuals || []).map(mm => sim(q, mm.title || '')))
      return { brand: x.brand, model: x.model, device_id: x.device_id, score: Math.max(base, manScore) }
    })
    return scored.filter(s => s.score > 0.4).sort((a, b) => b.score - a.score).slice(0, 8)
  }, [brands, query])

  const manualsForActive = useMemo(() => {
    const brand = brands.find(b => b.brand === activeBrand)
    const model = (brand?.models || []).find(m => m.model === activeModel)
    return model?.manuals || []
  }, [brands, activeBrand, activeModel])

  return (
    <div className="min-h-screen bg-[#0f1115]">
      <header className="border-b border-white/10 bg-[#0f1115]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50 rounded-lg"></div>
              <div className="relative bg-gradient-to-br from-cyan-400 to-cyan-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">Z</div>
            </div>
            <span className="font-bold text-xl text-white">Biblioteca de Manuais</span>
          </div>
          <button onClick={() => router.push('/')} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10">Voltar</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-300">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Total de Fabricantes</div>
                <div className="text-3xl font-bold text-white">{stats.brands}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Total de Modelos</div>
                <div className="text-3xl font-bold text-white">{stats.models}</div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-white/10">
                <div className="text-xs text-gray-400 mb-1">Total de Manuais</div>
                <div className="text-3xl font-bold text-white">{stats.manuals}</div>
              </div>
              <div className="md:col-span-3 p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                <div className="text-white font-semibold mb-2">Distribuição por Tipo</div>
                <div className="flex items-center gap-6">
                  <svg width="200" height="200" viewBox="0 0 32 32" className="text-white">
                    {(() => {
                      const total = Object.values(typesDist).reduce((a, b) => a + b, 0) || 1
                      let start = 0
                      const colors = ['#22d3ee', '#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa']
                      const arcs = Object.entries(typesDist).map(([k, v], i) => {
                        const frac = v / total
                        const end = start + frac * 2 * Math.PI
                        const r = 12
                        const cx = 16
                        const cy = 16
                        const x1 = cx + r * Math.cos(start)
                        const y1 = cy + r * Math.sin(start)
                        const x2 = cx + r * Math.cos(end)
                        const y2 = cy + r * Math.sin(end)
                        const large = end - start > Math.PI ? 1 : 0
                        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
                        start = end
                        return <path key={k} d={d} fill={colors[i % colors.length]} opacity={0.8} />
                      })
                      return arcs
                    })()}
                  </svg>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    {Object.entries(typesDist).map(([k, v], i) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: ['#22d3ee','#60a5fa','#34d399','#f59e0b','#f472b6','#a78bfa'][i % 6] }}></span>
                        <span>{k}</span>
                        <span className="text-gray-500">({v})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-1">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-semibold">Marcas</span>
                </div>
                <div className="space-y-2">
                  {brands.map(b => (
                    <button key={b.brand} onClick={() => { setActiveBrand(b.brand); const first = b.models[0]; setActiveModel(first?.model || '') }} className={`w-full text-left px-3 py-2 rounded-lg border ${activeBrand === b.brand ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>{b.brand} <span className="text-xs text-gray-500">({b.models.length})</span></button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-semibold">Modelos</span>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const first = filteredModels[0]; if (first) setActiveModel(first.model) } }} placeholder="Buscar modelo/manual" className="bg-transparent text-sm outline-none text-gray-200 placeholder:text-gray-500" />
                  </div>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-auto">
                  {filteredModels.map(m => (
                    <button key={m.device_id} onClick={() => setActiveModel(m.model)} className={`w-full text-left px-3 py-2 rounded-lg border ${activeModel === m.model ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                      <span className="mr-2">
                        {query && m.model.toLowerCase().includes(query.toLowerCase()) ? (
                          <>
                            <span className="text-white">{m.model.slice(0, m.model.toLowerCase().indexOf(query.toLowerCase()))}</span>
                            <span className="bg-cyan-500/20 text-cyan-300 px-1 rounded">{m.model.slice(m.model.toLowerCase().indexOf(query.toLowerCase()), m.model.toLowerCase().indexOf(query.toLowerCase()) + query.length)}</span>
                            <span className="text-white">{m.model.slice(m.model.toLowerCase().indexOf(query.toLowerCase()) + query.length)}</span>
                          </>
                        ) : (
                          <span className="text-white">{m.model}</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">({m.manuals.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-white font-semibold">Manuais</span>
                  <span className="text-xs text-gray-500">{manualsForActive.length} encontrados</span>
                </div>
                {manualsForActive.length === 0 ? (
                  <div className="p-4 rounded-lg bg-black/20 border border-white/10 text-gray-400">Nenhum manual cadastrado para este modelo.</div>
                ) : (
                  <ul className="space-y-2">
                    {manualsForActive.map(m => (
                      <li key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-white text-sm font-medium">{m.title || 'Manual'}</div>
                            <div className="text-xs text-gray-500">{m.source ? String(m.source) : '–'}</div>
                          </div>
                        </div>
                        {m.pdf_url ? (
                          <a href={m.pdf_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Abrir PDF</a>
                        ) : (
                          <span className="px-3 py-1 rounded-md bg-black/20 text-gray-400 border border-white/10">PDF ausente</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {globalSuggestions.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white font-semibold">Sugestões Globais</span>
                    <span className="text-xs text-gray-500">{globalSuggestions.length}</span>
                  </div>
                  <div className="space-y-2">
                    {globalSuggestions.map(s => (
                      <button key={s.device_id} onClick={() => { setActiveBrand(s.brand); setActiveModel(s.model) }} className="w-full text-left px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                        <span className="text-white font-medium mr-2">{s.brand}</span>
                        <span className="text-white">{s.model}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
