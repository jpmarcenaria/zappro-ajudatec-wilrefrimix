import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

try {
  const envPath = join(process.cwd(), 'apps', 'saas', '.env')
  if (existsSync(envPath)) {
    const txt = readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (!m) continue
      const k = m[1]
      let v = m[2]
      v = v.replace(/^"|"$/g, '')
      if (!process.env[k]) process.env[k] = v
    }
  }
} catch {}

const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openai = process.env.OPENAI_API_KEY
if (!supaUrl || !supaKey || !openai) {
  console.error('missing env SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/OPENAI_API_KEY')
  process.exit(1)
}

const supa = createClient(supaUrl, supaKey)

async function embed(text) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openai}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  })
  const j = await r.json()
  return j?.data?.[0]?.embedding || []
}

async function upsertDevice(brand, model, manufacturer) {
  const { data } = await supa.from('hvacr_devices').select('id').eq('brand', brand).eq('model', model).limit(1)
  let id = data?.[0]?.id
  if (!id) {
    const ins = await supa.from('hvacr_devices').insert({ brand, model, manufacturer }).select('id')
    if (ins.error) throw ins.error
    id = ins.data?.[0]?.id
  }
  return id
}

async function addManual(deviceId, title, pdfUrl, source = 'fabricante') {
  const { data: existing } = await supa
    .from('manuals')
    .select('id')
    .eq('device_id', deviceId)
    .eq('title', title)
    .limit(1)
    .maybeSingle()
  if (existing?.id) return existing.id
  const ins = await supa.from('manuals').insert({ device_id: deviceId, title, source, pdf_url: pdfUrl, language: 'pt-BR' }).select('id').single()
  if (ins.error) throw ins.error
  return ins.data?.id
}

async function addChunk(manualId, page, section, content) {
  const embedding = await embed(content)
  const ins = await supa.from('manual_chunks').insert({ manual_id: manualId, page, section, content, embedding }).select()
  if (ins.error) throw ins.error
  return ins.data?.[0]?.id
}

async function run() {
  const families = [
    { brand: 'Daikin', model: 'EcoSwing High Wall', manufacturer: 'Daikin' },
    { brand: 'LG', model: 'Dual Inverter High Wall', manufacturer: 'LG' },
    { brand: 'Fujitsu', model: 'Inverter High Wall', manufacturer: 'Fujitsu' },
    { brand: 'Midea', model: 'Springer High Wall', manufacturer: 'Midea' },
    { brand: 'Elgin', model: 'Eco Inverter High Wall', manufacturer: 'Elgin' }
  ]
  const out = []
  for (const f of families) {
    try {
      const devId = await upsertDevice(f.brand, f.model, f.manufacturer)
      const manId = await addManual(devId, 'Manual de Serviço', null, 'fabricante')
      await addChunk(manId, 1, 'Segurança e EPI', 'Desligar energia, uso de EPI, riscos elétricos e mecânicos.')
      await addChunk(manId, 2, 'Limpeza de filtros', 'Remover frente, lavar filtros com água corrente, secar à sombra, reinstalar.')
      await addChunk(manId, 3, 'Diagnóstico de sensores', 'Sensor ~10kΩ a 25°C, verificar chicotes e conectores, substituir se fora da faixa.')
      out.push({ brand: f.brand, model: f.model, device_id: devId, manual_id: manId })
    } catch (e) {
      out.push({ brand: f.brand, model: f.model, error: e?.message || String(e) })
    }
  }
  console.log(JSON.stringify({ inserted: out }, null, 2))
}

run()
