-- Run ONLY on the approved database with TWO existing consenting
-- student accounts registered through the real Auth API after the migration.
-- psql "$DATABASE_URL" -v student_a=UUID_A -v student_b=UUID_B -f supabase/tests/student_profiles_rls.sql
-- DATABASE_URL is a server-side test secret. Never prefix it VITE_ or commit it.
\set ON_ERROR_STOP on
begin;
select set_config('test.student_a', :'student_a', true);
select set_config('test.student_b', :'student_b', true);
do $$
begin
  if current_setting('test.student_a') = current_setting('test.student_b') then raise exception 'Two different student accounts are required'; end if;
  if (select count(*) from public.student_profiles where user_id in (current_setting('test.student_a')::uuid, current_setting('test.student_b')::uuid)) <> 2 then raise exception 'Both real accounts must have trigger-created profiles'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.student_a'),'role','authenticated')::text,true);
do $$
declare affected integer;
begin
  if (select count(*) from public.student_profiles where user_id = current_setting('test.student_a')::uuid) <> 1 then raise exception 'Student A cannot read own profile'; end if;
  if exists(select 1 from public.student_profiles where user_id = current_setting('test.student_b')::uuid) then raise exception 'Student A can read B'; end if;
  update public.student_profiles set full_name = full_name, grade = 'grade-secondary-3' where user_id = current_setting('test.student_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Allowed own-profile update failed'; end if;
  if (select grade from public.student_profiles where user_id = current_setting('test.student_a')::uuid) <> 'grade-secondary-3' then raise exception 'Grade did not persist'; end if;
  update public.student_profiles set full_name = 'Not Allowed' where user_id = current_setting('test.student_b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-student update succeeded'; end if;
  begin
    update public.student_profiles set grade = 'unsupported-grade' where user_id = current_setting('test.student_a')::uuid;
    raise exception 'Invalid grade accepted';
  exception when check_violation then null;
  end;
  begin
    update public.student_profiles set user_id = current_setting('test.student_b')::uuid where user_id = current_setting('test.student_a')::uuid;
    raise exception 'Identity update allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.student_profiles set created_at = now() where user_id = current_setting('test.student_a')::uuid;
    raise exception 'Created timestamp update allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.student_profiles set updated_at = now() where user_id = current_setting('test.student_a')::uuid;
    raise exception 'Updated timestamp update allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.student_profiles where user_id = current_setting('test.student_a')::uuid;
    raise exception 'Student delete allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.student_profiles(user_id,full_name,grade) values(current_setting('test.student_b')::uuid,'Not Allowed','grade-secondary-1');
    raise exception 'Student insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.student_b'),'role','authenticated')::text,true);
do $$
begin
  if exists(select 1 from public.student_profiles where user_id = current_setting('test.student_a')::uuid) then raise exception 'Student B can read A'; end if;
  if (select count(*) from public.student_profiles where user_id = current_setting('test.student_b')::uuid) <> 1 then raise exception 'Student B cannot read own profile'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$
begin
  begin
    perform 1 from public.student_profiles;
    raise exception 'Anonymous access allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
\echo 'RLS checks passed; all test updates rolled back.'

