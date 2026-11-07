import { useState } from 'react'
import { NavLink } from 'react-router'
import { useAuth } from './authContext'
import { canAccessAdminPortal } from './permissions'
import { routePaths } from '@/app/paths'

export function AuthAccountControl() {
  const { auth, state } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state.status !== 'authenticated') return null
  const showAdminLink = canAccessAdminPortal(state)
  return (
    <div className="mt-4 space-y-2 border-t border-white/15 pt-3 text-sm text-white">
      {showAdminLink && (
        <NavLink
          to={routePaths.admin}
          className={({ isActive }) =>
            `flex min-h-11 items-center justify-center rounded-lg hover:bg-white/10 ${isActive ? 'bg-white/14 font-semibold' : ''}`
          }
        >
          Admin
        </NavLink>
      )}
      <NavLink
        to={routePaths.profile}
        className={({ isActive }) =>
          `flex min-h-11 items-center justify-center rounded-lg hover:bg-white/10 ${isActive ? 'bg-white/14 font-semibold' : ''}`
        }
      >
        Your Profile
      </NavLink>
      <button
        type="button"
        disabled={busy}
        className="min-h-11 w-full rounded-lg hover:bg-white/10 disabled:opacity-50"
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
        {busy ? 'Logging Out…' : 'Log Out'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
