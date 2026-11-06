import { useAuth } from './authContext'
import { useNavigate } from 'react-router'
import { useRef, useState, type FocusEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { routePaths } from '@/app/paths'
import type { LoginErrors, LoginValues } from './types'
import { validateLogin } from './validation'

function readValues(form: HTMLFormElement): LoginValues {
  const data = new FormData(form)
  return {
    email: String(data.get('email') ?? ''),
    password: String(data.get('password') ?? ''),
  }
}

const fieldClass =
  'mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink focus-visible:outline-teal aria-invalid:border-danger'

/**
 * Student Login Form.
 * Uses the central Supabase authentication service.
 * Does not create a fake logged-in state or redirect to protected pages.
 */
export function LoginForm() {
  const { auth, state } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [errors, setErrors] = useState<LoginErrors>({})
  const [visible, setVisible] = useState(false)

  const submitted = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current || pending || state.status === 'loading') return
    const form = event.currentTarget
    const nextErrors = validateLogin(readValues(form))
    setErrors(nextErrors)

    const firstInvalidKey = Object.keys(nextErrors)[0]
    if (firstInvalidKey) {
      const control = form.elements.namedItem(firstInvalidKey)
      if (control instanceof HTMLElement) control.focus()
      return
    }

    submitted.current = true
    setPending(true)
    setRequestError('')
    try {
      await auth.signIn(readValues(form))
      navigate(routePaths.safety, { replace: true })
    } catch {
      setRequestError(
        state.status === 'unavailable'
          ? 'Account services are not configured yet. Please try again later.'
          : 'Incorrect Email or Password. Please Try Again.',
      )
    } finally {
      submitted.current = false
      setPending(false)
      const password = form.elements.namedItem('password')
      if (password instanceof HTMLInputElement) password.value = ''
    }
  }

  function handleResetCheck() {
    submitted.current = false
    if (!pending) setRequestError('')
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={handleSubmit}
      aria-label="Student login"
      aria-describedby="login-notice"
      onChange={handleResetCheck}
      className="space-y-5"
    >
      <div
        id="login-notice"
        className="rounded-lg border border-line bg-teal-soft p-4 text-sm leading-relaxed text-ink"
      >
        <p className="font-semibold text-navy">
          {state.status === 'unavailable' ? 'Login is coming soon' : 'Welcome Back'}
        </p>
        <p className="mt-1 text-ink/80">
          {state.status === 'unavailable'
            ? 'Real student accounts are not active yet. Supabase is not configured. You can explore the safety guide and 3D lab without an account. No session will be created.'
            : 'Log in with your email and password. Public experiments are also available without an account.'}
        </p>
      </div>

      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-navy">
            Email <span className="font-normal text-slate">(required)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={fieldClass}
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              const form = event.currentTarget.form
              if (form) {
                const next = validateLogin(readValues(form))
                setErrors((prev) => ({ ...prev, email: next.email }))
              }
            }}
          />
          {errors.email && (
            <p id="email-error" className="mt-2 text-sm text-danger" aria-live="polite">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-navy">
              Password <span className="font-normal text-slate">(required)</span>
            </label>
            <Link
              to={routePaths.forgotPassword}
              className="inline-flex min-h-11 items-center text-xs font-semibold text-teal-dark hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`${fieldClass} pr-24`}
              onBlur={(event: FocusEvent<HTMLInputElement>) => {
                const form = event.currentTarget.form
                if (form) {
                  const next = validateLogin(readValues(form))
                  setErrors((prev) => ({ ...prev, password: next.password }))
                }
              }}
            />
            <button
              type="button"
              aria-controls="password"
              aria-pressed={visible}
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((value) => !value)}
              className="absolute right-1 top-3 min-h-10 rounded-md px-3 text-sm font-semibold text-teal-dark hover:bg-teal-soft"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
          </div>

          {errors.password && (
            <p id="password-error" className="mt-2 text-sm text-danger" aria-live="polite">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={pending || state.status === 'loading'}
          className="min-h-12 w-full rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-slate"
        >
          {pending ? 'Logging In…' : 'Log In'}
        </button>
      </fieldset>
      {requestError && (
        <p role="alert" className="text-sm text-danger">
          {requestError}
        </p>
      )}

      {/* Navigation links */}
      <p className="text-center text-sm text-ink/75">
        Don&apos;t have an account?{' '}
        <Link
          to={routePaths.signUp}
          className="inline-flex min-h-11 items-center font-semibold text-teal-dark hover:underline focus-visible:outline-2 focus-visible:outline-teal"
        >
          Create Account
        </Link>
      </p>

      <div className="flex justify-center border-t border-line pt-3">
        <Link
          to={routePaths.safety}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-dark hover:underline focus-visible:outline-2 focus-visible:outline-teal"
        >
          Review Safety
        </Link>
      </div>
    </form>
  )
}
