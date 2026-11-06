import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { AuthFeedback, AuthFieldError } from '@/features/auth/components/AuthFeedback'
import { authInputClass } from '@/features/auth/components/PasswordField'
import { useAuth } from '@/features/auth/authContext'
import type { StudentProfile } from '@/features/auth/authService'
import { sampleGrades } from '@/features/curriculum/data/sampleCurriculum'
import { validateProfile, type ProfileErrors } from './profile'

export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const { auth } = useAuth()
  const [fullName, setFullName] = useState(profile.full_name)
  const [grade, setGrade] = useState(profile.grade)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null)
  const submitting = useRef(false)
  const changed = fullName.trim() !== profile.full_name || grade !== profile.grade

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const next = validateProfile({ fullName, grade })
    setErrors(next)
    setFeedback(null)
    const first = Object.keys(next)[0]
    if (first) {
      const control = event.currentTarget.elements.namedItem(first)
      if (control instanceof HTMLElement) control.focus()
      return
    }
    if (!changed) return
    submitting.current = true
    setPending(true)
    try {
      await auth.updateProfile(fullName, grade)
      setFullName(fullName.trim())
      setFeedback('success')
    } catch {
      setFeedback('error')
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  return (
    <form
      noValidate
      aria-label="Edit your profile"
      aria-busy={pending}
      onSubmit={submit}
      onChange={() => {
        setFeedback(null)
        setErrors({})
      }}
      className="space-y-5"
    >
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="mb-5 text-lg font-semibold text-navy">Your Details</legend>
        <div>
          <label htmlFor="profile-name" className="block text-sm font-semibold text-navy">
            Full Name
          </label>
          <input
            id="profile-name"
            name="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'profile-name-error' : undefined}
            className={authInputClass}
          />
          <AuthFieldError id="profile-name-error" message={errors.fullName} />
        </div>
        <div>
          <label htmlFor="profile-grade" className="block text-sm font-semibold text-navy">
            Current Grade
          </label>
          <select
            id="profile-grade"
            name="grade"
            required
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            aria-invalid={Boolean(errors.grade)}
            aria-describedby={errors.grade ? 'profile-grade-error' : 'profile-grade-help'}
            className={authInputClass}
          >
            {sampleGrades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <p id="profile-grade-help" className="mt-2 text-sm text-slate">
            Your grade is saved with your account.
          </p>
          <AuthFieldError id="profile-grade-error" message={errors.grade} />
        </div>
        <Button type="submit" disabled={pending || !changed} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Save Changes'}
        </Button>
      </fieldset>
      {pending && <AuthFeedback kind="loading">Saving your profile…</AuthFeedback>}
      {feedback && (
        <AuthFeedback kind={feedback}>
          {feedback === 'success'
            ? 'Your profile was saved.'
            : 'Your profile could not be saved. Please try again.'}
        </AuthFeedback>
      )}
    </form>
  )
}
