import { ClipboardCheck, Glasses, TriangleAlert } from 'lucide-react'

const guidance = [
  {
    title: 'Personal protection',
    icon: Glasses,
    detail:
      'Follow the activity-specific PPE instructions. Lab coats, eye protection, and suitable gloves may be required.',
  },
  {
    title: 'Know your workspace',
    icon: ClipboardCheck,
    detail:
      'Locate safety equipment, keep benches clear, and follow instructor guidance before using any instrument.',
  },
  {
    title: 'Act safely',
    icon: TriangleAlert,
    detail:
      'Never handle unknown substances or equipment without authorization. Report spills or incidents immediately.',
  },
] as const

export function SafetyOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {guidance.map(({ title, icon: Icon, detail }, index) => (
        <section key={title} className="rounded-xl border border-line bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-lg bg-teal-soft text-teal">
              <Icon size={23} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-slate">0{index + 1}</span>
          </div>
          <h2 className="mt-6 text-lg font-semibold text-navy">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate">{detail}</p>
        </section>
      ))}
    </div>
  )
}
