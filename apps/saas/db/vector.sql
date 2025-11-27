-- Extensão pgvector
create extension if not exists vector;

-- Dispositivos HVAC-R
create table if not exists hvacr_devices (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  series text,
  manufacturer text,
  created_at timestamptz default now()
);

-- Manuais
create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references hvacr_devices(id) on delete cascade,
  title text not null,
  source text,
  pdf_url text,
  language text default 'pt-BR',
  created_at timestamptz default now()
);

-- Chunks com embeddings (text-embedding-3-small: 1536)
create table if not exists manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid references manuals(id) on delete cascade,
  page int,
  section text,
  content text not null,
  embedding vector(1536)
);

-- Índices
create index if not exists idx_manual_chunks_manual on manual_chunks(manual_id);
create index if not exists idx_manual_chunks_embedding on manual_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Códigos de alarme (opcional)
create table if not exists alarm_codes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references hvacr_devices(id) on delete cascade,
  code text not null,
  title text,
  severity int,
  resolution text,
  created_at timestamptz default now()
);

-- RPC: busca semântica
create or replace function match_manual_chunks(
  query_embedding vector(1536),
  filter_brand text,
  filter_model text,
  match_threshold float,
  match_count int
)
returns table (
  manual_id uuid,
  page int,
  section text,
  content text,
  similarity float
)
language sql stable as $$
  select mc.manual_id, mc.page, mc.section, mc.content,
         1 - (mc.embedding <=> query_embedding) as similarity
  from manual_chunks mc
  join manuals m on m.id = mc.manual_id
  left join hvacr_devices d on d.id = m.device_id
  where (filter_brand is null or d.brand = filter_brand)
    and (filter_model is null or d.model = filter_model)
    and (mc.embedding <#> query_embedding) <= (1 - match_threshold)
  order by mc.embedding <#> query_embedding asc
  limit match_count;
$$;

