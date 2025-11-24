**Tarefas Padrão Trae IDE — Sistema RAG HVAC-R Brasil (Implementação: 24/11/2025)**

- Ambiente: Execução exclusivamente em WSL 2 (Ubuntu 24.04/22.04). Porta padrão do app: `3001`.
- Contratos: Conformidade integral com `.trae/rules/MCP-Contract.md` e `.trae/rules/Trae-WSL-Contract.md`.
- MCPs a serem usados: `Postgrest`, `GitHub`, `Fetch`, `Persistent Knowledge Graph`, `Memory`, `Sequential Thinking`, `TaskManager`, `testsprite`, `context7`, `Playwright`, `webresearch`, `Brave Search`, `Tavily`, `Firecrawl`.

---

**Tarefa 1 — Provisionar banco e API PostgREST (Supabase + pgvector)**
- Descrição: Criar schemas `technical_manuals`, `professor_content`, `faq_knowledge_base`, `search_cache`, `firecrawl_jobs` com índices HNSW e função `match_manuals` para busca vetorial.
- Critérios de aceitação:
  - Extensão `vector` habilitada e índices HNSW criados.
  - Tabelas com constraints e `trust_score`/`metadata` presentes.
  - PostgREST acessível para `select=*` com RLS habilitável.
- Tecnologias: `Postgrest` (MCP), Supabase/Postgres, pgvector.
- Prazos: Conclusão até 24/11/2025; verificação H+2h.
- Métricas: Tempo de resposta `GET /v1/*` < 250 ms em WSL; integridade constraints.
- Prioridade: Alta.
- Arquitetura: Normalizar entidades, índices para busca semântica, preparar RLS.

**Tarefa 2 — Ingestão Brasil‑centrada de manuais via Firecrawl**
- Descrição: Crawls de manuais técnicos de fabricantes no Brasil; armazenar markdown/URLs hashificados; validar HTTPS e procedência.
- Critérios de aceitação:
  - Jobs `firecrawl_jobs` registrados e status `completed` com `pages_crawled>0`.
  - Conteúdos marcados `language=pt-BR` e `trust_score>=0.9`.
- Tecnologias: `Firecrawl` (MCP), `Fetch` (MCP), Supabase.
- Prazos: 24/11/2025; reindex H+4h.
- Métricas: Cobertura ≥ 80% das marcas locais; erro de crawl < 5%.
- Prioridade: Alta.
- Arquitetura: Pipeline batch com validação de HTTPS e deduplicação por `file_hash`.

**Tarefa 3 — Agregador de busca (Tavily/Brave) com ranqueamento BR**
- Descrição: Integrar Tavily/Brave/Firecrawl com pesos (.br, fabricantes, CREA/CONFEA/ABRAVA, manuais, datas recentes, BR em plataformas), filtrando apenas HTTPS.
- Critérios de aceitação:
  - `apps/saas/app/api/openai/chat/route.ts` aplica scoring e filtro HTTPS (ver `apps/saas/app/api/openai/chat/route.ts:123-145`).
  - `tools`: Brave/Tavily ativos quando há `useSearch`.
- Tecnologias: `Tavily` (MCP), `Brave Search` (MCP), `webresearch` (MCP), `Fetch` (MCP).
- Prazos: 24/11/2025.
- Métricas: Top‑5 fontes retornadas BR‑priorizadas; latência < 2s.
- Prioridade: Alta.
- Arquitetura: Heurístico com ajuste de pesos; fallback estável.

**Tarefa 4 — Módulo Top 10 Professores HVAC‑R (BR)**
- Descrição: Endpoint `GET/POST /api/search/professors` com ranking por reputação, produção técnica, presença digital.
- Critérios de aceitação:
  - Ranking/HTTPS (ver `apps/saas/app/api/search/professors/route.ts:72-89,69-70`) e `GET` estático útil (ver `apps/saas/app/api/search/professors/route.ts:120-137`).
  - Resposta com 10 itens em `POST` quando chaves estão presentes.
- Tecnologias: `Tavily`, `Brave Search`, `Firecrawl`, `webresearch` (MCPs).
- Prazos: 24/11/2025.
- Métricas: ≥ 70% de fontes acadêmicas/entidades BR; latência < 2s.
- Prioridade: Alta.
- Arquitetura: De‑duplication, scoring temático, fallback de estabilidade.

