import { Navigate } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { AuthFeedback } from '@/features/auth/components/AuthFeedback'
import { routePaths } from '@/app/paths'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AuthCallbackPage() {
  usePageTitle('Confirm Your Email')
  const { state } = useAuth()
  if (state.status === 'authenticated') return <Navigate to={routePaths.safety} replace />
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="mb-5 text-3xl font-semibold text-navy">Confirm Your Email</h1>
      <AuthFeedback kind={state.status === 'loading' ? 'loading' : 'error'}>
        {state.status === 'loading'
          ? 'Checking your email confirmation…'
          : 'This confirmation link could not be verified. Please log in or request a new confirmation email.'}
      </AuthFeedback>
    </section>
  )
}
