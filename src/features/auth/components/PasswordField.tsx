import { useState, type InputHTMLAttributes } from 'react'

export const authInputClass =
  'mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink focus-visible:outline-teal aria-invalid:border-danger disabled:bg-surface-muted'

export function PasswordField({
  id,
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy">
        {label} <span className="font-normal text-slate">(required)</span>
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          className={`${authInputClass} pr-24`}
        />
        <button
          type="button"
          disabled={props.disabled}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          onClick={() => setVisible((value) => !value)}
          className="absolute right-1 top-2.5 min-h-11 rounded-md px-3 text-sm font-semibold text-teal-dark hover:bg-teal-soft"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
