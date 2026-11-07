import { ShieldCheck } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { useAuth } from '@/features/auth/authContext'

/**
 * Minimal protected `/admin` entry page (T30).
 * Verifies role-based route protection and displays the verified role and permissions
 * without implementing full dashboard statistics or CRUD workflows (reserved for T31+).
 */
export function AdminFoundationPage() {
  const { state } = useAuth()

  return (
    <PageContainer>
      <div className="space-y-6 py-6 sm:py-8">
        <PageHeader
          eyebrow="Role-Based Authorization"
          title="Admin"
          description="Protected administrative foundation route. Future curriculum management and administrative tools will be mounted behind this verified boundary."
          action={
            <ButtonLink to={routePaths.home} variant="secondary" size="sm">
              Back to Home
            </ButtonLink>
          }
        />

        <Card padding="lg" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-teal">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">
                  Verified Administrator Session
                </h2>
                <p className="text-xs text-ink-secondary">
                  Account: {state.user?.email ?? state.user?.id ?? 'Verified Admin'}
                </p>
              </div>
            </div>
            <StatusPill tone="ready" dot>
              Role: {state.role ?? 'admin'}
            </StatusPill>
          </div>

          <p className="text-sm leading-relaxed text-ink-secondary">
            Your administrative role has been verified against the database role assignment policy.
            Administrative dashboard screens and curriculum management workflows are scheduled for
            upcoming releases.
          </p>

          <div className="rounded-xl border border-line bg-surface-muted/50 p-4">
            <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Granted Permissions
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-md border border-line bg-white px-2.5 py-1 font-mono text-xs font-medium text-ink"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
