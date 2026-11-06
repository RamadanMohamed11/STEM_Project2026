import { ClipboardCheck, Glasses, TriangleAlert } from 'lucide-react'
import { safetyIntroduction } from '../data/safetyContent'

const icons = { ppe: Glasses, workspace: ClipboardCheck, materials: TriangleAlert }

export function SafetyOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {safetyIntroduction.map(({ id, title, detail }, index) => {
        const Icon = icons[id]
        return (
          <section
            key={title}
            className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-card transition-colors hover:border-line-strong sm:p-6"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-teal-soft text-teal">
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="text-xs font-bold text-slate">0{index + 1}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-navy">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate">{detail}</p>
          </section>
        )
      })}
    </div>
  )
}
