import { useState } from 'react'
import {
  AlertTriangle,
  Flame,
  Wind,
  Bomb,
  FlaskConical,
  FlameKindling,
  Thermometer,
  X,
} from 'lucide-react'
import { getHazards, type HazardId } from '../data/hazards'

const icons = {
  flame: Flame,
  wind: Wind,
  explosion: Bomb,
  corrosive: FlaskConical,
  oxidizer: FlameKindling,
  heat: Thermometer,
  irritant: AlertTriangle,
}
export function HazardAlert({
  hazardIds,
  dismissible = false,
}: {
  hazardIds: readonly HazardId[]
  dismissible?: boolean
}) {
  const [dismissed, setDismissed] = useState<string | null>(null)
  const hazards = getHazards(hazardIds)
  const identity = hazards
    .map((hazard) => hazard.id)
    .sort()
    .join(',')
  if (!hazards.length || dismissed === identity) return null
  return (
    <section
      aria-label="Experiment hazards"
      className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-ink shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-navy">Safety Precautions</h2>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(identity)}
            aria-label="Dismiss hazard warning"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white focus-visible:outline-teal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <ul className="mt-3 space-y-4">
        {hazards.map((hazard) => {
          const Icon = icons[hazard.icon]
          return (
            <li key={hazard.id}>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={19} aria-hidden="true" />
                {hazard.label}
              </h3>
              <p className="mt-1 text-sm">{hazard.description}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {hazard.precautions.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                <strong>Protection for reviewed handling:</strong> {hazard.requiredPpe.join(', ')}.
              </p>
              {hazard.engineeringControls.includes('fume-hood') && (
                <p className="text-xs">
                  <strong>Ventilation:</strong> Use an approved working fume hood. It is an
                  engineering control, not PPE.
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs leading-relaxed">
        Draft general guidance. Your teacher must review the activity and the chemical safety data
        sheet. Gloves, ventilation and other protection depend on the specific risks. A checked box
        does not qualify you to perform a real experiment.
      </p>
    </section>
  )
}
