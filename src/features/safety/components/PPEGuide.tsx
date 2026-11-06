import { Footprints, Glasses, Hand, UserRound, Shirt } from 'lucide-react'
import { ppeGuide } from '../data/safetyContent'

const icons = { coat: Shirt, goggles: Glasses, gloves: Hand, shoes: Footprints, hair: UserRound }

export function PPEGuide() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ppeGuide.map((item) => {
        const Icon = icons[item.icon]
        return (
          <li
            key={item.id}
            className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <div className="mb-5 flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-teal-soft text-teal-dark">
                <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate">{item.what}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm leading-relaxed">
              {[
                ['Why it helps', item.why],
                ['When to use it', item.when],
                ['Avoid', item.avoid],
              ].map(([label, detail]) => (
                <div key={label}>
                  <dt className="font-semibold text-navy">{label}</dt>
                  <dd className="mt-0.5 text-slate">{detail}</dd>
                </div>
              ))}
            </dl>
          </li>
        )
      })}
    </ul>
  )
}
