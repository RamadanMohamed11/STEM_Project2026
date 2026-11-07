/**
 * Application role and permission model (T30).
 *
 * SECURITY BOUNDARY NOTE:
 * Frontend role and permission checks control UI presentation and route navigation only.
 * Authoritative access control is enforced at the PostgreSQL database layer via
 * Row Level Security (RLS), table privilege grants, and SECURITY DEFINER functions.
 */

export type AppRole = 'student' | 'instructor' | 'admin'

export const APP_ROLES: readonly AppRole[] = ['student', 'instructor', 'admin'] as const

export const DEFAULT_APP_ROLE: AppRole = 'student'

export type AppPermission =
  | 'content:view'
  | 'account:manage_own'
  | 'experiments:execute'
  | 'progress:manage_own'
  | 'instructor:view_assigned_resources'
  | 'admin:access_portal'
  | 'admin:manage_content'
  | 'admin:view_audit_logs'
  | 'admin:assign_roles'

export const ROLE_PERMISSIONS_MATRIX: Readonly<Record<AppRole, readonly AppPermission[]>> = {
  student: [
    'content:view',
    'account:manage_own',
    'experiments:execute',
    'progress:manage_own',
  ],
  instructor: [
    'content:view',
    'account:manage_own',
    'experiments:execute',
    'progress:manage_own',
    'instructor:view_assigned_resources',
  ],
  admin: [
    'content:view',
    'account:manage_own',
    'experiments:execute',
    'progress:manage_own',
    'admin:access_portal',
    'admin:manage_content',
    'admin:view_audit_logs',
    'admin:assign_roles',
  ],
} as const

export type RoleVerificationStatus = 'idle' | 'loading' | 'verified' | 'error'

export interface RoleAwareSnapshotFields {
  status: 'unavailable' | 'loading' | 'anonymous' | 'authenticated' | 'error'
  role?: AppRole | null
  roleStatus?: RoleVerificationStatus
  permissions?: readonly AppPermission[]
}

export function isValidAppRole(value: unknown): value is AppRole {
  return value === 'student' || value === 'instructor' || value === 'admin'
}

export function getPermissionsForRole(role: AppRole | null | undefined): readonly AppPermission[] {
  if (!role || !isValidAppRole(role)) return []
  return ROLE_PERMISSIONS_MATRIX[role]
}

/**
 * Verifies whether the current authenticated session has one of the expected roles.
 * Fails closed (`false`) if the session is not authenticated or role verification has not completed.
 */
export function hasRole(
  snapshot: RoleAwareSnapshotFields | null | undefined,
  expected: AppRole | readonly AppRole[],
): boolean {
  if (!snapshot || snapshot.status !== 'authenticated') return false
  if (snapshot.roleStatus && snapshot.roleStatus !== 'verified') return false
  if (!isValidAppRole(snapshot.role)) return false
  const allowed = Array.isArray(expected) ? expected : [expected]
  return allowed.includes(snapshot.role)
}

/**
 * Verifies whether the current authenticated session holds a specific permission.
 * Fails closed (`false`) if the session is not authenticated or role verification failed.
 */
export function hasPermission(
  snapshot: RoleAwareSnapshotFields | null | undefined,
  permission: AppPermission,
): boolean {
  if (!snapshot || snapshot.status !== 'authenticated') return false
  if (snapshot.roleStatus && snapshot.roleStatus !== 'verified') return false
  if (!isValidAppRole(snapshot.role)) return false
  const expectedForRole = ROLE_PERMISSIONS_MATRIX[snapshot.role]
  if (!expectedForRole.includes(permission)) return false
  if (Array.isArray(snapshot.permissions)) {
    return snapshot.permissions.includes(permission)
  }
  return true
}

/**
 * Determines whether the authenticated user is authorized to enter the `/admin` portal boundary.
 */
export function canAccessAdminPortal(
  snapshot: RoleAwareSnapshotFields | null | undefined,
): boolean {
  return hasRole(snapshot, 'admin') && hasPermission(snapshot, 'admin:access_portal')
}
