# Checklist Deploy ZapPRO - AjudaTec

**Status Atual:** 🔄 Em Progresso  
**Última atualização:** 26/11/2025

---

## ✅ Fase 1: Stripe (Completo)

- [x] Conta Stripe criada
- [x] Produto configurado
- [x] Pricing Table ID obtido
- [x] Webhooks testados localmente
- [x] Keys de teste validadas

**Próximo:** Configurar Webhook em produção após deploy

---

## 🔄 Fase 2: Vercel Deploy (Em Andamento)

### 2.1 Preparação
- [x] Documentação `.env.example` completa
- [x] Análise de variáveis de ambiente (`docs/ENV_ANALYSIS.md`)
- [ ] Revisar configuração `vercel.json`
- [ ] Validar `next.config.ts` para produção

### 2.2 Deploy Inicial
- [ ] Importar repositório no Vercel
- [ ] Configurar Root Directory: `apps/saas`
- [ ] Configurar Framework Preset: Next.js
- [ ] Deploy sem variáveis (vai falhar, mas cria projeto)

### 2.3 Configuração de Variáveis (Vercel Dashboard)

**Obrigatórias:**
- [ ] `NEXT_PUBLIC_WEBSITE_URL` = `https://seu-dominio.vercel.app`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://seu-dominio.vercel.app`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = (da Supabase Cloud - Fase 3)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (da Supabase Cloud - Fase 3)
- [ ] `SUPABASE_URL` = (mesmo que acima)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (da Supabase Cloud - Fase 3)
- [ ] `OPENAI_API_KEY` = `sk-proj-...` (da OpenAI Platform)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` = `prctbl_...`
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_ID` = `price_...`
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` = (configurar depois do webhook - Passo 2.5)
- [ ] `ADMIN_USERNAME` = `admin`
- [ ] `ADMIN_PASSWORD_HASH` = (gerar com `npm run admin:hash`)
- [ ] `ADMIN_SESSION_SECRET` = (gerar com `openssl rand -hex 32`)

**Opcionais:**
- [ ] `NEXT_TELEMETRY_DISABLED` = `1`
- [ ] `SYSTEM_INSTRUCTION_PT_BR` = (prompt customizado)
- [ ] `TAVILY_API_KEY` = (web search - Fase 4)
- [ ] `FIRECRAWL_API_KEY` = (crawling - Fase 4)

### 2.4 Re-Deploy com Variáveis
- [ ] Re-deploy após configurar variáveis
- [ ] Validar build log (sem erros)
- [ ] Validar `https://seu-dominio.vercel.app/api/health`

### 2.5 Configurar Webhook Stripe
- [ ] Stripe Dashboard → Developers → Webhooks → Add endpoint
- [ ] URL: `https://seu-dominio.vercel.app/api/webhook/stripe`
- [ ] Eventos:
  - [x] `checkout.session.completed`
  - [x] `customer.subscription.created`
  - [x] `customer.subscription.updated`
  - [x] `customer.subscription.deleted`
- [ ] Copiar Webhook Secret → Vercel env var `STRIPE_WEBHOOK_SECRET`
- [ ] Re-deploy final

### 2.6 Testes Pós-Deploy
- [ ] Landing page carrega corretamente
- [ ] Stripe Pricing Table visível
- [ ] Fluxo de checkout funciona (teste com cartão Stripe)
- [ ] Webhook recebe eventos (verificar Stripe Dashboard)
- [ ] Admin login funciona (`/admin`)
- [ ] Chat de IA responde (`/chat` ou dashboard)

---

## 🔄 Fase 3: Supabase Cloud (Em Andamento)

### 3.1 Criar Projeto
- [ ] Criar novo projeto em https://app.supabase.com
- [ ] Nome: `zappro-ajudatec-prod`
- [ ] Região: `South America (São Paulo)` (ou US East)
- [ ] Database Password: (Guardar com segurança!)

### 3.2 Executar Migrações
- [ ] Verificar migrations em `supabase/migrations/`
- [ ] Opção A: `supabase link` + `supabase db push`
- [ ] Opção B: SQL Editor manual no dashboard

### 3.3 Configurar RLS
- [ ] Revisar políticas RLS em migrações
- [ ] Testar acesso anônimo (deve ser bloqueado)
- [ ] Testar acesso autenticado

### 3.4 Obter Credenciais
- [ ] Project Settings → API
- [ ] Copiar `URL` → Vercel: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copiar `anon public` → Vercel: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copiar `service_role` → Vercel: `SUPABASE_SERVICE_ROLE_KEY`

### 3.5 Testes
- [ ] Criar usuário teste via app
- [ ] Salvar mensagem de chat
- [ ] Verificar no Supabase Dashboard (Table Editor)

---

## ⏳ Fase 4: Features Opcionais

### 4.1 Web Search (Tavily)
- [ ] Criar conta em https://app.tavily.com
- [ ] Obter API Key
- [ ] Adicionar `TAVILY_API_KEY` no Vercel
- [ ] Testar busca no chat

### 4.2 Crawling (Firecrawl)
- [ ] Criar conta em https://www.firecrawl.dev
- [ ] Obter API Key
- [ ] Adicionar `FIRECRAWL_API_KEY` no Vercel
- [ ] Configurar cron job (`/api/cron/crawl-faqs`)

### 4.3 Brave Search (Alternativo)
- [ ] Criar conta Brave Search API
- [ ] Obter API Key
- [ ] Adicionar `BRAVE_API_KEY` no Vercel

---

## 📊 Monitoramento & Manutenção

### Logs
- [ ] Configurar Vercel Log Drains (opcional)
- [ ] Monitorar `/api/health` (uptime)
- [ ] Alertas de erro (Vercel Integrations)

### Performance
- [ ] Validar Core Web Vitals (Vercel Analytics)
- [ ] Monitorar uso de OpenAI (custos)
- [ ] Monitorar Supabase quotas

### Segurança
- [ ] Revisar `SECURITY_CHECKLIST.md`
- [ ] Rotação de secrets (trimestral)
- [ ] Audit logs (Stripe, Supabase)

---

## 🔗 Links Importantes

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **OpenAI Platform:** https://platform.openai.com
- **Documentação Completa:** `docs/ENV_ANALYSIS.md`

---

## 📝 Notas

### Comandos Úteis

```bash
# Gerar hash de senha admin
npm run admin:hash -- suaSenhaSegura

# Gerar secret aleatório
openssl rand -hex 32

# Validar build local
cd apps/saas && npm run build

# Link Supabase projeto
supabase link --project-ref seu-projeto-id

# Push migrations
supabase db push

# Testar webhook localmente
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

### Rollback Plan

Se algo der errado em produção:
1. Vercel: Rollback para deployment anterior
2. Supabase: Restaurar snapshot do banco (Backups)
3. Stripe: Desativar webhook temporariamente

---

**Status:** 🔄 Pronto para deploy Vercel (aguardando Supabase)  
**Bloqueadores:** Nenhum  
**ETA:** Deploy completo em ~2 horas
