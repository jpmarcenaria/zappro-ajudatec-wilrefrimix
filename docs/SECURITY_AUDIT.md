# Revisão Completa do Repositório – ZapPRO (WSL + MCP)

## Arquivos Essenciais

- `apps/saas/app/` – App Router Next.js 15 (páginas, rotas API, layout, estilos).
- `apps/saas/components/` – Componentes React críticos (chat, auth, landing).
- `apps/saas/lib/` – Bibliotecas: `supabase.ts` (singleton), `supabaseClient.ts` (client helper), `schemas.ts`, `monitor.ts` (métricas/observabilidade).
- `apps/saas/tests/` – Testes E2E Playwright (chat, landing, OAuth, upload, HVAC-R BR).
- `apps/saas/scripts/` – Scripts utilitários (`sprite.mjs`, embeddings, PDFs, busca).
- `apps/saas/Dockerfile` – Build runner Alpine com usuário não‑root e estágio Trivy.
- `docker-compose.yml` – Orquestração Supabase/serviços (web 3001, rest 3000, etc.).
- `apps/saas/.env.example` – Padrão de configuração WSL/Compose com comentários.
- `.trae/rules/*` – Contratos WSL/MCP obrigatórios.
- `apps/saas/prompts/system-instruction.pt-br.md` – Prompt padrão da persona HVAC-R.

## Arquivos Potencialmente Obsoletos

- `apps/saas/lib/supabaseClient.ts` – marcado como “legacy” no README, porém ainda referenciado por `components/AuthButtons.tsx`. Recomendação: consolidar em `supabase.ts` (singleton) em ciclo futuro, mantendo compatibilidade e testando OAuth.
- Sem outros arquivos com referência ausente detectada. `lib/monitor.ts` é usado por `app/api/status/route.ts`.

## Organização e Estrutura

- Testes estão em `apps/saas/tests/` – OK.
- Scripts `.sh` presentes na raiz: `wsl-commands.sh`, `test-run-wsl.sh`, `test-build-wsl.sh` – OK e padronizados para WSL.
- Projeto Next.js usa `app/` (App Router). Não há `src/` por design; manter consistência evitando diretório `src` paralelo.

## Containers e Segurança

- `apps/saas/Dockerfile` usa Node Alpine, `USER node`, healthcheck, labels OCI e `COPY --chown`.
- Compose ajustado: `web` expõe 3001 (padrão WSL), `rest` expõe 3000 (PostgREST MCP), `studio` movido para 3006 (evita conflito com 3000).
- `SUPABASE_URL` do `web` aponta para `http://kong:8000` na rede, conforme MCP.
- Varredura de segurança: estágio Trivy no Dockerfile e serviço `trivy` no Compose.

## Recomendações

- Consolidar `supabaseClient.ts` → `supabase.ts` com migração gradual.
- Adicionar testes HVAC-R com trace (`--trace on`) na CI.
- Fixar `.env` de dev com `ALLOWED_ORIGIN` coerente com a origem (3001/3002) para evitar 403 em rotas.
- Manter prompt da persona em `apps/saas/prompts/` e referenciá‑lo por `SYSTEM_INSTRUCTION_PT_BR_PATH`.

## Validação

- Typecheck/build OK em WSL.
- `docker-compose config` válido; booleans corrigidos para strings.
- Documentação atualizada em `README.md` para preview 3002.

