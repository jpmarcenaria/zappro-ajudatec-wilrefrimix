# Plano de Banco Vetorial (Supabase + pgvector) e Router RAG

Data: 27/11/2025
Escopo: Indexar todos os PDFs de manuais de ar‑condicionado (inverter) organizados em pasta local e operar busca semântica nível 1 (RAG), fallback nível 2 (web) e nível 3 (LLM), com ingestão automática quando faltar manual.

## Objetivo

- Construir um índice semântico nacional de manuais técnicos (HVAC‑R, tecnologia inverter) para resposta técnica confiável.
- Pipeline local → Supabase (pgvector) com metadados normalizados por fabricante/marca/modelo.
- Política de roteamento: 1) RAG BD, 2) Web, 3) LLM.

## Estrutura de Pastas (Repositório)

- Raiz sugerida: `data/manuals/`.
- Convenção: `data/manuals/<fabricante>/<marca>/<modelo>/<arquivo>.pdf`
- Exemplos:
  - `data/manuals/Daikin/Daikin/FTXV/Manual_de_Servico.pdf`
  - `data/manuals/Midea/Midea/MSPLIT/Manual_Tecnico_MSPLIT_2022.pdf`

Metadados inferidos do path: `fabricante`, `marca`, `modelo`, `arquivo`.

## Banco de Dados (Supabase + pgvector)

- Extensão: `pgvector`.
- Tabelas mínimas:
  - `hvacr_devices(id, brand, model, series, manufacturer, created_at)`
  - `manuals(id, device_id, title, source, pdf_url, language, created_at)`
  - `manual_chunks(id, manual_id, page, section, content, embedding vector(1536))`
  - `alarm_codes(id, device_id, code, title, severity, resolution, created_at)`
- Índices:
  - `ivfflat` em `manual_chunks.embedding` com `vector_cosine_ops`, `lists=100`.
- RPC:
  - `match_manual_chunks(query_embedding, filter_brand, filter_model, match_threshold, match_count)` retorna `manual_id, page, section, content, similarity`.
- Provisionamento:
  - Executar `apps/saas/db/vector.sql` no SQL Editor do Supabase (produção).

## Variáveis de Ambiente (Server)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server).
- `OPENAI_API_KEY` (embeddings).
- Client-safe: `NEXT_PUBLIC_SUPABASE_URL` apenas para leitura pública; ingestão sempre via `service_role`.

## Pipeline de Ingestão (Tool Local)

- Função: varrer `data/manuals`, extrair texto dos PDFs, chunkar, gerar embeddings e inserir no Supabase.
- Etapas:
  - Descoberta de arquivos: permissão apenas `.pdf`.
  - Extração de texto: `pdf.js`/`pdf-parse` com fallback OCR (Tesseract) para PDFs escaneados.
  - Limpeza: remover cabeçalhos/rodapés repetidos, normalizar encoding, dividir por seções se possível.
  - Chunking: tamanho alvo 500–1000 tokens; overlap 100–200 tokens; preservar fronteiras de seção quando disponíveis.
  - Embeddings: `text-embedding-3-small` (1536 dims) com batch e retry exponencial.
  - Inserção:
    - `hvacr_devices` (upsert por `brand+model`).
    - `manuals` (upsert por `device_id+title` com `source/pdf_url` opcionais).
    - `manual_chunks` (inserção idempotente por `manual_id+page+hash(content)`).
  - Índice: garantir criação do `ivfflat` antes de primeiras consultas.
  - Logs: salvar relatório por arquivo com `chunks_count`, tempo, erros, checksums.
  - Reprocesso: se detecção de baixa qualidade (OCR), marcar `needs_ocr=true` para fila futura.

## Boas Práticas (2025)

- Qualidade de chunking: use heurísticas híbridas (títulos/seções + tamanho em tokens) para evitar “chunk sem contexto”.
- Filtros de recuperação: aplicar `brand/model` quando identificados; limiar `match_threshold` 0.70–0.80; `match_count` 5–10.
- Re‑ranking: opcionalmente aplicar re‑ranking por Cross‑Encoder em top‑k quando necessário.
- Cache: Redis para queries repetidas (`brand:model:query_hash`) e alarm codes; TTL 1–24h.
- Idempotência: deduplicar por hash do conteúdo; não reinserir chunks idênticos.
- Segurança: ingestão via `service_role` no servidor; jamais usar anon para escrita.
- Observabilidade: medir latência (`Server-Timing`) e registrar `avgSimilarity`/`topChunkSimilarity`.
- OCR: detectar PDFs escaneados e agendar conversão; preferir fontes originais dos fabricantes.
- Índices: após ingestão em lote executar `ANALYZE manual_chunks`; realizar `REINDEX` quando churn de >20%.
- Tuning `lists`: `100` para até ~100k chunks; `200–400` para ~1M; ajustar conforme latência/recall.
- Distância: usar `vector_cosine_ops` para embeddings OpenAI e ordenar por `<#>` com limiar via `1 - similarity`.
- Metadados: preencher `language='pt-BR'` e normalizar `brand/model` para consistência de filtros.

## Router de Pesquisa (Níveis)

- Nível 1 – BD RAG (semântico):
  - Extrair `brand/model/error_code` da pergunta.
  - Gerar embedding de consulta.
  - Chamar `match_manual_chunks` com filtros e `threshold` (ex.: 0.72) e `count` 5.
  - Se houver resultados, responder SOMENTE com conteúdo dos chunks (com referência de seção/página).

- Nível 2 – Pesquisa Web:
  - Se RAG não retornar resultados, buscar manuais em fontes brasileiras (fabricantes, suporte, portais técnicos).
  - Retornar link direto de download e instruir o usuário a fazer upload no chat para ingestão.

- Nível 3 – LLM (GPT‑4o):
  - Se não houver contexto, gerar resposta curta baseada em boas práticas de campo, deixando claro ausência de manual.
  - Nunca inventar valores técnicos; sempre preferir fontes oficiais.

Nota: O código atual da rota `apps/saas/app/api/openai/chat/route.ts` segue esta política: tenta RAG pelo RPC; se nada encontrado, devolve link direto e instruções de upload; em último caso, responde genericamente.

## Endpoints

- Ingestão: `POST /api/manuals/ingest`
  - JSON: `{ brand?, model?, manufacturer?, title, pdf_url?, source?, content? }`
  - Regras: usar `service_role` para escrita; texto do manual pode ser passado em `content`.

## Segurança e CORS

- `ALLOWED_ORIGIN` deve ser definido para o domínio de produção (ex.: `https://zappro.site`).
- Nenhum segredo em client; Stripe client usa apenas publishable key.
- Rate limit por IP/usuário.

## Execução

- Supabase (produção): abrir SQL Editor e executar `apps/saas/db/vector.sql`.
- Após ingestão inicial, validar consultas via RPC com filtros por marca/modelo.

## Roadmap (Próximos Passos)

- Implementar script CLI `manuals-ingest` (WSL) que percorre `data/manuals` e chama embeddings/insert com logs.
- Integrar Redis para cache de consultas e alarm codes.
- Adicionar re‑ranking opcional para top‑k.
- Completar cobertura de fabricantes comercializados no Brasil (Daikin, Midea, Gree, LG, Samsung, Fujitsu, Carrier, Springer, Elgin, Consul/Brastemp, etc.).
