#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const opts = { config: 'playwright.3001.config.ts', cwd: 'apps/saas', tests: ['tests/status.spec.ts','tests/cache.spec.ts','tests/manuals-ingest.spec.ts'], failFast: false, env: {}, applyDb: false }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '--config' && args[i+1]) { opts.config = args[++i] }
  else if (a === '--cwd' && args[i+1]) { opts.cwd = args[++i] }
  else if (a === '--tests' && args[i+1]) { opts.tests = args[++i].split(',').map(s=>s.trim()).filter(Boolean) }
  else if (a === '--fail-fast') { opts.failFast = true }
  else if (a === '--apply-db') { opts.applyDb = true }
  else if (a.startsWith('--env=') || a === '--env') {
    const eq = a.includes('=') ? a.slice(a.indexOf('=')+1) : (args[i+1]||'')
    if (eq) {
      for (const kv of eq.split(',')) {
        const [k,...rest] = kv.split('='); const v = rest.join('='); if (k) opts.env[k] = v
      }
      if (a === '--env') i++
    }
  }
}

const root = process.cwd()
const logsDir = join(root, 'logs')
if (!existsSync(logsDir)) mkdirSync(logsDir)
const stamp = new Date().toISOString().replace(/[:.]/g,'-')
const runLog = join(logsDir, `make-${stamp}.log`)
const summaryLog = join(logsDir, `make-summary-${stamp}.json`)

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT||'3001'}`
const env = { ...process.env, BASE_URL, PORT: process.env.PORT || '3001', ALLOWED_ORIGIN: `http://localhost:${process.env.PORT||'3001'}`, NEXT_PUBLIC_WEBSITE_URL: `http://localhost:${process.env.PORT||'3001'}`, ...opts.env }

const writeLog = (text) => { try { writeFileSync(runLog, text, { flag: 'a' }) } catch {} }

const fetchHead = async (url) => {
  try {
    const res = await fetch(url, { method: 'GET' })
    return res.status
  } catch { return 0 }
}

const diagnose = (name, out) => {
  const text = String(out||'')
  const findings = []
  if (/ECONNREFUSED/.test(text) || /connect ECONNREFUSED/.test(text)) findings.push('conexao_recusada')
  if (/::1:3000/.test(text) || /localhost:3000/.test(text)) findings.push('porta_3000_config')
  if (/missing_upstash_env/.test(text) || /Upstash env ausente/.test(text)) findings.push('upstash_env_ausente')
  if (/missing env/.test(text)) findings.push('env_server_ausente')
  if (/Unauthorized.*MCP/.test(text)) findings.push('mcp_token_ausente')
  return findings
}

const suggestFix = async (findings) => {
  const actions = []
  if (findings.includes('porta_3000_config')) actions.push('usar_config_3001')
  if (findings.includes('conexao_recusada')) actions.push('verificar_servidor_rodando')
  if (findings.includes('upstash_env_ausente')) actions.push('definir_UPSTASH_REDIS_REST_URL_e_TOKEN')
  if (findings.includes('env_server_ausente')) actions.push('definir_OPENAI_API_KEY_e_SUPABASE_SERVICE_ROLE_KEY')
  if (findings.includes('mcp_token_ausente')) actions.push('definir_SUPABASE_ACCESS_TOKEN_para_MCP')
  return actions
}

const runOne = (spec) => new Promise((resolve) => {
  const cmd = 'npx'
  const args = ['playwright','test',spec,'--config',opts.config]
  const p = spawn(cmd, args, { cwd: join(root, opts.cwd), env, shell: true })
  let buf = ''
  p.stdout.on('data', d => { buf += d.toString(); writeLog(d.toString()) })
  p.stderr.on('data', d => { buf += d.toString(); writeLog(d.toString()) })
  p.on('close', async (code) => {
    const ok = code === 0
    const findings = diagnose(spec, buf)
    const actions = await suggestFix(findings)
    resolve({ spec, ok, code, findings, actions, out: buf })
  })
})

const summarize = (items) => {
  const summary = {
    baseURL: BASE_URL,
    results: items.map(x => ({ spec: x.spec, ok: x.ok, code: x.code, findings: x.findings, actions: x.actions })),
    passed: items.filter(x=>x.ok).length,
    failed: items.filter(x=>!x.ok).length,
  }
  try { writeFileSync(summaryLog, JSON.stringify(summary, null, 2)) } catch {}
  return summary
}

(async () => {
  writeLog(`MAKE START ${new Date().toISOString()}\n`)
  if (opts.applyDb) {
    const drive = root.slice(0,1).toLowerCase()
    const wslRoot = `/mnt/${drive}${root.slice(2).replace(/\\/g,'/')}`
    const cmd = 'wsl'
    const args = ['bash','-lc',`cd ${wslRoot} && bash scripts/apply-db.sh`]
    await new Promise((resolve) => {
      const p = spawn(cmd, args, { cwd: root, env, shell: true })
      let buf = ''
      p.stdout.on('data', d => { buf += d.toString(); writeLog(d.toString()) })
      p.stderr.on('data', d => { buf += d.toString(); writeLog(d.toString()) })
      p.on('close', () => resolve(undefined))
    })
  }
  const health = await fetchHead(`${BASE_URL}/api/health`)
  if (health !== 200) {
    writeLog(`HEALTH ${health}\n`)
  }
  const results = []
  for (const spec of opts.tests) {
    const r = await runOne(spec)
    results.push(r)
    if (!r.ok && opts.failFast) break
  }
  const summary = summarize(results)
  writeLog(`SUMMARY ${JSON.stringify(summary)}\n`)
  const hasCritical = summary.failed > 0 && summary.results.some(r => r.findings.includes('conexao_recusada') || r.findings.includes('porta_3000_config'))
  if (hasCritical) process.exit(1)
  process.exit(summary.failed > 0 ? 1 : 0)
})()

