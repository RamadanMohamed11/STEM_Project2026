import { CheckCircle2, Droplets, FlaskConical, RotateCcw, Scale, BookOpenText } from 'lucide-react'
import type { WorkflowState } from '../engine/workflowTypes.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import type { ExperimentWorkflowDefinition } from '../engine/workflowTypes.ts'
import {
  undissolvedSaltG,
  SOLUBILITY_G_PER_100ML,
  STIR_DISSOLUTION_G_PER_ACTION,
} from '../engine/saltExperiment.ts'

interface ExperimentResultsProps {
  definition: ExperimentWorkflowDefinition
  workflow: WorkflowState
  experiment: SaltExperimentState
  onRestart: () => void
}

/** No inferred sensor data: final readings come only from recorded workflow values. */
export function ExperimentResults({
  definition,
  workflow,
  experiment,
  onRestart,
}: ExperimentResultsProps) {
  if (!workflow.completed) return null
  const readings = [
    {
      label: 'Recorded water volume',
      value: `${workflow.measurements.waterMl ?? '—'} mL`,
      icon: Droplets,
    },
    {
      label: 'Modelled weighed sodium chloride mass',
      value: `${workflow.measurements.saltG ?? '—'} g`,
      icon: Scale,
    },
    {
      label: 'Water remaining in beaker',
      value: `${experiment.waterMl.beaker} mL`,
      icon: FlaskConical,
    },
    {
      label: 'Modelled dissolved salt',
      value: `${experiment.dissolvedSaltG.toFixed(2)} g`,
      icon: Scale,
    },
  ]

  return (
    <section
      id="experiment-results"
      aria-labelledby="results-title"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-teal/30 bg-white shadow-card"
    >
      <header className="border-b border-teal/20 bg-teal-soft/65 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-teal-dark">
              <CheckCircle2 size={20} aria-hidden="true" /> All {definition.steps.length} steps
              validated
            </p>
            <h2 id="results-title" className="mt-2 text-xl font-semibold text-navy">
              Experiment completed — Results
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink/80">
              Your recorded quantities and the modelled dissolution outcome are shown below.
              Completion reflects the educational procedure, not a real laboratory assessment.
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-[#263f52]"
          >
            <RotateCcw size={16} aria-hidden="true" /> Retry experiment
          </button>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {readings.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-line bg-canvas/60 p-3">
              <dt className="flex items-start gap-2 text-xs leading-relaxed text-ink/75">
                <Icon size={16} className="shrink-0 text-teal" aria-hidden="true" /> {label}
              </dt>
              <dd className="mt-3 text-lg font-semibold tabular-nums text-navy">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-line p-4" aria-label="Recorded observation">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <FlaskConical size={17} className="text-teal" aria-hidden="true" /> Simulated
              observation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {workflow.observationRecorded && undissolvedSaltG(experiment) < 0.0001
                ? 'No undissolved sodium chloride solid is represented in the beaker at the end of the activity.'
                : 'The final solid state could not be verified.'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink/65">
              This is an observation of the software model, not an observation from a physical
              laboratory.
            </p>
          </section>
          <section
            className="rounded-lg border border-line p-4"
            aria-label="Scientific interpretation"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <BookOpenText size={17} className="text-teal" aria-hidden="true" /> Scientific
              principle
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {definition.resultExplanation}
            </p>
          </section>
        </div>
        <p className="border-t border-line pt-4 text-xs leading-relaxed text-ink/75">
          <strong>Simplified model, not measured kinetics:</strong> Solubility is approximated as{' '}
          {SOLUBILITY_G_PER_100ML} g NaCl per 100 mL of water near 20°C; each confirmed stirring
          action dissolves up to {STIR_DISSOLUTION_G_PER_ACTION} g in this teaching model. These
          values are not temperature measurements, real-time sensors or a validated prediction of
          dissolution speed.
        </p>
      </div>
    </section>
  )
}
