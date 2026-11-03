import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
      <div className="max-w-2xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-teal">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/75">{description}</p>
      </div>
      {action}
    </div>
  )
}
