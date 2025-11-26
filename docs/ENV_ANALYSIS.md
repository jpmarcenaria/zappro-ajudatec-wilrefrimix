# Análise Completa de Variáveis de Ambiente - ZapPRO AjudaTec

**Data:** 26/11/2025  
**Objetivo:** Mapear todas as variáveis de ambiente, seu uso no código e requisitos para deploy

---

## 1. MAPEAMENTO DE VARIÁVEIS POR ROTA/COMPONENTE

### 1.1 Rotas API - OpenAI

#### `/api/openai/chat` (POST)
**Arquivo:** `apps/saas/app/api/openai/chat/route.ts`

**Variáveis usadas:**
- ✅ `OPENAI_API_KEY` - **OBRIGATÓRIA** - Chave da API OpenAI
- ✅ `ALLOWED_ORIGIN` - Controle CORS (fallback: `NEXT_PUBLIC_WEBSITE_URL`)
- ✅ `NEXT_PUBLIC_WEBSITE_URL` - URL base da aplicação
- ✅ `SYSTEM_INSTRUCTION_PT_BR` - Prompt do chatbot (opcional, tem fallback)
- ✅ `SYSTEM_INSTRUCTION` - Fallback alternativo do prompt
- ✅ `TAVILY_API_KEY` - Web search (opcional)
- ✅ `BRAVE_API_KEY` - Web search alternativo (opcional)
- ✅ `FIRECRAWL_API_KEY` - Crawling web (opcional)

**Análise de código:**
```typescript
// Linha 59: Valida se OpenAI está configurada
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  return new Response(JSON.stringify({ text: 'API não configurada', groundingUrls: [] }), ...)
}

// Linhas 84-116: Carrega system instruction (com fallback)
const instructionBase = (() => {
  const envInstr = process.env.SYSTEM_INSTRUCTION_PT_BR || process.env.SYSTEM_INSTRUCTION
  if (envInstr && envInstr.trim().length > 0) return envInstr
  // Tenta carregar de arquivo PROMPTS/chatbot-persona.md
  // Se falhar, usa fallback hardcoded
})()

// Linhas 118-192: Agregação de search (opcional)
const tvly = process.env.TAVILY_API_KEY
const brave = process.env.BRAVE_API_KEY
const fire = process.env.FIRECRAWL_API_KEY
```

#### `/api/openai/transcribe` (POST)
**Arquivo:** `apps/saas/app/api/openai/transcribe/route.ts`

**Variáveis usadas:**
- ✅ `OPENAI_API_KEY` - **OBRIGATÓRIA**
- ✅ `ALLOWED_ORIGIN` - Controle CORS

#### `/api/openai/tts` (POST)
**Arquivo:** `apps/saas/app/api/openai/tts/route.ts`

**Variáveis usadas:**
- ✅ `OPENAI_API_KEY` - **OBRIGATÓRIA**
- ✅ `ALLOWED_ORIGIN` - Controle CORS

---

### 1.2 Rotas API - Stripe

#### `/api/checkout` (POST)
**Arquivo:** `apps/saas/app/api/checkout/route.ts`

**Variáveis usadas:**
- ✅ `STRIPE_SECRET_KEY` - **OBRIGATÓRIA**
- ✅ `NEXT_PUBLIC_WEBSITE_URL` - Success/Cancel URLs
- ✅ `ALLOWED_ORIGIN` - CORS

#### `/api/stripe/create-checkout` (POST)
**Arquivo:** `apps/saas/app/api/stripe/create-checkout/route.ts`

**Variáveis usadas:**
- ✅ `STRIPE_SECRET_KEY` - **OBRIGATÓRIA**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - **OBRIGATÓRIA**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - **OBRIGATÓRIA**
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ID` - ID do produto Stripe
- ✅ `NEXT_PUBLIC_APP_URL` - Success/Cancel URLs

#### `/api/webhook/stripe` (POST)
**Arquivo:** `apps/saas/app/api/webhook/stripe/route.ts`

**Variáveis usadas:**
- ✅ `STRIPE_WEBHOOK_SECRET` - **OBRIGATÓRIA** - Validação de webhook
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - **OBRIGATÓRIA**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - **OBRIGATÓRIA**

---

### 1.3 Rotas API - Admin

#### `/api/admin/login` (POST)
**Arquivo:** `apps/saas/app/api/admin/login/route.ts`

**Variáveis usadas (via lib/adminAuth.ts):**
- ✅ `ADMIN_USERNAME` - Default: 'admin'
- ✅ `ADMIN_PASSWORD_HASH` - Hash bcrypt ou texto plano (dev)
- ✅ `ADMIN_SESSION_SECRET` - Chave de sessão JWT

**Análise:**
```typescript
// lib/adminAuth.ts linha 5
const secret = process.env.ADMIN_SESSION_SECRET || 'dev-admin-secret'

