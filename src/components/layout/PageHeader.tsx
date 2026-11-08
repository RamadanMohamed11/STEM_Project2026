import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end lg:mb-10 animate-fade-in-up">
      <div className="max-w-2xl min-w-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-teal sm:mb-2.5">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink/80 sm:mt-3 sm:text-base">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0 animate-scale-in stagger-1">{action}</div>}
    </div>
  )
}
