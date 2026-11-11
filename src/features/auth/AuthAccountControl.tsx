import { useState } from 'react'
import { NavLink } from 'react-router'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import { useAuth } from './authContext'
import { canAccessAdminPortal } from './permissions'
import { routePaths } from '@/app/paths'

export function AuthAccountControl({ isCollapsed }: { isCollapsed?: boolean }) {
  const { auth, state } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state.status !== 'authenticated') return null
  const showAdminLink = canAccessAdminPortal(state)
  return (
    <div className="mt-4 space-y-1.5 border-t border-white/15 pt-3 text-sm text-white">
      {showAdminLink && (
        <NavLink
          to={routePaths.admin}
          title={isCollapsed ? 'Admin' : undefined}
          aria-label={isCollapsed ? 'Admin' : undefined}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-lg transition-colors hover:bg-white/10 ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
            } ${isActive ? 'bg-white/14 font-semibold' : ''}`
          }
        >
          <ShieldCheck size={19} className="shrink-0 text-teal-light" aria-hidden="true" />
          <span className={isCollapsed ? 'sr-only' : 'truncate'}>Admin</span>
        </NavLink>
      )}
      <NavLink
        to={routePaths.profile}
        title={isCollapsed ? 'Your Profile' : undefined}
        aria-label={isCollapsed ? 'Your Profile' : undefined}
        className={({ isActive }) =>
          `flex min-h-11 items-center rounded-lg transition-colors hover:bg-white/10 ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
          } ${isActive ? 'bg-white/14 font-semibold' : ''}`
        }
      >
        <User size={19} className="shrink-0" aria-hidden="true" />
        <span className={isCollapsed ? 'sr-only' : 'truncate'}>Your Profile</span>
      </NavLink>
      <button
        type="button"
        disabled={busy}
        title={isCollapsed ? 'Log Out' : undefined}
        aria-label={isCollapsed ? 'Log Out' : undefined}
        className={`flex min-h-11 w-full items-center rounded-lg transition-colors hover:bg-white/10 disabled:opacity-50 ${
          isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
        }`}
        onClick={async () => {
          if (busy) return
          setBusy(true)
          setError('')
          try {
            await auth.signOut()
          } catch {
            setError('Please try logging out again.')
          } finally {
            setBusy(false)
          }
        }}
      >
        <LogOut size={19} className="shrink-0" aria-hidden="true" />
        <span className={isCollapsed ? 'sr-only' : 'truncate'}>
          {busy ? 'Logging Out…' : 'Log Out'}
        </span>
      </button>
      {error && <p role="alert" className="px-2 text-xs text-rose-300">{error}</p>}
    </div>
  )
}