// lib/adminAuth.ts linha 38
return process.env.ADMIN_USERNAME || 'admin'
```

---

### 1.4 Client-Side (Browser)

#### `lib/supabase.ts` & `lib/supabaseClient.ts`
**Variáveis usadas:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - **OBRIGATÓRIA**
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **OBRIGATÓRIA**

```typescript
// lib/supabase.ts linhas 4-5
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

#### `contexts/AuthContext.tsx`
**Variáveis usadas:**
- ✅ `NEXT_PUBLIC_FAKE_AUTH_EMAIL` - Apenas dev (default: test@test.com)
- ✅ `NEXT_PUBLIC_FAKE_AUTH_PASSWORD` - Apenas dev (default: 12345678A)

#### Landing Page & Checkout
**Variáveis usadas:**
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Inicialização Stripe.js
- ✅ `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` - Tabela de preços
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ID` - ID do produto

---

## 2. COMPARAÇÃO: .env ATUAL vs .env.example ANTIGA

### .env Atual (Docker/Infraestrutura)
```
✅ POSTGRES_HOST, PORT, DB, PASSWORD
✅ STUDIO_DEFAULT_ORGANIZATION, PROJECT
✅ PG_META_CRYPTO_KEY
✅ DASHBOARD_USERNAME, PASSWORD
✅ API_EXTERNAL_URL, SITE_URL
✅ JWT_SECRET, JWT_EXPIRY
✅ ANON_KEY, SERVICE_ROLE_KEY
✅ PGRST_DB_SCHEMAS
✅ LOGFLARE_PUBLIC_ACCESS_TOKEN, PRIVATE_ACCESS_TOKEN
✅ IMGPROXY_ENABLE_WEBP_DETECTION
✅ SECRET_KEY_BASE, VAULT_ENC_KEY
✅ FUNCTIONS_VERIFY_JWT
✅ POOLER_TENANT_ID, DEFAULT_POOL_SIZE, MAX_CLIENT_CONN, DB_POOL_SIZE
✅ NODE_IMAGE
```

### .env.example Antiga (INCOMPLETA)
```
❌ Estrutura corrompida
❌ Misturava variáveis de infraestrutura com frontend
❌ Faltava documentação de uso
❌ Não tinha separação clara dev vs produção
❌ Faltava TODAS as variáveis da aplicação (OpenAI, Stripe, etc)
```

---

## 3. MATRIZ DE VARIÁVEIS POR AMBIENTE

| Variável | Dev Local | Vercel | Obrigatória | Onde Usada |
|----------|-----------|--------|-------------|------------|
| **INFRAESTRUTURA (Docker)** |
| POSTGRES_* | ✅ | ❌ | Sim (dev) | Docker Compose |
| STUDIO_* | ✅ | ❌ | Sim (dev) | Supabase Studio |
| JWT_SECRET | ✅ | ❌ | Sim (dev) | GoTrue |
| ANON_KEY | ✅ | ❌ | Sim (dev) | Docker env |
| SERVICE_ROLE_KEY | ✅ | ❌ | Sim (dev) | Docker env |
| POOLER_* | ✅ | ❌ | Sim (dev) | Supavisor |
| **APLICAÇÃO (Next.js)** |
| NEXT_PUBLIC_WEBSITE_URL | ✅ | ✅ | Sim | Toda app |
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | Sim | Client Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ | Sim | Client Supabase |
| SUPABASE_URL | ✅ | ✅ | Sim | Server APIs |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | Sim | Server APIs |
| OPENAI_API_KEY | ✅ | ✅ | Sim | Chat/TTS/Whisper |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ✅ | ✅ | Sim | Landing/Checkout |
| NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID | ✅ | ✅ | Sim | Landing |
| NEXT_PUBLIC_STRIPE_PRICE_ID | ✅ | ✅ | Sim | Checkout |
| STRIPE_SECRET_KEY | ✅ | ✅ | Sim | Server APIs |
| STRIPE_WEBHOOK_SECRET | ✅ | ✅ | Sim | Webhook |
| ADMIN_USERNAME | ✅ | ✅ | Sim | Admin login |
| ADMIN_PASSWORD_HASH | ✅ | ✅ | Sim | Admin login |
| ADMIN_SESSION_SECRET | ✅ | ✅ | Sim | Admin JWT |
| TAVILY_API_KEY | ⚠️ | ⚠️ | Não | Chat search |
| FIRECRAWL_API_KEY | ⚠️ | ⚠️ | Não | Chat crawl |
| BRAVE_API_KEY | ⚠️ | ⚠️ | Não | Chat search |
| SYSTEM_INSTRUCTION_PT_BR | ⚠️ | ⚠️ | Não* | Chat prompt |
| ALLOWED_ORIGIN | ✅ | ❌ | Não | CORS dev |
| PORT | ✅ | ❌ | Não | Dev server |
| NEXT_PUBLIC_FAKE_AUTH_* | ✅ | ❌ | Não | Fake auth dev |

**Legenda:**
- ✅ = Necessária
- ❌ = Não usada
- ⚠️ = Opcional
- * = Tem fallback hardcoded

---

## 4. CHECKLIST PARA DEPLOY VERCEL

### 4.1 Variáveis Obrigatórias (Vercel Dashboard)

```bash
# URLs
NEXT_PUBLIC_WEBSITE_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app

