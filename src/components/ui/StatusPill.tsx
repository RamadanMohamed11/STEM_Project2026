import type { ReactNode } from 'react'

type StatusTone = 'neutral' | 'ready' | 'warning'

const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-surface-muted text-ink/85',
  ready: 'bg-teal-soft text-teal-dark',
  warning: 'bg-warning-soft text-warning-dark',
}

interface StatusPillProps {
  children: ReactNode
  tone?: StatusTone
}

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${toneStyles[tone]}`}
    >
      {children}
    </span>
  )
}