**Tarefa 5 — Chatbot: Prompt pt‑BR, persona técnica e multimodal**
- Descrição: Instruções pt‑BR, persona @willrefrimix, estrutura de resposta e priorização de fontes BR; multimodal (texto/imagem/PDF).
- Critérios de aceitação:
  - Instruções (ver `apps/saas/app/api/openai/chat/route.ts:58-70`).
  - Modelo muda conforme multimodal e `tools` quando `useSearch`.
- Tecnologias: OpenAI server‑side; `Memory` (MCP); `context7` (MCP).
- Prazos: 24/11/2025.
- Métricas: 100% respostas pt‑BR; presença de “Aviso de segurança”; grounding quando `useSearch`.
- Prioridade: Alta.
- Arquitetura: App Router server‑only; nenhum segredo no client.

**Tarefa 6 — CORS endurecido, preflight e validação de origem**
- Descrição: Aplicar `OPTIONS`, validar `origin` contra `ALLOWED_ORIGIN/NEXT_PUBLIC_WEBSITE_URL`, e setar `Access-Control-Allow-Origin`.
- Critérios de aceitação:
  - Chat/TTS/Transcribe/Checkout/Professores com `OPTIONS` e bloqueio fora da origem.
  - Linhas: chat `apps/saas/app/api/openai/chat/route.ts:1-11,24-36`, tts `apps/saas/app/api/openai/tts/route.ts:1-10,15-23`, transcribe `apps/saas/app/api/openai/transcribe/route.ts:1-10,15-23`, checkout `apps/saas/app/api/checkout/route.ts:33-41`, professores `apps/saas/app/api/search/professors/route.ts:139-157`.
- Tecnologias: Next.js App Router.
- Prazos: 24/11/2025.
- Métricas: 0 requisições fora da origem; preflight 204.
- Prioridade: Alta.
- Arquitetura: Server‑side headers; sem vazamento de segredos.

**Tarefa 7 — Monitoramento: Server‑Timing + alertas de latência**
- Descrição: Log de duração, `Server-Timing` e `console.warn` >2s nas rotas críticas.
- Critérios de aceitação: chat `apps/saas/app/api/openai/chat/route.ts:198-204`, tts `apps/saas/app/api/openai/tts/route.ts:71-76`, transcribe `apps/saas/app/api/openai/transcribe/route.ts:44-52`, checkout `apps/saas/app/api/checkout/route.ts:21-31`, professores `apps/saas/app/api/search/professors/route.ts:110-118,132-139`.
- Tecnologias: Next.js server; `testsprite` (MCP).
- Prazos: 24/11/2025.
- Métricas: 95º < 2s; alertas emitidos quando excedidos.
- Prioridade: Média.
- Arquitetura: Observabilidade leve via headers + logs.

**Tarefa 8 — Testes (WSL‑only): unit, E2E Playwright e smoke**
- Descrição: Rodar `lint`, `typecheck`, `build`; executar smoke com `BASE_URL=http://localhost:3001` e Playwright E2E com bypass de Dev Overlay.
- Critérios de aceitação:
  - `npm run validate:wsl` OK; `scripts/sprite.mjs` reporta códigos 200 nas rotas.
  - Playwright navega `/`→`/chat` e valida upload/TTS.
- Tecnologias: `testsprite` (MCP), `Playwright` (MCP).
- Prazos: 24/11/2025.
- Métricas: Pass rate ≥ 95%; nenhuma chave server exposta.
- Prioridade: Alta.
- Arquitetura: Execução via `wsl bash -lc` e porta `3001`.

**Tarefa 9 — Especificação técnica do chatbot HVAC‑R**
- Descrição: Definir arquitetura de IA moderna, fluxos de conversa técnica, integrações, modelos focados em tecnologia inverter, e roadmap.
- Critérios de aceitação:
  - Documento com fluxos de diagnóstico, manuais e validação com professores.
  - Roadmap com marcos trimestrais e metas de latência/qualidade.
- Tecnologias: `context7` (MCP), `Persistent Knowledge Graph` (MCP).
- Prazos: 24/11/2025.
- Métricas: Cobertura de casos inverter (VRF/VRV, split) ≥ 90%.
- Prioridade: Alta.
- Arquitetura: RAG hierárquico, caches semânticos e fallback robusto.

