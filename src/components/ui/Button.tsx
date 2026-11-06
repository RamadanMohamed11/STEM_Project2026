import type { ButtonHTMLAttributes, ReactNode } from 'react'
import {
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  icon?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

export function Button({
  children,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 select-none focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 ${
        buttonVariantStyles[variant]
      } ${buttonSizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
      {icon}
    </button>
  )
}
