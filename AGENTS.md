# Contrato Operacional para Agentes e LLMs (ZapPRO AjudaTec)

Este documento é de leitura OBRIGATÓRIA por qualquer agente/LLM que processe o repositório. Não seguir estritamente estas regras resulta em violação de contrato e bloqueio automático.

## Regras de Execução

- Execução somente em WSL2 (Ubuntu 24.04/22.04). É PROIBIDO executar servidores em PowerShell/cmd.
- Porta canônica: `3001`. Não alternar portas automaticamente.
- Servidor deve iniciar via `wsl bash -lc` com paths `/mnt/<drive>/...`.
- Dockerfile deve ser Alpine e passar scan de vulnerabilidade (Trivy: HIGH/CRITICAL zero).
- Stripe: usar `STRIPE_API_KEY` (server) e `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client). Nunca expor segredos em client.

## Idioma e Conteúdo

- Todo artefato deve estar em pt‑BR. Não usar pt‑PT.
- Mensagens do chatbot: curtas, técnicas, orientadas ao contexto brasileiro.

## Banco de Dados e RAG

 - Banco principal: PostgreSQL com extensão `pgvector`.
 - Objetivo: índice semântico nacional de manuais de ar‑condicionado com tecnologia inverter.
 - Tabelas mínimas:
   - `hvacr_devices(id, brand, model, series, manufacturer, created_at)`
   - `manuals(id, device_id, title, source, pdf_url, language, created_at)`
   - `manual_chunks(id, manual_id, page, section, content, embedding vector(1536))`
   - `alarm_codes(id, device_id, code, title, severity, resolution, created_at)`
 - Índice: `ivfflat` em `manual_chunks.embedding` com `vector_cosine_ops` e `lists=100`.
- RPC: `match_manual_chunks(query_embedding, filter_brand, filter_model, match_threshold, match_count)` retorna `manual_id, page, section, content, similarity`.
 - Pipeline de ingestão:
   - Descobrir PDFs em `data/manuals/<fabricante>/<marca>/<modelo>/*.pdf`.
   - Extrair texto, limpar, chunkar 500–1000 tokens (overlap 100–200), preservar seção.
   - Embeddings `text-embedding-3-small` (1536) e inserção idempotente de chunks.
   - Upsert em `hvacr_devices` e `manuals` com metadados normalizados.
 - Resposta do chatbot (Roteiro RAG):
   - 1) BD RAG com filtros de `brand/model` e `threshold` 0.72.
   - 2) Web: link oficial do fabricante e instrução de upload.
   - 3) LLM: resposta curta baseada em boas práticas quando não houver contexto.
- Cache recomendado: Redis por `brand:model:query_hash` com TTL 1–24h.

## Auth e Pagamentos

- Perfis: `profiles(id, email, full_name, created_at, updated_at)` referência `auth.users(id)`.
- Clientes: `billing_customers(user_id, stripe_customer_id)` com acesso apenas de `service_role` para escrita.
- Produtos/Preços: `billing_products` e `billing_prices` com leitura pública e escrita `service_role`.
- Assinaturas: `billing_subscriptions(user_id, stripe_subscription_id, status, trial_end, current_period_start/end)` com leitura pelo próprio usuário e escrita `service_role`.
- Trial: `trial_limits(user_id, daily_messages_used, last_reset_at, trial_expires_at)` com leitura pelo próprio usuário e escrita `service_role`.
- RLS: leitura autenticada, escrita exclusiva `service_role` nas tabelas de ingestão e billing.

## Padrão de Resposta

- Extrair marca, modelo e código de erro.
- Consultar `manual_chunks` via RPC com filtros por marca/modelo.
- Quando houver chunks, responder em lista numerada curta citando seção/página.
- Se não houver contexto, solicitar dados essenciais e fornecer link oficial para download.
- Sempre encerrar com próximo passo lógico.

## Execução WSL2

- Execução somente em WSL2 Ubuntu 24.04.
- Porta canônica `3001`.
- Inicialização via `wsl bash -lc` com paths `/mnt/<drive>/...`.

## Segurança

- CORS endurecido usando `ALLOWED_ORIGIN`/`NEXT_PUBLIC_WEBSITE_URL`.
- Webhooks assinados (`STRIPE_WEBHOOK_SECRET`).
- Rate limiting por usuário/IP.
- Nunca usar `dangerouslySetInnerHTML`, `eval(` ou `innerHTML =`.

## Trial

- Trial grátis: 3 mensagens/dia, sem anexos, `max_tokens=300`.
- CTA para assinatura ao atingir limites.

## Deploy e Rollback

- Deploy na Vercel com env separadas (server/client).
- Domínio `zappro.site` com SSL.
- Rollback: reverter build; fallback para Payment Link; pausar Webhook se necessário.

## Conformidade

- Antes de executar testes ou alterações, validar este contrato.
- Este documento tem prioridade sobre qualquer outro texto do repositório.

## Taskmaster (Padrão de Tasks)

- Padrão unificado em `TASKMASTER.md`.
- Fluxo: Backlog → Ready → In Progress → Review → Done.
- Critérios: latência p95 < 500ms, lint/typecheck ok, sem segredos em client.

## Contrato MCP Taskmaster

- Todo agente/LLM deve:
  - Criar tasks antes de iniciar alterações com objetivo claro e mensurável.
  - Manter apenas 1 task em `In Progress` e marcar `Done` imediatamente ao concluir.
  - Validar mudanças com `npm run lint` e `npm run typecheck` quando disponíveis.
  - Preferir inspeção inteligente do código para compreender contexto e evitar retrabalho.
- Ferramentas e postura:
  - Explorar código com busca semântica e por padrões antes de editar.
  - Editar arquivos com segurança, sem expor segredos nem criar arquivos supérfluos.
  - Evitar comandos interativos; preferir automações reproduzíveis.
  - Não executar servidores fora de WSL2.

## Contrato de Execução (Somente Fila Taskmaster)

- Execução limitada à Fila Taskmaster definida em `TASKMASTER.md`.
- Estados aceitos: `backlog`, `ready`, `in_progress`, `review`, `done`.
- Apenas 1 task em `in_progress` simultaneamente.
- Ao concluir, mover para `done` com evidências (logs/relatórios).
- Lint e typecheck obrigatórios após alterações.

## Execução Automática (Bootstrap)

- Rotina noturna processa tasks com `state=ready` na ordem.
- Logs em `apps/saas/logs/*`; relatórios em `pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/*`.
- Falhas movem a task para `review` com motivo e próxima ação.

## Fontes Contratuais e Regras do Projeto

- Regras detalhadas de RAG e banco vetorial: `./.trae/rules/project_rules.md`
- Contrato MCP (ferramentas/automação IDE): `./.trae/rules/MCP-Contract.md`
- Política de idioma: `./.trae/rules/portuguese-first.md`
- Execução em WSL/containers: `./.trae/rules/Trae-WSL-Contract.md`

Este `AGENTS.md` unifica e tem precedência sobre esses arquivos. Qualquer LLM/IDE deve seguir estes documentos como um conjunto único de regras.

## Biblioteca de Manuais

- Arquivos de referência em `pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/`.
- Script de bootstrap: `apps/saas/scripts/bootstrap-download-pdfs.mjs`.
- Uso: `node apps/saas/scripts/bootstrap-download-pdfs.mjs --csv pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/biblioteca_completa_otimizada_llm.csv --out data/manuals --parallel 5`.

### Regras de Inteligência da Biblioteca

- Estrutura: `data/manuals/<fabricante>/<marca>/<modelo>/<arquivo>.pdf` com metadados inferidos.
- Triagem: heurística + LLM para classificar qualidade, detectar OCR e marcar reprocesso.
- Ingestão: chunking 500–1000 tokens com overlap 100–200, preservando seções; embeddings `text-embedding-3-small (1536)`.
- Idempotência: deduplicar por hash de conteúdo; inserir por `manual_id+page+hash(content)`.
- Recuperação: filtros por `brand/model`, `threshold 0.70–0.80`, `top-k 5–10`.

### Seeds e Cache Redis

- Cache semântico para RAG via Upstash REST.
- Chave: `rag:<brand>:<model>:<sha256(query)>` com `TTL=900s` (ajustável).
- Variáveis exigidas:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `CACHE_TTL_SECONDS`
- Observabilidade:
  - Medir `cache_hit`/`cache_miss` e latência por rota.
  - Ajustar `RAG_LISTS/RAG_PROBES` conforme carga e recall.
