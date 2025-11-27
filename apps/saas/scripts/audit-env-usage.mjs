#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function listFiles(dir) {
  const out = []
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    const ents = readdirSync(d, { withFileTypes: true })
    for (const e of ents) {
      const p = join(d, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) out.push(p)
    }
  }
  return out
}

function extractEnvKeys(text) {
  const keys = new Set()
  const re = /process\.env\.([A-Z0-9_]+)/g
  let m
  while ((m = re.exec(text))) keys.add(m[1])
  return Array.from(keys)
}

function loadExampleEnv(path) {
  const text = readFileSync(path, 'utf8')
  const re = /^(?:#\s*)?([A-Z0-9_]+)\s*=\s*/gm
  const keys = new Set()
  let m
  while ((m = re.exec(text))) keys.add(m[1])
  return Array.from(keys)
}

function run() {
  const root = process.cwd()
  const appApi = join(root, 'apps', 'saas', 'app', 'api')
  const files = listFiles(appApi)
  const usage = {}
  for (const f of files) {
    const txt = readFileSync(f, 'utf8')
    const keys = extractEnvKeys(txt)
    if (keys.length) usage[f] = keys
  }
  const exampleRoot = join(root, '.env.example')
  const exampleApp = join(root, 'apps', 'saas', '.env.example')
  const rootKeys = loadExampleEnv(exampleRoot)
  const appKeys = loadExampleEnv(exampleApp)
  const result = { usage, example_root_keys: rootKeys, example_app_keys: appKeys, missing_in_examples: [] }
  const allExample = new Set([...rootKeys, ...appKeys])
  const missing = new Set()
  for (const arr of Object.values(usage)) for (const k of arr) if (!allExample.has(k)) missing.add(k)
  result.missing_in_examples = Array.from(missing)
  writeFileSync(join(root, 'apps', 'saas', 'logs', 'env_audit.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ ok: true, files_scanned: files.length, missing: result.missing_in_examples.length }))
}

run()
