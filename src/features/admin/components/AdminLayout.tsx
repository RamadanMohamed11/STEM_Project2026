import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FlaskConical, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { routePaths } from '@/app/paths'
import { PageContainer } from '@/components/layout/PageContainer'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { RequireAdmin } from '@/features/auth/RequireRole'
import { useAuth } from '@/features/auth/authContext'
import { canAccessAdminPortal } from '@/features/auth/permissions'
import { getActiveAdminNavItem, getAdminBreadcrumbs } from '../config/adminNavigation'
import { AdminNavigationList } from './AdminNavigationList'

export function AdminLayout() {
  const { auth, state } = useAuth()
  const { pathname } = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const activeNavItem = getActiveAdminNavItem(pathname)
  const breadcrumbs = getAdminBreadcrumbs(pathname)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (mobileMenuOpen && !dialog.open) {
      dialog.showModal()
      closeButtonRef.current?.focus()
    }
    if (!mobileMenuOpen && dialog.open) {
      dialog.close()
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  // Defense-in-depth: if AdminLayout is ever rendered directly without RequireAdmin,
  // enforce the exact same role and permission boundary.
  if (!canAccessAdminPortal(state)) {
    return <RequireAdmin />
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError(null)
    try {
      await auth.signOut()
    } catch {
      setSignOutError('We could not sign you out right now. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen min-w-0 bg-canvas text-ink md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-navy focus:fixed focus:start-4 focus:top-4 focus:not-sr-only"
      >
        Skip to main content
      </a>

      {/* Desktop Admin Sidebar */}
      <aside
        aria-label="Admin sidebar"
        className="sticky top-0 hidden h-dvh min-h-[540px] flex-col overflow-y-auto bg-navy px-4 py-7 text-white md:flex"
      >
        <Link
          to={routePaths.admin}
          aria-label="STEM Virtual Lab Admin Dashboard"
          className="flex min-h-12 items-center gap-3 rounded-xl px-2 focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-teal text-white shadow-sm">
            <FlaskConical size={20} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold tracking-tight">STEM Virtual Lab</span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-teal-light uppercase">
              Admin Workspace
            </span>
          </span>
        </Link>

        <div className="mt-8 px-3 text-[10px] font-bold tracking-[0.18em] text-white/50 uppercase">
          Management
        </div>
        <div className="mt-3">
          <AdminNavigationList variant="sidebar" />
        </div>

        <div className="mt-auto space-y-2 border-t border-white/15 pt-5">
          <div className="rounded-xl border border-white/12 bg-white/5 px-3.5 py-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-teal-light" aria-hidden="true" />
              <span>Authorized Admin</span>
            </div>
            <p className="mt-1 truncate text-white/70">
              {state.user?.email ?? state.user?.id ?? 'Verified Administrator'}
            </p>
          </div>

          <Link
            to={routePaths.home}
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>

          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{signingOut ? 'Signing Out…' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Responsive Admin Header */}
        <header
          aria-label="Admin header"
          className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm"
        >
          <div className="mx-auto flex min-h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open admin navigation"
                aria-controls="admin-mobile-navigation"
                aria-expanded={mobileMenuOpen}
                className="-ms-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 md:hidden"
              >
                <Menu size={22} aria-hidden="true" />
              </button>

              <div className="min-w-0">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="hidden text-xs font-medium text-ink-secondary lg:inline">
                {activeNavItem.eyebrow}
              </span>
              <StatusPill tone="ready" dot>
                Role: {state.role ?? 'admin'}
              </StatusPill>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{signingOut ? 'Signing Out…' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <PageContainer>
            {signOutError && (
              <div className="pt-6">
                <Card
                  padding="sm"
                  className="border-rose-200 bg-rose-50 text-sm text-rose-900"
                  role="alert"
                >
                  {signOutError}
                </Card>
              </div>
            )}
            <Outlet />
          </PageContainer>
        </main>
      </div>

      {/* Mobile Navigation Drawer */}
      <dialog
        ref={dialogRef}
        id="admin-mobile-navigation"
        aria-label="Admin mobile navigation"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMobileMenuOpen(false)
        }}
        className="ms-auto me-0 h-dvh max-h-dvh w-[min(21rem,calc(100vw-2rem))] max-w-none border-0 bg-navy p-0 text-white shadow-elevated backdrop:bg-navy/65 md:hidden"
      >
        <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-teal text-white">
                <FlaskConical size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold">STEM Virtual Lab</p>
                <p className="text-[10px] font-semibold tracking-wider text-teal-light uppercase">
                  Admin Workspace
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close admin navigation"
              className="inline-flex size-11 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-teal-light focus-visible:outline-offset-2"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <p className="mt-8 mb-3 px-3 text-[11px] font-semibold tracking-[0.16em] text-white/55 uppercase">
            Management
          </p>
          <AdminNavigationList
            variant="drawer"
            onNavigate={() => setMobileMenuOpen(false)}
          />

          <div className="mt-auto space-y-2 border-t border-white/15 pt-5">
            <Link
              to={routePaths.home}
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
            <button
              type="button"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{signingOut ? 'Signing Out…' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
