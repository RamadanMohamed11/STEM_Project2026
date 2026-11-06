import { useAuth } from './authContext'
import { recoveryRequestAcceptedMessage } from './recovery'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { routePaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { AuthFeedback, AuthFieldError } from './components/AuthFeedback'
import { PasswordField, authInputClass } from './components/PasswordField'
import {
  validateRecovery,
  type RecoveryMode,
  type RecoveryAvailability,
  type RecoveryErrors,
  type RecoveryValues,
} from './recovery'

function values(form: HTMLFormElement): RecoveryValues {
  const data = new FormData(form)
  return {
    email: String(data.get('email') ?? ''),
    newPassword: String(data.get('newPassword') ?? ''),
    confirmPassword: String(data.get('confirmPassword') ?? ''),
  }
}

/** Provider-backed operations, with validation and honest unconfigured fallback. */
export function RecoveryForm({
  mode,
  availability,
}: {
  mode: RecoveryMode
  availability?: RecoveryAvailability
}) {
  const { auth, state } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const unavailable = availability === 'unavailable' || state.status === 'unavailable'
  const [errors, setErrors] = useState<RecoveryErrors>({})
  const [checked, setChecked] = useState(false)
  const submitted = useRef(false)
  const busy = pending || availability === 'checking' || state.status === 'loading'
  const fields =
    mode === 'forgot' ? (['email'] as const) : (['newPassword', 'confirmPassword'] as const)
  const notice =
    mode === 'forgot'
      ? 'Password recovery is not available in this prototype. No reset email will be sent.'
      : 'Password reset is not available in this prototype. No password will be changed. A future recovery service must verify your access first.'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current || busy) return
    const form = event.currentTarget
    const next = validateRecovery(mode, values(form))
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) {
      const control = form.elements.namedItem(first)
      if (control instanceof HTMLElement) control.focus()
      return
    }
    submitted.current = true
    setPending(true)
    setMessage('')
    setRequestError('')
    try {
      const input = values(form)
      if (mode === 'forgot') {
        await auth.requestPasswordReset(input.email)
        setMessage(recoveryRequestAcceptedMessage)
      } else {
        const result = await auth.changePassword(input.newPassword, input.confirmPassword)
        setMessage(
          result.signedOut
            ? 'Your password was changed. Please log in with your new password.'
            : 'Your password was changed. Please log out before continuing.',
        )
      }
      setChecked(true)
    } catch {
      submitted.current = false
      setRequestError(
        unavailable
          ? 'Recovery is not configured yet. Please try again later.'
          : mode === 'reset' && !state.recoveryReady
            ? 'Open a new password recovery link from your email.'
            : 'The recovery request could not be completed. Please try again later.',
      )
    } finally {
      setPending(false)
      for (const name of ['newPassword', 'confirmPassword']) {
        const input = form.elements.namedItem(name)
        if (input instanceof HTMLInputElement) input.value = ''
      }
    }
  }
  return (
    <form
      noValidate
      aria-label={mode === 'forgot' ? 'Password recovery' : 'Password reset'}
      aria-describedby="recovery-notice"
      aria-busy={busy}
      onSubmit={submit}
      onChange={() => {
        if (pending) return
        submitted.current = false
        setChecked(false)
        setMessage('')
        setRequestError('')
      }}
      className="space-y-5"
    >
      <AuthFeedback id="recovery-notice" kind={unavailable ? 'unavailable' : 'info'}>
        {unavailable
          ? notice
          : mode === 'forgot'
            ? 'Enter your email to request recovery instructions.'
            : state.recoveryReady
              ? 'Choose your new password.'
              : 'Open a recovery link from your email before changing your password.'}
      </AuthFeedback>
      {busy && <AuthFeedback kind="loading">Checking recovery access…</AuthFeedback>}
      {availability === 'error' && (
        <AuthFeedback kind="error">
          The recovery service is unavailable. Please try again later.
        </AuthFeedback>
      )}
      <fieldset disabled={busy} className="min-w-0 space-y-5">
        <legend className="sr-only">
          {mode === 'forgot' ? 'Your email' : 'Your new password'}
        </legend>
        {fields.map((field) => {
          const description =
            [
              field === 'newPassword' ? 'new-password-help' : '',
              errors[field] ? `${field}-error` : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined
          return (
            <div key={field}>
              {field === 'email' ? (
                <>
                  <label htmlFor="recovery-email" className="block text-sm font-semibold text-navy">
                    Email <span className="font-normal text-slate">(required)</span>
                  </label>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={description}
                    className={authInputClass}
                  />
                </>
              ) : (
                <PasswordField
                  id={field}
                  name={field}
                  label={field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  required
                  aria-invalid={Boolean(errors[field])}
                  aria-describedby={description}
                />
              )}
              {field === 'newPassword' && (
                <p id="new-password-help" className="mt-2 text-xs text-slate">
                  Use 8 to 128 characters.
                </p>
              )}
              <AuthFieldError id={`${field}-error`} message={errors[field]} />
            </div>
          )
        })}
        <Button
          type="submit"
          fullWidth
          disabled={busy || checked || (!unavailable && mode === 'reset' && !state.recoveryReady)}
        >
          {busy ? 'Please wait…' : 'Reset Password'}
        </Button>
      </fieldset>
      {requestError && <AuthFeedback kind="error">{requestError}</AuthFeedback>}
      {message && <AuthFeedback kind="success">{message}</AuthFeedback>}
      <Link
        to={routePaths.login}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-dark hover:underline"
      >
        Back to Login
      </Link>
    </form>
  )
}
