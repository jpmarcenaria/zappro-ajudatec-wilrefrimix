# Testing Guide - Critical Fixes Validation

## Pre-requisitos

Certifique-se de que o arquivo `.env` em `apps/saas/` contém:

```bash
# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Search (Opcional)
TAVILY_API_KEY=...
BRAVE_API_KEY=...
FIRECRAWL_API_KEY=...
```

---

## 1. Testar OpenAI Chat Endpoint

### Iniciar Dev Server
```bash
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && PORT=3001 npm run dev"
```

### Testar no Browser
1. Abrir `http://localhost:3001`
2. Fazer login
3. Enviar mensagem: "Como diagnosticar erro E1 em split Midea?"
4. Verificar:
   - ✅ Resposta vem da OpenAI
   - ✅ Não há erro no console
   - ✅ Se ativar search, fontes aparecem

### Testar com cURL
```bash
curl -X POST http://localhost:3001/api/openai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Como testar compressor inverter?",
    "attachments": [],
    "useSearch": true
  }'
```

**Resposta esperada**:
```json
{
  "text": "Resposta do GPT-4o...",
  "groundingUrls": [
    {"title": "...", "uri": "https://..."}
  ]
}
```

---

## 2. Testar Stripe Webhook

### Simular Evento Localmente
```bash
# Instalar Stripe CLI
wsl bash -lc "stripe listen --forward-to localhost:3001/api/webhook/stripe"

# Em outro terminal, enviar evento de teste
wsl bash -lc "stripe trigger customer.subscription.created"
```

### Verificar no Supabase
```sql
-- Checar se subscription foi criada
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;

-- Checar se perfil foi atualizado pelo trigger
SELECT id, plan, updated_at FROM profiles WHERE id = '...';
```

**Esperado**: 
- Registro em `subscriptions` com `status = 'active'`
- `profiles.plan` atualizado para `'PRO'`

---

## 3. Testar RLS de Logs

### Tentar Acessar como Usuário Autenticado (deve FALHAR)
```sql
-- Com token de usuário normal
SELECT * FROM monitor_logs LIMIT 1;
-- Erro esperado: "new row violates row-level security policy"
```

### Acessar como Service Role (deve FUNCIONAR)
```sql
-- Com SUPABASE_SERVICE_ROLE_KEY
SELECT * FROM monitor_logs ORDER BY ts DESC LIMIT 10;
-- Deve retornar logs
```

---

## 4. Testar Error Handling no Frontend

### Forçar Erro
1. No `.env`, remover temporariamente `OPENAI_API_KEY`
2. Enviar mensagem no chat
3. Verificar:
   - ✅ Mensagem de erro aparece
   - ✅ Botão "Tentar Novamente" é renderizado
   - ✅ Ao clicar, reenvia a última mensagem

### Restaurar
Adicionar `OPENAI_API_KEY` de volta e testar novamente.

---

## 5. Testar Performance da Landing

### Lighthouse
```bash
# Com servidor rodando em http://localhost:3001
npx lighthouse http://localhost:3001 --view
```

**Métricas esperadas**:
- LCP < 2.5s (melhorado com `priority` no favicon)
- Performance > 90

---

## 6. Smoke Test Completo

```bash
wsl bash -lc "cd /mnt/d/projetos/zappro-ajudatec-wilrefrimix/zappro-ajudatec-wilrefrimix/apps/saas && npm run test:smoke"
```

---

## 7. E2E com Playwright (Opcional)

```bash
# Via Docker Compose
docker compose run --rm --profile test tests
```

---

## ✅ Checklist de Validação

- [ ] OpenAI responde corretamente
- [ ] Search aggregation funciona (com API keys configuradas)
- [ ] Stripe webhook atualiza Supabase
- [ ] RLS de logs está protegido
- [ ] Botão "Tentar Novamente" funciona
- [ ] TypeScript compila sem erros
- [ ] Build de produção funciona
- [ ] Lighthouse performance > 90

---

## 🐛 Troubleshooting

### Erro: "API não configurada"
→ Adicionar `OPENAI_API_KEY` no `.env`

### Erro: "missing webhook secret"
→ Adicionar `STRIPE_WEBHOOK_SECRET` no `.env`

### Erro: "Connection refused" no Supabase
→ Rodar `npx supabase start` antes do dev server

### Políticas RLS bloqueiam service role
→ Service role bypassa RLS por padrão, não precisa de políticas especiais
