import type { ReactNode } from 'react'

export type AuthFeedbackKind = 'info' | 'loading' | 'error' | 'success' | 'unavailable'

/** Success is reserved for a confirmed provider response, never a local form check. */
export function AuthFeedback({
  kind,
  children,
  id,
}: {
  kind: AuthFeedbackKind
  children: ReactNode
  id?: string
}) {
  return (
    <div
      id={id}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-busy={kind === 'loading'}
      className={`rounded-lg border p-4 text-sm leading-relaxed ${kind === 'error' ? 'border-danger text-danger' : kind === 'success' ? 'border-success bg-teal-soft text-ink' : 'border-line bg-teal-soft text-ink'}`}
    >
      {children}
    </div>
  )
}

export function AuthFieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} aria-live="polite" className="mt-2 text-sm text-danger">
      {message}
    </p>
  ) : null
}
