import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const logsDir = join(root, 'logs')
if (!existsSync(logsDir)) mkdirSync(logsDir)

const owner = process.env.GITHUB_OWNER || ''
const repo = process.env.GITHUB_REPO || ''

const issues = [
  {
    title: 'Habilitar Docker Desktop + WSL2 e instalar Trivy',
    body: [
      '- Ativar Docker Desktop com integração WSL 2',
      '- Validar `docker info` no WSL',
      '- Instalar Trivy e executar `scan:trivy`',
      '- Anexar evidências em `apps/saas/logs/*`'
    ].join('\n')
  },
  {
    title: 'Provisionar Supabase local com schemas e RLS',
    body: [
      '- Confirmar Supabase CLI e Docker ativos em WSL',
      '- Criar schemas e políticas RLS (PostgREST)',
      '- Validar endpoints com Playwright smoke pós-deploy'
    ].join('\n')
  }
]

writeFileSync(join(logsDir, 'github-issues.json'), JSON.stringify({ owner, repo, issues }, null, 2))
writeFileSync(join(logsDir, 'github-issues.md'), issues.map((i, idx) => `# ${idx+1}. ${i.title}\n\n${i.body}\n`).join('\n'))

console.log('github-compliance: payloads gravados em logs/github-issues.*')
