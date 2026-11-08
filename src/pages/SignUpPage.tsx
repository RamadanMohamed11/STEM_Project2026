import { RegistrationForm } from '@/features/registration/RegistrationForm'
import { usePageTitle } from '@/hooks/usePageTitle'

export function SignUpPage() {
  usePageTitle('Sign Up')
  return (
    <section className="mx-auto max-w-xl animate-fade-in-up">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
        STEM Virtual Lab · Sign Up
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Welcome to your science lab
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink/75">
        Get ready to explore chemistry, try experiments, and learn at your own pace.
      </p>
      <div className="mt-7 rounded-xl border border-line bg-white p-5 shadow-card sm:p-8">
        <RegistrationForm />
      </div>
    </section>
  )
}
