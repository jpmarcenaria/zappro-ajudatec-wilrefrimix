import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const logsDir = join(root, 'logs')
if (!existsSync(logsDir)) mkdirSync(logsDir)

const run = (cmd, args, opts={}) => {
  const p = spawnSync(cmd, args, { encoding: 'utf8', ...opts })
  return { code: p.status ?? 0, out: (p.stdout || '') + (p.stderr || '') }
}

const dockerInfo = run('wsl', ['bash', '-lc', 'docker info'])
writeFileSync(join(logsDir, 'supabase-docker-info.log'), dockerInfo.out)
const supaVersion = run('wsl', ['bash', '-lc', 'npx supabase --version'])
writeFileSync(join(logsDir, 'supabase-version.log'), supaVersion.out)

const ready = dockerInfo.out.includes('Server Version') && /supabase\s+\d+/.test(supaVersion.out)
writeFileSync(join(logsDir, 'supabase-ready.json'), JSON.stringify({ ready }))

if (!ready) {
  console.log('provision-supabase: ambiente não pronto; ver logs em apps/saas/logs/*.log')
  process.exit(0)
}

// Plano de provisionamento (sem executar migração destrutiva automaticamente)
const plan = {
  schemas: ['technical_manuals', 'professor_content', 'faq_knowledge_base', 'search_cache', 'firecrawl_jobs'],
  rls: true,
  endpoints: ['v1/technical_manuals', 'v1/professor_content', 'v1/faq_knowledge_base']
}
writeFileSync(join(logsDir, 'supabase-plan.json'), JSON.stringify(plan, null, 2))
console.log('provision-supabase: plano gerado; execute migrações quando aprovado')
