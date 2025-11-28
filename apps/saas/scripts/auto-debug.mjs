import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

const root = path.resolve(process.cwd())
const logsDir = path.join(root, 'logs', 'auto-debug')
fs.mkdirSync(logsDir, { recursive: true })

function run(cmdline, opts = {}) {
  return new Promise((resolve) => {
    exec(cmdline, { ...opts, shell: true }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code || 1) : 0, out: stdout?.toString() || '', err: stderr?.toString() || '' })
    })
  })
}

async function collectTypecheck() {
  const r = await run('npm run typecheck', { cwd: root })
  return { ok: r.code === 0, out: r.out, err: r.err }
}

async function collectLint() {
  const r = await run('npm run lint', { cwd: root })
  return { ok: r.code === 0, out: r.out, err: r.err }
}

async function collectVitest() {
  const r = await run('npx vitest --run __tests__ --reporter json', { cwd: root })
  let json = null
  try {
    // Vitest JSON may include multiple JSON lines; pick last parsable
    const lines = r.out.trim().split(/\n+/)
    for (let i = lines.length - 1; i >= 0; i--) {
      try { json = JSON.parse(lines[i]); break } catch {}
    }
  } catch {}
  return { ok: r.code === 0, raw: r.out, json }
}

async function collectPlaywright() {
  const r = await run('npx playwright test --reporter json', { cwd: root })
  let json = null
  try { json = JSON.parse(r.out) } catch {}
  return { ok: r.code === 0, raw: r.out, json }
}

function extractFailuresVitest(json) {
  const failures = []
  if (!json) return failures
  for (const f of json?.tests || []) {
    if (f.result?.state === 'fail') {
      failures.push({ framework: 'vitest', file: f.file, name: f.name, error: f.errors?.[0]?.message || '', stack: f.errors?.[0]?.stack || '' })
    }
  }
  return failures
}

function extractFailuresPlaywright(json) {
  const failures = []
  if (!json?.suites) return failures
  for (const s of json.suites) {
    for (const sp of s.specs || []) {
      for (const r of sp.tests || []) {
        if (r.status === 'failed') {
          failures.push({ framework: 'playwright', file: sp.file, name: sp.title, error: (r.errors?.[0]?.message) || '', stack: (r.errors?.[0]?.stack) || '' })
        }
      }
    }
  }
  return failures
}

function guessFilesFromStacks(failures) {
  const refs = []
  for (const f of failures) {
    const m = (f.stack || '').match(/(apps\/saas\/[\w\/\.-]+):(\d+):(\d+)/)
    if (m) refs.push({ path: m[1], line: Number(m[2]) })
  }
  return refs
}

async function proposeFixesWithLLM(context) {
  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!apiKey) return { skipped: true, suggestions: 'OPENAI_API_KEY ausente; pulando autodesbug.' }
  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você é um agente sênior que gera patches mínimos e seguros para corrigir falhas de testes. Retorne um único bloco de diff unificado válido.' },
      { role: 'user', content: `Contexto:\n${context}\n\nRegra: gere diff unificado (git-like) apenas com mudanças necessárias. Não crie arquivos novos sem necessidade.` }
    ],
    temperature: 0
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  })
  const j = await res.json().catch(() => ({}))
  const text = j?.choices?.[0]?.message?.content || ''
  return { skipped: false, suggestions: text }
}

function write(file, data) {
  fs.writeFileSync(file, data)
}

async function main() {
  const type = await collectTypecheck()
  const lint = await collectLint()
  const vit = await collectVitest()
  const pw = await collectPlaywright()

  const vitFails = extractFailuresVitest(vit.json)
  const pwFails = extractFailuresPlaywright(pw.json)
  const allFails = [...vitFails, ...pwFails]

  const ledger = { when: new Date().toISOString(), typecheck_ok: type.ok, lint_ok: lint.ok, vit_ok: vit.ok, pw_ok: pw.ok, failures: allFails }
  write(path.join(logsDir, 'bugs.json'), JSON.stringify(ledger, null, 2))

  const refs = guessFilesFromStacks(allFails)
  let ctx = `Falhas:\n${JSON.stringify(allFails, null, 2)}\n\nArquivos suspeitos:\n${JSON.stringify(refs, null, 2)}`
  const llm = await proposeFixesWithLLM(ctx)
  write(path.join(logsDir, 'suggestions.md'), llm.suggestions || 'sem sugestões')

  const apply = process.argv.includes('--apply')
  if (apply && llm.suggestions && !llm.skipped) {
    // tentativa simples: salvar diff para revisão manual
    write(path.join(logsDir, 'patch.diff'), llm.suggestions)
    console.log('Patch proposto salvo em logs/auto-debug/patch.diff — aplique manualmente com git apply')
  }

  console.log('Resumo auto-debug:')
  console.log(`typecheck_ok=${type.ok} lint_ok=${lint.ok} vit_ok=${vit.ok} pw_ok=${pw.ok} failures=${allFails.length}`)
  console.log(`Saídas em ${logsDir}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
