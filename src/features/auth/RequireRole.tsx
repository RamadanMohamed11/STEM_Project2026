import { Outlet, useLocation } from 'react-router'
import { ShieldAlert, Lock } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageContainer } from '@/components/layout/PageContainer'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { useAuth } from './authContext'
import { AuthFeedback } from './components/AuthFeedback'
import {
  canAccessAdminPortal,
  hasPermission,
  hasRole,
  type AppPermission,
  type AppRole,
} from './permissions'

export interface RequireRoleProps {
  allowedRoles: readonly AppRole[]
  requiredPermission?: AppPermission
}

/**
 * Frontend route boundary for role- and permission-restricted pages (T30).
 *
 * Note: Frontend route guards provide user experience boundaries only.
 * Database access control is enforced independently via PostgreSQL RLS and RPC checks.
 */
export function RequireRole({ allowedRoles, requiredPermission }: RequireRoleProps) {
  const { state } = useAuth()
  const location = useLocation()

  if (
    state.status === 'loading' ||
    (state.status === 'authenticated' && state.roleStatus === 'loading')
  ) {
    return <AuthFeedback kind="loading">Checking your permissions…</AuthFeedback>
  }

  // Anonymous, missing session, expired session, or unconfigured auth
  if (state.status !== 'authenticated') {
    return (
      <PageContainer>
        <div className="mx-auto max-w-xl py-10">
          <Card padding="lg" className="space-y-5" role="alert">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-amber-800 uppercase">
                  Access Denied
                </p>
                <h1 className="text-xl font-bold text-ink">You Do Not Have Permission</h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-ink-secondary">
              {state.error
                ? state.error
                : 'You must sign in with an authorized administrator account to access this area.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <ButtonLink
                to={routePaths.login}
                variant="primary"
                size="sm"
              >
                Sign In
              </ButtonLink>
              <ButtonLink to={routePaths.home} variant="secondary" size="sm">
                Back to Home
              </ButtonLink>
            </div>
          </Card>
        </div>
      </PageContainer>
    )
  }

  const roleAllowed = hasRole(state, allowedRoles)
  const permissionAllowed = requiredPermission
    ? hasPermission(state, requiredPermission)
    : true

  if (state.roleStatus !== 'verified' || !roleAllowed || !permissionAllowed) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-xl py-10" data-denied-path={location.pathname}>
          <Card padding="lg" className="space-y-5" role="alert">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-rose-800 uppercase">
                  Access Denied
                </p>
                <h1 className="text-xl font-bold text-ink">You Do Not Have Permission</h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-ink-secondary">
              {state.roleStatus === 'error'
                ? (state.roleError ??
                  'Your account permissions could not be verified. Please try again later.')
                : 'Your signed-in account does not have the required administrative role to view this page.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <ButtonLink to={routePaths.home} variant="primary" size="sm">
                Back to Home
              </ButtonLink>
            </div>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return <Outlet />
}

/**
 * Specialized route boundary for `/admin` requiring both the `'admin'` role
 * and the `'admin:access_portal'` permission.
 */
export function RequireAdmin() {
  const { state } = useAuth()
  if (
    state.status === 'authenticated' &&
    state.roleStatus === 'verified' &&
    !canAccessAdminPortal(state)
  ) {
    return <RequireRole allowedRoles={['admin']} requiredPermission="admin:access_portal" />
  }
  return <RequireRole allowedRoles={['admin']} requiredPermission="admin:access_portal" />
}
