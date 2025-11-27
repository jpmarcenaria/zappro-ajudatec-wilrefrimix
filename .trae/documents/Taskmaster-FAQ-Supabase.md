# Taskmaster – Padrão de Tasks para Chatbot FAQ (Supabase)

## Templates de Tasks

### Feature
```
{
  "type": "feature",
  "title": "Implementar HNSW em manual_chunks",
  "description": "Criar índice HNSW e ajustar parâmetros para 1536 dims",
  "acceptance_criteria": [
    "Index criado sem erros",
    "Consultas RAG retornam em <500ms com top-5",
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
    "Sem regressão em latência"
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
      "Cache funcionando em rotas /api/openai/chat",
      "Relatório de hit-rate"
    ]
  },
  {
    "id": "faq-schema-opt",
    "type": "refactor",
    "title": "Otimizar schema de FAQ",
    "acceptance_criteria": [
      "Índices criados em colunas de busca",
      "Consultas SELECT/ RPC com plano eficiente",
      "EXPLAIN ANALYZE dentro dos limites"
    ]
  }
]
```

## Guia de Configuração

1. Definir variáveis no `.env.example` (RAG_* e Redis)
2. Provisionar `apps/saas/db/vector.sql` no Supabase
3. Ajustar parâmetros de índice conforme volume (HNSW/IVFFlat)
4. Ativar cache semântico com TTL
5. Medir latência e ajustar `matchThreshold` e top-k

