-- T45: AI tutor usage log for per-user rate limiting.
-- Only timestamps are stored; chat contents are never written to the database.

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx
  on public.ai_usage(user_id, created_at desc);

alter table public.ai_usage enable row level security;

-- Supabase default privileges grant ALL on new public tables; narrow them explicitly.
revoke all on public.ai_usage from anon, authenticated;
grant select, insert on public.ai_usage to authenticated;

drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own
  on public.ai_usage for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists ai_usage_insert_own on public.ai_usage;
create policy ai_usage_insert_own
  on public.ai_usage for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- No update/delete policies: students cannot erase their own usage to reset the limit.

-- Atomically checks the hourly window and records one request.
-- SECURITY INVOKER: runs with the caller's RLS, so it can only see and insert the caller's rows.
-- The transaction-scoped advisory lock serializes concurrent requests from the same user.
create or replace function public.consume_ai_tutor_quota(p_limit integer default 30)
returns table (allowed boolean, used integer, remaining integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_used integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_tutor_quota:' || v_user::text, 0));

  select count(*)::integer into v_used
  from public.ai_usage
  where user_id = v_user
    and created_at > now() - interval '1 hour';

  if v_used >= p_limit then
    return query select false, v_used, 0;
    return;
  end if;

  insert into public.ai_usage (user_id) values (v_user);
  return query select true, v_used + 1, p_limit - v_used - 1;
end;
$$;

revoke all on function public.consume_ai_tutor_quota(integer) from public, anon;
grant execute on function public.consume_ai_tutor_quota(integer) to authenticated;

comment on table public.ai_usage is
  'T45 AI tutor request timestamps for hourly rate limiting. No message content is stored.';
