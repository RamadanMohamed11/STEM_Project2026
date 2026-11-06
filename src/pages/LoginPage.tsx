import { LoginForm } from '@/features/auth/LoginForm'
import { usePageTitle } from '@/hooks/usePageTitle'

export function LoginPage() {
  usePageTitle('Login')

  return (
    <section className="mx-auto max-w-xl">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
        STEM Virtual Lab · Login
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Welcome Back
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink/75">
        Log in to continue your chemistry experiments and track your learning progress.
      </p>
      <div className="mt-7 rounded-xl border border-line bg-white p-5 shadow-card sm:p-8">
        <LoginForm />
      </div>
    </section>
  )
}
