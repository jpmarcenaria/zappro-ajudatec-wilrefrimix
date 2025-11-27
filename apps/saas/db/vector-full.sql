create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists hvacr_devices (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  series text,
  manufacturer text,
  created_at timestamptz default now(),
  unique (manufacturer, brand, model)
);

create index if not exists hvacr_devices_brand_idx on hvacr_devices(brand);
create index if not exists hvacr_devices_model_idx on hvacr_devices(model);

create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references hvacr_devices(id) on delete cascade,
  title text not null,
  source text,
  pdf_url text,
  language text default 'pt-BR',
  created_at timestamptz default now(),
  unique (device_id, title)
);

create index if not exists manuals_device_idx on manuals(device_id);

create table if not exists manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references manuals(id) on delete cascade,
  page int,
  section text,
  content text not null,
  content_sha256 text not null,
  embedding vector(1536),
  created_at timestamptz default now(),
  unique (manual_id, page, content_sha256)
);

create index if not exists manual_chunks_manual_idx on manual_chunks(manual_id);
create index if not exists manual_chunks_embedding_idx on manual_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists alarm_codes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references hvacr_devices(id) on delete cascade,
  code text not null,
  title text,
  severity int,
  resolution text,
  created_at timestamptz default now(),
  unique (device_id, code)
);

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

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz default now()
);

create table if not exists billing_products (
  id uuid primary key default gen_random_uuid(),
  stripe_product_id text unique not null,
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists billing_prices (
  id uuid primary key default gen_random_uuid(),
  stripe_price_id text unique not null,
  product_id uuid references billing_products(id) on delete cascade,
  unit_amount integer not null,
  currency text not null default 'brl',
  interval text,
  interval_count int,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references billing_customers(id) on delete cascade,
  stripe_subscription_id text unique not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists billing_subscriptions_user_idx on billing_subscriptions(user_id);

create table if not exists trial_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  daily_messages_used int default 0,
  last_reset_at timestamptz default now(),
  trial_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles for each row execute function set_updated_at();

drop trigger if exists billing_subscriptions_set_updated_at on billing_subscriptions;
create trigger billing_subscriptions_set_updated_at before update on billing_subscriptions for each row execute function set_updated_at();

drop trigger if exists trial_limits_set_updated_at on trial_limits;
create trigger trial_limits_set_updated_at before update on trial_limits for each row execute function set_updated_at();

alter table hvacr_devices enable row level security;
alter table manuals enable row level security;
alter table manual_chunks enable row level security;
alter table alarm_codes enable row level security;
alter table profiles enable row level security;
alter table billing_customers enable row level security;
alter table billing_products enable row level security;
alter table billing_prices enable row level security;
alter table billing_subscriptions enable row level security;
alter table trial_limits enable row level security;

create table if not exists remarketing_contacts (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  source text,
  tags jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists remarketing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

drop policy if exists hvacr_devices_select on hvacr_devices;
create policy hvacr_devices_select on hvacr_devices for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
drop policy if exists hvacr_devices_write on hvacr_devices;
create policy hvacr_devices_write on hvacr_devices for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists manuals_select on manuals;
create policy manuals_select on manuals for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
drop policy if exists manuals_write on manuals;
create policy manuals_write on manuals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists manual_chunks_select on manual_chunks;
create policy manual_chunks_select on manual_chunks for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
drop policy if exists manual_chunks_write on manual_chunks;
create policy manual_chunks_write on manual_chunks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists alarm_codes_select on alarm_codes;
create policy alarm_codes_select on alarm_codes for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
drop policy if exists alarm_codes_write on alarm_codes;
create policy alarm_codes_write on alarm_codes for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles for select using (auth.uid() = id or auth.role() = 'service_role');
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_service_insert on profiles;
create policy profiles_service_insert on profiles for insert using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists billing_customers_self_select on billing_customers;
create policy billing_customers_self_select on billing_customers for select using (auth.uid() = user_id or auth.role() = 'service_role');
drop policy if exists billing_customers_service_write on billing_customers;
create policy billing_customers_service_write on billing_customers for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists billing_products_select on billing_products;
create policy billing_products_select on billing_products for select using (true);
drop policy if exists billing_products_service_write on billing_products;
create policy billing_products_service_write on billing_products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists billing_prices_select on billing_prices;
create policy billing_prices_select on billing_prices for select using (true);
drop policy if exists billing_prices_service_write on billing_prices;
create policy billing_prices_service_write on billing_prices for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists billing_subscriptions_self_select on billing_subscriptions;
create policy billing_subscriptions_self_select on billing_subscriptions for select using (auth.uid() = user_id or auth.role() = 'service_role');
drop policy if exists billing_subscriptions_service_write on billing_subscriptions;
create policy billing_subscriptions_service_write on billing_subscriptions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists trial_limits_self_select on trial_limits;
create policy trial_limits_self_select on trial_limits for select using (auth.uid() = user_id or auth.role() = 'service_role');
drop policy if exists trial_limits_service_write on trial_limits;
create policy trial_limits_service_write on trial_limits for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table remarketing_contacts enable row level security;
alter table remarketing_events enable row level security;

drop policy if exists remarketing_contacts_select on remarketing_contacts;
create policy remarketing_contacts_select on remarketing_contacts for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');
drop policy if exists remarketing_contacts_service_write on remarketing_contacts;
create policy remarketing_contacts_service_write on remarketing_contacts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists remarketing_events_select on remarketing_events;
create policy remarketing_events_select on remarketing_events for select using (auth.uid() = user_id or auth.role() = 'service_role');
drop policy if exists remarketing_events_service_write on remarketing_events;
create policy remarketing_events_service_write on remarketing_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
