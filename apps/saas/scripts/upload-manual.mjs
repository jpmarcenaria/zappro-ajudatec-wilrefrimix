#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function uploadManual(brand, model, pdfPath, title = 'Manual de Serviço') {
    // 1. Find device
    const { data: device } = await supabase
        .from('hvacr_devices')
        .select('id')
        .eq('brand', brand)
        .eq('model', model)
        .single()

    if (!device) {
        console.error(`Device not found: ${brand} ${model}`)
        return
    }

    // 2. Read PDF (optional: estimar páginas)
    const pdfBuffer = readFileSync(pdfPath)
    const pagesEstimate = Math.max(1, Math.floor(pdfBuffer.length / 2000))

    // 3. Upsert em `manuals` por device_id + title
    const { data: existing } = await supabase
        .from('manuals')
        .select('id')
        .eq('device_id', device.id)
        .eq('title', title)
        .limit(1)
        .maybeSingle()

    let manualId = existing?.id
    if (!manualId) {
        const { data: ins, error } = await supabase
            .from('manuals')
            .insert({ device_id: device.id, title, source: 'local', pdf_url: pdfPath, language: 'pt-BR' })
            .select('id')
            .single()
        if (error) {
            console.error('Insert error:', error)
            return
        }
        manualId = ins?.id
    }

    if (error) {
        console.error('Upload error:', error)
        return
    }

    console.log(`✅ Manual registrado: ${brand} ${model} (${manualId}) ~${pagesEstimate}p`)
    // TODO: Extrair texto, chunkar e gerar embeddings → inserir em `manual_chunks`
}

// Example usage
uploadManual('Daikin', 'VRV 5', './data/manuals/daikin/VRV5/Manual_de_Servico.pdf')
