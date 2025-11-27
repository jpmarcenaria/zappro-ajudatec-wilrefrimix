create extension if not exists pgcrypto;

create schema if not exists integration_test;

create table if not exists integration_test.test_table (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  text_field text,
  num_field int
);

alter table integration_test.test_table enable row level security;

drop policy if exists test_table_select on integration_test.test_table;
create policy test_table_select on integration_test.test_table for select using (auth.role() = 'authenticated' or auth.role() = 'service_role');

drop policy if exists test_table_write on integration_test.test_table;
create policy test_table_write on integration_test.test_table for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function integration_test.test_insert(p_text text, p_num int)
returns integration_test.test_table
language plpgsql security definer as $$
declare
  r integration_test.test_table;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  insert into integration_test.test_table(text_field, num_field)
  values (p_text, p_num)
  returning * into r;
  return r;
end;
$$;

create or replace function integration_test.test_select(p_id uuid default null, p_text text default null)
returns setof integration_test.test_table
language sql stable as $$
  select * from integration_test.test_table
  where (p_id is null or id = p_id)
    and (p_text is null or text_field = p_text);
$$;

create or replace function integration_test.test_update(p_id uuid, p_text text, p_num int)
returns integration_test.test_table
language plpgsql security definer as $$
declare r integration_test.test_table;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  update integration_test.test_table
  set text_field = p_text, num_field = p_num
  where id = p_id
  returning * into r;
  return r;
end;
$$;

create or replace function integration_test.test_delete(p_id uuid)
returns void
language plpgsql security definer as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  delete from integration_test.test_table where id = p_id;
end;
$$;

create or replace function integration_test.test_cleanup()
returns void
language plpgsql security definer as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  delete from integration_test.test_table;
end;
$$;

create or replace function integration_test.test_drop_table()
returns void
language plpgsql security definer as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden';
  end if;
  drop table if exists integration_test.test_table;
end;
$$;
