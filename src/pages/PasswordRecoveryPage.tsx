import { RecoveryForm } from '@/features/auth/RecoveryForm'
import type { RecoveryMode } from '@/features/auth/recovery'
import { usePageTitle } from '@/hooks/usePageTitle'

export function PasswordRecoveryPage({ mode }: { mode: RecoveryMode }) {
  const title = mode === 'forgot' ? 'Forgot Your Password?' : 'Reset Your Password'
  usePageTitle(title)
  return (
    <section className="mx-auto max-w-xl animate-fade-in-up">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">
        STEM Virtual Lab · Account Recovery
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-ink/75">
        {mode === 'forgot'
          ? 'Enter your email to check the recovery form.'
          : 'Choose a new password and enter it again to check that it matches.'}
      </p>
      <div className="mt-7 rounded-xl border border-line bg-white p-5 shadow-card sm:p-8">
        <RecoveryForm key={mode} mode={mode} />
      </div>
    </section>
  )
}
