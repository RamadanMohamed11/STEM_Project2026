import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const

export function Card({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-white shadow-card transition-all duration-200 ease-out ${
        interactive
          ? 'hover:border-line-strong hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]'
          : ''
      } ${paddingStyles[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
