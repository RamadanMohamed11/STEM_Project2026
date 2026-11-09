import { MistakesSummary } from './LabSafetyPanels'
import {
  Award,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  Info,
  RotateCcw,
  Scale,
} from 'lucide-react'
import type { WorkflowState, ExperimentWorkflowDefinition } from '../engine/workflowTypes.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import {
  SOLUBILITY_G_PER_100ML,
  STIR_DISSOLUTION_G_PER_ACTION,
  undissolvedSaltG,
} from '../engine/saltExperiment.ts'
import { getExperimentResultsSummary } from '../lib/resultsSummary.ts'
import { ExplainThis } from '@/features/ai/components/ExplainThis'
import { buildExplainPrompt } from '@/features/ai/lib/tutorContext'

interface ExperimentResultsProps {
  definition: ExperimentWorkflowDefinition
  workflow: WorkflowState
  experiment: SaltExperimentState
  experimentTitle?: string
  onRestart: () => void
}

/** No inferred sensor data: final readings come only from recorded workflow values. */
export function ExperimentResults({
  definition,
  workflow,
  experiment,
  experimentTitle,
  onRestart,
}: ExperimentResultsProps) {
  if (!workflow.completed) return null

  const summary = getExperimentResultsSummary({
    experiment: {
      id: definition.experimentId,
      title: experimentTitle ?? definition.title,
      status: 'demo',
    },
    definition,
    workflow,
    chemistry: experiment,
    sessionPhase: 'completed',
  })

  const readings = [
    {
      label: 'Recorded water volume',
      shortLabel: 'Water Used',
      value: `${workflow.measurements.waterMl ?? '—'} mL`,
      icon: Droplets,
      note: 'Derived from the 100 mL graduated cylinder',
    },
    {
      label: 'Modelled weighed sodium chloride mass',
      shortLabel: 'Salt Added',
      value: `${workflow.measurements.saltG ?? '—'} g`,
      icon: Scale,
      note: 'Derived from the simulated tared weighing boat',
    },
    {
      label: 'Water remaining in beaker',
      shortLabel: 'Final Beaker Volume',
      value: `${experiment.waterMl.beaker} mL`,
      icon: FlaskConical,
      note: 'Aqueous solvent volume in the 250 mL beaker',
    },
    {
      label: 'Modelled dissolved salt',
      shortLabel: 'Dissolved Solute',
      value: `${experiment.dissolvedSaltG.toFixed(2)} g`,
      icon: Scale,
      note: `${undissolvedSaltG(experiment).toFixed(2)} g solid remaining · ${experiment.stirCount} stir cycle${experiment.stirCount === 1 ? '' : 's'}`,
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
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-dark px-3 py-1 text-xs font-semibold text-white">
                <CheckCircle2 size={14} aria-hidden="true" /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-dark">
                All {definition.steps.length} steps validated
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
              {summary.experimentTitle} · {definition.title}
            </p>
            <h2 id="results-title" className="text-xl font-semibold text-navy sm:text-2xl">
              Experiment completed — Results
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink/80">
              Your recorded quantities and the modelled dissolution outcome are shown below.
              Completion reflects the educational procedure, not a real laboratory assessment.
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white hover:bg-[#263f52] focus-visible:outline-teal"
          >
            <RotateCcw size={16} aria-hidden="true" /> Retry experiment
          </button>
        </div>
      </header>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        {/* 1. Simulated Measurements */}
        <section aria-labelledby="results-measurements-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3
              id="results-measurements-heading"
              className="flex items-center gap-2 text-base font-semibold text-navy"
            >
              <Scale size={17} className="text-teal" aria-hidden="true" /> Simulated Measurements &
              Recorded Quantities
            </h3>
            <span className="text-xs text-slate">
              Authoritative values from the validated simulation state
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {readings.map(({ label, shortLabel, value, icon: Icon, note }) => (
              <div
                key={label}
                className="flex flex-col justify-between rounded-xl border border-line bg-canvas/60 p-3.5"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                    {shortLabel}
                  </span>
                  <dt className="mt-1 flex items-start gap-2 text-xs leading-relaxed text-ink/75">
                    <Icon size={15} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />{' '}
                    {label}
                  </dt>
                </div>
                <div className="mt-3">
                  <dd className="text-xl font-semibold tabular-nums text-navy">{value}</dd>
                  <p className="mt-1 text-[11px] leading-snug text-slate">{note}</p>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* 2. Simulated Observations & 3. Scientific Explanation */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section
            className="flex flex-col justify-between rounded-xl border border-line bg-white p-4 sm:p-5"
            aria-label="Recorded observation"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
                  <FlaskConical size={17} className="text-teal" aria-hidden="true" /> Simulated
                  observation
                </h3>
                <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-semibold text-teal-dark">
                  Software Model Observation
                </span>
              </div>
              <p className="text-sm font-semibold text-navy">
                {summary.simulatedObservations.headline}
              </p>
              <p className="text-sm leading-relaxed text-ink/80">
                {workflow.observationRecorded && undissolvedSaltG(experiment) < 0.0001
                  ? 'No undissolved sodium chloride solid is represented in the beaker at the end of the activity.'
                  : 'The final solid state could not be verified.'}
              </p>
              <ul className="space-y-1.5 pt-1 text-xs leading-relaxed text-ink/80">
                {summary.simulatedObservations.details.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-teal-dark"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 border-t border-line pt-2.5 text-xs leading-relaxed text-ink/65">
              This is an observation of the software model, not an observation from a physical
              laboratory.
            </p>
          </section>

          <section
            className="flex flex-col justify-between rounded-xl border border-line bg-white p-4 sm:p-5"
            aria-label="Scientific interpretation"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
                  <BookOpenText size={17} className="text-teal" aria-hidden="true" /> Scientific
                  principle & explanation
                </h3>
                <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                  Physical Dissolution
                </span>
              </div>
              <p className="text-sm font-semibold text-navy">
                {summary.scientificExplanation.headline}
              </p>
              <p className="text-sm leading-relaxed text-ink/80">{definition.resultExplanation}</p>
              <p className="text-xs leading-relaxed text-ink/80">
                {summary.scientificExplanation.ionProcessExplanation}
              </p>
            </div>
            <p className="mt-3 rounded-lg bg-teal-soft/55 px-3 py-2 text-xs font-medium leading-relaxed text-navy">
              {summary.scientificExplanation.physicalChangeClarification}
            </p>
            <ExplainThis
              className="mt-3"
              experimentId={definition.experimentId}
              stage="results"
              label="Explain what happened"
              prompt={buildExplainPrompt({
                kind: 'observation',
                experimentTitle: summary.experimentTitle,
                observation: `${summary.simulatedObservations.headline}. ${summary.simulatedObservations.summary}`,
              })}
              fallback={[
                definition.resultExplanation,
                summary.scientificExplanation.ionProcessExplanation,
                summary.scientificExplanation.physicalChangeClarification,
              ].join('\n\n')}
            />
          </section>
        </div>

        {/* 4. Student Actions & 5. Final Educational Conclusions */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section
            aria-labelledby="results-student-actions-heading"
            className="rounded-xl border border-line bg-canvas/40 p-4 sm:p-5"
          >
            <h3
              id="results-student-actions-heading"
              className="flex items-center gap-2 text-base font-semibold text-navy"
            >
              <ClipboardCheck size={17} className="text-teal" aria-hidden="true" /> Verified Student
              Actions
            </h3>
            <p className="mt-1 text-xs text-slate">
              Each procedural step below was validated against the simulation state in order.
            </p>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-ink/85">
              {summary.studentActions.map((action) => (
                <li
                  key={action.id}
                  className="flex items-start gap-2.5 rounded-lg border border-line bg-white px-3 py-2"
                >
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-teal-dark"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold text-navy">
                      Step {action.stepNumber}: {action.title}
                    </span>
                    <p className="text-ink/75">{action.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex flex-col gap-4">
            <section
              aria-labelledby="results-conclusions-heading"
              className="rounded-xl border border-teal/25 bg-teal-soft/35 p-4 sm:p-5"
            >
              <h3
                id="results-conclusions-heading"
                className="flex items-center gap-2 text-base font-semibold text-navy"
              >
                <Award size={17} className="text-teal-dark" aria-hidden="true" /> Final Educational
                Conclusions
              </h3>
              <p className="mt-1 text-xs text-ink/75">
                Key chemistry takeaways supported by your completed experiment:
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/85">
                {summary.finalConclusions.map((conclusion) => (
                  <li key={conclusion} className="flex items-start gap-2">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-teal-dark"
                      aria-hidden="true"
                    />
                    <span>{conclusion}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 6. Model Assumptions */}
            <section
              aria-labelledby="results-assumptions-heading"
              className="rounded-xl border border-line bg-white p-4 sm:p-5"
            >
              <h3
                id="results-assumptions-heading"
                className="flex items-center gap-2 text-sm font-semibold text-navy"
              >
                <Info size={16} className="text-teal" aria-hidden="true" /> Model Assumptions &
                Scientific Scope
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-ink/75">
                {summary.modelAssumptions.map((assumption) => (
                  <li key={assumption} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink/75">
                <strong>Simplified model, not measured kinetics:</strong> Solubility is approximated
                as {SOLUBILITY_G_PER_100ML} g NaCl per 100 mL of water near 20°C; each confirmed
                stirring action dissolves up to {STIR_DISSOLUTION_G_PER_ACTION} g in this teaching
                model. These values are not temperature measurements, real-time sensors or a
                validated prediction of dissolution speed.
              </p>
            </section>
          </div>
        </div>
        {/* L9: completion summary lists the mistakes and safety alerts with explanations. */}
        <div className="mt-5">
          <MistakesSummary experimentId={definition.experimentId} />
        </div>
      </div>
    </section>
  )
}
