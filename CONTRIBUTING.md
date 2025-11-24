# Guia de Contribuição e Desenvolvimento

Este documento detalha as regras e padrões obrigatórios para o desenvolvimento neste projeto, com foco na execução consistente dentro do ambiente WSL (Windows Subsystem for Linux).

## Contrato de Terminal (WSL)

- Todas as operações de CLI devem ser executadas em WSL (Ubuntu) usando Bash.
- Arquivo de contrato em `.trae/terminal.json` define essa preferência.
- Quando executar a partir do Windows, use `wsl bash -lc "<comando>"`.

### Prompt de Contrato (LLM)

```
CONTRATO OBRIGATÓRIO – EXECUÇÃO EM WSL UBUNTU 24.04 (Windows 11)

1) Terminal e Ambiente
- Sempre execute comandos via WSL Ubuntu 24.04 usando: wsl bash -lc "<comando>"
- Nunca use PowerShell ou CMD para build, Supabase, Docker ou scripts npm.
- Use paths Linux (ex: /mnt/d/...) e jamais paths Windows (ex: D:\...).

2) Qualidade e Validação
- Após qualquer alteração de código, valide em WSL: npm run lint, npm run typecheck, npm run build.
- Evite criar arquivos supérfluos; edite os existentes seguindo o padrão do projeto.

3) Segurança e APIs
- Não exponha chaves em client; acesse OpenAI somente via rotas server (Next.js API em app/api/openai/*).
- Respeite variáveis em apps/saas/.env; não mova segredos para client.

4) Execução Local
- Dev em WSL (porta definida): wsl bash -lc "cd /mnt/d/.../apps/saas && PORT=3001 npm run dev"
- Supabase local usa Docker (WSL); se Docker não estiver ativo, não tentar start.

5) Objetivo
- Priorizar correção, performance, e consistência com App Router Next.js.
- Seguir a UX WhatsApp‑like existente e padrões de integração (Stripe/Supabase/OpenAI).
```

### Seed de Prompt (Contrato WSL Ubuntu 24.04)

Use o seed abaixo para alinhar qualquer agente/ferramenta ao contrato de execução:

```
CONTRATO OBRIGATÓRIO – EXECUÇÃO EM WSL UBUNTU 24.04

Ambiente: WSL Ubuntu 24.04
Shell: Bash
Execução a partir do Windows: sempre usar `wsl bash -lc "<comando>"`
Paths: padrão Linux (`/mnt/d/...`) – nunca usar paths Windows (`D:\\`)
Ferramentas: Docker com integração WSL, Supabase CLI via `npx`, Node.js 20+
Proibições: não usar PowerShell/CMD para build, Supabase, Docker ou scripts npm
Validações: rodar `npm run typecheck`, `npm run lint`, `npm run build` em WSL
Contrato: respeitar `.trae/terminal.json` e interromper qualquer execução fora do WSL
```

## Fluxo Git

- Branches
  - `main`: estável, somente merges via PR revisados
  - `develop`: integração contínua de features
  - `feature/<slug>`: desenvolvimento de funcionalidades
  - `fix/<slug>`: correções pontuais
  - `hotfix/<slug>`: correções críticas sobre release
  - `release/<version>`: preparação para publicação

- Commits (Conventional Commits)
  - `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`, `test: ...`
  - Escopos opcionais: `feat(api)`, `fix(ui)`, etc.
  - Mensagens no imperativo, curtas e objetivas

- Tags Semânticas
  - `vMAJOR.MINOR.PATCH` (ex.: `v1.0.0`, `v1.1.0`)
  - `MAJOR`: mudanças incompatíveis
  - `MINOR`: novas features retrocompatíveis
  - `PATCH`: correções retrocompatíveis

- Proteções de Branch
  - `main`: exigir status verde de CI, revisão de pelo menos 1 revisor, squash merge
  - Bloquear pushes diretos; permitir apenas via PR

- PRs
  - Checklist: `lint`, `typecheck`, `build`, `test:e2e` em WSL
  - Descrever impacto, riscos e validações
  - Referenciar issues quando aplicável

- Tokens GitHub (Trae IDE)
  - Configurar `GITHUB_TOKEN`/`GH_TOKEN` na IDE para operações autenticadas
  - Validar com `npm run compliance:github` (gera payloads de issues em `apps/saas/logs/`)

## CI/CD

- Ações
  - CI (`.github/workflows/ci.yml`): build, start em `3001`, contrato/Smoke
  - Sprite + Playwright (`.github/workflows/ci-sprite.yml`): sprite e E2E com artefatos
  - Scan de Container (`.github/workflows/scan.yml`): build de imagem e Trivy
- Regras
  - Disparar em `push`/`PR` para `main`/`develop` e em tags `v*.*.*`
  - Falhas devem bloquear merge em `main`

## Ignore Files

- `.gitignore` padronizado para caches, builds, `env`, relatórios e artefatos
- `.dockerignore` com exclusões para reduzir imagem e evitar segredos

## Validações Locais Antes do Push

- `wsl bash -lc "cd /mnt/d/.../apps/saas && npm run lint && npm run typecheck && npm run build"`
- `wsl bash -lc "cd /mnt/d/.../apps/saas && npm run test:e2e"`
