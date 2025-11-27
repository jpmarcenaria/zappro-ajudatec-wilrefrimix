#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

function run() {
  const root = resolve(process.cwd(), '..', '..')
  const src = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'biblioteca_completa_otimizada_llm.csv'))
  const out = resolve(join(root, 'pdf_manuais_hvac-r_inverter', 'arquivos_de_instrucoes', 'br_inverter_catalog.csv'))
  const text = existsSync(src) ? readFileSync(src, 'utf8') : ''
  const lines = text.split(/\r?\n/)
  const header = lines[0].split(',')
  const idxBrand = header.findIndex(h => /marca|brand/i.test(h))
  const idxModel = header.findIndex(h => /modelo|model/i.test(h))
  const set = new Set()
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue
    const cols = lines[i].split(',')
    const brand = (cols[idxBrand] || '').trim()
    const model = (cols[idxModel] || '').trim()
    if (brand && model) set.add(`${brand},${model}`)
  }
  const outCsv = 'brand,model\n' + Array.from(set).join('\n')
  writeFileSync(out, outCsv)
  console.log(JSON.stringify({ entries: set.size, file: out }))
}

run()

