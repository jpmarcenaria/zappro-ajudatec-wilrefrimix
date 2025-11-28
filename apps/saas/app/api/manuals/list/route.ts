import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ManualDTO = { id: string; title: string; pdf_url?: string | null; source?: string | null }
type DeviceDTO = { id: string; brand: string; model: string }

export async function GET(req: Request) {
  const t0 = Date.now()
  const allowed = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_WEBSITE_URL || ''
  const origin = req.headers.get('origin') || ''
  if (allowed && origin && origin !== allowed) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'Access-Control-Allow-Origin': allowed } })
  }

  try {
    let supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    let supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    let supa = null as any
    if (supaUrl && supaKey) {
      supa = createClient(supaUrl, supaKey)
    } else {
      const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      if (!anonUrl || !anonKey) {
        return NextResponse.json({ error: 'missing_env' }, { status: 200, headers: { 'Access-Control-Allow-Origin': allowed } })
      }
      supaUrl = anonUrl
      supaKey = anonKey
      supa = createClient(anonUrl, anonKey)
    }

    const { data: devices, error: devErr } = await supa
      .from('hvacr_devices')
      .select('id, brand, model')
      .order('brand', { ascending: true })
      .order('model', { ascending: true })

    if (devErr) throw devErr

    const { data: manuals, error: manErr } = await supa
      .from('manuals')
      .select('id, title, pdf_url, source, device_id')

    if (manErr) throw manErr

    const manualsByDevice: Record<string, ManualDTO[]> = {}
    for (const m of (manuals || []) as (ManualDTO & { device_id?: string | null })[]) {
      const did = m.device_id || ''
      if (!did) continue
      if (!manualsByDevice[did]) manualsByDevice[did] = []
      manualsByDevice[did].push({ id: m.id, title: m.title, pdf_url: m.pdf_url ?? null, source: m.source ?? null })
    }

    const byBrand: Record<string, { brand: string; models: Array<{ model: string; device_id: string; manuals: ManualDTO[] }> }> = {}
    for (const d of (devices || []) as DeviceDTO[]) {
      if (!byBrand[d.brand]) byBrand[d.brand] = { brand: d.brand, models: [] }
      byBrand[d.brand].models.push({ model: d.model, device_id: d.id, manuals: manualsByDevice[d.id] || [] })
    }

    const payload = { brands: Object.values(byBrand), totalDevices: (devices || []).length }
    const dur = Date.now() - t0
    const headers: Record<string, string> = { 'Access-Control-Allow-Origin': allowed, 'Server-Timing': `total;dur=${dur}` }
    return NextResponse.json(payload, { status: 200, headers })
  } catch (e: any) {
    const msg = e?.message || 'list_error'
    return NextResponse.json({ error: msg }, { status: 500, headers: { 'Access-Control-Allow-Origin': allowed } })
  }
}

export async function OPTIONS() {
  const origin = (() => { try { return new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || '').origin } catch { return '' } })()
  return NextResponse.json({}, {
    status: 204,
    headers: {
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
