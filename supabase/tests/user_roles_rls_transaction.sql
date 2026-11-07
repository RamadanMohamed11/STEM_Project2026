-- Authorized T30 production RLS & RBAC security verification probe.
-- Uses temporary transaction-scoped identities with separate roles (student, instructor, admin, anon).
-- All temporary rows and role changes are rolled back at the end of the transaction.
begin;

do $$
declare
  u_student uuid := gen_random_uuid();
  u_instructor uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
begin
  perform set_config('test.u_student', u_student::text, true);
  perform set_config('test.u_instructor', u_instructor::text, true);
  perform set_config('test.u_admin', u_admin::text, true);

  -- Insert three users; student attempts to forge role='admin' in raw_user_meta_data
  insert into auth.users (id, raw_user_meta_data)
  values
    (u_student, '{"full_name":"STEM T30 Student","grade":"grade-secondary-1","role":"admin","is_admin":true}'::jsonb),
    (u_instructor, '{"full_name":"STEM T30 Instructor","grade":"grade-secondary-2"}'::jsonb),
    (u_admin, '{"full_name":"STEM T30 Admin","grade":"grade-secondary-3"}'::jsonb);

  -- Verify all three users received 'student' by default (forged metadata was ignored)
  if (select role from public.user_role_assignments where user_id = u_student) <> 'student' then
    raise exception 'Forged signup metadata granted non-student role';
  end if;
  if (select role from public.user_role_assignments where user_id = u_instructor) <> 'student' then
    raise exception 'Instructor test identity did not start as student';
  end if;
  if (select role from public.user_role_assignments where user_id = u_admin) <> 'student' then
    raise exception 'Admin test identity did not start as student';
  end if;

  -- Bootstrap the initial administrator through the privileged private procedure
  perform private.bootstrap_assign_user_role(u_admin, 'admin', 'Authorized T30 initial admin bootstrap');
end $$;

-- ============================================================================
-- 1. Test as Student Identity (authenticated)
-- ============================================================================
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.u_student'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  affected integer;
begin
  -- Verify student role and permission checks
  if public.get_current_user_role() <> 'student' then
    raise exception 'Expected student role for u_student';
  end if;
  if not public.has_permission('experiments:execute') then
    raise exception 'Student missing experiments:execute permission';
  end if;
  if public.has_permission('admin:access_portal') or public.has_permission('admin:assign_roles') then
    raise exception 'Student unexpectedly granted admin permission';
  end if;

  -- Student can read own role assignment, but cannot read other users' role assignments
  if (select count(*) from public.user_role_assignments where user_id = current_setting('test.u_student')::uuid) <> 1 then
    raise exception 'Student cannot read own role assignment';
  end if;
  if exists (select 1 from public.user_role_assignments where user_id = current_setting('test.u_admin')::uuid) then
    raise exception 'Student can read another user role assignment';
  end if;

  -- Student cannot access admin-only audit log rows
  if exists (select 1 from public.admin_role_audit_log) then
    raise exception 'Student was able to read admin_role_audit_log';
  end if;

  -- Student cannot assign themselves admin via direct UPDATE or INSERT or DELETE
  begin
    update public.user_role_assignments
    set role = 'admin'
    where user_id = current_setting('test.u_student')::uuid;
    raise exception 'Direct role UPDATE by student succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.user_role_assignments (user_id, role, assignment_reason)
    values (current_setting('test.u_student')::uuid, 'admin', 'Self elevation attempt');
    raise exception 'Direct role INSERT by student succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.user_role_assignments
    where user_id = current_setting('test.u_student')::uuid;
    raise exception 'Direct role DELETE by student succeeded';
  exception when insufficient_privilege then null;
  end;

  -- Student cannot invoke public.admin_assign_user_role
  begin
    perform public.admin_assign_user_role(
      current_setting('test.u_student')::uuid,
      'admin',
      'Unauthorized student RPC attempt'
    );
    raise exception 'Student call to admin_assign_user_role succeeded';
  exception when insufficient_privilege then null;
  end;

  -- Student cannot invoke private.bootstrap_assign_user_role
  begin
    perform private.bootstrap_assign_user_role(
      current_setting('test.u_student')::uuid,
      'admin',
      'Unauthorized private bootstrap attempt'
    );
    raise exception 'Student call to private.bootstrap_assign_user_role succeeded';
  exception when insufficient_privilege then null;
  end;

  -- Existing student_profiles RLS still works for Student
  if (select count(*) from public.student_profiles where user_id = current_setting('test.u_student')::uuid) <> 1 then
    raise exception 'Student cannot read own student_profile';
  end if;
  if exists (select 1 from public.student_profiles where user_id = current_setting('test.u_instructor')::uuid) then
    raise exception 'Student can read another student_profile';
  end if;
  update public.student_profiles
  set full_name = 'STEM T30 Student Updated', grade = 'grade-secondary-2'
  where user_id = current_setting('test.u_student')::uuid;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'Student own profile update failed';
  end if;
