-- Task T30: Secure Admin Roles & Permissions Foundation
-- Depends on: 202611060001_student_profiles.sql (private schema and student_profiles table)
-- Non-destructive migration: preserves existing users, student_profiles, and RLS policies.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- 1. User Role Assignments Table
-- Stores the single authoritative application role per user.
-- Never trusts user-editable raw_user_meta_data for authorization.
create table if not exists public.user_role_assignments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  assigned_by uuid references auth.users(id) on delete set null,
  assignment_reason text not null default 'Default student role on registration'
    check (char_length(btrim(assignment_reason)) between 3 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_role_assignments_role
  on public.user_role_assignments(role);

-- 2. Role Permissions Matrix Table
-- Defines explicit least-privilege capabilities granted to each application role.
create table if not exists public.role_permissions (
  role text not null check (role in ('student', 'instructor', 'admin')),
  permission text not null check (
    permission in (
      'content:view',
      'account:manage_own',
      'experiments:execute',
      'progress:manage_own',
      'instructor:view_assigned_resources',
      'admin:access_portal',
      'admin:manage_content',
      'admin:view_audit_logs',
      'admin:assign_roles'
    )
  ),
  description text not null check (char_length(btrim(description)) between 5 and 240),
  created_at timestamptz not null default now(),
  primary key (role, permission)
);

insert into public.role_permissions (role, permission, description)
values
  -- Student permissions
  ('student', 'content:view', 'View permitted educational curriculum and experiment content'),
  ('student', 'account:manage_own', 'Access and update own private student profile'),
  ('student', 'experiments:execute', 'Use available interactive 3D chemistry experiments'),
  ('student', 'progress:manage_own', 'Access permitted personal learning and quiz records'),
  -- Instructor permissions (scoped; no unrestricted student record access)
  ('instructor', 'content:view', 'View permitted educational curriculum and experiment content'),
  ('instructor', 'account:manage_own', 'Access and update own account profile'),
  ('instructor', 'experiments:execute', 'Use available interactive 3D chemistry experiments'),
  ('instructor', 'progress:manage_own', 'Access permitted personal learning and quiz records'),
  ('instructor', 'instructor:view_assigned_resources', 'Access only explicitly assigned educational resources when enabled'),
  -- Administrator permissions (scoped to administrative governance and content management)
  ('admin', 'content:view', 'View permitted educational curriculum and experiment content'),
  ('admin', 'account:manage_own', 'Access and update own account profile'),
  ('admin', 'experiments:execute', 'Use available interactive 3D chemistry experiments'),
  ('admin', 'progress:manage_own', 'Access permitted personal learning and quiz records'),
  ('admin', 'admin:access_portal', 'Access the protected administrative portal boundary'),
  ('admin', 'admin:manage_content', 'Manage permitted educational curriculum and experiment metadata'),
  ('admin', 'admin:view_audit_logs', 'Inspect administrative role assignment audit logs'),
  ('admin', 'admin:assign_roles', 'Perform explicitly authorized role assignment operations')
on conflict (role, permission) do update
  set description = excluded.description;

-- 3. Administrative Role Audit Log Table
-- Protected administrative table recording all role changes.
create table if not exists public.admin_role_audit_log (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  previous_role text check (previous_role in ('student', 'instructor', 'admin')),
  new_role text not null check (new_role in ('student', 'instructor', 'admin')),
  changed_by uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 3 and 240),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_role_audit_log_target
  on public.admin_role_audit_log(target_user_id, created_at desc);

-- 4. Updated-at Trigger on user_role_assignments
create trigger user_role_assignments_updated_at
  before update on public.user_role_assignments
  for each row execute function private.set_student_profile_updated_at();

-- 5. Automatic Default Student Role Assignment on Registration
-- Ignores any role field in raw_user_meta_data so self-registration can never elevate privileges.
create or replace function private.assign_default_student_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_role_assignments (user_id, role, assigned_by, assignment_reason)
  values (new.id, 'student', null, 'Default student role on registration')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.assign_default_student_role() from public, anon, authenticated;

create trigger user_role_after_signup
  after insert on auth.users
  for each row execute function private.assign_default_student_role();

-- Backfill existing users safely with default 'student' role if missing
insert into public.user_role_assignments (user_id, role, assigned_by, assignment_reason)
select id, 'student', null, 'Backfilled default student role during T30 migration'
from auth.users
on conflict (user_id) do nothing;

-- 6. Authoritative Role & Permission Check Functions
create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ura.role
  from public.user_role_assignments as ura
  where ura.user_id = (select auth.uid())
$$;

revoke all on function public.get_current_user_role() from public, anon, authenticated;
grant execute on function public.get_current_user_role() to authenticated;

create or replace function public.has_permission(requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_role_assignments as ura
    inner join public.role_permissions as rp
      on rp.role = ura.role
    where ura.user_id = (select auth.uid())
      and rp.permission = requested_permission
  )
$$;

revoke all on function public.has_permission(text) from public, anon, authenticated;
grant execute on function public.has_permission(text) to authenticated;

-- 7. Trusted Role Assignment Procedures
-- 7a. Private bootstrap function: callable ONLY by database owner / migration / SQL console,
-- never exposed to public, anon, or authenticated PostgREST clients.
create or replace function private.bootstrap_assign_user_role(
  target_user uuid,
  new_role text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  prior_role text;
begin
  if target_user is null then
    raise exception 'Target user ID is required' using errcode = '22023';
  end if;
  if new_role not in ('student', 'instructor', 'admin') then
    raise exception 'Invalid application role: %', new_role using errcode = '22023';
  end if;
  if reason is null or pg_catalog.char_length(pg_catalog.btrim(reason)) not between 3 and 240 then
    raise exception 'A valid assignment reason (3-240 characters) is required' using errcode = '22023';
  end if;

  select role into prior_role
  from public.user_role_assignments
  where user_id = target_user
  for update;

  insert into public.user_role_assignments (user_id, role, assigned_by, assignment_reason)
  values (target_user, new_role, null, pg_catalog.btrim(reason))
  on conflict (user_id) do update
    set role = excluded.role,
        assigned_by = null,
        assignment_reason = excluded.assignment_reason;

  insert into public.admin_role_audit_log (target_user_id, previous_role, new_role, changed_by, reason)
  values (target_user, prior_role, new_role, null, pg_catalog.btrim(reason));
end;
$$;

revoke all on function private.bootstrap_assign_user_role(uuid, text, text) from public, anon, authenticated;

-- 7b. Audited administrative RPC: callable only by authenticated users who possess 'admin:assign_roles'.
create or replace function public.admin_assign_user_role(
  target_user uuid,
  new_role text,
  reason text
)
returns public.user_role_assignments
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  prior_role text;
  updated_row public.user_role_assignments;
begin
  if caller_id is null or not public.has_permission('admin:assign_roles') then
    raise exception 'Access denied: admin:assign_roles permission is required.'
      using errcode = '42501';
  end if;

  if target_user is null then
    raise exception 'Target user ID is required.'
      using errcode = '22023';
  end if;

  if new_role not in ('student', 'instructor', 'admin') then
    raise exception 'Invalid application role.'
      using errcode = '22023';
  end if;

  if reason is null or pg_catalog.char_length(pg_catalog.btrim(reason)) not between 3 and 240 then
    raise exception 'A valid assignment reason (3-240 characters) is required.'
      using errcode = '22023';
  end if;

  if target_user = caller_id and new_role <> 'admin' then
    raise exception 'Administrators cannot remove their own admin role.'
      using errcode = '42501';
  end if;

  select role into prior_role
  from public.user_role_assignments
  where user_id = target_user
  for update;

  if not found then
    raise exception 'Target user does not have a registered account.'
      using errcode = 'P0002';
  end if;

  update public.user_role_assignments
  set role = new_role,
      assigned_by = caller_id,
      assignment_reason = pg_catalog.btrim(reason)
  where user_id = target_user
  returning * into updated_row;

  insert into public.admin_role_audit_log (target_user_id, previous_role, new_role, changed_by, reason)
  values (target_user, prior_role, new_role, caller_id, pg_catalog.btrim(reason));

  return updated_row;
end;
$$;

revoke all on function public.admin_assign_user_role(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_assign_user_role(uuid, text, text) to authenticated;

-- 8. Row Level Security & Least-Privilege Table Grants
-- Deny by default; no direct INSERT, UPDATE, or DELETE grants to anon or authenticated.
alter table public.user_role_assignments enable row level security;
alter table public.user_role_assignments force row level security;
revoke all on public.user_role_assignments from public, anon, authenticated;
grant select on public.user_role_assignments to authenticated;

create policy user_role_assignments_read_own_or_admin
  on public.user_role_assignments
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.has_permission('admin:assign_roles'))
  );

alter table public.role_permissions enable row level security;
alter table public.role_permissions force row level security;
revoke all on public.role_permissions from public, anon, authenticated;
grant select on public.role_permissions to authenticated;

create policy role_permissions_read_own_or_admin
  on public.role_permissions
  for select
  to authenticated
  using (
    role = (select public.get_current_user_role())
    or (select public.has_permission('admin:access_portal'))
  );

alter table public.admin_role_audit_log enable row level security;
alter table public.admin_role_audit_log force row level security;
revoke all on public.admin_role_audit_log from public, anon, authenticated;
grant select on public.admin_role_audit_log to authenticated;

create policy admin_role_audit_log_read_admin
  on public.admin_role_audit_log
  for select
  to authenticated
  using ((select public.has_permission('admin:view_audit_logs')));
