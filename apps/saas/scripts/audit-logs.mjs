import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const root = process.cwd()
const logsDir = join(root, 'logs')
if (!existsSync(logsDir)) mkdirSync(logsDir)
const run = (cmd, args) => {
  const p = spawnSync(cmd, args, { encoding: 'utf8' })
  return { code: p.status ?? 0, out: (p.stdout || '') + (p.stderr || '') }
}
const b = run('wsl', ['bash', '-lc', `cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && docker build -t zappro-saas .`])
writeFileSync(join(logsDir, 'docker-build.log'), b.out)
const r = run('wsl', ['bash', '-lc', `docker rm -f zappro-saas-ct >/dev/null 2>&1 || true && docker run -d --name zappro-saas-ct -e PORT=3001 -p 3001:3001 zappro-saas`])
writeFileSync(join(logsDir, 'docker-run.log'), r.out)
await new Promise(res => setTimeout(res, 1500))
const h = await fetch('http://localhost:3001/api/search/professors').then(async x => ({ status: x.status, body: await x.text() })).catch(() => ({ status: 0, body: '' }))
writeFileSync(join(logsDir, 'healthcheck.log'), `status=${h.status}\n${h.body}`)
run('wsl', ['bash', '-lc', `docker stop zappro-saas-ct`])
const t = run('wsl', ['bash', '-lc', `trivy image --severity HIGH,CRITICAL zappro-saas || true`])
writeFileSync(join(logsDir, 'trivy.log'), t.out)
