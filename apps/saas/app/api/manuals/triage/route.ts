import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'

export const dynamic = 'force-dynamic'

function classify(text: string) {
  const t = text.toLowerCase()
  const scoreService = [
    'manual de serviço','service manual','troubleshooting','diagnóstico','código de erro','error code',
    'procedimento de teste','modo de serviço','service mode','wiring diagram','diagrama elétrico','part number'
  ].reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0)
  const scoreEng = [
    'installation manual','manual de instalação','datasheet','catálogo','specification','especificações','energy efficiency'
  ].reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0)
  const type = scoreService >= Math.max(2, scoreEng) ? 'service_manual' : (scoreEng > 0 ? 'engineering_doc' : 'unknown')
  return { type, scoreService, scoreEng }
}

export async function POST(req: Request) {
  try {
    const data = await req.arrayBuffer()
    if (!data || data.byteLength < 1024) return NextResponse.json({ error: 'file_too_small' }, { status: 400 })
    const pdfParse = await import('pdf-parse')
    const buf = Buffer.from(data)
    const d = await pdfParse.default(buf)
    const text = String(d.text || '')
    const cls = classify(text)
    return NextResponse.json({ bytes: buf.length, classification: cls, text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'triage_error' }, { status: 500 })
  }
}
