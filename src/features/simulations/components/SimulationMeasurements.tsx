import { Droplets, FlaskConical, Scale } from 'lucide-react'
import {
  CAPACITIES_ML,
  isDemonstrationComplete,
  maximumDissolvedSaltG,
  undissolvedSaltG,
} from '../engine/saltExperiment.ts'
import type { SaltExperimentState } from '../engine/types.ts'

export function SimulationMeasurements({
  experiment,
  completed = false,
}: {
  experiment: SaltExperimentState
  completed?: boolean
}) {
  const data = [
    {
      name: 'Water source',
      value: `${experiment.waterMl.water} / ${CAPACITIES_ML.water} mL`,
      icon: Droplets,
    },
    {
      name: 'Graduated cylinder',
      value: `${experiment.waterMl['graduated-cylinder']} / ${CAPACITIES_ML['graduated-cylinder']} mL`,
      icon: FlaskConical,
    },
    {
      name: 'Beaker water',
      value: `${experiment.waterMl.beaker} / ${CAPACITIES_ML.beaker} mL`,
      icon: Droplets,
    },
    { name: 'Salt in stock', value: `${experiment.saltStockG} g`, icon: Scale },
    { name: 'NaCl added', value: `${experiment.saltInBeakerG} g`, icon: Scale },
    {
      name: 'Dissolved NaCl',
      value: `${experiment.dissolvedSaltG.toFixed(2)} g`,
      icon: FlaskConical,
    },
    {
      name: 'Undissolved NaCl',
      value: `${undissolvedSaltG(experiment).toFixed(2)} g`,
      icon: Scale,
    },
  ]

  return (
    <section
      aria-labelledby="simulation-measurements-title"
      className="rounded-xl border border-line bg-white p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal">
            Deterministic state
          </p>
          <h2 id="simulation-measurements-title" className="mt-1 text-base font-semibold text-navy">
            Current measurements
          </h2>
        </div>
        <span className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-semibold text-ink/80">
          {completed
            ? 'Procedure completed'
            : isDemonstrationComplete(experiment)
              ? 'Dissolution objective reached · review pending'
              : 'Simulation in progress'}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {data.map(({ name, value, icon: Icon }) => (
          <div key={name} className="rounded-lg border border-line bg-canvas/55 px-3 py-3">
            <dt className="flex items-center gap-1.5 text-xs text-ink/75">
              <Icon size={14} className="text-teal" aria-hidden="true" />
              {name}
            </dt>
            <dd className="mt-2 text-base font-semibold tabular-nums text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-ink/70">
        Quantities come from the local simulation state, not from sensors. Approximate NaCl
        solubility at 20°C: {maximumDissolvedSaltG(experiment).toFixed(2)} g for the water currently
        in the beaker. This is a simplified learning model.
      </p>
    </section>
  )
}
