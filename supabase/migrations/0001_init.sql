create extension if not exists pgcrypto;

create type plan_type as enum ('FREE','TRIAL','PRO','EXPIRED');
create type message_role as enum ('user','model');
create type attachment_type as enum ('image','video','audio','document');
create type subscription_status as enum ('active','trialing','past_due','canceled','incomplete','incomplete_expired','paused','unpaid');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar text,
  plan plan_type not null default 'TRIAL',
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles(id, email, plan, created_at, updated_at)
  values (new.id, new.email, 'TRIAL', now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  price_id text,
  status subscription_status,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_subscriptions before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.update_user_plan_on_subscription() returns trigger as $$
begin
  if new.user_id is null then
    return new;
  end if;
  if new.status = 'active' then
    update public.profiles set plan = 'PRO', updated_at = now() where id = new.user_id;
  elsif new.status = 'trialing' then
    update public.profiles set plan = 'TRIAL', trial_start = coalesce(new.current_period_start, now()), trial_end = new.current_period_end, updated_at = now() where id = new.user_id;
  elsif new.status in ('canceled','past_due','unpaid','incomplete','incomplete_expired','paused') then
    update public.profiles set plan = 'EXPIRED', updated_at = now() where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_subscription_change on public.subscriptions;
create trigger on_subscription_change
after insert or update on public.subscriptions
for each row execute function public.update_user_plan_on_subscription();

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_chat_sessions before update on public.chat_sessions
for each row execute function public.set_updated_at();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role message_role not null,
  content text not null,
  grounding_urls jsonb,
  audio_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  type attachment_type not null,
  mime_type text,
  storage_path text,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.chat_sessions(id) on delete cascade,
  model text,
  input_tokens integer,
  output_tokens integer,
  total_cost numeric(10,4) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text,
  type text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx on public.chat_sessions(user_id);
create index if not exists messages_session_idx on public.messages(session_id);
create index if not exists attachments_message_idx on public.attachments(message_id);
create index if not exists customers_user_idx on public.customers(user_id);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_idx on public.subscriptions(stripe_subscription_id);

insert into storage.buckets(id, name, public)
values ('attachments','attachments', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.usage_logs enable row level security;
alter table public.webhook_events enable row level security;

create policy read_own_profile on public.profiles for select using (id = auth.uid());
create policy update_own_profile on public.profiles for update using (id = auth.uid());

create policy read_own_customer on public.customers for select using (user_id = auth.uid());

create policy read_own_subscriptions on public.subscriptions for select using (user_id = auth.uid());

create policy manage_own_sessions_select on public.chat_sessions for select using (user_id = auth.uid());
create policy manage_own_sessions_insert on public.chat_sessions for insert with check (user_id = auth.uid());
create policy manage_own_sessions_update on public.chat_sessions for update using (user_id = auth.uid());
create policy manage_own_sessions_delete on public.chat_sessions for delete using (user_id = auth.uid());

create policy manage_own_messages_select on public.messages for select using (
  exists(select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);
create policy manage_own_messages_insert on public.messages for insert with check (
  exists(select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);
create policy manage_own_messages_update on public.messages for update using (
  exists(select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);
create policy manage_own_messages_delete on public.messages for delete using (
  exists(select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);

create policy manage_own_attachments_select on public.attachments for select using (
  exists(
    select 1 from public.messages m join public.chat_sessions s on s.id = m.session_id
    where m.id = attachments.message_id and s.user_id = auth.uid()
  )
);
create policy manage_own_attachments_insert on public.attachments for insert with check (
  exists(
    select 1 from public.messages m join public.chat_sessions s on s.id = m.session_id
    where m.id = attachments.message_id and s.user_id = auth.uid()
  )
);
create policy manage_own_attachments_update on public.attachments for update using (
  exists(
    select 1 from public.messages m join public.chat_sessions s on s.id = m.session_id
    where m.id = attachments.message_id and s.user_id = auth.uid()
  )
);
create policy manage_own_attachments_delete on public.attachments for delete using (
  exists(
    select 1 from public.messages m join public.chat_sessions s on s.id = m.session_id
    where m.id = attachments.message_id and s.user_id = auth.uid()
  )
);

