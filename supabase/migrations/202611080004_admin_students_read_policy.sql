-- T49: Admin Students Directory and Reports read policy.
-- Grants administrators with 'admin:access_portal' permission read access to all student profiles
-- for educational oversight, progress tracking, and academic reporting.
-- Students retain strictly self-scoped read and update access to their own profile.
-- No delete policies are granted: student profiles cannot be deleted from the admin UI.

drop policy if exists student_profiles_admin_select on public.student_profiles;

create policy student_profiles_admin_select on public.student_profiles
  for select
  to authenticated
  using ((select public.has_permission('admin:access_portal')));

comment on policy student_profiles_admin_select on public.student_profiles is
  'T49: Allows portal administrators to inspect the student directory and linked educational performance.';
