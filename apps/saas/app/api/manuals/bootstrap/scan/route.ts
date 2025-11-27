import { NextResponse } from 'next/server'

async function sample(url: string) {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-1048575', 'User-Agent': 'Mozilla/5.0', Accept: 'application/pdf,*/*' }, redirect: 'follow' })
    if (!r.ok) return ''
    const buf = await r.arrayBuffer()
    return Buffer.from(buf).toString('latin1')
  } catch { return '' }
}

function score(text: string) {
  const t = text.toLowerCase()
  const pos = ['service manual','manual de serviço','installation manual','operation manual','troubleshooting','error code','wiring diagram','diagram']
  const neg = ['brochure','catálogo','catalogo','marketing','datasheet','spec sheet','press release']
  let s = 0
  for (const k of pos) if (t.includes(k)) s += 1
  for (const k of neg) if (t.includes(k)) s -= 1
  return s
}

async function classify(text: string) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { label: 'unknown', confidence: 0 }
  const prompt = `Classifique o PDF como service_manual, engineering_doc, marketing ou other. Responda em JSON {label, confidence}. Texto:\n${text.slice(0, 6000)}`
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Você é um classificador conciso.' }, { role: 'user', content: prompt }], max_tokens: 60, temperature: 0 })
    })
    if (!r.ok) return { label: 'unknown', confidence: 0 }
    const j = await r.json()
    const txt = j?.choices?.[0]?.message?.content || ''
    const m = txt.match(/\{\s*"label"\s*:\s*"([a-z_]+)"\s*,\s*"confidence"\s*:\s*(\d+(?:\.\d+)?)\s*\}/i)
    if (m) return { label: m[1], confidence: Number(m[2]) }
    return { label: 'unknown', confidence: 0 }
  } catch { return { label: 'unknown', confidence: 0 } }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })
    const text = await sample(url)
    const s = score(text)
    let label = s >= 2 ? 'service_manual' : s <= -1 ? 'marketing' : 'unknown'
    let confidence = Math.min(1, Math.max(0, (s + 2) / 4))
    if (label === 'unknown') {
      const ai = await classify(text)
      label = ai.label
      confidence = ai.confidence
    }
    return NextResponse.json({ url, label, confidence })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}

