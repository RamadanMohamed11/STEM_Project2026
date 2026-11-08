-- Task T45 Transactional Verification: AI tutor usage RLS and hourly quota.
-- Executes inside a transaction and rolls back so data remains clean.
-- Requires migration 202611080002_ai_tutor_usage.sql.
-- All privileged setup happens first: once the role is switched to `authenticated`
-- it cannot switch back.

begin;

do $$
declare
  v_a uuid := '00000000-0000-4000-8000-000000000451';
  v_b uuid := '00000000-0000-4000-8000-000000000452';
  v_c uuid := '00000000-0000-4000-8000-000000000453';
  v_row record;
  v_count integer;
  v_failed boolean;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         u.email, 'pw', now(), '{"provider":"email"}'::jsonb, '{}'::jsonb, now(), now()
  from (values (v_a, 't45.a@test.local'), (v_b, 't45.b@test.local'), (v_c, 't45.c@test.local'))
    as u(id, email);

  -- Student C used the full quota more than an hour ago.
  insert into public.ai_usage (user_id, created_at)
  select v_c, now() - interval '61 minutes' from generate_series(1, 3);

  -- Privileges: anon has none; authenticated has select/insert only.
  if has_function_privilege('anon', 'public.consume_ai_tutor_quota(integer)', 'execute') then
    raise exception 'anon must not execute consume_ai_tutor_quota';
  end if;
  if has_table_privilege('anon', 'public.ai_usage', 'select') then
    raise exception 'anon must not read ai_usage';
  end if;
  if has_table_privilege('authenticated', 'public.ai_usage', 'update')
     or has_table_privilege('authenticated', 'public.ai_usage', 'delete') then
    raise exception 'authenticated must not update or delete ai_usage';
  end if;

  -- Student A (limit 3 keeps the test short).
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('role', 'authenticated', true);

  for i in 1..3 loop
    select * into v_row from public.consume_ai_tutor_quota(3);
    if not v_row.allowed or v_row.used <> i or v_row.remaining <> 3 - i then
      raise exception 'Request % should be allowed (used %, remaining %)', i, v_row.used, v_row.remaining;
    end if;
  end loop;

  select * into v_row from public.consume_ai_tutor_quota(3);
  if v_row.allowed or v_row.remaining <> 0 then
    raise exception '4th request with limit 3 must be denied';
  end if;

  select count(*) into v_count from public.ai_usage;
  if v_count <> 3 then
    raise exception 'Student A must see exactly own 3 rows (denied request not recorded), got %', v_count;
  end if;

  -- Students cannot reset their quota.
  v_failed := false;
  begin
    delete from public.ai_usage;
  exception when insufficient_privilege then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Students must not delete usage rows'; end if;

  -- Students cannot write rows for someone else.
  v_failed := false;
  begin
    insert into public.ai_usage (user_id) values (v_b);
  exception when insufficient_privilege then
    v_failed := true;
  end;
  if not v_failed then raise exception 'Inserting usage for another user must fail'; end if;

  -- Student B sees none of A's rows and has an independent quota.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_b::text, true);
  select count(*) into v_count from public.ai_usage;
  if v_count <> 0 then raise exception 'Student B must not see student A usage'; end if;
  select * into v_row from public.consume_ai_tutor_quota(3);
  if not v_row.allowed or v_row.used <> 1 then raise exception 'Student B quota is independent'; end if;

  -- Student C's old rows are outside the one-hour window.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_c::text, true);
  select * into v_row from public.consume_ai_tutor_quota(3);
  if not v_row.allowed or v_row.used <> 1 then raise exception 'Window must slide after one hour'; end if;

  raise notice 'T45 ai_usage RLS and quota checks passed';
end;
$$;

rollback;
