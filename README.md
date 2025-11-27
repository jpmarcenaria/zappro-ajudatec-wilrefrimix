<div align="center">

# 🔧 ZapPRO AjudaTec

ATENÇÃO: Antes de executar ou modificar este projeto, LEIA e SIGA integralmente o contrato em `AGENTS.md`.

### Assistente Técnico Inteligente para HVAC-R

*Chatbot especializado em climatização com IA da OpenAI, integração Stripe e persona técnica brasileira*

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)](https://openai.com)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?logo=supabase)](https://supabase.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)

[Demonstração](#-demonstração) •
[Funcionalidades](#-funcionalidades) •
[Tecnologias](#-tecnologias) •
[Instalação](#-instalação) •
[Deploy](#-deploy) •
[Documentação](#-documentação)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Demonstração](#-demonstração)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração Local](#configuração-local)
  - [Docker Compose](#docker-compose)
- [Uso](#-uso)
- [Deploy](#-deploy)
- [Documentação](#-documentação)
- [Contrato MCP Taskmaster](#-contrato-mcp-taskmaster)
- [RAG + Redis Cache](#-rag--redis-cache)
- [Biblioteca de Manuais](#-biblioteca-de-manuais)
- [Testes](#-testes)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Contribuindo](#-contribuindo)
- [Segurança](#-segurança)
- [FAQ](#-faq)
- [Licença](#-licença)
- [Autores](#-autores)
- [Agradecimentos](#-agradecimentos)

---

## 🎯 Sobre o Projeto

**ZapPRO AjudaTec** é uma plataforma SaaS completa que oferece assistência técnica especializada em HVAC-R (Aquecimento, Ventilação, Ar Condicionado e Refrigeração) através de Inteligência Artificial. O projeto foi desenvolvido com foco no mercado brasileiro, utilizando as melhores práticas de desenvolvimento web moderno.

### Por que este projeto existe?

- 🎓 **Democratizar o conhecimento técnico**: Ajudar técnicos iniciantes e experientes com soluções rápidas e precisas
- 🇧🇷 **Contexto brasileiro**: Foco em equipamentos, marcas e normas vigentes no Brasil (ABNT, INMETRO)
- 🤖 **IA Multimodal**: Aceita textos, imagens de placas/etiquetas, áudio e PDFs de manuais
- 💰 **Modelo de negócio**: Monetização via Stripe com assinatura mensal
- 🔒 **Segurança**: Implementação de RLS (Row Level Security), rate limiting e validações

### Diferenciais

- ✅ Persona técnica customizada estilo [@willrefrimix](https://instagram.com/willrefrimix)
- ✅ Grounding search com Tavily, Firecrawl e Brave Search
- ✅ Priorização automática de fontes brasileiras (YouTube BR, manuais locais)
- ✅ TTS (Text-to-Speech) e STT (Speech-to-Text) via Whisper
- ✅ Dashboard administrativo com logs e métricas
- ✅ 100% containerizado com Docker Compose

---

## 🎬 Demonstração

### Landing Page
*Interface moderna com integração Stripe Pricing Table*

```
🏠 Landing → 💳 Checkout Stripe → ✅ Callback → 📊 Dashboard → 💬 Chat AI
```

### Chat Interface
- 📝 Entrada de texto
- 🎤 Gravação de áudio (transcrição automática)
- 📸 Upload de imagens (análise de placas/etiquetas)
- 📄 Upload de PDFs (manuais técnicos)
- 🔍 Web search em tempo real (opcional)
- 🔊 Reprodução de áudio (TTS)

---

## ✨ Funcionalidades

### 🤖 Assistente de IA

- [x] Chat multimodal (texto, imagem, áudio, PDF)
- [x] System instruction customizável via `.env` ou arquivo Markdown
- [x] Modelos GPT-4o (imagens/PDF) e GPT-4o-mini (texto)
- [x] Grounding search com ranking de fontes brasileiras
- [x] Rate limiting (20 msgs/min por usuário)
- [x] Histórico de conversas no Supabase

### 💳 Monetização

- [x] Integração completa com Stripe
- [x] Pricing Table embutida na landing page
- [x] Checkout Session com metadata de usuário
- [x] Webhooks para sincronização de assinaturas
- [x] Suporte a testes com cartões Stripe

### 🔐 Autenticação & Autorização

- [x] Supabase Auth (email/senha)
- [x] Row Level Security (RLS) para proteção de dados
- [x] Fake Auth para desenvolvimento local
- [x] Dashboard administrativo com login separado

### 📊 Administração

- [x] Dashboard admin (`/admin`)
- [x] Logs de API streaming (`/api/logs/stream`)
- [x] Métricas de uso (monitor.ts)
- [x] Auditoria de acessos

### 🌐 Web Search & Crawling

- [x] Tavily API (busca avançada)
- [x] Firecrawl API (crawling de YouTube)
- [x] Brave Search (alternativo)
- [x] Scoring automático de fontes (prioriza `.br`, fabricantes, normas)

### 🧪 Testes

- [x] E2E com Playwright (15+ scenarios)
- [x] Unit tests com Vitest
- [x] Smoke tests pós-deploy
- [x] Health checks e status endpoints
- [x] Coverage ~70%

---

## 🛠 Tecnologias

### Frontend

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **Linguagem:** [TypeScript 5.8](https://www.typescriptlang.org)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com)
- **Componentes:** Customizados (sem biblioteca externa)
- **Build:** [Vite](https://vitejs.dev) (landing pages)

### Backend

- **Runtime:** [Node.js 20](https://nodejs.org) (Alpine)
- **APIs:** Next.js API Routes (server-side)
- **ORM:** [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- **Validação:** [Zod](https://zod.dev)
- **Webhooks:** Stripe SDK

### IA & NLP

- **Provider:** [OpenAI](https://openai.com)
- **Modelos:** GPT-4o, GPT-4o-mini
- **TTS:** OpenAI TTS (voice: shimmer)
- **STT:** Whisper API
- **Search:** Tavily, Firecrawl, Brave Search

### Banco de Dados

- **Database:** [PostgreSQL 15](https://www.postgresql.org) (via Supabase)
- **Auth:** [GoTrue](https://github.com/supabase/gotrue) (Supabase Auth)
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime (WebSockets)

### Infraestrutura

- **Containerização:** [Docker](https://www.docker.com) + Docker Compose
- **Proxy:** Kong Gateway
- **Analytics:** Logflare
- **Pooling:** Supavisor (PgBouncer)
- **Deploy:** VPS (Docker)

### Pagamentos

- **Gateway:** [Stripe](https://stripe.com)
- **Features:** Checkout, Webhooks, Pricing Table

### DevOps

- **CI/CD:** GitHub Actions
- **Security:** Trivy (scan de vulnerabilidades)
- **Testes:** Playwright, Vitest
- **Lint:** ESLint + TypeScript Compiler

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                          │
│  Landing Page (Vite) → Checkout → Dashboard (Next.js) → Chat     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                           │
│  /api/openai/*  |  /api/stripe/*  |  /api/admin/*  |  /api/health│
└──────────┬──────────────────┬──────────────────┬─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────────┐
    │  OpenAI  │      │  Stripe  │      │   Supabase   │
    │  GPT-4o  │      │ Checkout │      │  PostgreSQL  │
    │  Whisper │      │ Webhooks │      │     Auth     │
    │   TTS    │      └──────────┘      │   Storage    │
    └──────────┘                        └──────────────┘
           │
           ▼
    ┌──────────────────────┐
    │   Search Providers   │
    │  Tavily | Firecrawl  │
    │    Brave Search      │
    └──────────────────────┘
```

### Fluxo de Dados (Chat)

```
User Input → Rate Limit → Parse (text/audio/image/pdf)
    ↓
OpenAI API ← System Instruction + Grounding Search
    ↓
Response → TTS (opcional) → Client
    ↓
Save to Supabase (chat_messages)
```

---

## 🚀 Instalação

### Pré-requisitos

- **Sistema Operacional:** Windows 11 + WSL 2 (Ubuntu 24.04) ou Linux/macOS
- **Node.js:** 20.x ou superior ([Download](https://nodejs.org))
- **npm:** 10.x ou superior
- **Docker Desktop:** Última versão ([Download](https://www.docker.com/products/docker-desktop))
- **Curl:** Instalado no WSL (`sudo apt install curl`)
- **Git:** Instalado ([Download](https://git-scm.com))

### Configuração Local

#### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/zappro-ajudatec-wilrefrimix.git
cd zappro-ajudatec-wilrefrimix
```

#### 2. Instale as Dependências

```bash
# Raiz do projeto (landing Vite)
npm install

# Aplicação Next.js (apps/saas)
cd apps/saas
npm ci
```

#### 3. Configure as Variáveis de Ambiente

```bash
# Copie o exemplo
cp .env.example .env

# Edite o arquivo .env com suas chaves
nano .env
```

 > 📌 **Importante:** Veja `.env.example` para detalhes de cada variável.

**Variáveis obrigatórias para dev local:**

```bash
# Supabase (use valores do Docker Compose)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Veja .env.example

# OpenAI
OPENAI_API_KEY=sk-proj-...  # Obtenha em https://platform.openai.com

# Stripe (use test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

#### 4. Inicie o Supabase Local

```bash
# Na raiz do projeto
docker compose up -d

# Aguarde ~30s para inicialização
# Acesse Studio em: http://localhost:3006
```

#### 5. Execute a Aplicação (WSL)

```bash
cd apps/saas

# Desenvolvimento
npm run dev

# Acesse: http://localhost:3001
```

#### 6. (Opcional) Instale Browsers do Playwright

```bash
npx playwright install --with-deps
```

### Docker Compose

O projeto inclui um `docker-compose.yml` completo com todos os serviços Supabase:

**Serviços incluídos:**
- PostgreSQL 15 + pgvector
- Supabase Studio (porta 3006)
- Kong Gateway (porta 8000)
- GoTrue (Auth) (porta 9999)
- PostgREST (porta 3000)
- Realtime (porta 4000)
- Storage + ImgProxy (portas 5000/5001)
- Logflare (Analytics)
- Supavisor (Pooler)
- Edge Functions

**Comandos úteis:**

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f

# Parar serviços
docker compose down

# Remover volumes (reset database)
docker compose down -v
```

---

## 💻 Uso

### Desenvolvimento Local

#### Comando Rápido (WSL)

```bash
cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && \
export ALLOWED_ORIGIN=http://localhost:3001 \
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3001 \
PORT=3001 && \
npm run dev
```

#### Criar Alias (opcional)

```bash
# Adicionar ao ~/.bashrc
echo 'alias zappro-dev="cd /mnt/d/.../apps/saas && npm run dev"' >> ~/.bashrc
source ~/.bashrc

# Usar
zappro-dev
```

### Credenciais de Teste

**Login Fake (apenas dev):**
- Email: `test@test.com`
- Senha: `12345678A`

**Admin Dashboard:**
- URL: `http://localhost:3001/admin`
- Usuário: `admin`
- Senha: `admin` (dev) ou hash bcrypt (prod)

### Fluxo de Uso

1. **Landing Page** (`/`)
   - Visualize pricing table
   - Clique em "Fazer Login"

2. **Login/Registro**
   - Use credenciais fake (dev) ou crie conta
   - Redirecionamento automático para dashboard

3. **Dashboard** (`/dashboard`)
   - Visualize mensagens recentes
   - Clique em "Iniciar Chat"

4. **Chat** (`/chat`)
   - Digite pergunta ou grave áudio
   - Faça upload de imagens/PDFs (opcional)
   - Ative web search (opcional)
   - Reproduza resposta em áudio

### Endpoints de Health Check

```bash
# Health check
curl http://localhost:3001/api/health
# Resposta: 200 OK

# Status (conexões, env vars)
curl http://localhost:3001/api/status
# Resposta: JSON com status de Supabase, OpenAI, etc.
```

---

## 🌐 Deploy

### VPS (Produção)

Deploy em VPS com Docker, atrás de um proxy (Nginx) com TLS.

#### 1. Pré-requisitos

- VPS com Ubuntu 22.04/24.04 e acesso SSH
- Domínio com DNS apontando para a VPS
- Certificado TLS (Let's Encrypt via Nginx)
- Projeto Supabase Cloud ([Criar projeto](https://app.supabase.com))
- Conta Stripe (modo live) ([Dashboard](https://dashboard.stripe.com))
- Chave OpenAI ([Platform](https://platform.openai.com))

#### 2. Build da Imagem

```bash
cd apps/saas
docker build -t zappro-saas:latest .
```

#### 3. Executar o Contêiner

```bash
docker run -d \
  --name zappro-saas \
  -e PORT=3001 \
  -e NEXT_PUBLIC_WEBSITE_URL=https://seu-dominio.com \
  -e NEXT_PUBLIC_APP_URL=https://seu-dominio.com \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJhbG... \
  -e OPENAI_API_KEY=sk-proj-... \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -p 3001:3001 \
  zappro-saas:latest
```

Configure Nginx como proxy reverso em `443 → http://localhost:3001`.

#### 4. Webhook Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint
2. **URL:** `https://seu-dominio.com/api/webhook/stripe`
3. **Eventos:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie **Webhook Secret** → Defina `STRIPE_WEBHOOK_SECRET` na VPS

#### 5. Testes Pós-Deploy

```bash
# Health check
curl https://seu-dominio.com/api/health

# Landing page
curl https://seu-dominio.com

# Admin
curl -I https://seu-dominio.com/admin
```

 > 📚 **Documentação:** veja a seção "Documentação Consolidada" no final deste arquivo.

---

## 📚 Documentação

### Arquitetura de Pastas

```
zappro-ajudatec-wilrefrimix/
├── apps/
│   └── saas/                    # Aplicação Next.js principal
│       ├── app/                 # App Router (Next.js 16)
│       │   ├── api/             # API Routes
│       │   ├── admin/           # Dashboard admin
│       │   ├── chat/            # Interface de chat
│       │   └── dashboard/       # Dashboard usuário
│       ├── components/          # Componentes React
│       ├── lib/                 # Utilitários e configs
│       ├── tests/               # Testes E2E (Playwright)
│       ├── __tests__/           # Unit tests (Vitest)
│       └── prompts/             # System instructions
├── supabase/
│   ├── migrations/              # Migrations SQL
│   └── volumes/                 # Dados Docker (git ignored)
├── docs/                        # Documentação
├── .env.example                 # Template de variáveis
└── docker-compose.yml           # Stack Supabase local
```

---

## 📜 Contrato MCP Taskmaster

- Padrão de tasks centralizado em `TASKMASTER.md` com templates, fluxo e critérios.
- Todo agente/LLM deve criar tasks antes de alterações e marcar conclusão imediatamente.
- Regras:
  - Execução PROIBIDA sem planejamento prévio em `TASKMASTER.md` com objetivo, critérios e dependências.
  - Usar ferramentas de inspeção de código para localizar e compreender contexto.
  - Editar arquivos com segurança, sem expor segredos nem criar ruído.
  - Validar alterações com `npm run lint` e `npm run typecheck` quando aplicável.
  - Registrar latência p95 < `500ms` para rotas críticas de chat.
- Critérios de aceitação típicos:
  - Funcionalidade completa, sem erros em logs.
  - Cobertura de testes mínima mantida.
  - Documentação atualizada em `README.md` e `AGENTS.md`.

### Execução via Fila Taskmaster

- Execução restrita à Fila definida em `TASKMASTER.md`.
- Estados: `backlog`, `ready`, `in_progress`, `review`, `done`.
- Apenas 1 task em progresso; concluir e registrar evidências.
- Lint/typecheck obrigatórios após alterações.

### Bootstrap

- Fila inicial inclui: provisionar Supabase via MCP, SQL sandbox, descoberta/download/triagem/ingestão, smoke do Upstash, tuning RAG.
- Rotina noturna processa apenas tasks com `state=ready` e promove em sequência.

### Seed de Banco

- Script: `apps/saas/scripts/seed-db.mjs` insere dispositivos, manuais e códigos de alarme de forma idempotente.
- Requisitos: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Uso: `node apps/saas/scripts/seed-db.mjs`.
- Resultado: JSON com contagem de registros e duração.

---

## ⚙️ RAG + Redis Cache

- Política de roteamento: 1) RAG BD (Supabase pgvector), 2) Web, 3) LLM.
- RPC principal: `match_manual_chunks(query_embedding, filter_brand, filter_model, match_threshold, match_count)`.
- Cache semântico com Redis (Upstash REST):
  - Chave: `rag:<brand>:<model>:<sha256(query)>`.
  - TTL padrão: `900` segundos (configurável via `CACHE_TTL_SECONDS`).
  - Variáveis:
    - `UPSTASH_REDIS_REST_URL`
    - `UPSTASH_REDIS_REST_TOKEN`
    - `CACHE_TTL_SECONDS`
- Parâmetros RAG:
  - `RAG_MATCH_THRESHOLD` (ex.: `0.72`), `RAG_MATCH_COUNT` (ex.: `10`).
  - Índice `ivfflat` com `lists=100`, `vector_cosine_ops` para OpenAI embeddings `1536`.
- Endpoints relacionados:
  - Chat: `apps/saas/app/api/openai/chat/route.ts` (usa cache e RPC RAG).

---

## 📚 Biblioteca de Manuais

- Estrutura de pastas local: `data/manuals/<fabricante>/<marca>/<modelo>/<arquivo>.pdf`.
- Scripts principais:
  - Descoberta: `apps/saas/scripts/discover-pdf-links.mjs` (aceita `--csv`).
  - Download: `apps/saas/scripts/bootstrap-download-pdfs.mjs` (fallback fetch→curl→PowerShell→Playwright).
  - Triagem: `apps/saas/scripts/triage-local-pdfs.mjs` (heurística + LLM).
  - Ingestão: `apps/saas/scripts/ingest-manuals-from-data.mjs` (chunking 500–1000 tokens, overlap 100–200, embeddings `text-embedding-3-small`).
  - Noite: `apps/saas/scripts/nightly-run.mjs` (pipeline discover→download→triage→ingest).
- Convenções e metadados:
  - Metadados inferidos do path: `fabricante`, `marca`, `modelo`, `arquivo`.
  - Idempotência: deduplicação por hash do conteúdo; inserção por `manual_id+page+hash(content)`.
  - Filtros de recuperação por `brand/model` e threshold `0.70–0.80`.
- Exemplos de uso:
  - `node apps/saas/scripts/discover-pdf-links.mjs --csv rascunho/biblioteca_absoluta_completa_brasil.csv --out pdf_links.json`
  - `node apps/saas/scripts/bootstrap-download-pdfs.mjs --csv rascunho/biblioteca_absoluta_completa_brasil.csv --out data/manuals --parallel 5`
  - `node apps/saas/scripts/triage-local-pdfs.mjs --root data/manuals`
  - `node apps/saas/scripts/ingest-manuals-from-data.mjs --root data/manuals`
  - `node apps/saas/scripts/ingest-manuals-from-data.mjs --triage-report pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/local_scan_results.json`

---

## 🧪 Testes

### Executar Testes Localmente

#### E2E (Playwright)

```bash
cd apps/saas

# Headless
npm run test:e2e

# UI Mode (debug)
npx playwright test --ui

# Specific test
npx playwright test tests/contract.spec.ts
```

#### Unit Tests (Vitest)

```bash
npm run test:unit
```

#### Smoke Tests (Pós-Deploy)

```bash
node scripts/postdeploy-smoke.mjs
```

### Cobertura de Testes

- **E2E:** 15 scenarios (landing, auth, chat, admin, checkout)
- **Unit:** Security, rate limiting, validations
- **Coverage:** ~70%
- **CI/CD:** GitHub Actions (em cada push)

### Cenários E2E

- ✅ Landing page load e Stripe pricing table
- ✅ Login/logout flow
- ✅ Fake auth (dev mode)
- ✅ Dashboard access e mensagens
- ✅ Chat interface (texto, áudio, imagem)
- ✅ Admin login e logs streaming
- ✅ Checkout Stripe (test mode)
- ✅ Webhook handling
- ✅ Health checks

---

## 🔐 Variáveis de Ambiente

### Resumo de Variáveis

| Categoria | Quantidade | Obrigatória (Dev) | Obrigatória (Prod) |
|-----------|------------|-------------------|-------------------|
| Infraestrutura (Docker) | 27 | ✅ | ❌ |
| Aplicação (Next.js) | 20 | 12 | 17 |
| **Total** | **47** | **39** | **17** |

### Variáveis por Categoria

#### 🔵 Supabase (6)
```bash
NEXT_PUBLIC_SUPABASE_URL          # URL client-side
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Chave anônima
SUPABASE_URL                      # URL server-side
SUPABASE_SERVICE_ROLE_KEY         # Chave admin
```

#### 💳 Stripe (5)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID
NEXT_PUBLIC_STRIPE_PRICE_ID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

#### 🤖 OpenAI (1)
```bash
OPENAI_API_KEY
```

#### 🔍 Web Search (3 - Opcional)
```bash
TAVILY_API_KEY
FIRECRAWL_API_KEY
BRAVE_API_KEY
```

#### 👨‍💼 Admin (3)
```bash
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
```

 > 📄 **Referência:** `.env.example`

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

### Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/zappro-ajudatec-wilrefrimix.git`
3. **Crie uma branch** para sua feature: `git checkout -b feature/nova-funcionalidade`
4. **Faça suas alterações** e commit: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra um Pull Request**

### Padrão de Commits

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
feat: adiciona nova funcionalidade
fix: corrige bug crítico
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de comportamento
test: adiciona ou corrige testes
chore: tarefas de build, CI/CD, etc.
```

### Regras

- ✅ Código em TypeScript
- ✅ Seguir ESLint config do projeto
- ✅ Adicionar testes para novas features
- ✅ Atualizar documentação quando necessário
- ✅ Manter cobertura de testes > 70%

 > 📖 **Guia:** siga as regras desta seção e do `AGENTS.md`.

---

## 🔒 Segurança

### Práticas Implementadas

- ✅ **RLS (Row Level Security)** no Supabase
- ✅ **Rate Limiting** (20 msgs/min por usuário)
- ✅ **CORS** configurável via `.env`
- ✅ **Validação** de inputs com Zod
- ✅ **Secrets** nunca expostos no client (NEXT_PUBLIC_*)
- ✅ **Webhooks** validados com Stripe SDK
- ✅ **Docker** non-root user (nextjs)
- ✅ **Trivy** scan de vulnerabilidades (CI/CD)

### Variáveis Sensíveis (NUNCA expor)

```bash
❌ OPENAI_API_KEY
❌ STRIPE_SECRET_KEY
❌ STRIPE_WEBHOOK_SECRET
❌ SUPABASE_SERVICE_ROLE_KEY
❌ ADMIN_PASSWORD_HASH
❌ ADMIN_SESSION_SECRET
```

### Reportar Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, **NÃO** abra uma issue pública. Entre em contato diretamente:

- 📧 Email: security@zappro.com (ou seu email)
- 🔒 GitHub Security Advisories

 > 📋 **Checklist:** ver seção "Segurança" neste arquivo.

---

## ❓ FAQ

<details>
<summary><strong>Posso usar em produção?</strong></summary>

 Sim! O projeto está pronto para produção. Siga a seção "Deploy" e configure todas as variáveis obrigatórias.
</details>

<details>
<summary><strong>Preciso de WSL no Windows?</strong></summary>

Recomendado, pois os scripts npm usam comandos bash. Alternativamente, use Linux ou macOS diretamente.
</details>

<details>
<summary><strong>Quanto custa rodar?</strong></summary>

**Dev local:** Grátis (exceto APIs externas)  
**Produção (estimativa mensal):**
- Vercel: $0 (Hobby) ou $20 (Pro)
- Supabase: $0 (Free) ou $25 (Pro)
- OpenAI: ~$10-50 (depende do uso)
- Stripe: 3.59% + R$0.59 por transação
</details>

<details>
<summary><strong>Como alterar o prompt do chatbot?</strong></summary>

 Edite `SYSTEM_INSTRUCTION_PT_BR` no `.env`.
</details>

<details>
<summary><strong>Posso usar outro provedor de IA além da OpenAI?</strong></summary>

Sim, mas requer refatoração das rotas `/api/openai/*`. Sugestões: Google Gemini, Anthropic Claude, Ollama (local).
</details>

<details>
<summary><strong>Como funciona o grounding search?</strong></summary>

Quando ativado, a API busca contexto em 3 provedores (Tavily, Firecrawl, Brave), ranqueia fontes brasileiras e injeta no prompt da OpenAI.
</details>

<details>
<summary><strong>Posso remover o Stripe?</strong></summary>

Sim, remova as rotas `/api/checkout` e `/api/webhook/stripe`, e ajuste a landing page para remover o pricing table.
</details>

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 ZapPRO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👨‍💻 Autores

### Desenvolvedor Principal

- **Seu Nome** - [GitHub](https://github.com/seu-usuario) | [LinkedIn](https://linkedin.com/in/seu-perfil)

### Contribuidores

Agradecemos a todos que contribuíram para este projeto! 🎉

[![Contributors](https://contrib.rocks/image?repo=seu-usuario/zappro-ajudatec-wilrefrimix)](https://github.com/seu-usuario/zappro-ajudatec-wilrefrimix/graphs/contributors)

---

## 🙏 Agradecimentos

- [OpenAI](https://openai.com) - Pela API GPT-4o e Whisper
- [Vercel](https://vercel.com) - Plataforma de deploy
- [Supabase](https://supabase.com) - Backend as a Service
- [Stripe](https://stripe.com) - Processamento de pagamentos
- [Tavily](https://tavily.com) - Search API
- [Firecrawl](https://firecrawl.dev) - Crawling API
- [@willrefrimix](https://instagram.com/willrefrimix) - Inspiração da persona técnica
- Comunidade brasileira de desenvolvedores 🇧🇷

---

## 📞 Contato & Suporte

### Suporte

- 📧 Email: suporte@zappro.com
- 💬 Discord: [Link do servidor]
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/zappro-ajudatec-wilrefrimix/issues)

### Redes Sociais

- 🌐 Website: https://zappro.com.br
- 📘 LinkedIn: [Página da empresa]
- 📸 Instagram: [@zappro.oficial]
- 🐦 Twitter: [@zapprotech]

---

<div align="center">

### ⭐ Se este projeto te ajudou, considere dar uma estrela!

[![Star](https://img.shields.io/github/stars/seu-usuario/zappro-ajudatec-wilrefrimix?style=social)](https://github.com/seu-usuario/zappro-ajudatec-wilrefrimix)

**Feito com ❤️ por [ZapPRO](https://github.com/seu-usuario) no Brasil 🇧🇷**

</div>
### Biblioteca de Manuais (Bootstrap)

#### Download automático de PDFs

```bash
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix && \
node apps/saas/scripts/bootstrap-download-pdfs.mjs \
  --csv pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/biblioteca_completa_otimizada_llm.csv \
  --out data/manuals \
  --parallel 5"
```

- Requisitos: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` definidos em `apps/saas/.env`
- Resultado: PDFs salvos em `data/manuals/<marca>/<marca>/<modelo>/*.pdf` e registro em `hvacr_devices`/`manuals`
- Relatório: `pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/bootstrap_report.json`

#### Validações rápidas (WSL)

```bash
# Porta 3001
sudo ss -lptn sport = :3001

# Firewall (se necessário)
sudo ufw allow 3001/tcp
```
### Documentação Consolidada

- Deploy (Resumo): configurar Vercel com Root `apps/saas`, 17 variáveis obrigatórias, webhook Stripe em `/api/webhook/stripe` com eventos de assinatura e `STRIPE_WEBHOOK_SECRET` em produção.
- Segurança (Resumo): secrets protegidos, endpoint `/api/health` validando Supabase/OpenAI/Stripe, rate limiting ativo em `/api/openai/chat`, RLS habilitado nas tabelas, auditoria e build sem vulnerabilidades.
- Testes Rápidos (WSL): servidor `PORT=3001 npm run dev`, E2E `npm run test:e2e:stripe` e `npm run test:e2e:ui`, verificar conflitos de porta com `sudo ss -lptn sport = :3001`.
- Trial do Chat: limite de 3 mensagens/dia, sem anexos, `TRIAL_MAX_OUTPUT_TOKENS=300`, cabeçalho `x-plan: trial|paid` e respostas de CTA para upload quando necessário.
- Prompt Técnico: respostas curtas em passo a passo, usar RAG primeiro; quando houver chunks, citar seção/página; em falta, fornecer link oficial e instruir upload.
