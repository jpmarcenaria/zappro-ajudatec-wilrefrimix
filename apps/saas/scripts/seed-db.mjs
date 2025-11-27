#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

async function seedDatabase(supa) {
  const devices = [
    { manufacturer: 'Daikin', brand: 'Daikin', model: 'FTXV', series: 'Split Inverter' },
    { manufacturer: 'LG', brand: 'LG', model: 'S3-W18KL31A', series: 'Dual Inverter' },
    { manufacturer: 'Midea', brand: 'Midea', model: 'MSPLIT', series: 'Split Inverter' }
  ]
  const manuals = [
    { brand: 'Daikin', model: 'FTXV', title: 'Manual de Serviço FTXV', source: 'local', pdf_url: null, language: 'pt-BR' },
    { brand: 'LG', model: 'S3-W18KL31A', title: 'Manual Técnico LG Dual Inverter', source: 'local', pdf_url: null, language: 'pt-BR' },
    { brand: 'Midea', model: 'MSPLIT', title: 'Manual Técnico Midea MSPLIT 2022', source: 'local', pdf_url: null, language: 'pt-BR' }
  ]
  const alarms = [
    { brand: 'LG', model: 'S3-W18KL31A', code: 'CH 05', title: 'Falha sensor', severity: 2, resolution: 'Verificar cabos e sensor' }
  ]

  const up1 = await supa.from('hvacr_devices').upsert(devices, { onConflict: 'manufacturer,brand,model', returning: 'representation' })
  if (up1.error) return { ok: false, error: up1.error.message }
  const devRows = up1.data || []

  const devMap = new Map()
  for (const d of devRows) devMap.set(`${d.brand}:${d.model}`, d.id)

  const manualRows = []
  for (const m of manuals) {
    const did = devMap.get(`${m.brand}:${m.model}`)
    if (!did) continue
    const { data, error } = await supa.from('manuals').upsert([{ device_id: did, title: m.title, source: m.source, pdf_url: m.pdf_url, language: m.language }], { onConflict: 'device_id,title', returning: 'representation' })
    if (error) return { ok: false, error: error.message }
    manualRows.push(...(data || []))
  }

  for (const a of alarms) {
    const did = devMap.get(`${a.brand}:${a.model}`)
    if (!did) continue
    const { error } = await supa.from('alarm_codes').upsert([{ device_id: did, code: a.code, title: a.title, severity: a.severity, resolution: a.resolution }], { onConflict: 'device_id,code' })
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true, error: null, devices: devRows.length, manuals: manualRows.length, alarms: alarms.length }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.log(JSON.stringify({ ok: false, error: 'Env ausente: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY' }))
    process.exit(0)
  }
  const supa = createClient(url, key)
  const t0 = Date.now()
  const res = await seedDatabase(supa)
  const dur = Date.now() - t0
  console.log(JSON.stringify({ ...res, dur }))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { seedDatabase }
