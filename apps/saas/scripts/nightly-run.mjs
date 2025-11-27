#!/usr/bin/env node
import { spawn } from 'node:child_process'

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    p.on('close', code => { if (code === 0) resolve(0); else reject(new Error(`${cmd} exit ${code}`)) })
  })
}

async function main() {
  const root = process.cwd()
  const saas = `${root}/apps/saas`
  const nodeBin = process.execPath
  await run(nodeBin, ['scripts/discover-pdf-links.mjs'], saas)
  await run(nodeBin, ['../scripts/bootstrap-download-pdfs.mjs', '--out', `${root}/data/manuals`, '--parallel', '8'], root)
  await run(nodeBin, ['scripts/scan-pdf-quality.mjs'], saas)
  await run(nodeBin, ['scripts/ingest-manuals-from-data.mjs'], saas)
}

main().catch(err => { console.error(err?.message || String(err)); process.exit(1) })
