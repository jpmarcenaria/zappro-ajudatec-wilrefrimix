# ZapPRO – Assistente Técnico HVAC-R

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Coverage](https://img.shields.io/badge/coverage-70%25-yellow)](docs/TESTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)

> Chatbot especializado em HVAC-R com IA da OpenAI, integração Stripe e persona técnica brasileira.

## Pré‑requisitos
- Windows 11 + WSL 2 (Ubuntu 24.04)
- Node.js 20+ e npm 10+
- Docker Desktop + Docker Compose
- `curl` instalado no WSL: `sudo apt update && sudo apt install -y curl`

## Instalação (pull recente)
- `cd apps/saas && npm ci`
- Instalar browsers do Playwright (opcional para E2E): `npx playwright install --with-deps`

## Preview (WSL) – comando curto
- Execute no terminal WSL:
- `cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && export ALLOWED_ORIGIN=http://localhost:3001 NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001 PORT=3001 && (curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q 200 || nohup npm run dev >/dev/null 2>&1 &) && for i in {1..40}; do curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ | grep -q 200 && break || sleep 0.25; done && powershell.exe -NoProfile -Command Start-Process http://localhost:3001/`

## Guia ultra‑simples (Junior)
- 1) Abrir o Ubuntu (WSL)
- 2) Instalar `curl` se faltar: `sudo apt update && sudo apt install -y curl`
- 3) Instalar deps do app: `cd /mnt/d/.../apps/saas && npm ci`
- 4) Subir e abrir: copiar e colar o comando curto acima
- 5) Testar login: email `test@test.com`, senha `12345678A`
- 6) Abrir Chat: botão “Iniciar Chat” no dashboard

## Erros comuns e solução rápida
- `wsl.exe: parâmetro command já foi especificado`: use `C:\Windows\System32\wsl.exe bash -lc "..."` se rodar via PowerShell
- `curl: command not found`: instale com `sudo apt install -y curl`
- `porta 3001 ocupada`: troque `PORT=3002` e abra `http://localhost:3002/` (ajuste também `ALLOWED_ORIGIN` e `NEXT_PUBLIC_WEBSITE_URL`)

## Alias opcional (encurta o comando)
- No WSL: `echo "alias preview='cd /mnt/d/.../apps/saas && export ALLOWED_ORIGIN=http://localhost:3001 NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001 PORT=3001 && (curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3001/ | grep -q 200 || nohup npm run dev >/dev/null 2>&1 &) && for i in {1..40}; do curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3001/ | grep -q 200 && break || sleep 0.25; done && powershell.exe -NoProfile -Command Start-Process http://localhost:3001/'" >> ~/.bashrc && source ~/.bashrc`
- Depois: `preview`

## Seed (Supabase local)
- `docker compose up -d`
- A base sobe com migrações montadas em `supabase/migrations/` (aplicadas automaticamente na inicialização).
- Variáveis relevantes (compose):
  - `NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}`
- Studio (admin): `http://localhost:3006/`  • API: `http://localhost:8000`

## Credenciais de teste
- `NEXT_PUBLIC_FAKE_AUTH_EMAIL=test@test.com`
- `NEXT_PUBLIC_FAKE_AUTH_PASSWORD=12345678A`
- Fluxo: Landing → “Fazer Login” → preencher credenciais → “Testar Grátis” → `/dashboard`.

## Verificação rápida
- Health: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health` → `200`
- Status: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/status` → `200`
- Smoke pós‑deploy: `wsl bash -lc "node apps/saas/scripts/postdeploy-smoke.mjs"`

## Observações
- Porta canônica: `3001`. Ajuste `ALLOWED_ORIGIN` e `NEXT_PUBLIC_WEBSITE_URL` se usar outra porta.
- Não expor chaves server‑only (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) no cliente.
