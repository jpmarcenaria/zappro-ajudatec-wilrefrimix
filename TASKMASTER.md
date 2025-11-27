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
    "id": "setup-pgvector",
    "type": "feature",
    "title": "Habilitar pgvector e RPC de match",
    "acceptance_criteria": [
      "Extensão vector ativa",
      "Tabela manual_chunks existente",
      "RPC match_manual_chunks funcional"
    ]
  },
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
]
```

## Guia de Configuração
1. Definir variáveis no `.env.example` (RAG_* e Redis)
2. Provisionar `apps/saas/db/vector.sql` no Supabase
3. Ajustar parâmetros de índice conforme volume (HNSW/IVFFlat)
4. Ativar cache semântico com TTL e medir hit‑rate
5. Medir latência e ajustar `matchThreshold` e top-k

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
    "id": "cache-smoke-endpoint",
    "type": "feature",
    "title": "Endpoint de smoke Upstash",
    "description": "Criar /api/cache/test com set/get TTL",
    "state": "ready",
    "acceptance_criteria": [
      "200 OK",
      "set/get TTL funcionando",
      "logs registram cache_hit/cache_miss"
    ]
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
]
```

---

## Execução Automática (Bootstrap)

- A execução noturna roda apenas tasks com `state=ready`, promovendo uma por vez para `in_progress` e finalizando em `done` com evidências.
- Logs: `apps/saas/logs/*` e relatórios em `pdf_manuais_hvac-r_inverter/arquivos_de_instrucoes/*`.
- Qualquer falha move a task para `review` com motivo e próxima ação.