end $$;

-- ============================================================================
-- 2. Test as Valid Administrator Identity (authenticated)
-- ============================================================================
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.u_admin'), 'role', 'authenticated')::text,
  true
);

do $$
declare
  promoted public.user_role_assignments;
begin
  if public.get_current_user_role() <> 'admin' then
    raise exception 'Expected admin role for u_admin';
  end if;
  if not public.has_permission('admin:access_portal') or not public.has_permission('admin:assign_roles') then
    raise exception 'Admin missing expected administrative permissions';
  end if;

  -- Admin can perform explicitly permitted operation: promote u_instructor to 'instructor'
  promoted := public.admin_assign_user_role(
    current_setting('test.u_instructor')::uuid,
    'instructor',
    'Approved chemistry instructor assignment'
  );
  if promoted.role <> 'instructor' or promoted.assigned_by <> current_setting('test.u_admin')::uuid then
    raise exception 'Admin role assignment did not persist expected fields';
  end if;

  -- Admin cannot remove their own admin role
  begin
    perform public.admin_assign_user_role(
      current_setting('test.u_admin')::uuid,
      'student',
      'Accidental self-demotion'
    );
    raise exception 'Admin self-demotion was allowed';
  exception when insufficient_privilege then null;
  end;

  -- Admin can read audit logs for the role changes
  if (select count(*) from public.admin_role_audit_log where target_user_id = current_setting('test.u_instructor')::uuid) <> 1 then
    raise exception 'Admin cannot read expected audit log entry';
  end if;

  -- Even an admin cannot directly UPDATE user_role_assignments bypassing the audited RPC
  begin
    update public.user_role_assignments
    set role = 'admin'
    where user_id = current_setting('test.u_student')::uuid;
    raise exception 'Direct table UPDATE bypassing RPC succeeded for admin';
  exception when insufficient_privilege then null;
  end;

  -- Admin does NOT have unrestricted access to private student_profiles of other users
  if exists (select 1 from public.student_profiles where user_id = current_setting('test.u_student')::uuid) then
    raise exception 'Admin was granted unrestricted read access to private student_profiles';
  end if;
end $$;

-- ============================================================================
-- 3. Verify Role Change Reflected for Promoted Instructor Identity
-- ============================================================================
select set_config(
  'request.jwt.claims',
  json_build_object('sub', current_setting('test.u_instructor'), 'role', 'authenticated')::text,
  true
);

do $$
begin
  if public.get_current_user_role() <> 'instructor' then
    raise exception 'Promoted instructor role not reflected after session switch';
  end if;
  if not public.has_permission('instructor:view_assigned_resources') then
    raise exception 'Instructor missing instructor:view_assigned_resources permission';
  end if;
  if public.has_permission('admin:access_portal') or public.has_permission('admin:assign_roles') then
    raise exception 'Instructor unexpectedly granted admin permissions';
  end if;
  -- Instructor has no unrestricted access to student profiles or admin audit logs
  if exists (select 1 from public.student_profiles where user_id = current_setting('test.u_student')::uuid) then
    raise exception 'Instructor was able to read unassigned student profile';
  end if;
  if exists (select 1 from public.admin_role_audit_log) then
    raise exception 'Instructor was able to read admin_role_audit_log';
  end if;
end $$;

-- ============================================================================
-- 4. Test as Anonymous Identity (anon)
-- ============================================================================
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  begin
    perform 1 from public.user_role_assignments;
    raise exception 'Anonymous select on user_role_assignments allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.role_permissions;
    raise exception 'Anonymous select on role_permissions allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.admin_role_audit_log;
    raise exception 'Anonymous select on admin_role_audit_log allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.get_current_user_role();
    raise exception 'Anonymous execute on get_current_user_role allowed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.has_permission('admin:access_portal');
    raise exception 'Anonymous execute on has_permission allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
rollback;

select 'passed' as t30_rbac_rls_security_checks;
