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
    return list.filter(m => m.model.toLowerCase().includes(q) || (m.manuals || []).some(mm => (mm.title || '').toLowerCase().includes(q)))
  }, [brands, activeBrand, query])

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
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar modelo/manual" className="bg-transparent text-sm outline-none text-gray-200 placeholder:text-gray-500" />
                  </div>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-auto">
                  {filteredModels.map(m => (
                    <button key={m.device_id} onClick={() => setActiveModel(m.model)} className={`w-full text-left px-3 py-2 rounded-lg border ${activeModel === m.model ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>{m.model} <span className="text-xs text-gray-500">({m.manuals.length})</span></button>
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
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

