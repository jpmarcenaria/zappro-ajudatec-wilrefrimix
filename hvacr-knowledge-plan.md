# Plano de Base Técnica HVAC‑R (Brasil) com Supabase/pgvector – 2025

## Objetivo

- Responder consultas técnicas como “manual consultado”: citar modelo, seção e procedimento, com passos verificáveis.
- Foco em inversores de frequência/tecnologia inverter em HVAC‑R comercializados no Brasil.
- Garantir estabilidade a longo prazo: dados versionados, cache, RAG robusto, auditoria e métricas.

## Referências do Código

- Agregador e busca web: `apps/saas/app/api/openai/chat/route.ts:213`
- FAQ vetorial/embeddings: `apps/saas/app/api/cron/crawl-faqs/route.ts:276`
- Deduplicação FAQs: `apps/saas/scripts/deduplicate-faq.mjs:55`
- Fake Auth (dev): `apps/saas/contexts/AuthContext.tsx:15`

## Arquitetura de Dados (Supabase)

- `hvacr_devices` (catálogo de aparelhos)
  - `id uuid pk`, `brand text`, `model text`, `variant text`, `market text default 'BR'`, `year int`, `refrigerant text`, `capacity_kw numeric`, `manual_url text`, `priority int default 5`, `created_at timestamptz`
  - Índices: `idx_devices_brand_model`, `idx_devices_priority`

- `device_manuals` (documentos originais)
  - `id uuid pk`, `device_id uuid fk hvacr_devices(id)`, `type text check in ('installation','service','user','spec')`, `source text`, `url text`, `sha256 text unique`, `lang text default 'pt-BR'`, `pages int`, `created_at timestamptz`
  - Índices: `idx_manuals_device`, `idx_manuals_sha`

- `manual_chunks` (RAG)
  - `id uuid pk`, `manual_id uuid fk device_manuals(id)`, `page int`, `section text`, `content text`, `metadata jsonb`, `embedding vector(1536)`, `created_at timestamptz`
  - Índices: `idx_chunks_manual`, `idx_chunks_section`, `idx_chunks_embedding using ivfflat (embedding vector_cosine_ops) with (lists=100)`

- `alarm_codes` (mapa normalizado de alarmes)
  - `id uuid pk`, `device_id uuid fk`, `code text`, `title text`, `severity int`, `resolution text`, `references jsonb`, `created_at timestamptz`
  - Índices: `idx_alarm_device_code`, `idx_alarm_severity`

- `web_search_cache`, `provider_usage_logs` (já criadas) – reuso para Perplexity/Tavily/Brave/Firecrawl.

## Políticas RLS

- `hvacr_devices`, `device_manuals`, `manual_chunks`, `alarm_codes`: RLS habilitado.
  - Leitura: `authenticated` pode `SELECT`.
  - Escrita: apenas `service_role`.

## Funções RPC

- `match_manual_chunks(query_embedding vector(1536), device_id uuid null, brand text null, model text null, match_threshold float default 0.72, match_count int default 8)` → retorna `chunk_id, manual_id, device_id, section, page, content, similarity` filtrando por aparelho quando fornecido.
- `upsert_device(brand text, model text, variant text, market text, manual_url text)` → cria/atualiza dispositivo.
- `ingest_manual(manual_url text, device_id uuid, type text)` → registra documento; ingestão de chunks é realizada por Edge Function/Worker (ver Pipeline).

## Pipeline de Ingestão (2025 – Boas Práticas)

- Coleta fontes oficiais (fabricantes, distribuidores BR, ABNT/ASTM quando aplicável).
- Conversão PDF → texto (OCR quando necessário), preservando cabeçalhos e numeração.
- Chunking híbrido:
  - Regras: por seção/cabeçalho; tamanho alvo 800–1200 tokens; overlap 120–160.
  - Tabelas e diagramas: converter para texto estruturado (CSV/Markdown) e anexar à seção.
- Embeddings: `text-embedding-3-small` (1536) ou `text-embedding-3-large` quando orçamento permitir; armazenar no `manual_chunks.embedding`.
- Metadados essenciais: `brand`, `model`, `type`, `page`, `section`, `rev/date`.
- Auditoria: salvar `sha256` do PDF e versão.
- Deduplicação: hash de conteúdo; script de merge (similar a `apps/saas/scripts/deduplicate-faq.mjs`).

## Resposta “Conforme Manual” (RAG)

- Passos:
  - 1) Reescrever consulta com contexto (Brasil, idioma pt‑BR, modelo se informado).
  - 2) Buscar cache web (Perplexity/Tavily) para links complementares, com pesos BR.
  - 3) Gerar embedding da pergunta.
  - 4) `match_manual_chunks` com filtros de `brand/model` quando presentes.
  - 5) Compor resposta com passos enumerados, EPI/segurança, citações: `fabricante (manual type, seção, página)`, + links.
  - 6) Incluir “verificação cruzada” com 1–2 fontes (cache web) se manual não for claro.

