import { useAuth } from '@/features/auth/authContext'
import { AuthFeedback } from '@/features/auth/components/AuthFeedback'
import { Link } from 'react-router'
import { routePaths } from '@/app/paths'
import { Card } from '@/components/ui/Card'
import { ProfileForm } from '@/features/profile/ProfileForm'
import { getOwnStudentProfile } from '@/features/profile/profile'
import { usePageTitle } from '@/hooks/usePageTitle'

export function StudentProfilePage() {
  usePageTitle('Your Profile')
  const { state } = useAuth()
  const profile = getOwnStudentProfile(state)
  return (
    <section className="mx-auto w-full max-w-2xl animate-fade-in-up">
      <h1 className="text-3xl font-semibold text-navy">Your Profile</h1>
      <p className="mt-3 text-slate">Keep your name and grade up to date.</p>
      <Card className="mt-6 min-w-0" padding="lg">
        {profile ? (
          <>
            <ProfileForm key={profile.user_id} profile={profile} />
            <section
              aria-labelledby="account-information"
              className="mt-8 border-t border-line pt-6"
            >
              <h2 id="account-information" className="text-lg font-semibold text-navy">
                Account Information
              </h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-semibold text-navy">Email</dt>
                  <dd className="mt-1 break-all text-ink">
                    {state.user?.email ?? 'Email is not available.'}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-slate">
                Email changes are not available here yet. Any future change will need email
                verification.
              </p>
            </section>
          </>
        ) : (
          <AuthFeedback
            kind={
              state.status === 'loading' ||
              (state.status === 'authenticated' && !state.profileError && !state.profile)
                ? 'loading'
                : 'unavailable'
            }
          >
            {state.status === 'loading' ||
            (state.status === 'authenticated' && !state.profileError && !state.profile)
              ? 'Loading your profile…'
              : (state.profileError ??
                state.error ??
                'Your profile is not available. Please log in to view your details.')}
            {state.status !== 'loading' && state.status !== 'authenticated' && (
              <Link to={routePaths.login} className="ml-1 font-semibold underline">
                Log In
              </Link>
            )}
          </AuthFeedback>
        )}
      </Card>
    </section>
  )
}
