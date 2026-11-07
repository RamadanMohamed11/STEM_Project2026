# Admin Roles & Permissions Foundation (T30)

## 1. Role & Permission Architecture

The STEM Virtual Lab enforces a least-privilege Role-Based Access Control (RBAC) architecture across three application roles:

| Role | Default on Signup | Granted Permissions | Restrictions |
| :--- | :--- | :--- | :--- |
| `student` | Yes | `content:view`, `account:manage_own`, `experiments:execute`, `progress:manage_own` | Cannot access `/admin`, cannot view other users' profiles or roles, cannot modify roles. |
| `instructor` | No | All `student` permissions + `instructor:view_assigned_resources` | Scoped to explicitly assigned educational resources when enabled; no unrestricted access to student profiles or `/admin`. |
| `admin` | No | All `student` permissions + `admin:access_portal`, `admin:manage_content`, `admin:view_audit_logs`, `admin:assign_roles` | Scoped to administrative governance and content management; does **not** grant unrestricted read/write access to private `student_profiles` rows. |

---

## 2. Database Schema & Migration (`202611070002_user_roles_and_permissions.sql`)

**Migration Dependency:** Requires `202611060001_student_profiles.sql` (`private` schema and `private.set_student_profile_updated_at()` trigger function).

### Tables Created
1. **`public.user_role_assignments`**
   - `user_id uuid primary key references auth.users(id) on delete cascade`
   - `role text not null default 'student' check (role in ('student', 'instructor', 'admin'))`
   - `assigned_by uuid references auth.users(id) on delete set null`
   - `assignment_reason text not null check (char_length(btrim(assignment_reason)) between 3 and 240)`
   - `created_at timestamptz`, `updated_at timestamptz`
   - Index: `idx_user_role_assignments_role` on `(role)`
2. **`public.role_permissions`**
   - Read-only database reference mapping `(role, permission)` with descriptions.
3. **`public.admin_role_audit_log`**
   - Immutable audit trail recording `target_user_id`, `previous_role`, `new_role`, `changed_by`, `reason`, and `created_at`.
   - Index: `idx_admin_role_audit_log_target` on `(target_user_id, created_at desc)`

---

## 3. Row Level Security (RLS) & Least-Privilege Grants

All tables enforce `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` with default-deny grants:

- **`public.user_role_assignments`**
  - `REVOKE ALL FROM public, anon, authenticated`
  - `GRANT SELECT TO authenticated` (no `INSERT`, `UPDATE`, or `DELETE` grants to any client role)
  - Policy `user_role_assignments_read_own_or_admin`: allows `SELECT` only when `(select auth.uid()) = user_id` or `(select public.has_permission('admin:assign_roles'))`.
- **`public.role_permissions`**
  - `REVOKE ALL FROM public, anon, authenticated`
  - `GRANT SELECT TO authenticated`
  - Policy `role_permissions_read_own_or_admin`: allows `SELECT` for the caller's own role or users with `admin:access_portal`.
- **`public.admin_role_audit_log`**
  - `REVOKE ALL FROM public, anon, authenticated`
  - `GRANT SELECT TO authenticated`
  - Policy `admin_role_audit_log_read_admin`: allows `SELECT` only when `(select public.has_permission('admin:view_audit_logs'))` is true.

---

## 4. Secure Role Assignment & Initial Admin Bootstrap

1. **Registration Protection:**
   - The `after insert on auth.users` trigger `user_role_after_signup` executes `private.assign_default_student_role()`, which unconditionally assigns `'student'` and ignores any `role` or `is_admin` properties in `raw_user_meta_data`.
2. **Initial Administrator Bootstrap (Database Console / Migration Only):**
   - `private.bootstrap_assign_user_role(target_user uuid, new_role text, reason text)` is defined in the `private` schema with `REVOKE ALL FROM public, anon, authenticated`.
   - It cannot be invoked over the public PostgREST API. A project owner can bootstrap the first administrator in the Supabase SQL Editor:
     ```sql
     select private.bootstrap_assign_user_role(
       '00000000-0000-0000-0000-000000000000'::uuid,
       'admin',
       'Initial system administrator bootstrap'
     );
     ```
3. **Subsequent Role Assignments (Audited Admin RPC):**
   - `public.admin_assign_user_role(target_user uuid, new_role text, reason text)` verifies `public.has_permission('admin:assign_roles')`, blocks self-demotion, updates `public.user_role_assignments`, and appends an audit record to `public.admin_role_audit_log`.
   - Never hardcodes administrator emails and never exposes Supabase `service_role` or secret keys to the React client.
