# Taskmaster – Padrão de Tasks (Chatbot FAQ, Supabase, Redis)

## Objetivo
- Unificar planejamento e execução de tasks para um chatbot FAQ HVAC‑R com RAG (Supabase + pgvector), cache Redis e latência p95 < 500ms.

## Templates de Tasks

### Feature
```
{
  "type": "feature",
  "title": "Implementar índice HNSW em manual_chunks",
  "description": "Criar índice HNSW e ajustar parâmetros para 1536 dims",
  "acceptance_criteria": [
    "Index criado sem erros",
    "Consultas RAG <500ms com top-5",
    "Precisão >= 0.85 em dataset de validação"
  ],
  "owner": "backend",
  "dependencies": ["setup-pgvector"],
  "estimate": "4h"
}
```

### Refactor
```
{
  "type": "refactor",
  "title": "Unificar RPC de FAQ e Manuais",
  "description": "Criar RPC único com filtros brand/model e fallback",
  "acceptance_criteria": [
    "RPC retorna top-k com metadados",
    "Filtro por brand/model aplicado",
    "Sem regressão de latência"
  ],
  "owner": "backend",
  "estimate": "3h"
}
```

### Ops
```
{
  "type": "ops",
  "title": "Configurar Redis cache semântico",
  "description": "Adicionar cache TTL 15min para consultas RAG",
  "acceptance_criteria": [
    "Hit-rate >= 50% em queries repetidas",
    "Latência média reduzida >30%",
    "Chaves expiram corretamente"
  ],
  "owner": "platform",
  "estimate": "2h"
}
```

## Fluxo de Trabalho
- Backlog → Ready → In Progress → Review → Done
- Gate de Review: testes passam, lint/typecheck ok, critérios de aceitação atendidos

## Critérios de Aceitação (Geral)
- Latência p95 < 500ms
- Sem segredos no cliente
- Logs de performance e erros armazenados

## Seeds de Tasks (Inicial)
```
[
  {
    "id": "redis-cache",
    "type": "ops",
    "title": "Configurar Redis TTL 900s",
    "acceptance_criteria": [
      "Variáveis REDIS_URL/REDIS_TLS definidas",
      "Cache funcionando em /api/openai/chat",
      "Relatório de hit-rate"
    ]
  },
  {
    "id": "faq-schema-opt",
    "type": "refactor",
    "title": "Otimizar schema de FAQ",
    "acceptance_criteria": [
      "Índices criados em colunas de busca",
      "Consultas SELECT/RPC com plano eficiente",
      "EXPLAIN ANALYZE dentro dos limites"
    ]
  }
  ,
  {
    "id": "billing-schema",
    "type": "feature",
    "title": "Provisionar schema de billing e perfis",
    "acceptance_criteria": [
      "Tabelas profiles/billing_* criadas",
      "RLS aplicada com service_role para escrita",
      "Assinatura trial registrada"
    ]
  },
  {
    "id": "trial-limits",
    "type": "ops",
    "title": "Configurar limites de trial",
    "acceptance_criteria": [
      "Tabela trial_limits criada",
      "Leitura pelo próprio usuário",
      "Resets diários funcionando"
    ]
  }
]
```

## Guia de Configuração
1. Definir variáveis no `.env.example` (RAG_*, Redis, Stripe)
2. Provisionar `apps/saas/db/vector.sql` e `apps/saas/db/vector-full.sql` no Supabase
3. Executar `scripts/apply-db.sh` via WSL ou Docker Compose
4. Ajustar parâmetros de índice conforme volume (HNSW/IVFFlat)
5. Ativar cache semântico com TTL e medir hit‑rate
6. Medir latência e ajustar `matchThreshold` e top-k

## Redis & Prompt Navegador LLM
- Variáveis: `REDIS_URL`, `REDIS_TLS`, `CACHE_TTL_SECONDS` (padrão 900s)
- Upstash/Redis Cloud: login via GitHub, criar DB, usar `rediss://` com TLS
- Smoke test: set/get com TTL
- Prompt Navegador (2025): usar agente com login GitHub para criar DB, salvar variáveis sem segredos, validar `redis_connectivity: OK` e reportar nomes das variáveis e próxima ação

## RAG (Supabase + pgvector)
- Tabelas: `hvacr_devices`, `manuals`, `manual_chunks`, `alarm_codes`
- Índices: HNSW recomendado; IVFFlat com `lists/probes` quando aplicável
- RPC: `match_manual_chunks(query_embedding, filter_brand, filter_model, match_threshold, match_count)`
- Parâmetros RAG via `.env` (`RAG_MATCH_THRESHOLD`, `RAG_MATCH_COUNT`, `RAG_DISTANCE_OP`, `RAG_INDEX_TYPE`, `RAG_LISTS`, `RAG_PROBES`)

