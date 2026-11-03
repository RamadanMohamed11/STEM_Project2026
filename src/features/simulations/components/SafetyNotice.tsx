import { ShieldCheck, ShieldAlert } from 'lucide-react'
import type { SafetyMetadata } from '@/types/experiment'

export function SafetyNotice({ safety }: { safety?: SafetyMetadata }) {
  if (!safety) return null

  const higherRisk = safety.level !== 'low'
  const Icon = higherRisk ? ShieldAlert : ShieldCheck

  return (
    <section
      aria-labelledby="lab-safety-title"
      className="rounded-xl border border-line bg-white px-5 py-5 shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-9 items-center justify-center rounded-lg ${higherRisk ? 'bg-warning-soft text-warning-dark' : 'bg-teal-soft text-teal-dark'}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal">
            Lab awareness
          </p>
          <h2 id="lab-safety-title" className="text-sm font-semibold text-navy">
            Safety considerations
          </h2>
        </div>
      </div>
      {safety.note && <p className="mt-3 text-sm leading-relaxed text-ink/80">{safety.note}</p>}
      {safety.recommendedPpe && safety.recommendedPpe.length > 0 && (
        <p className="mt-2 text-xs text-ink/75">
          Recommended protection: {safety.recommendedPpe.join(', ')}
        </p>
      )}
      {safety.requiresSupervision && (
        <p className="mt-2 text-xs font-semibold text-ink/75">
          Follow instructor supervision in a real laboratory.
        </p>
      )}
    </section>
  )
}
