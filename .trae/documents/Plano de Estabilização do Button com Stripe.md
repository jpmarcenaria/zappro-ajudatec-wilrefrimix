# Objetivo
Garantir funcionamento estável do `button` “Assinar” com Stripe (Checkout para assinatura mensal), usando a chave `STRIPE_API_KEY` do `.env` e o MCP Stripe para criação/gestão do produto “ZapPro – R$ 99,90/mês”.

## Pré‑requisitos
1. Ter `sk_test_...` ou `sk_live_...` no `.env` em `STRIPE_API_KEY`.
2. Backend exposto com `NEXT_PUBLIC_WEBSITE_URL` correto e páginas `success`/`cancel` funcionando.
3. Webhook `POST /api/webhook/stripe` existente e acessível.

## 1. Configuração do Ambiente
- Validar `.env`:
  - `STRIPE_API_KEY` presente e sem espaços: `STRIPE_API_KEY=sk_test_...`.
  - `STRIPE_WEBHOOK_SECRET` definido (do endpoint `/api/webhook/stripe`).
  - `NEXT_PUBLIC_WEBSITE_URL` com origem pública (ex.: `http://localhost:3001` em dev).
- Configurar MCP Stripe:
  - Inserir no arquivo de configuração do Trae IDE:
```
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": { "STRIPE_API_KEY": "${STRIPE_API_KEY}" }
    }
  }
}
```
- Critérios de aceitação:
  - Ferramentas MCP “stripe” iniciam sem erro.
  - Chamada de teste ao Stripe (listar produtos) retorna 200.

## 2. Estabilização do Componente
- Fluxo do `button`:
  - `click` → `fetch('/api/checkout', { method: 'POST' })` com `AbortController` (timeout 8–12s).
  - Se resposta contém `url`, redirecionar com `location.href = url`.
  - Estado `isSubscribing` para evitar cliques múltiplos.
- Testes de conexão com Stripe:
  - Endpoint de saúde: servidor chama `stripe.products.list({ limit: 1 })` e retorna `200`/`500`.
- Tratamento de erros:
  - Mapeamento de erros (`400` config inválida, `402` pagamento recusado, `429` rate limit, `5xx` instabilidade).
  - Mensagens amigáveis e reintento automático com backoff exponencial (até 2 tentativas, jitter 250–750ms).
- Timeouts:
  - Cliente: `AbortController` (ex.: 10s). Servidor: tempo máximo de operação 12–15s.
- Retentativa:
  - Repetir somente para `429`, `503`, `network error`. Não repetir para `4xx` lógicos.
- Observabilidade:
  - Incluir `requestId`, `dur` e `Server-Timing` no cabeçalho de resposta.

## 3. Criação do Produto Mensal (ZapPro R$ 99,90)
- Usar MCP Stripe:
  - Criar `product` nome: `ZapPro`, `type: service`, `default_price` via `prices.create`.
  - Criar `price` com `unit_amount: 9990`, `currency: brl`, `recurring.interval: month`.
  - Metadados sugeridos:
    - `product.metadata`: `{ app: 'zappro', plan: 'pro', billing: 'monthly' }`.
    - `price.metadata`: `{ tier: 'pro', country: 'BR' }`.
- Checkout:
  - `mode: subscription`, `success_url`: `${NEXT_PUBLIC_WEBSITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`.
  - `cancel_url`: `${NEXT_PUBLIC_WEBSITE_URL}/cancel`.
- Webhooks (recorrência):
  - Assinar eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`.
  - Validar assinatura com `STRIPE_WEBHOOK_SECRET`.
- Testes automatizados:
  - Cenários com cards de teste (`4242 4242 4242 4242` e recusas como `4000 0000 0000 0002`).
  - Verificar criação/atualização de assinatura no banco (ex.: `subscriptions`).

## 4. Monitoramento Contínuo
- Logs detalhados:
  - Estruturados (JSON) com `level`, `requestId`, `dur`, `status`, sem expor segredos.
- Alertas:
  - Limiares: ≥3 falhas `5xx` em 5 minutos → alerta.
  - Falha de verificação de assinatura de webhook → alerta imediato.
- Saúde de recorrência:
  - Tarefa programada diária para `stripe.subscriptions.list(status='active')` e conciliação com base local.

## 5. Critérios de Conclusão
- `button` estável: sem cliques duplos, tempo de resposta < 2s até redirect.
- Testes E2E passam (checkout sucesso/cancelamento/recusa).
- Produto/price criados e usados no Checkout.
- Webhooks validando e sincronizando assinaturas.
- Observabilidade e alertas ativos.

## Próximas Ações
1. Confirmar que `STRIPE_API_KEY` e `STRIPE_WEBHOOK_SECRET` estão corretos no `.env`.
2. Ativar o MCP Stripe e criar `product`/`price` ZapPro (R$ 99,90/mês).
3. Ajustar o endpoint `/api/checkout` para usar o `price.id` criado.
4. Executar os testes e validar os fluxos em dev com cartões de teste.