## Qualidade e Observabilidade
- Testes de carga (K6/Locust), p95 < 500ms
- Monitoramento: latência por RPC, `avgSimilarity`, `topChunkSimilarity`, RAM, hit‑rate
- Rollback: `REINDEX`, reset de parâmetros (`ef_search`, `lists/probes`), desativar cache em incidente

---

## Contrato de Execução (Somente Fila Taskmaster)

- O sistema só pode executar ações que estejam na Fila Taskmaster.
- Qualquer operação fora da fila é proibida, inclusive comandos manuais.
- Estados válidos: `backlog`, `ready`, `in_progress`, `review`, `done`.
- Regras:
  - Apenas 1 task pode estar em `in_progress` por vez.
  - Ao concluir, mover imediatamente para `done` e registrar evidências.
  - Antes de executar, validar envs e contratos de segurança (segredos server-side).
  - Lint e typecheck obrigatórios após alterações.

---

## Fila Taskmaster (Bootstrap)
```
[
  {
    "id": "uiux-manuals-contrib",
    "type": "feature",
    "title": "Melhorar UI/UX da Biblioteca",
    "description": "Upload com triagem, links de download e navegação aprimorada",
    "state": "ready",
    "acceptance_criteria": [
      "Botão Importar PDF executa triagem",
      "Download disponível quando pdf_url",
      "Busca navegável por marca/modelo"
    ]
  },
  {
    "id": "api-manuals-status",
    "type": "feature",
    "title": "Endpoint de status da biblioteca",
    "description": "CSV x DB, missing/found e exposição de blacklist/registry",
    "state": "ready",
    "acceptance_criteria": [
      "GET /api/manuals/status retorna total/found/missing",
      "Inclui blacklist e registry",
      "Sem segredos vazados"
    ]
  },
  {
    "id": "api-manuals-triage",
    "type": "feature",
    "title": "Endpoint de triagem de PDF",
    "description": "Heurística para classificar service_manual vs engineering_doc",
    "state": "ready",
    "acceptance_criteria": [
      "POST /api/manuals/triage aceita arquivo",
      "Retorna classificação e texto",
      "Integra com ingest"
    ]
  },
  {
    "id": "mcp-supabase-provision",
    "type": "ops",
    "title": "Provisionar Supabase via MCP",
    "description": "Aplicar schemas base (vector.sql) e validar RPCs",
    "state": "ready",
    "acceptance_criteria": [
      "pgvector ativo",
      "tabelas hvacr_devices/manuals/manual_chunks criadas",
      "RPC match_manual_chunks funcional"
    ]
  },
  {
    "id": "mcp-supabase-sql-sandbox",
    "type": "feature",
    "title": "Criar/Dropar SQL mínimo (sandbox)",
    "description": "Testar criação e remoção de tabela sandbox via MCP",
    "state": "ready",
    "acceptance_criteria": [
      "CREATE TABLE executado",
      "SELECT EXISTS retorna true",
      "DROP TABLE executado"
    ]
  },
  {
    "id": "discover-pdf-links",
    "type": "feature",
    "title": "Descobrir links de manuais",
    "description": "Usar Tavily/Brave/Firecrawl com CSV nacional para gerar valid_links.json",
    "state": "ready",
    "acceptance_criteria": [
      "valid_links.json gerado",
      ">= 20 links válidos",
      "blacklist e registry atualizados"
    ]
  },
  {
    "id": "download-pdfs",
    "type": "feature",
    "title": "Baixar PDFs válidos",
    "description": "Baixar via fetch/curl/PowerShell/Playwright e salvar em data/manuals",
    "state": "ready",
    "acceptance_criteria": [
      ">= 20 PDFs baixados",
      "upsert hvacr_devices/manuals ok",
      "relatório bootstrap_report.json salvo"
    ]
  },
  {
    "id": "triage-pdfs",
    "type": "refactor",
    "title": "Triagem de PDFs",
    "description": "Classificar PDFs e marcar somente service_manual para ingestão",
    "state": "ready",
    "acceptance_criteria": [
      "local_scan_results.json gerado",
      ">= 80% de confiança em service_manual",
      "lista filtrada para ingestão"
    ]
  },
  {
    "id": "ingest-semantic",
    "type": "feature",
    "title": "Ingestão semântica",
    "description": "Chunking + embeddings e inserção em manual_chunks",
    "state": "ready",
    "acceptance_criteria": [
      ">= 1000 chunks inseridos",
      "ANALYZE em manual_chunks",
      "match via RPC retorna top-5"
    ]
  },
  {
    "id": "mcp-access-token",
    "type": "ops",
    "title": "Configurar SUPABASE_ACCESS_TOKEN",
    "description": "Habilitar MCP Supabase no Trae IDE para DDL/migrações",
    "state": "ready",
    "acceptance_criteria": [
      "list_organizations retorna dados",
      "list_projects funciona",
      "apply_migration conectado"
    ],
    "progress": 0
  },
  {
    "id": "admin-charts",
    "type": "feature",
    "title": "Gráficos de latência e hit-rate",
    "description": "Adicionar gráficos simples no Admin com dados do monitor",
    "state": "ready",
    "acceptance_criteria": [
      "Latência média por rota em gráfico",
      "Hit/Miss do cache em linha/barra",
      "Atualização a cada 5s"
    ],
    "progress": 0
  },
  {
    "id": "hit-rate-validation",
    "type": "ops",
    "title": "Validar hit-rate em produção",
    "description": "Medir hit-rate e ajustar TTL conforme uso real",
    "state": "ready",
    "acceptance_criteria": [
      "Relatório semanal do hit-rate",
      "TTL ajustado e documentado",
      "p95 mantido < 500ms"
    ],
    "progress": 0
  },
  {
    "id": "manuals-ui-fix",
    "type": "feature",
    "title": "Corrigir Biblioteca de Manuais",
    "description": "Remover erro failed_list e adicionar fallback Supabase anon",
    "state": "in_progress",
    "acceptance_criteria": [
      "Página lista sem 403/500",
      "Fallback client supabase funciona",
      "UX mantém contadores e busca"
    ],
    "progress": 50
  },
  {
    "id": "chat-senior-quality",
    "type": "refactor",
    "title": "Aprimorar respostas do chatbot",
    "description": "Refinar prompt, validação e respostas técnicas padronizadas",
    "state": "ready",
    "acceptance_criteria": [
      "Respostas com valores e passos objetivos",
      "Validação impede respostas genéricas",
      "Loga avgSimilarity/topChunkSimilarity"
    ],
    "progress": 0
  },
  {
    "id": "deploy-progress-bar",
    "type": "feature",
    "title": "Barra de Progresso de Deploy",
    "description": "Calcular % concluído da fila e exibir no Admin",
    "state": "ready",
    "acceptance_criteria": [
      "% por estado e % geral",
      "Atualização automática",
      "Link para detalhes das tasks"
    ],
    "progress": 0
  },
  {
    "id": "rag-bench-tuning",
    "type": "ops",
    "title": "Benchmark e tuning RAG",
    "description": "Medir latência/recall e ajustar RAG_LISTS/RAG_PROBES",
    "state": "ready",
    "acceptance_criteria": [
      "p95 < 500ms",
      "recall@5 >= 0.80",
      "parâmetros documentados"
    ]
  }
  ,
  {
    "id": "triage-local-pdfs",
    "type": "feature",
    "title": "Triagem e relatório de PDFs locais",
    "description": "Classificar service_manual e gerar local_scan_results.json",
    "state": "ready",
    "acceptance_criteria": [
      "Relatório gerado",
      ">= 50 PDFs classificados",
      ">= 80% confiança service_manual"
    ]
  },
  {
    "id": "ingest-pdfs-chunks",
    "type": "feature",
    "title": "Extrair texto, chunkar e inserir embeddings",
    "description": "Rodar ingestão a partir de data/manuals usando pdf-parse + embeddings",
    "state": "ready",
    "acceptance_criteria": [
      ">= 1000 chunks inseridos",
      "ANALYZE manual_chunks",
      "RPC match retorna top-5"
    ]
  },
  {
    "id": "redis-cache-semantic-test",
    "type": "ops",
    "title": "Teste smoke de cache semântico",
    "description": "Validar set/get TTL via /api/cache/test",
    "state": "ready",
    "acceptance_criteria": [
      "Endpoint retorna ok=true",
      "Server-Timing presente",
      "TTL respeitado"
    ]
  },
  {
    "id": "pdf-library-security",
    "type": "refactor",
    "title": "Fortalecer biblioteca de PDFs",
    "description": "Aplicar HTTPS-only e whitelist de domínios confiáveis",
    "state": "ready",
    "acceptance_criteria": [
      "Links http bloqueados",
      "Domínios não confiáveis em blacklist",
      "valid_links.csv sem hosts proibidos"
    ]
  },
  {
    "id": "vps-deploy",
    "type": "ops",
    "title": "Preparar deploy em VPS",
    "description": "Docker build, run, proxy Nginx e TLS",
    "state": "ready",
    "acceptance_criteria": [
      "Container roda em 3001",
      "Nginx proxy 443→3001",
      "Health check 200 em produção"
    ]
  },
  {
    "id": "gemini-pro-integration",
    "type": "feature",
    "title": "Integrar Gemini Pro como provider opcional",
    "description": "Adicionar toggles/env e rotas compatíveis com Gemini Pro",
    "state": "ready",
    "acceptance_criteria": [
      "Env keys configuráveis",
      "Chat suporta provider=gemini",
      "Sem segredos no client"
    ]
  },
  {
    "id": "ops-4_5-prep",
    "type": "ops",
    "title": "Preparar Ops 4.5 (observabilidade/segurança)",
    "description": "Métricas, rate limit, headers de segurança e rollback",
    "state": "ready",
    "acceptance_criteria": [
      "Server-Timing ativo",
      "Rate limit aplicado",
      "Headers de segurança configurados"
    ]
  },
  {
    "id": "chatbot-refine",
    "type": "refactor",
    "title": "Refinar respostas e roteamento do chatbot",
    "description": "Ajustar filtros brand/model, thresholds e respostas técnicas",
    "state": "ready",
    "acceptance_criteria": [
      "Respostas citam seção/página",
      "Fallback web com link oficial",
      "LLM curto sem valores inventados"
    ]
  },
  {
    "id": "ui-buttons-tests",
    "type": "feature",
    "title": "Testes Playwright dos botões principais",
    "description": "Cobrir CTA, Chat enviar, Biblioteca busca",
    "state": "ready",
    "acceptance_criteria": [
      "Todos botões visíveis",
      "Clicks sem erro",
      "Trace opcional on"
    ]
  },
  {
    "id": "trial-login-tests",
    "type": "feature",
    "title": "Testes de login e contagem de trial",
    "description": "Validar criação de usuário e limites de trial",
    "state": "ready",
    "acceptance_criteria": [
      "SignUp ok",
      "trial_limits atualizado",
      "Bloqueio após limite"
    ]
  },
  {
    "id": "remarketing-tables",
    "type": "feature",
    "title": "Criar tabelas de remarketing",
    "description": "Provisionar contacts/events com RLS",
    "state": "ready",
    "acceptance_criteria": [
      "Tabelas criadas",
      "RLS correta",
      "Insert e select funcionam"
    ]
  }
  ,
  {
    "id": "repo-hardening-docs",
    "type": "refactor",
    "title": "Blindagem operacional e docs",
    "description": "Atualizar README/AGENTS com regras anti-quebra e cache RAG",
    "state": "ready",
    "acceptance_criteria": [
      "Seção Blindagem Operacional presente no README",
      "AGENTS.md reforçado com regras de execução",
      "Variáveis de TTLs de cache documentadas"
    ]
  },
  {
    "id": "cache-hit-rate-monitor",
    "type": "feature",
    "title": "Monitorar hit/miss do cache",
    "description": "Adicionar métricas e gráfico de hit-rate no Admin",
    "state": "ready",
    "acceptance_criteria": [
      "Logs registram cache_hit/cache_miss",
      "Gráfico visível no Admin",
      "TTL ajustável via env"
    ]
  },
  {
    "id": "mcp-tavily-context7-research",
    "type": "ops",
    "title": "Pesquisa de boas práticas (Tavily/Context7)",
    "description": "Levantar práticas 2025 para repos mantidos por LLMs/IDEs/CLI",
    "state": "ready",
    "acceptance_criteria": [
      "Resumo com fontes registrado sem criar novos arquivos",
      "Recomendações aplicadas em README/AGENTS",
      "Sem segredos expostos"
    ]
  },
  {
    "id": "cors-hardening",
    "type": "refactor",
    "title": "Endurecer CORS e headers",
    "description": "Validar ALLOWED_ORIGIN e habilitar Server-Timing em rotas críticas",
    "state": "ready",
    "acceptance_criteria": [
      "Rotas retornam 403 fora do domínio autorizado",
      "Server-Timing presente",
      "Sem regressão de UX"
    ]
  },
  {
    "id": "ci-lint-typecheck-gate",
    "type": "feature",
    "title": "Gate de CI para lint/typecheck",
    "description": "Falhar build quando lint ou typecheck falharem",
    "state": "ready",
    "acceptance_criteria": [
      "Pipeline bloqueia merge com erros",
      "Relatório de regras ativas",
      "Sem impacto em produção"
    ]
  }
  ,
  {
    "id": "dockerfile-alpine-harden",
    "type": "refactor",
    "title": "Dockerfile Alpine endurecido",
    "description": "Multi-stage, usuário não-root, scan Trivy HIGH/CRITICAL zero",
    "state": "ready",
    "acceptance_criteria": [
      "Imagem final <200MB",
      "Usuário não-root ativo",
      "Trivy HIGH/CRITICAL=0"
    ]
  },
  {
    "id": "ci-cd-vps-standard",
    "type": "feature",
    "title": "Padronizar CI/CD para VPS",
    "description": "Actions para build/publish Docker e deploy com health-check",
    "state": "ready",
    "acceptance_criteria": [
      "Pipeline backend/front configurado",
      "Publish de imagem com tag",
      "Health-check pós-deploy=200"
    ]
  },
  {
    "id": "nginx-security-hardening",
    "type": "refactor",
    "title": "Endurecer Nginx",
    "description": "TLS 1.3, HSTS, headers seguros, rate limiting básico",
    "state": "ready",
    "acceptance_criteria": [
      "HSTS e headers aplicados",
      "TLS 1.3 ativo",
      "429 em excesso de requisições"
    ]
  },
  {
    "id": "env-sanitization-check",
    "type": "feature",
    "title": "Validação de envs crítica",
    "description": "Script valida envs obrigatórias e aborta com relatório",
    "state": "ready",
    "acceptance_criteria": [
      "Relatório lista variáveis ausentes",
      "Abort seguro sem segredos",
      "ALLOWED_ORIGIN verificado"
    ]
  },
  {
    "id": "redis-ttl-policy",
    "type": "refactor",
    "title": "Política dinâmica de TTL",
    "description": "Ajuste automático de TTL por hit/miss e tipo de consulta",
    "state": "ready",
    "acceptance_criteria": [
      "TTL varia por perfil de uso",
      "Hit-rate semanal >50%",
      "Relatório de ajuste emitido"
    ]
  },
  {
    "id": "rpc-observability",
    "type": "feature",
    "title": "Observabilidade de RPC",
    "description": "Log de latência e similarity por chamada de match_manual_chunks",
    "state": "ready",
    "acceptance_criteria": [
      "avgSimilarity/topChunkSimilarity logados",
      "Latência por RPC registrada",
      "Dashboard simples no Admin"
    ]
  },
  {
    "id": "tests-coverage-expansion",
    "type": "refactor",
    "title": "Expandir cobertura de testes",
    "description": "Aumentar cobertura unit/e2e para Biblioteca e Chat",
    "state": "ready",
    "acceptance_criteria": [
      ">= 75% cobertura",
      "Playwright cobre /manuals",
      "Sem flakiness"
    ]
  },
  {
    "id": "ingest-cli-bootstrap",
    "type": "feature",
    "title": "CLI de ingestão",
    "description": "Script manuals-ingest com logs e métricas de qualidade",
    "state": "ready",
    "acceptance_criteria": [
      ">= 1000 chunks inseridos",
      "Relatório por arquivo",
      "ANALYZE manual_chunks executado"
    ]
  },
  {
    "id": "vps-waf-firewall",
    "type": "ops",
    "title": "WAF e firewall VPS",
    "description": "UFW e filtros Nginx básicos contra abuso",
    "state": "ready",
    "acceptance_criteria": [
      "UFW bloqueia portas não usadas",
      "Rate limit Nginx ativo",
      "Logs de bloqueio disponíveis"
    ]
  },
  {
    "id": "db-backup-restore",
    "type": "ops",
    "title": "Backup/restore de banco",
    "description": "Agendar backup e validar restore do Postgres/Supabase",
    "state": "ready",
    "acceptance_criteria": [
      "Backup diário gerado",
      "Restore de teste concluído",
      "Sem segredos em backups"
    ]
  }
]
```

---

## Execução Automática (Bootstrap)

- A execução noturna roda apenas tasks com `state=ready`, promovendo uma por vez para `in_progress` e finalizando em `done` com evidências.
- Logs: `apps/saas/logs/*` e relatórios em `pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/*`.
- Qualquer falha move a task para `review` com motivo e próxima ação.
- Itens marcados como `done` devem ser removidos da fila de execução (limpeza obrigatória).
