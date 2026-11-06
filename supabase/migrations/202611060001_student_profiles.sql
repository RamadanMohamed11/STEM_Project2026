-- Dedicated student project only. Apply through the Supabase migration workflow.
-- Passwords and email identity remain exclusively in Supabase Auth.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  grade text not null check (grade in ('grade-secondary-1', 'grade-secondary-2', 'grade-secondary-3')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;
alter table public.student_profiles force row level security;
revoke all on public.student_profiles from public, anon, authenticated;
grant select on public.student_profiles to authenticated;
grant update (full_name, grade) on public.student_profiles to authenticated;

create policy student_profiles_read_own on public.student_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy student_profiles_update_own on public.student_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No student INSERT or DELETE privilege/policy. IDs and timestamps are not writable.

create function private.set_student_profile_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.set_student_profile_updated_at() from public, anon, authenticated;
create trigger student_profiles_updated_at before update on public.student_profiles
  for each row execute function private.set_student_profile_updated_at();

create function private.create_student_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.student_profiles(user_id, full_name, grade)
    values (new.id, pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), new.raw_user_meta_data ->> 'grade');
  return new;
end;
$$;
revoke all on function private.create_student_profile() from public, anon, authenticated;
create trigger student_profile_after_signup after insert on auth.users
  for each row execute function private.create_student_profile();
-- Invalid signup metadata fails the constraints and rolls back Auth signup atomically.
-- No metadata UPDATE trigger: self-editable Auth metadata never controls authorization
-- or overwrites an existing profile. No roles/admin flags are stored here.
