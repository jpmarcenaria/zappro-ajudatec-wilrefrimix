import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const dynamic = 'force-dynamic'

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const header = (lines[0] || '').split(',')
  const idxBrand = header.findIndex(h => /marca|brand/i.test(h))
  const idxModel = header.findIndex(h => /modelo|model/i.test(h))
  const list: Array<{ brand: string, model: string }> = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const brand = (cols[idxBrand] || '').trim()
    const model = (cols[idxModel] || '').trim()
    if (brand && model) list.push({ brand, model })
  }
  return list
}

export async function GET() {
  try {
    const root = process.cwd()
    const csvPath = resolve(join(root, 'rascunho', 'biblioteca_absoluta_completa_brasil.csv'))
    const blacklistPath = resolve(join(root, 'apps', 'saas', 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'blacklist.json'))
    const registryPath = resolve(join(root, 'apps', 'saas', 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'download_registry.json'))

    const csvText = existsSync(csvPath) ? readFileSync(csvPath, 'utf8') : ''
    const pairs = parseCsv(csvText)

    const { createClient } = await import('@supabase/supabase-js')
    const supa = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
    const found: Array<{ brand: string, model: string, manuals: number }> = []
    const miss: Array<{ brand: string, model: string }> = []
    for (const { brand, model } of pairs) {
      const { data: dev } = await supa.from('hvacr_devices').select('id').eq('brand', brand).eq('model', model).limit(1)
      const dId = dev?.[0]?.id
      if (!dId) { miss.push({ brand, model }); continue }
      const { count } = await supa.from('manuals').select('*', { count: 'exact', head: true }).eq('device_id', dId)
      found.push({ brand, model, manuals: count || 0 })
    }

    const blacklist = existsSync(blacklistPath) ? JSON.parse(readFileSync(blacklistPath, 'utf8')) : []
    const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : []

    return NextResponse.json({ total: pairs.length, found, missing: miss, blacklist, registry })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'status_error' }, { status: 500 })
  }
}

