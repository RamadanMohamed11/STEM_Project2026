import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FlaskConical,
  LockKeyhole,
  MoveRight,
} from 'lucide-react'
import type {
  ExperimentWorkflowDefinition,
  WorkflowState,
  WorkflowValidation,
} from '../engine/workflowTypes.ts'
import type { SaltExperimentState } from '../engine/types.ts'
import { getRequiredEquipment } from '../lib/executionGuideSelectors.ts'
import { useContextualGuidance } from '../state/useContextualGuidance'
import type { InventoryItem, ExperimentGuideStage } from '@/types/laboratory'

interface ExperimentGuideProps {
  definition: ExperimentWorkflowDefinition
  workflow: WorkflowState
  experiment: SaltExperimentState
  placedIds: readonly string[]
  items: readonly InventoryItem[]
  referenceStages: readonly ExperimentGuideStage[]
  validation: WorkflowValidation | null
}

/** Live execution guide. Unlike the old reference reader, future steps cannot be skipped. */
export function ExperimentGuide({
  definition,
  workflow,
  experiment,
  placedIds,
  items,
  referenceStages,
  validation,
}: ExperimentGuideProps) {
  const guidance = useContextualGuidance()
  const step = definition.steps[workflow.stepIndex]
  if (!step) return null
  const stage = definition.stages.find((group) => group.id === step.stageId)
  const equipment = getRequiredEquipment(step)
  const count = workflow.completed ? definition.steps.length : workflow.stepIndex

  return (
    <section
      aria-labelledby="guide-title"
      className="min-w-0 overflow-hidden rounded-xl border border-line bg-white shadow-card"
    >
      <header className="border-b border-line px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
          03 / Live learning guide
        </p>
        <h2 id="guide-title" className="mt-1 text-base font-semibold text-navy">
          Experiment guide
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/70">
          Linked to validated execution. A stage cannot be skipped by navigating the guide.
        </p>
      </header>

      <div className="px-4 py-4" aria-live="polite">
        <p className="text-[10px] font-bold uppercase tracking-widest text-teal">
          {workflow.completed
            ? 'Experiment complete'
            : `${stage?.title ?? 'Procedure'} · Step ${workflow.stepIndex + 1}/${definition.steps.length}`}
        </p>
        <h3 className="mt-2 text-base font-semibold leading-snug text-navy">
          {workflow.completed ? 'All required steps validated' : step.title}
        </h3>
        <details className="mt-2 text-xs leading-relaxed text-ink/75">
          <summary className="cursor-pointer font-semibold text-teal-dark">Why this step?</summary>
          <p className="mt-1">
            {workflow.completed ? definition.resultExplanation : step.description}
          </p>
        </details>

        <div className="mt-4 rounded-lg border border-teal/25 bg-teal-soft/65 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-teal-dark">
            <MoveRight size={15} aria-hidden="true" /> Next available action
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink/85">{guidance.instruction}</p>
          {!workflow.completed && (
            <p className="mt-3 text-xs font-semibold text-teal-dark">
              Perform this action by manipulating the apparatus in the 3D workbench.
            </p>
          )}
        </div>

        {equipment.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-navy">Required equipment</h4>
            <ul className="mt-2 space-y-1.5">
              {equipment.map((id) => (
                <li key={id} className="flex items-center gap-2 text-xs text-ink/80">
                  {placedIds.includes(id) ? (
                    <CheckCircle2
                      size={15}
                      className="shrink-0 text-teal-dark"
                      aria-label="On bench"
                    />
                  ) : (
                    <Circle size={15} className="shrink-0 text-ink/50" aria-label="Not on bench" />
                  )}
                  {items.find((item) => item.id === id)?.title ?? id}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 border-t border-line pt-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold text-navy">
            <FlaskConical size={15} className="text-teal" aria-hidden="true" /> Current measurements
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-ink/80">
            Beaker water: <strong>{experiment.waterMl.beaker} mL</strong> · NaCl added:{' '}
            <strong>{experiment.saltInBeakerG} g</strong>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            Recorded: {workflow.measurements.waterMl ?? '—'} mL water /{' '}
            {workflow.measurements.saltG ?? '—'} g selected salt
          </p>
        </div>

        {validation && !validation.valid && validation.stepId === step.id && (
          <p
            role="status"
            className={`mt-3 rounded-md px-3 py-2 text-xs leading-relaxed ${validation.valid ? 'bg-teal-soft/60 text-teal-dark' : 'bg-warning-soft/70 text-navy'}`}
          >
            {validation.message}
          </p>
        )}
      </div>

      <details className="border-t border-line px-4 py-4">
        <summary className="mb-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-navy">
          <ClipboardList size={15} className="text-teal" aria-hidden="true" /> Validated step
          checklist · {count}/{definition.steps.length}
        </summary>
        <ol className="space-y-1.5" aria-label="Validated steps (future steps locked)">
          {definition.steps.map((item, index) => {
            const done = workflow.completed || index < workflow.stepIndex
            const active = !workflow.completed && index === workflow.stepIndex
            return (
              <li
                key={item.id}
                aria-current={active ? 'step' : undefined}
                className={`flex items-start gap-2 rounded-lg px-2 py-2 text-xs leading-relaxed ${active ? 'bg-teal-soft font-semibold text-teal-dark' : 'text-ink/70'}`}
              >
                {done ? (
                  <CheckCircle2
                    size={16}
                    aria-label="Validated"
                    className="mt-0.5 shrink-0 text-teal-dark"
                  />
                ) : active ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-teal bg-white text-[10px] text-teal-dark">
                    {index + 1}
                  </span>
                ) : (
                  <LockKeyhole
                    size={15}
                    aria-label="Locked"
                    className="mt-0.5 shrink-0 text-ink/50"
                  />
                )}
                {item.title}
              </li>
            )
          })}
        </ol>
      </details>

      <details className="border-t border-line px-4 py-4">
        <summary className="cursor-pointer text-xs font-semibold text-navy">
          Scientific reference · five learning topics
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-ink/70">
          Optional scientific explanations. Reading them does not change procedure progress.
        </p>
        <div className="mt-3 space-y-2">
          {referenceStages.map((reference) => (
            <details
              key={reference.id}
              className="rounded-lg border border-line bg-white px-3 py-2"
            >
              <summary className="cursor-pointer text-xs font-semibold text-navy">
                {reference.title}
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">{reference.introduction}</p>
              <ol className="mt-2 list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-ink/75">
                {reference.steps.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ol>
              <p className="mt-3 rounded-md bg-teal-soft/55 p-2 text-xs leading-relaxed text-ink/80">
                {reference.note}
              </p>
            </details>
          ))}
        </div>
      </details>
    </section>
  )
}