# Supabase (use Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID=prctbl_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Configure webhook primeiro!

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Admin (IMPORTANTE: use hash bcrypt!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...  # Gere com: npm run admin:hash
ADMIN_SESSION_SECRET=  # Gere com: openssl rand -hex 32

# Opcional
NEXT_TELEMETRY_DISABLED=1
```

### 4.2 Configuração do Webhook Stripe

1. **Antes de tudo:** Deploy na Vercel e obtenha URL
2. **Painel Stripe:** Developers → Webhooks → Add endpoint
3. **URL:** `https://seu-dominio.vercel.app/api/webhook/stripe`
4. **Eventos:** Selecione `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`
5. **Copie o Webhook Secret** e adicione como `STRIPE_WEBHOOK_SECRET` na Vercel

### 4.3 Configuração Supabase Cloud

1. Crie projeto no Supabase (https://app.supabase.com)
2. Execute as migrações: `supabase db push` (ou manual)
3. **Project Settings → API:**
   - Copie `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copie `anon/public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copie `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## 5. VALIDAÇÃO DE SEGURANÇA

### ✅ Variáveis NUNCA devem ser public (NEXT_PUBLIC_):
- ❌ `OPENAI_API_KEY` - Server-only
- ❌ `STRIPE_SECRET_KEY` - Server-only
- ❌ `STRIPE_WEBHOOK_SECRET` - Server-only
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Server-only
- ❌ `ADMIN_*` - Server-only

### ✅ Variáveis OK para client (NEXT_PUBLIC_):
- ✅ `NEXT_PUBLIC_WEBSITE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- ✅ `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID`
- ✅ `NEXT_PUBLIC_STRIPE_PRICE_ID`

### ⚠️ Produção vs Desenvolvimento:
- ❌ NUNCA use `NEXT_PUBLIC_FAKE_AUTH_*` em produção
- ❌ NUNCA use `ENABLE_MOCK_WEBHOOK=true` em produção
- ❌ NUNCA use senha em texto plano em `ADMIN_PASSWORD_HASH`

---

## 6. TESTES DE VALIDAÇÃO

### 6.1 Teste Local (Docker)
```bash
# 1. Inicie Supabase
supabase start

# 2. Inicie app
cd apps/saas
npm run dev

# 3. Valide endpoints
curl http://localhost:3001/api/health  # Deve retornar 200
curl http://localhost:3001/api/status  # Deve mostrar conexões
```

### 6.2 Teste Vercel (Deploy)
```bash
# 1. Após deploy, teste health check
curl https://seu-dominio.vercel.app/api/health

# 2. Teste webhook Stripe (mock)
curl -X POST https://seu-dominio.vercel.app/api/webhook/stripe/test

# 3. Valide admin login
# Navegue para: https://seu-dominio.vercel.app/admin
```

---

## 7. PRÓXIMOS PASSOS

### Imediato:
1. ✅ `.env.example` atualizado e documentado
2. ⏳ Revisar `.gitignore` (já permite `.env.example`)
3. ⏳ Criar workflow de validação de env vars

### Deploy Vercel:
1. ⏳ Importar projeto no Vercel
2. ⏳ Configurar todas as variáveis (Seção 4.1)
3. ⏳ Deploy inicial
4. ⏳ Configurar webhook Stripe (Seção 4.2)
5. ⏳ Re-deploy para aplicar webhook secret
6. ⏳ Testar fluxo completo (Seção 6.2)

### Opcional (Fase 4):
1. ⏳ Configurar Tavily API (web search)
2. ⏳ Configurar Firecrawl API (crawling)
3. ⏳ Configurar Brave Search API (alternativo)

---

## 8. LINKS ÚTEIS

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase Cloud:** https://app.supabase.com
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks
- **OpenAI API:** https://platform.openai.com/api-keys
- **Tavily API:** https://app.tavily.com
- **Firecrawl API:** https://www.firecrawl.dev

---

**Status:** ✅ Documentação completa  
**Última atualização:** 26/11/2025  
**Autor:** Antigravity AI
