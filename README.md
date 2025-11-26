<div align="center">

# 🔧 ZapPRO AjudaTec

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
- **Deploy:** [Vercel](https://vercel.com)

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

> 📌 **Importante:** Consulte [`docs/ENV_ANALYSIS.md`](docs/ENV_ANALYSIS.md) para detalhes de cada variável.

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

### Vercel (Produção)

O deploy na Vercel é o método recomendado para produção.

#### 1. Pré-requisitos

- Conta Vercel ([Criar conta](https://vercel.com/signup))
- Projeto Supabase Cloud ([Criar projeto](https://app.supabase.com))
- Conta Stripe (modo live) ([Dashboard](https://dashboard.stripe.com))
- Chave OpenAI ([Platform](https://platform.openai.com))

#### 2. Importar Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "Add New..." → "Project"
3. Importe o repositório GitHub
4. **Root Directory:** `apps/saas`
5. **Framework Preset:** Next.js

#### 3. Configurar Variáveis de Ambiente

Configure no Vercel Dashboard (Project Settings → Environment Variables):

**17 variáveis obrigatórias:**

```bash
# URLs
NEXT_PUBLIC_WEBSITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe (live mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Configurar depois

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=  # Gere com: npm run admin:hash
ADMIN_SESSION_SECRET=  # Gere com: openssl rand -hex 32

# Opcional
NEXT_TELEMETRY_DISABLED=1
```

#### 4. Deploy Inicial

- Clique em "Deploy"
- Aguarde build (~3 minutos)
- Acesse URL gerada

#### 5. Configurar Webhook Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → Add endpoint
2. **URL:** `https://seu-dominio.vercel.app/api/webhook/stripe`
3. **Eventos:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie **Webhook Secret** → Adicione `STRIPE_WEBHOOK_SECRET` no Vercel
5. Re-deploy

#### 6. Testes Pós-Deploy

```bash
# Health check
curl https://seu-dominio.vercel.app/api/health

# Landing page
curl https://seu-dominio.vercel.app

# Admin
# Acesse: https://seu-dominio.vercel.app/admin
```

> 📚 **Documentação completa:** [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md)

---

## 📚 Documentação

### Estrutura de Documentação

```
├── docs/
│   ├── ENV_ANALYSIS.md          # Análise completa de variáveis
│   ├── DEPLOYMENT.md            # Guia de deploy detalhado
│   ├── TESTING.md               # Estratégia de testes
│   └── CHANGELOG.md             # Histórico de mudanças
├── DEPLOY_CHECKLIST.md          # Checklist passo a passo
├── SECURITY_CHECKLIST.md        # Checklist de segurança
├── CONTRIBUTING.md              # Guia de contribuição
└── README.md                    # Este arquivo
```

### Documentos Principais

- **[ENV_ANALYSIS.md](docs/ENV_ANALYSIS.md):** Mapeamento completo de todas as variáveis de ambiente, onde são usadas e como configurar
- **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md):** Checklist interativo para deploy em Vercel
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md):** Validações de segurança e conformidade
- **[TESTING.md](docs/TESTING.md):** Estratégia de testes E2E, unit e smoke
- **[CONTRIBUTING.md](CONTRIBUTING.md):** Como contribuir com o projeto

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

> 📄 **Documentação completa:** [`.env.example`](.env.example) ou [`docs/ENV_ANALYSIS.md`](docs/ENV_ANALYSIS.md)

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

> 📖 **Guia completo:** [`CONTRIBUTING.md`](CONTRIBUTING.md)

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

> 📋 **Checklist completo:** [`SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md)

---

## ❓ FAQ

<details>
<summary><strong>Posso usar em produção?</strong></summary>

Sim! O projeto está pronto para produção. Siga o checklist em [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md) e configure todas as variáveis obrigatórias.
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

Edite `SYSTEM_INSTRUCTION_PT_BR` no `.env` ou crie um arquivo em `apps/saas/prompts/system-instruction.pt-br.md`.
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