**Tarefa 10 — Documentação técnica associada**
- Descrição: Diagramas de arquitetura, especificações de API, protocolos de comunicação, modelos de dados e plano de evolução tecnológica.
- Critérios de aceitação:
  - Diagramas com fronteiras WSL/server/client.
  - APIs versionadas e protocolos definidos; modelos com pgvector.
- Tecnologias: `GitHub` (MCP), `Fetch` (MCP).
- Prazos: 24/11/2025.
- Métricas: Completeness ≥ 90%; revisão técnica concluída.
- Prioridade: Média.
- Arquitetura: Documentar SLA, segurança e compliance CREA/ABNT.

**Tarefa 11 — Cache semântico e validação de procedência**
- Descrição: Implementar `search_cache` com TTL e consulta semântica; aceitar apenas fontes HTTPS.
- Critérios de aceitação:
  - Writes com `query_hash` único e TTL padrão 7 dias.
  - Filtro HTTPS ativo em agregadores (chat `apps/saas/app/api/openai/chat/route.ts:131-134`, professores `apps/saas/app/api/search/professors/route.ts:69-70`).
- Tecnologias: Supabase/PostgREST; `Postgrest` (MCP).
- Prazos: 24/11/2025.
- Métricas: Hit rate ≥ 30%; zero fontes não‑HTTPS.
- Prioridade: Média.
- Arquitetura: Cache em camada de consulta; prevenção de duplicata.

**Tarefa 12 — Operação WSL e portas**
- Descrição: Scripts de dev e validação em WSL; app na porta `3001`; smoke usa `BASE_URL=http://localhost:3001`.
- Critérios de aceitação:
  - `apps/saas/package.json` contém `dev:wsl` e `validate:wsl`.
  - `scripts/sprite.mjs` usa `BASE_URL` default `http://localhost:3001`.
- Tecnologias: `TaskManager` (MCP) para tracking; WSL.
- Prazos: 24/11/2025.
- Métricas: Build/lint/typecheck OK em WSL; servidor inicia sem `EADDRINUSE`.
- Prioridade: Alta.
- Arquitetura: Execução via `wsl bash -lc` e paths `/mnt/d/...`.

---

**Uso dos MCPs (especificação)**
- `Postgrest`: CRUD seguro; acesso às tabelas e função `match_manuals`.
- `GitHub`: Issues/PR para tarefas e revisões técnicas.
- `Fetch`: Coleta controlada de documentação/manuais externos.
- `Persistent Knowledge Graph`: Memória estruturada das entidades (equipamentos/manuais/professores) e relações.
- `Memory`: Preferências de execução WSL e contratos ativos.
- `Sequential Thinking`: Planejamento multi‑etapas.
- `TaskManager` (TodoWrite): Tracking das tarefas e estados.
- `testsprite`: Smoke pós‑deploy para rotas críticas.
- `context7`: Anexar contexto longo.
- `Playwright`: E2E de navegação, upload e TTS.
- `webresearch`: Pesquisa técnica; mapeável ao Tavily.
- `Brave Search`: Pesquisa adicional com foco em privacidade.
- `Tavily`: Pesquisa/QA com síntese; priorização BR.
- `Firecrawl`: Crawling/indexação de sites técnicos (manuais).

---

**Comandos WSL de referência**
- Dev: `wsl bash -lc "cd /mnt/d/.../apps/saas && PORT=3001 npm run dev"`
- Validação: `wsl bash -lc "cd /mnt/d/.../apps/saas && npm run lint && npm run typecheck && npm run build"`
- Smoke: `wsl bash -lc "cd /mnt/d/.../apps/saas && BASE_URL=http://localhost:3001 node scripts/smoke.mjs"`

---

**Referências de código (para verificação rápida)**
- Chat pt‑BR/persona: `apps/saas/app/api/openai/chat/route.ts:58-70`
- Agregador (pesos + HTTPS): `apps/saas/app/api/openai/chat/route.ts:123-145`
- Professores (ranking + HTTPS): `apps/saas/app/api/search/professors/route.ts:69-70,72-89`
- CORS/OPTIONS (rotas): chat `apps/saas/app/api/openai/chat/route.ts:1-11,24-36`; tts `apps/saas/app/api/openai/tts/route.ts:1-10,15-23`; transcribe `apps/saas/app/api/openai/transcribe/route.ts:1-10,15-23`; checkout `apps/saas/app/api/checkout/route.ts:33-41`; professores `apps/saas/app/api/search/professors/route.ts:139-157`

