-- Run on the configured PostgreSQL database with existing test accounts:
-- psql "$DATABASE_URL" -v student_id=UUID_STUDENT -v instructor_id=UUID_INSTRUCTOR -v admin_id=UUID_ADMIN -f supabase/tests/user_roles_rls.sql
-- DATABASE_URL is a server-side secret. Never prefix it VITE_ or commit it.
\set ON_ERROR_STOP on
begin;

select set_config('test.u_student', :'student_id', true);
select set_config('test.u_instructor', :'instructor_id', true);
select set_config('test.u_admin', :'admin_id', true);

do $$
begin
  perform private.bootstrap_assign_user_role(
    current_setting('test.u_admin')::uuid,
    'admin',
    'CLI RLS verification admin bootstrap'
  );
end $$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.u_student'), 'role', 'authenticated')::text,
  true
);

do $$
begin
  if public.get_current_user_role() <> 'student' then
    raise exception 'Expected student role for student_id';
  end if;
  if public.has_permission('admin:access_portal') then
    raise exception 'Student unexpectedly granted admin:access_portal';
  end if;
  if exists (select 1 from public.admin_role_audit_log) then
    raise exception 'Student was able to read admin_role_audit_log';
  end if;

  begin
    perform public.admin_assign_user_role(
      current_setting('test.u_student')::uuid,
      'admin',
      'Unauthorized student role elevation'
    );
    raise exception 'Student call to admin_assign_user_role succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.u_admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  assigned public.user_role_assignments;
begin
  if public.get_current_user_role() <> 'admin' then
    raise exception 'Expected admin role for admin_id';
  end if;
  assigned := public.admin_assign_user_role(
    current_setting('test.u_instructor')::uuid,
    'instructor',
    'Verified instructor role assignment'
  );
  if assigned.role <> 'instructor' then
    raise exception 'Admin role assignment failed';
  end if;
end $$;

reset role;
rollback;
\echo 'T30 RBAC & RLS checks passed; all test changes rolled back.'
