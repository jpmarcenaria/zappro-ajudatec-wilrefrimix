# Contrato Técnico – Execução Consistente em WSL (Trae IDE)

Versão: 1.0
Data de implementação obrigatória: 25/11/2025

## 1. Regras Obrigatórias
- Primeira regra: todos os terminais e servidores operam exclusivamente em WSL (Windows Subsystem for Linux).
- Configuração mínima:
  - Windows 11 com WSL 2 habilitado e systemd ativo
  - Distribuição: Ubuntu 24.04 LTS (recomendado) ou 22.04 LTS (suportado)
  - Docker Desktop com integração WSL habilitada
  - Node.js 20+ e npm 10+
  - Git e OpenSSL instalados no WSL
- Versões suportadas de WSL:
  - WSL 2.x: Suportado e recomendado
  - WSL 1.x: Não suportado

## 2. Especificações Técnicas
- Configuração de terminais:
  - Shell padrão: `bash` (zsh opcional)
  - Locale UTF‑8 e timezone configurados (`/etc/default/locale`, `timedatectl`)
  - Caminhos Linux sempre em `/mnt/<drive>/...`, nunca paths Windows
- Gerenciamento de servidores:
  - Next.js, Node, Supabase e serviços auxiliares devem ser iniciados via `wsl bash -lc "..."`
  - Portas padronizadas: app dev `3001` (reservada), escolher porta alternativa quando ocupada
  - Controle de portas/processos com `ss`, `lsof`, `ps`, `kill`
- Protocolos de comunicação:
  - HTTP local entre componentes (client → API em `app/api/*`)
  - Webhooks (Stripe) expostos via rotas Next.js
  - Comunicação com OpenAI feita exclusivamente no servidor (sem chaves em client)

## 3. Implementação
- Scripts de inicialização WSL (modelo):
  - Dev: `wsl bash -lc "cd /mnt/d/.../apps/saas && PORT=3001 npm run dev"`
  - Supabase: `wsl bash -lc "cd /mnt/d/... && npx supabase start"` (apenas com Docker ativo)
- Variáveis de ambiente:
  - Armazenadas em `apps/saas/.env` (sem exposição em client)
  - Chaves: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, etc. apenas usadas em rotas server
- Monitoramento de performance:
  - `htop`, `top`, `free -h`, `docker stats` no WSL
  - Logs de Next.js (dev e produção), métricas de latência de rotas (adicionar quando necessário)

## 4. Validação
- Testes de conformidade:
  - `wsl bash -lc "cd /mnt/d/.../apps/saas && npm run lint && npm run typecheck && npm run build"`
  - Smoke E2E: `BASE_URL=http://localhost:3001 node apps/saas/scripts/smoke.mjs`
- Verificação de compatibilidade:
  - `wsl.exe --version` (2.x), `cat /etc/os-release` (Ubuntu 24.04/22.04), `docker info`
- Logs e métricas:
  - Registrar status HTTP e tempos de resposta dos endpoints críticos (`/api/openai/*`, `/api/checkout`, webhooks)

## 5. Versionamento e Retrocompatibilidade
- Esta documentação é versionada neste repositório, com atualização obrigatória quando novas versões do WSL forem lançadas.
- Manter retrocompatibilidade com ambientes WSL existentes (22.04/24.04), incluindo notas de migração.