## SQL Cirúrgico (migração)

```sql
create table if not exists public.hvacr_devices (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  variant text,
  market text default 'BR',
  year int,
  refrigerant text,
  capacity_kw numeric,
  manual_url text,
  priority int default 5,
  created_at timestamptz default now()
);
create index if not exists idx_devices_brand_model on public.hvacr_devices(brand, model);
create index if not exists idx_devices_priority on public.hvacr_devices(priority);

create table if not exists public.device_manuals (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.hvacr_devices(id) on delete cascade,
  type text not null check (type in ('installation','service','user','spec')),
  source text,
  url text,
  sha256 text unique,
  lang text default 'pt-BR',
  pages int,
  created_at timestamptz default now()
);
create index if not exists idx_manuals_device on public.device_manuals(device_id);
create index if not exists idx_manuals_sha on public.device_manuals(sha256);

create table if not exists public.manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references public.device_manuals(id) on delete cascade,
  page int,
  section text,
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);
create index if not exists idx_chunks_manual on public.manual_chunks(manual_id);
create index if not exists idx_chunks_section on public.manual_chunks(section);
create index if not exists idx_chunks_embedding on public.manual_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.alarm_codes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.hvacr_devices(id) on delete cascade,
  code text not null,
  title text,
  severity int,
  resolution text,
  references jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_alarm_device_code on public.alarm_codes(device_id, code);
create index if not exists idx_alarm_severity on public.alarm_codes(severity);

alter table public.hvacr_devices enable row level security;
alter table public.device_manuals enable row level security;
alter table public.manual_chunks enable row level security;
alter table public.alarm_codes enable row level security;

create policy if not exists hvacr_devices_read on public.hvacr_devices for select to authenticated using (true);
create policy if not exists device_manuals_read on public.device_manuals for select to authenticated using (true);
create policy if not exists manual_chunks_read on public.manual_chunks for select to authenticated using (true);
create policy if not exists alarm_codes_read on public.alarm_codes for select to authenticated using (true);

create policy if not exists hvacr_devices_write_sr on public.hvacr_devices for all to service_role using (true) with check (true);
create policy if not exists device_manuals_write_sr on public.device_manuals for all to service_role using (true) with check (true);
create policy if not exists manual_chunks_write_sr on public.manual_chunks for all to service_role using (true) with check (true);
create policy if not exists alarm_codes_write_sr on public.alarm_codes for all to service_role using (true) with check (true);

create or replace function public.match_manual_chunks(
  query_embedding vector(1536),
  device_id uuid default null,
  brand text default null,
  model text default null,
  match_threshold float default 0.72,
  match_count int default 8
) returns table (
  chunk_id uuid,
  manual_id uuid,
  device_id uuid,
  section text,
  page int,
  content text,
  similarity float
) language plpgsql as $$
begin
  return query
  select c.id, c.manual_id, m.device_id, c.section, c.page, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.manual_chunks c
  join public.device_manuals m on m.id = c.manual_id
  join public.hvacr_devices d on d.id = m.device_id
  where (device_id is null or d.id = device_id)
    and (brand is null or lower(d.brand) = lower(brand))
    and (model is null or lower(d.model) = lower(model))
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end; $$;
```

## Ingestão dos Top 50 aparelhos (Brasil)

- Seleção inicial por mercado BR (volume de vendas, incidência de alarmes).
- Para cada aparelho: cadastrar em `hvacr_devices`, anexar manuais em `device_manuals`, executar OCR/extração e chunking → `manual_chunks`.
- Guardar referências (links oficiais, revisões, data da publicação).

## Resposta e Citação

- Prompt RAG:
  - “Responder em português técnico. Sempre citar fabricante, tipo de manual, seção e página. Listar passos com EPI/segurança. Incluir referências cruzadas se houver.”
- Saída com `source` contendo `{brand, model, manual_type, section, page, url}`.

## Validação & Métricas

- Smoke diário: sanity de RPC e top‑k de `match_manual_chunks`.
- Métricas: acerto por código de erro, tempo de resposta, presença de citação.
- Auditoria: `provider_usage_logs`, contagem de chunks, versões por `sha256`.

## Roadmap

- M1: criar tabelas, RPCs, ingestão piloto (5 aparelhos), ajustar prompt e peso de Brasil.
- M2: completar Top 50, adicionar alarmes normalizados, enriquecer com vídeos oficiais.
- M3: avaliação contínua, cache avançado, fallback Perplexity/Tavily, documentação de operação.

