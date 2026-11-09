import { useAuth } from '@/features/auth/authContext'
import { useNavigate } from 'react-router'
import { useRef, useState, type FormEvent, type FocusEvent } from 'react'
import { Link } from 'react-router'
import { routePaths } from '@/app/paths'
import { sampleGrades } from '@/features/curriculum/data/sampleCurriculum'
import {
  validateRegistration,
  type RegistrationValues,
  type RegistrationErrors,
} from './validation'

function readValues(form: HTMLFormElement): RegistrationValues {
  const data = new FormData(form)
  return {
    fullName: String(data.get('fullName') ?? ''),
    email: String(data.get('email') ?? ''),
    password: String(data.get('password') ?? ''),
    grade: String(data.get('grade') ?? ''),
  }
}

const fieldClass =
  'mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink focus-visible:outline-teal aria-invalid:border-danger'

/** Validated registration through the central Supabase authentication service. */
export function RegistrationForm() {
  const { auth, state } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)
  const submitted = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitted.current || pending || state.status === 'loading') return
    const form = event.currentTarget
    const next = validateRegistration(readValues(form), sampleGrades)
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
      const result = await auth.register(readValues(form))
      setChecked(true)
      if (result === 'authenticated') navigate(routePaths.safety, { replace: true })
      else
        setMessage(
          'Check Your Email. If registration is available for this email, follow the confirmation link before logging in.',
        )
    } catch {
      submitted.current = false
      setRequestError(
        state.status === 'unavailable'
          ? 'Account services are not configured yet. Please try again later.'
          : 'We could not create your account. Please check your details or try again later.',
      )
    } finally {
      setPending(false)
      const password = form.elements.namedItem('password')
      if (password instanceof HTMLInputElement) password.value = ''
    }
  }

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={submit}
      aria-label="Student registration"
      aria-describedby="registration-notice"
      onChange={() => {
        if (pending) return
        submitted.current = false
        setChecked(false)
        setMessage('')
        setRequestError('')
      }}
      className="space-y-5"
    >
      <p
        id="registration-notice"
        className="rounded-lg border border-line bg-teal-soft p-4 text-sm leading-relaxed text-ink"
      >
        {state.status === 'unavailable'
          ? 'Account creation is coming soon. You cannot create an account yet. Supabase is not configured. No account will be created.'
          : 'Create your student account to start learning.'}
      </p>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {(['fullName', 'email', 'password', 'grade'] as const).map((name) => {
          const label = {
            fullName: 'Full Name',
            email: 'Email',
            password: 'Password',
            grade: 'Grade',
          }[name]
          const error = errors[name]
          const describedBy =
            [name === 'password' ? 'password-help' : '', error ? `${name}-error` : '']
              .filter(Boolean)
              .join(' ') || undefined
          const common = {
            id: name,
            name,
            required: true,
            'aria-invalid': Boolean(error),
            'aria-describedby': describedBy,
            className: fieldClass,
            onBlur: (event: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
              const form = event.currentTarget.form
              if (form) {
                const next = validateRegistration(readValues(form), sampleGrades)
                setErrors((previous) => ({ ...previous, [name]: next[name] }))
              }
            },
          }
          return (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-semibold text-navy">
                {label} <span className="font-normal text-slate">(required)</span>
              </label>
              {name === 'grade' ? (
                <select {...common} defaultValue="">
                  <option value="">Choose your grade</option>
                  {sampleGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={name === 'password' ? 'relative' : undefined}>
                  <input
                    {...common}
                    type={
                      name === 'password'
                        ? visible
                          ? 'text'
                          : 'password'
                        : name === 'email'
                          ? 'email'
                          : 'text'
                    }
                    autoComplete={
                      name === 'password' ? 'new-password' : name === 'email' ? 'email' : 'name'
                    }
                    autoCapitalize={name === 'fullName' ? 'words' : 'none'}
                    spellCheck={name === 'fullName'}
                    className={`${fieldClass} ${name === 'password' ? 'pr-24' : ''}`}
                  />
                  {name === 'password' && (
                    <button
                      type="button"
                      aria-controls="password"
                      aria-pressed={visible}
                      aria-label={visible ? 'Hide password' : 'Show password'}
                      onClick={() => setVisible((value) => !value)}
                      className="absolute right-1 top-2.5 min-h-11 rounded-md px-3 text-sm font-semibold text-teal-dark hover:bg-teal-soft"
                    >
                      {visible ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              )}
              {name === 'password' && (
                <p id="password-help" className="mt-2 text-xs text-slate">
                  Use 8 to 128 characters. Avoid passwords you use elsewhere.
                </p>
              )}
              {error && (
                <p id={`${name}-error`} className="mt-2 text-sm text-danger" aria-live="polite">
                  {error}
                </p>
              )}
            </div>
          )
        })}
        <button
          type="submit"
          disabled={pending || checked || state.status === 'loading'}
          className="min-h-12 w-full rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-slate"
        >
          {pending ? 'Creating Account…' : 'Create Account'}
        </button>
      </fieldset>
      {requestError && (
        <p role="alert" className="text-sm text-danger">
          {requestError}
        </p>
      )}
      <p role="status" className="text-sm leading-relaxed text-ink/80">
        {message}
      </p>
      <p className="text-center text-sm text-ink/75">
        Already have an account?{' '}
        <Link
          to={routePaths.login}
          className="inline-flex min-h-11 items-center px-1.5 font-semibold text-teal-dark hover:underline"
        >
          Log In
        </Link>
      </p>
      <Link
        to={routePaths.safety}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-dark hover:underline"
      >
        Review Safety
      </Link>
    </form>
  )
}
