import { record } from '../../../../lib/monitor'
import { rateLimit } from '../../../../lib/rate-limit'

export async function OPTIONS() {
  const origin = (() => { try { return new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || '').origin } catch { return '' } })()
  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

type AttachmentPayload = { mimeType: string; data: string; name?: string }
type Body = { text: string; attachments: AttachmentPayload[]; useSearch?: boolean }
type ContentPart =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string }
  | { type: 'input_file'; file_data: string; filename?: string }


export async function POST(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return new Response('forbidden', { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  // Rate limiting: 20 mensagens por minuto
  const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anonymous'
  const limiter = rateLimit(userId, 20, 60000)

  if (!limiter.success) {
    return new Response(
      JSON.stringify({ error: 'Muitas requisições. Aguarde 1 minuto.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': limiter.remaining.toString(),
          'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
          ...(allowed ? { 'Access-Control-Allow-Origin': allowed } : {})
        }
      }
    )
  }

  let parsed: Partial<Body> = {}
  try {
    parsed = await req.json()
  } catch { }
  const text = typeof parsed.text === 'string' ? parsed.text : ''
  const attachments = Array.isArray(parsed.attachments) ? parsed.attachments : []
  const useSearch = !!parsed.useSearch

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const payload = { text: 'API não configurada', groundingUrls: [] }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  const contentParts: ContentPart[] = []
  if (text && typeof text === 'string' && text.trim().length > 0) {
    contentParts.push({ type: 'input_text', text })
  }

  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      if (!att || !att.mimeType || !att.data) continue
      const dataUrl = `data:${att.mimeType};base64,${att.data}`
      if (att.mimeType.startsWith('image/')) {
        contentParts.push({ type: 'input_image', image_url: dataUrl })
      } else if (att.mimeType === 'application/pdf') {
        contentParts.push({ type: 'input_file', file_data: dataUrl, filename: att.name || 'document.pdf' })
      }
    }
  }

  const model = contentParts.some(p => p.type !== 'input_text') ? 'gpt-4o' : 'gpt-4o-mini'

  const instructionBase = (() => {
    const envInstr = process.env.SYSTEM_INSTRUCTION_PT_BR || process.env.SYSTEM_INSTRUCTION
    if (envInstr && envInstr.trim().length > 0) return envInstr

    // Load persona from file
    try {
      const fs = require('fs')
      const path = require('path')
      const personaPath = path.join(process.cwd(), 'PROMPTS', 'chatbot-persona.md')
      const personaContent = fs.readFileSync(personaPath, 'utf-8')

      // Add current date context
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      return `${personaContent}\n\n**DATA ATUAL**: ${currentDate}\n**CONTEXTO**: Você está respondendo a um técnico de HVAC-R no Brasil.`
    } catch (error) {
      // Fallback to original instruction if file not found
      return [
        'Responda estritamente em português do Brasil (pt-BR), otimizando para TTS.',
        'Persona: técnico sênior brasileiro em HVAC-R, estilo @willrefrimix, pragmático e direto.',
        'Data de referência: 25/11/2025. Considere equipamentos e normas vigentes no Brasil.',
        'Estrutura: Diagnóstico breve; Manha/Dica prática; Referência; Aviso de segurança.',
        'Entrada multimodal: texto, áudio transcrito, imagens de placas/etiquetas, PDF de manuais.',
        'Priorize fontes brasileiras (YouTube técnico BR, manuais de marcas vendidas no Brasil).',
        'Evite aconselhar aparelhos não comercializados no Brasil. Faça perguntas se houver ambiguidade.',
      ].join('\n')
    }
  })()

  async function aggregateSearch(q: string): Promise<{ title: string; uri: string }[]> {
    const out: { title: string; uri: string }[] = []
    const tvly = process.env.TAVILY_API_KEY
    if (useSearch && tvly) {
      try {
        const r = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tvly}` },
          body: JSON.stringify({ query: q, search_depth: 'advanced', max_results: 3, include_answer: false })
        })
        const j = await r.json().catch(() => null)
        const items = Array.isArray(j?.results) ? j.results : []
        for (const it of items) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) out.push({ title, uri })
        }
      } catch { }
    }
    const brave = process.env.BRAVE_API_KEY
    if (useSearch && brave) {
      try {
        const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&country=BR&lang=pt-BR&count=3`, {
          headers: { 'X-Subscription-Token': brave }
        })
        const j = await r.json().catch(() => null)
        const items = Array.isArray(j?.web?.results) ? j.web.results : []
        for (const it of items) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) out.push({ title, uri })
        }
      } catch { }
    }
    const fire = process.env.FIRECRAWL_API_KEY
    if (useSearch && fire) {
      try {
        const r = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${fire}` },
          body: JSON.stringify({ query: q, limit: 3 })
        })
        const j = await r.json().catch(() => null)
        const items = Array.isArray(j?.results) ? j.results : []
        for (const it of items) {
          const title = typeof it?.title === 'string' ? it.title : ''
          const uri = typeof it?.url === 'string' ? it.url : ''
          if (title && uri) out.push({ title, uri })
        }
      } catch { }
    }
    const seen = new Set<string>()
    const uniq: { title: string; uri: string }[] = []
    function isTrusted(u: string): boolean { try { const x = new URL(u); return x.protocol === 'https:' } catch { return false } }
    for (const x of out) { if (!seen.has(x.uri) && isTrusted(x.uri)) { seen.add(x.uri); uniq.push(x) } }
    function host(u: string): string {
      try { return new URL(u).host.toLowerCase() } catch { return '' }
    }
    const manu = ['midea', 'gree', 'daikin', 'carrier', 'lg', 'samsung', 'consul', 'elgin', 'springer', 'electrolux']
    function score(item: { title: string; uri: string }): number {
      const h = host(item.uri)
      let s = 1
      if (h.endsWith('.br') || h.includes('.com.br') || h.includes('.org.br')) s *= 1.8
      if (manu.some(m => h.includes(m))) s *= 2
      if (h.includes('crea') || h.includes('confea') || h.includes('abrava')) s *= 2
      const t = (item.title || '').toLowerCase()
      if (t.includes('manual') || t.includes('boletim') || t.includes('pdf')) s *= 1.4
      if (t.includes('2025') || t.includes('2024')) s *= 1.2
      if (h.includes('youtube.com') || h.includes('instagram.com')) {
        if (t.includes('br') || t.includes('brasil')) s *= 1.6
      }
      return s
    }
    return uniq.sort((a, b) => score(b) - score(a)).slice(0, 5)
  }

  const grounding = useSearch && typeof text === 'string' && text.trim().length > 0 ? await aggregateSearch(text) : []
  const instruction = grounding.length > 0
    ? `${instructionBase}\nFontes sugeridas:\n${grounding.map(g => `- ${g.title} (${g.uri})`).join('\n')}`
    : instructionBase

  // Map content parts to OpenAI format
  const userContent = contentParts.map(p => {
    if (p.type === 'input_text') return { type: 'text', text: p.text }
    if (p.type === 'input_image') return { type: 'image_url', image_url: { url: p.image_url } }
    return null
  }).filter(Boolean)

  const body = {
    model,
    messages: [
      { role: 'system', content: instruction },
      { role: 'user', content: userContent }
    ],
    // tools: tools // Add tools if needed
  }

  let textOut = ''
  let statusCode = 200
  let errMsg = ''
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 6000)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      errMsg = await res.text().catch(() => '')
      statusCode = 200
    } else {
      const raw = await res.json().catch(() => ({}))
      textOut = raw?.choices?.[0]?.message?.content || ''
    }
  } catch {
    statusCode = 200
  }

  const dur = Date.now() - t0
  const payload = { text: textOut || 'Não consegui gerar uma resposta técnica no momento.', groundingUrls: grounding }
  const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
  if (dur > 2000 && process.env.NODE_ENV !== 'production') console.warn('slow_route', { route: '/api/openai/chat', dur, err: errMsg ? true : false })
  record('/api/openai/chat', dur, statusCode)
  return new Response(JSON.stringify(payload), { status: statusCode, headers })
}
