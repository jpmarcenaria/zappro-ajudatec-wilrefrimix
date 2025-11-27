# Guia Supabase no Trae IDE (MCP) – 27/11/2025

## Objetivo
- Operar Supabase via MCP no Trae IDE para provisionamento, migrações, PostgREST e integração RAG.
- Resolver erros comuns de autenticação e CORS em ambiente Windows.

## Pré‑requisitos
- `SUPABASE_ACCESS_TOKEN` válido com permissão em sua organização.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` para leitura pública.
- `SUPABASE_SERVICE_ROLE_KEY` para rotas de servidor (ingestão, RPC).

## Configuração de Acesso MCP
- No Trae IDE, exporte o token:
  - Windows PowerShell: `setx SUPABASE_ACCESS_TOKEN "<token>"`
  - Reinicie o Trae IDE após definir.
- Alternativa CLI: iniciar o servidor MCP com `--access-token <token>`.

## Ferramentas MCP disponíveis
- Supabase:
  - `mcp_supabase_list_organizations`, `mcp_supabase_get_organization`
  - `mcp_supabase_get_cost`, `mcp_supabase_confirm_cost`, `mcp_supabase_create_project`
  - `mcp_supabase_list_projects`, `mcp_supabase_get_project`
  - `mcp_supabase_list_tables`, `mcp_supabase_list_extensions`, `mcp_supabase_list_migrations`
  - `mcp_supabase_apply_migration`, `mcp_supabase_execute_sql`
  - `mcp_supabase_get_project_url`, `mcp_supabase_get_publishable_keys`, `mcp_supabase_generate_typescript_types`
  - Branches: `mcp_supabase_create_branch`, `mcp_supabase_list_branches`, `mcp_supabase_merge_branch`, `mcp_supabase_reset_branch`, `mcp_supabase_rebase_branch`
- PostgREST:
  - `mcp_Postgrest_sqlToRest`, `mcp_Postgrest_postgrestRequest`

## Passos Comuns
1. Listar organizações:
   - Chamar `list_organizations`; se `Unauthorized`, conferir `SUPABASE_ACCESS_TOKEN`.
2. Custos e criação de projeto:
   - `get_cost` → `confirm_cost` → `create_project` (região BR preferencial: `sa-east-1`).
3. Provisionar pgvector e RPC:
   - `apply_migration` com SQL de `apps/saas/db/vector.sql`.
4. Gerar tipos TypeScript:
   - `generate_typescript_types` para o projeto alvo.
5. PostgREST a partir de SQL:
   - `sqlToRest"SELECT * FROM manuals LIMIT 5"` → inspecionar `method/path` → `postgrestRequest`.

## Erros Frequentes
- `Unauthorized` nos comandos MCP:
  - Falta `SUPABASE_ACCESS_TOKEN` ou token expirado; definir e reiniciar.
- `SupabaseKey required` em rotas:
  - Falta `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`.
- CORS 403 em rotas:
  - Ajustar `ALLOWED_ORIGIN` para domínio atual; em dev, preferir origem `http://localhost:<porta>`.

## Pesquisa e Contexto (Tavily/Context7)
- Usar agentes de pesquisa para documentação e exemplos atualizados:
  - Tavily: buscar “Supabase pgvector RPC 2025”, “Supabase MCP access token”, “PostgREST SQL to REST”.
  - Context7: agregar páginas; criar resumo técnico e checklist de configuração.

## Integrações no Repositório
- RPC RAG na rota de chat: `apps/saas/app/api/openai/chat/route.ts:318`.
- Listagem de manuais: `apps/saas/app/api/manuals/list/route.ts:24`.
- Ingestão semântica: `apps/saas/app/api/manuals/ingest/route.ts:72`.
- Cron FAQs: `apps/saas/app/api/cron/crawl-faqs/route.ts:156`.
- Monitoramento em Supabase: `apps/saas/lib/monitor.ts:97` e `apps/saas/lib/monitor.ts:103`.
- Validação de env: `apps/saas/lib/env-validator.ts:1`.

## Segurança
- Leitura no cliente com `anon key`; escrita e ingestão sempre via `service_role` no servidor.
- Não expor tokens MCP/Supabase no cliente.

## Teste Rápido
- Listar tabelas: `mcp_supabase_list_tables` no projeto; confirmar `hvacr_devices`, `manuals`, `manual_chunks`.
- Executar sandbox:
  - `apply_migration` com `CREATE TABLE mcp_smoke_test(id uuid default gen_random_uuid(), created_at timestamptz default now());`
  - `execute_sql` com `DROP TABLE mcp_smoke_test;`

## Próximos Passos
- Configurar token MCP e validar `list_projects`.
- Aplicar `vector.sql` e testar `match_manual_chunks`.
- Integrar dashboards e gráficos de latência/hit‑rate.
