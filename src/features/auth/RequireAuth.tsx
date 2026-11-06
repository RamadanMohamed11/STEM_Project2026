import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './authContext'
import { routePaths } from '@/app/paths'
import { AuthFeedback } from './components/AuthFeedback'

export function RequireAuth() {
  const { state } = useAuth()
  const location = useLocation()
  if (state.status === 'loading')
    return <AuthFeedback kind="loading">Checking your account…</AuthFeedback>
  if (state.status === 'unavailable' || state.status === 'error')
    return (
      <AuthFeedback kind="unavailable">
        {state.error ?? 'Account services are not configured yet.'}{' '}
        <Link to={routePaths.login}>Back to Login</Link>
      </AuthFeedback>
    )
  if (state.status !== 'authenticated')
    return <Navigate to={routePaths.login} state={{ returnTo: location.pathname }} replace />
  return <Outlet />
}
