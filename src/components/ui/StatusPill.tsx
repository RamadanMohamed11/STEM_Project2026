import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'ready' | 'warning' | 'info' | 'success'

const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-surface-muted text-navy border border-line-strong',
  ready: 'bg-teal-soft text-teal-dark border border-teal/25',
  success: 'bg-teal-soft text-teal-dark border border-teal/25',
  warning: 'bg-warning-soft text-warning-dark border border-warning/30',
  info: 'bg-teal-soft/50 text-info border border-info/25',
}

const dotStyles: Record<StatusTone, string> = {
  neutral: 'bg-slate',
  ready: 'bg-teal',
  success: 'bg-teal',
  warning: 'bg-warning',
  info: 'bg-info',
}

interface StatusPillProps {
  children: ReactNode
  tone?: StatusTone
  dot?: boolean
  className?: string
}

export function StatusPill({ children, tone = 'neutral', dot = false, className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide select-none ${toneStyles[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`size-1.5 shrink-0 rounded-full ${dotStyles[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
