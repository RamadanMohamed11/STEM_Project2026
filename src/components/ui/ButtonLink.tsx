import type { ReactNode } from 'react'
import { Link, type To } from 'react-router'
import {
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles'

interface ButtonLinkProps {
  to: To
  children: ReactNode
  icon?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
  ariaLabel?: string
  onClick?: () => void
}

export function ButtonLink({
  to,
  children,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ariaLabel,
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 ${
        buttonVariantStyles[variant]
      } ${buttonSizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
      {icon}
    </Link>
  )
}
