import { NextResponse } from 'next/server'

type IngestBody = {
  brand?: string
  model?: string
  manufacturer?: string
  title: string
  pdf_url?: string
  source?: string
  content?: string
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  })
  if (!res.ok) throw new Error('embedding_failed')
  const data = await res.json()
  return data.data[0].embedding
}

function chunk(text: string): { content: string; page: number; section: string }[] {
  const parts: string[] = []
  const lines = text.split(/\n+/)
  let buf: string[] = []
  for (const l of lines) {
    buf.push(l)
    if (buf.join('\n').length > 2000) { parts.push(buf.join('\n')); buf = [] }
  }
  if (buf.length) parts.push(buf.join('\n'))
  return parts.map((c, i) => ({ content: c, page: i + 1, section: 'Auto' }))
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || ''
    const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!apiKey || !supaUrl || !supaKey) return NextResponse.json({ error: 'missing env' }, { status: 500 })
    const body: IngestBody = await req.json()
    if (!body || !body.title || (!body.content && !body.pdf_url)) return NextResponse.json({ error: 'invalid input' }, { status: 400 })

    const { createClient } = await import('@supabase/supabase-js')
    const supa = createClient(supaUrl, supaKey)

    let deviceId: string | null = null
    if (body.brand && body.model) {
      const { data: dev } = await supa
        .from('hvacr_devices')
        .select('id')
        .eq('brand', body.brand)
        .eq('model', body.model)
        .limit(1)
        .maybeSingle()
      if (dev?.id) deviceId = dev.id
      else {
        const { data: insDev, error: insDevErr } = await supa
          .from('hvacr_devices')
          .insert({ brand: body.brand, model: body.model, manufacturer: body.manufacturer || null })
          .select('id')
          .single()
        if (insDevErr) throw insDevErr
        deviceId = insDev.id
      }
    }

    const { data: man } = await supa
      .from('manuals')
      .insert({ device_id: deviceId, title: body.title, source: body.source || null, pdf_url: body.pdf_url || null })
      .select('id')
      .single()
    if (!man?.id) throw new Error('manual_insert_failed')

    const text = body.content || ''
    const parts = chunk(text)
    const embeddings: number[][] = []
    for (const p of parts) embeddings.push(await embed(p.content, apiKey))

    const rows = parts.map((p, idx) => ({ manual_id: man.id!, page: p.page, section: p.section, content: p.content, embedding: embeddings[idx] }))
    const { error: insErr } = await supa.from('manual_chunks').insert(rows)
    if (insErr) throw insErr

    return NextResponse.json({ manual_id: man.id!, chunks: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'ingest_error' }, { status: 500 })
  }
}