---

🎯 PROMPT COMPLETO PARA LLM (Trae IDE) - Sistema RAG HVAC-R Brasil
text
# TASK: Implementar Sistema de Pesquisa Inteligente Multi-API para Chatbot Técnico HVAC-R

## CONTEXTO
Você é responsável por implementar a camada de inteligência de busca e banco de dados para um chatbot técnico HVAC-R focado no mercado brasileiro. O sistema deve priorizar manuais oficiais, validar informações com top professores brasileiros, e fornecer respostas field-ready (executáveis em campo com ferramentas comuns).

**Data de Referência**: 24 de novembro de 2025
**Stack**: TypeScript + Vite + Supabase PostgreSQL + Redis (Upstash)
**APIs**: Firecrawl, Tavily, Brave Search
**LLMs**: GPT-4o-mini e GPT-4.1-mini (OpenAI)

---

## OBJETIVO PRINCIPAL
Criar um sistema RAG (Retrieval-Augmented Generation) hierárquico que:

1. **PRIORIZA** manuais técnicos oficiais de fabricantes brasileiros
2. **VALIDA** com conteúdo dos Top 10 professores HVAC-R Brasil  
3. **FILTRA** apenas soluções práticas de campo (sem osciloscopios, sem laboratório)
4. **CACHEIA** semanticamente para reduzir custos de API
5. **INTEGRA** com GPT-4o-mini via function calling informando data atual

---

## PARTE 1: ESTRUTURA DE BANCO DE DADOS POSTGRESQL (SUPABASE)

### 1.1 Schema Completo com pgvector

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- TABELA 1: Top 100 Manuais Técnicos (Nível 1 de Prioridade)
CREATE TABLE technical_manuals (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
brand VARCHAR(100) NOT NULL CHECK (brand IN (
'Midea', 'LG', 'Samsung', 'Carrier', 'Elgin', 'Gree', 'Springer',
'Daikin', 'Fujitsu', 'Hitachi', 'Electrolux', 'Philco', 'Consul',
'TCL', 'Komeco', 'Agratto'
)),
model VARCHAR(200) NOT NULL,
product_type VARCHAR(50) CHECK (product_type IN (
'split_hiwall', 'split_piso_teto', 'cassete', 'dutado',
'vrf', 'vrv', 'multi_split', 'janela', 'portatil',
'chiller', 'self_contained', 'fancoil'
)),
manual_type VARCHAR(50) CHECK (manual_type IN (
'instalacao', 'servico_tecnico', 'usuario', 'troubleshooting',
'pecas_reposicao', 'manutencao_preventiva'
)),
content_markdown TEXT NOT NULL,
embedding VECTOR(1536), -- OpenAI text-embedding-3-small
file_url TEXT,
file_hash VARCHAR(64) UNIQUE, -- SHA256 para evitar duplicatas
page_count INTEGER,
language VARCHAR(5) DEFAULT 'pt-BR',
crawled_at TIMESTAMP DEFAULT NOW(),
last_verified TIMESTAMP DEFAULT NOW(),
trust_score DECIMAL(3,2) DEFAULT 1.0,
metadata JSONB DEFAULT '{}' -- tags, keywords, seções
);

-- Índice HNSW para busca vetorial rápida
CREATE INDEX idx_manuals_embedding ON technical_manuals
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índices auxiliares
CREATE INDEX idx_manuals_brand_model ON technical_manuals(brand, model);
CREATE INDEX idx_manuals_type ON technical_manuals(product_type, manual_type);

