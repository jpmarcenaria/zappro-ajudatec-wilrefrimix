import { NextResponse } from 'next/server'
type Item = { title: string; uri: string }
type Ranked = { name: string; uri: string; score: number }

export async function POST(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return NextResponse.json({ items: [] }, { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
  try {
  const body = await req.json().catch(() => ({} as { keywords?: string[] }))
  const keywords = Array.isArray(body?.keywords) && body.keywords.length > 0 ? body.keywords : [
    'professor HVAC-R Brasil',
    'docente refrigeração Brasil',
    'curso HVAC Brasil técnico',
    'evento técnico HVAC-R Brasil',
  ]
  const tvly = process.env.TAVILY_API_KEY
  const brave = process.env.BRAVE_API_KEY
  const fire = process.env.FIRECRAWL_API_KEY

  async function searchOne(q: string): Promise<Item[]> {
    const items: Item[] = []
    if (tvly) {
      try {
        const r = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tvly}` },
          body: JSON.stringify({ query: q, search_depth: 'advanced', max_results: 5, include_answer: false })
        })
        const j = await r.json().catch(() => null)
        for (const it of Array.isArray(j?.results) ? j.results : []) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) items.push({ title, uri })
        }
      } catch {}
    }
    if (brave) {
      try {
        const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&country=BR&lang=pt-BR&count=5`, {
          headers: { 'X-Subscription-Token': brave }
        })
        const j = await r.json().catch(() => null)
        for (const it of Array.isArray(j?.web?.results) ? j.web.results : []) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) items.push({ title, uri })
        }
      } catch {}
    }
    if (fire) {
      try {
        const r = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fire}` },
          body: JSON.stringify({ query: q, limit: 5 })
        })
        const j = await r.json().catch(() => null)
        for (const it of Array.isArray(j?.results) ? j.results : []) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) items.push({ title, uri })
        }
      } catch {}
    }
    return items.filter(it => { try { return new URL(it.uri).protocol === 'https:' } catch { return false } })
  }

  function host(u: string): string { try { return new URL(u).host.toLowerCase() } catch { return '' } }
  const edu = ['senai','senac','ufrj','ufmg','usp','unicamp','ifsp','ifpe','petrobras','abnt','abrava']
  function score(it: Item): number {
    const h = host(it.uri)
    const t = (it.title || '').toLowerCase()
    let s = 1
    if (h.endsWith('.br') || h.includes('.com.br') || h.includes('.org.br')) s *= 1.8
    if (edu.some(e => h.includes(e))) s *= 2
    if (t.includes('engenheiro') || t.includes('professor') || t.includes('docente')) s *= 1.5
    if (t.includes('certificação') || t.includes('crea') || t.includes('confea')) s *= 1.6
    if (t.includes('evento') || t.includes('congresso') || t.includes('simpósio')) s *= 1.3
    if (t.includes('publicação') || t.includes('periódico') || t.includes('manual') || t.includes('curso')) s *= 1.4
    if (t.includes('2025') || t.includes('2024')) s *= 1.2
    if (h.includes('youtube.com') || h.includes('instagram.com')) {
      if (t.includes('br') || t.includes('brasil')) s *= 1.6
    }
    return s
  }
  function nameFrom(title: string): string {
    const parts = title.split(' - ')
    return parts[0].trim()
  }

  const collected: Item[] = []
  for (const q of keywords) {
    const items = await searchOne(q)
    collected.push(...items)
  }
  const seen = new Set<string>()
  const ranked: Ranked[] = []
  for (const it of collected) {
    if (seen.has(it.uri)) continue
    seen.add(it.uri)
    const sc = score(it)
    ranked.push({ name: nameFrom(it.title), uri: it.uri, score: sc })
  }
  ranked.sort((a,b) => b.score - a.score)
  const top = ranked.slice(0, 10)
  const dur = Date.now() - t0
  if (process.env.NODE_ENV !== 'production') {
    console.log(JSON.stringify({ route: '/api/search/professors', method: 'POST', status: 200, duration_ms: dur }))
  }
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/search/professors', method: 'POST', dur })
  return NextResponse.json({ items: top }, { status: 200, headers })
  } catch {
    return NextResponse.json({ items: [] }, { status: 200, headers: { 'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || '' } })
  }
}

export async function GET(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return NextResponse.json({ items: [] }, { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
  try {
    const fallback: Ranked[] = [
      { name: 'Prof. HVAC-R Brasil', uri: 'https://www.hvacrbrasil.com.br/docentes/prof-hvacr', score: 9.1 },
      { name: 'Eng. Certificado CREA', uri: 'https://www.confea.org.br/certificados/eng-br', score: 8.8 },
      { name: 'Docente ABRAVA', uri: 'https://www.abrava.com.br/eventos/docentes', score: 8.5 }
    ]
    const tKeywords = [
      'professor HVAC-R Brasil',
      'docente refrigeração Brasil',
      'curso HVAC Brasil técnico',
      'evento técnico HVAC-R Brasil',
    ]
    const tvly = process.env.TAVILY_API_KEY
    const brave = process.env.BRAVE_API_KEY
    const fire = process.env.FIRECRAWL_API_KEY

    async function searchOne(q: string): Promise<Item[]> {
      const items: Item[] = []
      if (tvly) {
        try {
          const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tvly}` },
            body: JSON.stringify({ query: q, search_depth: 'advanced', max_results: 5, include_answer: false })
          })
          const j = await r.json().catch(() => null)
          for (const it of Array.isArray(j?.results) ? j.results : []) {
            const title = typeof it?.title === 'string' ? it.title : ''
            const uri = typeof it?.url === 'string' ? it.url : ''
            if (title && uri) items.push({ title, uri })
          }
        } catch {}
      }
      if (brave) {
        try {
          const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&country=BR&lang=pt-BR&count=5`, {
            headers: { 'X-Subscription-Token': brave }
          })
          const j = await r.json().catch(() => null)
          for (const it of Array.isArray(j?.web?.results) ? j.web.results : []) {
            const title = typeof it?.title === 'string' ? it.title : ''
            const uri = typeof it?.url === 'string' ? it.url : ''
            if (title && uri) items.push({ title, uri })
          }
        } catch {}
      }
      if (fire) {
        try {
          const r = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fire}` },
            body: JSON.stringify({ query: q, limit: 5 })
          })
          const j = await r.json().catch(() => null)
          for (const it of Array.isArray(j?.results) ? j.results : []) {
            const title = typeof it?.title === 'string' ? it.title : ''
            const uri = typeof it?.url === 'string' ? it.url : ''
            if (title && uri) items.push({ title, uri })
          }
        } catch {}
      }
      return items.filter(it => { try { return new URL(it.uri).protocol === 'https:' } catch { return false } })
    }

    function host(u: string): string { try { return new URL(u).host.toLowerCase() } catch { return '' } }
    const edu = ['senai','senac','ufrj','ufmg','usp','unicamp','ifsp','ifpe','petrobras','abnt','abrava']
    function score(it: Item): number {
      const h = host(it.uri)
      const t = (it.title || '').toLowerCase()
      let s = 1
      if (h.endsWith('.br') || h.includes('.com.br') || h.includes('.org.br')) s *= 1.8
      if (edu.some(e => h.includes(e))) s *= 2
      if (t.includes('engenheiro') || t.includes('professor') || t.includes('docente')) s *= 1.5
      if (t.includes('certificação') || t.includes('crea') || t.includes('confea')) s *= 1.6
      if (t.includes('evento') || t.includes('congresso') || t.includes('simpósio')) s *= 1.3
      if (t.includes('publicação') || t.includes('periódico') || t.includes('manual') || t.includes('curso')) s *= 1.4
      if (t.includes('2025') || t.includes('2024')) s *= 1.2
      if (h.includes('youtube.com') || h.includes('instagram.com')) {
        if (t.includes('br') || t.includes('brasil')) s *= 1.6
      }
      return s
    }
    function nameFrom(title: string): string {
      const parts = title.split(' - ')
      return parts[0].trim()
    }

    const collected: Item[] = []
    for (const q of tKeywords) {
      const items = await searchOne(q)
      collected.push(...items)
    }
    const seen = new Set<string>()
    const ranked: Ranked[] = []
    for (const it of collected) {
      if (seen.has(it.uri)) continue
      seen.add(it.uri)
      const sc = score(it)
      ranked.push({ name: nameFrom(it.title), uri: it.uri, score: sc })
    }
    const top = ranked.length > 0 ? ranked.sort((a,b) => b.score - a.score).slice(0, 10) : fallback
    const dur = Date.now() - t0
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({ route: '/api/search/professors', method: 'GET', status: 200, duration_ms: dur }))
    }
    const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
    if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/search/professors', method: 'GET', dur })
    return NextResponse.json({ items: top }, { status: 200, headers })
  } catch {
    return NextResponse.json({ items: [] }, { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
}

export async function OPTIONS() {
  const origin = (() => { try { return new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || '').origin } catch { return '' } })()
  return NextResponse.json({}, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
