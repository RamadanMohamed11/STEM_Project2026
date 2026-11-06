import type { ReactNode } from 'react'
import type { SafetyTip } from '../data/safetyContent'

export function SafetyLessonSection({
  id,
  number,
  title,
  introduction,
  children,
}: {
  id: string
  number: string
  title: string
  introduction: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <div className="mb-5 flex items-start gap-4 sm:mb-6">
        <span className="pt-1 text-sm font-semibold tracking-widest text-teal" aria-hidden="true">
          {number}
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-xl font-semibold text-navy sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate sm:text-base">
            {introduction}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function SafetyTipList({ items }: { items: readonly SafetyTip[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-2 sm:p-7">
      {items.map((item) => (
        <li key={item.id} className="border-l-2 border-teal/25 pl-4">
          <h3 className="text-base font-semibold text-navy">{item.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate">{item.detail}</p>
        </li>
      ))}
    </ul>
  )
}
