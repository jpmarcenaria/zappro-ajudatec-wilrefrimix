<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ZapPRO – SaaS (Next.js + OpenAI + Supabase + Stripe)

![CI Sprite](https://img.shields.io/badge/CI%20Sprite-ready-brightgreen)

## Arquitetura

- `apps/saas` (Next.js App Router)
  - UI: `components/WebLanding.tsx`, `components/ChatInterface.tsx`
  - API: `app/api/checkout`, `app/api/webhook/stripe`, `app/api/openai/*`
  - Libs: `lib/aiService.ts`, `lib/supabaseClient.ts`
  - Config: `next.config.ts` (`output: 'standalone'`)
- `supabase/`
  - `migrations/0001_init.sql` (perfis, assinaturas, chat_sessions, messages, attachments, usage_logs)
- `.trae/terminal.json` (contrato de execução WSL)
- `.github/workflows/scan.yml` (scan de container)

Nota: Todo o frontend antigo em Vite/Gemini foi removido. O projeto atual é somente Next.js em `apps/saas`.

## Requisitos

- Node.js 20+
- Conta Stripe (test mode e webhook)
- Projeto Supabase com Auth habilitado e provedores Google/GitHub configurados
- Vercel para deploy e variáveis de ambiente

## Configuração

1. Criar projeto Supabase e habilitar OAuth Google/GitHub
   - Coletar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Configurar Stripe
   - Criar produtos/preços e opcionalmente período de trial.
   - Coletar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   - Criar Pricing Table e coletar `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID`.
3. Variáveis de ambiente (Vercel → Project Settings → Environment Variables)
   - `NEXT_PUBLIC_WEBSITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`


## Dockerfile (Imagem mínima e segura)

- Base `node:20-alpine` com non-root user.
- Build multi-stage e execução com `next start`.
- Sem ferramentas supérfluas; camadas otimizadas.

## Scan de Container

- Pipeline de scan automatizado via GitHub Actions usando Trivy.
- Workflow em `.github/workflows/scan.yml` constrói a imagem `apps/saas` e executa análise de vulnerabilidades.

## Fluxos Principais

- Autenticação: Supabase OAuth (Google/GitHub) via botões na landing.
- Compra na landing: embed de Stripe Pricing Table e rota de checkout.
- Portal do cliente: link Stripe para gerenciamento de assinatura.

## Desenvolvimento Local

```bash
cd apps/saas
npm install
npm run dev
```

Abra `http://localhost:3000`.



### Supabase Local (WSL)

- Pré-requisitos: Docker Desktop com integração WSL habilitada.
- Instalar CLI localmente no projeto e usar via `npx`.

```bash
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix && npm i -D supabase && npx supabase --version"
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix && npx supabase init"
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix && npx supabase start"
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix && npx supabase db reset"
```

- Após o `start`, copie `anon key` e `service_role key` para `apps/saas/.env`:
  - `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>`
  - `SUPABASE_SERVICE_ROLE_KEY=<service_role>`

### Rotas OpenAI (Next.js API)

- Chat, Transcribe e TTS expostas em `apps/saas/app/api/openai/*`.
- Configure `OPENAI_API_KEY` em `apps/saas/.env`.

## Próximas Etapas

- Persistir eventos do Stripe em `public.subscriptions`
- Opcional: mover `app/api/openai/*` para `apps/api` dedicado
- Renomear funções legadas “Gemini” para nomenclatura neutra
- Checagem de plano ativo no frontend antes de liberar recursos PRO
## Padrões de Repositório (SaaS Next.js)

- App Router (`app/`) com páginas e funções de API em `app/api/*`.
- Separação client/server: chave OpenAI usada apenas em rotas do servidor.
- Camada `lib/` para serviços (OpenAI, Supabase) consumidos no client.
- UI componentizada em `components/` com estilização orientada a UX (WhatsApp‑like).
- Integração Stripe: `app/api/checkout` + embed Pricing Table na landing.
- Integração Supabase OAuth (Google/GitHub): `lib/supabaseClient.ts` e handlers.
- Build `output: 'standalone'` para contêiner leve.

## Rotas e Endpoints

- OpenAI
  - `POST /api/openai/chat` – gera resposta (multimodal: texto/imagem/pdf)
  - `POST /api/openai/transcribe` – transcreve áudio
  - `POST /api/openai/tts` – texto→fala, retorno Base64
- Stripe
  - `POST /api/checkout` – cria sessão de assinatura
  - `POST /api/webhook/stripe` – recebe eventos
- Páginas
  - `GET /` – landing com Pricing Table (quando configurado)
  - `GET /chat` – interface WhatsApp‑like
  - `GET /subscribe/success` – confirmação

## Variáveis de Ambiente (`apps/saas/.env`)

- `NEXT_PUBLIC_WEBSITE_URL` – base de navegação e redirects
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Opcional local: `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`

## Regras (Contrato Operacional)

- Executar sempre via WSL Ubuntu 24.04 com `wsl bash -lc "..."`.
- Validar `npm run lint`, `npm run typecheck`, `npm run build` em WSL.
- Não expor chaves em client; chamadas OpenAI somente pelo servidor.
- Portas padrão: dev `3000` (ou disponível), Stripe/Supabase conforme `config.toml`.
- Docker Desktop com integração WSL para Supabase local.
## Estrutura de Pastas

```
/
├─ apps/
│  └─ saas/              # Next.js: UI, APIs, Stripe, Supabase
│     ├─ app/api/checkout
│     ├─ app/api/webhook/stripe
│     ├─ app/api/openai/*
│     ├─ lib/supabaseClient.ts
│     ├─ next.config.ts  # standalone + tracing root
│     └─ Dockerfile
├─ supabase/
│  ├─ migrations/0001_init.sql
│  └─ config.toml
└─ README.md
```

## Desenvolvimento

```bash
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && npm install && npm run dev"
```

Abrir `http://localhost:3000` (ou porta definida por `PORT`).

## Desenvolvimento e Deploy
### Observabilidade de Build/CI

- Pipeline publica `sprite.json` e relatório HTML do Playwright como artefatos.
- Resumo com status e duração por endpoint é incluído no Job Summary.