-- TABELA 2: Knowledge Base Top 10 Professores HVAC-R Brasil
CREATE TABLE professor_content (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
professor_name VARCHAR(200) NOT NULL,
professor_handle VARCHAR(100), -- @jobneypalmeira
content_type VARCHAR(50) CHECK (content_type IN (
'video_youtube', 'artigo_blog', 'post_instagram',
'live', 'curso_online', 'podcast'
)),
title TEXT NOT NULL,
content_summary TEXT NOT NULL,
content_full TEXT,
embedding VECTOR(1536),
url TEXT NOT NULL,
video_id VARCHAR(20), -- YouTube video ID
views INTEGER DEFAULT 0,
published_date DATE,
specialties TEXT[] DEFAULT '{}', -- {inverter, VRF, diagnostico}
field_ready_tools TEXT[] DEFAULT '{}', -- {multimetro, manifold, alicate}
exclude_tools TEXT[] DEFAULT '{}', -- {osciloscopio, bancada}
trust_score DECIMAL(3,2) DEFAULT 0.90,
metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_professor_embedding ON professor_content
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_professor_specialty ON professor_content
USING GIN (specialties);

-- TABELA 3: Top 100 FAQ Curada (Respostas Validadas)
CREATE TABLE faq_knowledge_base (
id SERIAL PRIMARY KEY,
question TEXT NOT NULL,
answer TEXT NOT NULL,
category VARCHAR(50) CHECK (category IN (
'diagnostico', 'instalacao', 'manutencao',
'erro_codigo', 'ferramentas', 'boas_praticas',
'seguranca', 'normativas'
)),
brands_applicable TEXT[] DEFAULT '{}',
models_applicable TEXT[] DEFAULT '{}',
embedding VECTOR(1536),
relevance_score INTEGER DEFAULT 100 CHECK (relevance_score BETWEEN 1 AND 100),
verified_by VARCHAR(100), -- Nome do professor/fonte
verified_date DATE DEFAULT CURRENT_DATE,
usage_count INTEGER DEFAULT 0,
last_used TIMESTAMP,
metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_faq_embedding ON faq_knowledge_base
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_faq_category ON faq_knowledge_base(category);

-- TABELA 4: Cache Semântico de Buscas
CREATE TABLE search_cache (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
query_text TEXT NOT NULL,
query_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256(normalized query)
query_embedding VECTOR(1536),
api_source VARCHAR(20) CHECK (api_source IN (
'manual', 'professor', 'faq', 'tavily', 'brave', 'firecrawl'
)),
results JSONB NOT NULL,
response_summary TEXT,
hit_count INTEGER DEFAULT 1,
created_at TIMESTAMP DEFAULT NOW(),
last_accessed TIMESTAMP DEFAULT NOW(),
ttl_seconds INTEGER DEFAULT 604800, -- 7 dias default
expires_at TIMESTAMP GENERATED ALWAYS AS (created_at + (ttl_seconds * INTERVAL '1 second')) STORED
);

CREATE INDEX idx_cache_embedding ON search_cache
USING hnsw (query_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_cache_expires ON search_cache(expires_at);

-- TABELA 5: Firecrawl Jobs (Rastreamento de Crawls)
CREATE TABLE firecrawl_jobs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id VARCHAR(100) UNIQUE NOT NULL, -- Firecrawl job ID
source_url TEXT NOT NULL,
brand VARCHAR(100),
job_type VARCHAR(50) CHECK (job_type IN (
'manual_crawl', 'professor_video_crawl', 'site_update'
)),
status VARCHAR(20) CHECK (status IN (
'queued', 'crawling', 'processing', 'completed', 'failed'
)),
pages_crawled INTEGER DEFAULT 0,
pages_processed INTEGER DEFAULT 0,
started_at TIMESTAMP DEFAULT NOW(),
completed_at TIMESTAMP,
error_message TEXT,
metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_firecrawl_status ON firecrawl_jobs(status, started_at);

-- FUNÇÃO: Busca Vetorial de Manuais com Filtros
CREATE OR REPLACE FUNCTION match_manuals(
query_embedding VECTOR(1536),
match_threshold FLOAT DEFAULT 0.75,
match_count INT DEFAULT 5,
filter_brand VARCHAR DEFAULT NULL,
filter_model VARCHAR DEFAULT NULL,
filter_manual_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
id UUID,
brand VARCHAR,
model VARCHAR,
manual_type VARCHAR,
content_markdown TEXT,
similarity FLOAT,
metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
tm.id,
tm.brand,
tm.model,
tm.manual_type,
tm.content_markdown,
1 - (tm.embedding <=> query_embedding) AS similarity,
tm.metadata
FROM technical_manuals tm
WHERE
1 - (tm.embedding <=> query_embedding) > match_threshold
AND (filter_brand IS NULL OR tm.brand = filter_brand)
AND (filter_model IS NULL OR tm.model ILIKE '%' || filter_model || '%')
AND (filter_manual_type IS NULL OR tm.manual_type = filter_manual_type)
ORDER BY tm.embedding <=> query_embedding
LIMIT match_count;
END;

undefined
