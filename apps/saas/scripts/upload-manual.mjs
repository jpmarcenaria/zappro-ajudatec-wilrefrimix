#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function uploadManual(brand, model, pdfPath, type = 'service') {
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

    // 2. Read PDF and generate SHA256
    const pdfBuffer = readFileSync(pdfPath)
    const sha256 = createHash('sha256').update(pdfBuffer).digest('hex')

    // 3. Insert manual
    const { data: manual, error } = await supabase
        .from('device_manuals')
        .upsert({
            device_id: device.id,
            type,
            url: pdfPath,
            sha256,
            lang: 'pt-BR',
            pages: Math.floor(pdfBuffer.length / 2000) // Estimativa
        }, { onConflict: 'sha256' })
        .select()

    if (error) {
        console.error('Upload error:', error)
        return
    }

    console.log(`✅ Manual uploaded: ${brand} ${model} (${manual[0].id})`)

    // TODO: Chunk PDF and create embeddings
    // Requires pdf-parse + OpenAI embeddings API
}

// Example usage
uploadManual('Daikin', 'VRV 5', './data/manuals/daikin_vrv5_service.pdf')
