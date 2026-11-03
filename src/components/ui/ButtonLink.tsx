import type { ReactNode } from 'react'
import { Link, type To } from 'react-router'

interface ButtonLinkProps {
  to: To
  children: ReactNode
  icon?: ReactNode
  variant?: 'primary' | 'secondary'
}

const variantStyles = {
  primary: 'bg-teal text-white hover:bg-teal-dark',
  secondary: 'border border-line-strong bg-white text-ink hover:bg-surface-muted',
} as const

export function ButtonLink({ to, children, icon, variant = 'primary' }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors ${variantStyles[variant]}`}
    >
      {children}
      {icon}
    </Link>
  )
}
