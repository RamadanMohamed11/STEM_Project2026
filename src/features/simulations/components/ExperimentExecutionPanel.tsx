import { AlertCircle, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import type { WorkflowActionKind } from '../engine/workflowTypes.ts'

export type ProcedureButtonKind =
  | 'acknowledge-safety'
  | 'validate-step'
  | 'record-water-measurement'
  | 'record-salt-measurement'
  | 'record-observation'
  | 'finish-review'

export interface ProcedureStepView {
  id: string
  title: string
  description: string
  stage: string
  legalActions: readonly WorkflowActionKind[]
}

export interface ProcedureFeedback {
  valid: boolean
  message: string
  code: string
  severity: 'info' | 'warning' | 'error' | 'success'
}

interface ExperimentExecutionPanelProps {
  steps: readonly ProcedureStepView[]
  safetyRules: readonly { id: string; instruction: string; required: boolean }[]
  resultExplanation: string
  stepIndex: number
  completed: boolean
  waterRecordedMl: number | null
  saltRecordedG: number | null
  selectedSaltG: number
  safetyAcknowledged: boolean
  observationRecorded: boolean
  reviewRecorded: boolean
  feedback: ProcedureFeedback | null
  onAction: (kind: ProcedureButtonKind, massG?: number) => void
}

const actionLabels: Record<ProcedureButtonKind, string> = {
  'acknowledge-safety': 'Acknowledge precautions',
  'validate-step': 'Validate current step',
  'record-water-measurement': 'Record cylinder water volume',
  'record-salt-measurement': 'Record selected salt mass',
  'record-observation': 'Record dissolution observation',
  'finish-review': 'Confirm scientific review',
}

export function ExperimentExecutionPanel({
  steps,
  safetyRules,
  resultExplanation,
  stepIndex,
  completed,
  waterRecordedMl,
  saltRecordedG,
  selectedSaltG,
  safetyAcknowledged,
  observationRecorded,
  reviewRecorded,
  feedback,
  onAction,
}: ExperimentExecutionPanelProps) {
  const step = steps[stepIndex]
  const pendingActions: readonly { kind: ProcedureButtonKind; done: boolean }[] = [
    { kind: 'acknowledge-safety', done: safetyAcknowledged },
    { kind: 'record-water-measurement', done: waterRecordedMl !== null },
    { kind: 'record-salt-measurement', done: saltRecordedG !== null },
    { kind: 'record-observation', done: observationRecorded },
    { kind: 'finish-review', done: reviewRecorded },
  ]
  const pending = pendingActions.find(
    (item) => !item.done && step?.legalActions.includes(item.kind),
  )
  const action: ProcedureButtonKind | undefined =
    pending?.kind ?? (step?.legalActions.includes('validate-step') ? 'validate-step' : undefined)
  const progress = completed ? steps.length : stepIndex

  return (
    <section
      aria-labelledby="procedure-title"
      className="rounded-xl border border-line bg-white px-4 py-5 shadow-card sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal">
            Validated execution · separate from learning guide
          </p>
          <h2 id="procedure-title" className="mt-1 text-lg font-semibold text-navy">
            Experimental procedure
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            Progress advances only when an operation or recorded observation satisfies the current
            validation conditions.
          </p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold tabular-nums text-navy">
          {completed ? 'Completed' : `Step ${stepIndex + 1} of ${steps.length}`}
        </span>
      </div>

      <progress
        className="lab-guide-progress mt-4 block h-2 w-full overflow-hidden rounded-full bg-surface-muted"
        value={progress}
        max={steps.length}
        aria-label={`Validated procedure progress: ${progress} of ${steps.length} steps`}
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.82fr)]">
        <div className="rounded-lg border border-line bg-canvas/60 p-4">
          {completed ? (
            <div>
              <div className="flex items-center gap-2 text-teal-dark">
                <CheckCircle2 size={20} aria-hidden="true" />
                <h3 className="text-base font-semibold">Procedure validated</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                You recorded the water volume, selected salt mass, modelled complete dissolution,
                and reviewed the physical-process explanation. Completion reflects this educational
                workflow, not real laboratory proficiency.
              </p>
              <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink/80">
                {resultExplanation}
              </p>
            </div>
          ) : step ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal">
                {step.stage}
              </p>
              <h3 className="mt-2 text-base font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">{step.description}</p>
              {step.legalActions.includes('acknowledge-safety') && (
                <div className="mt-3 rounded-lg bg-teal-soft/70 p-3 text-xs leading-relaxed text-ink/80">
                  <p className="flex items-center gap-2 font-semibold text-teal-dark">
                    <ShieldCheck size={16} aria-hidden="true" />
                    Required demonstration precautions
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1.5">
                    {safetyRules.map((rule) => (
                      <li key={rule.id}>{rule.instruction}</li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    Acknowledgement applies to these instructions; follow an instructor's real-lab
                    rules as well.
                  </p>
                </div>
              )}
              {step.legalActions.includes('finish-review') && (
                <p className="mt-3 rounded-lg border border-line bg-white p-3 text-xs leading-relaxed text-ink/80">
                  {resultExplanation}
                </p>
              )}
              {step.legalActions.includes('record-salt-measurement') && (
                <p className="mt-3 text-xs leading-relaxed text-ink/75">
                  Selected virtual mass: <strong>{selectedSaltG} g</strong>. This records a chosen
                  quantity, not a measurement from calibrated balance hardware.
                </p>
              )}
              {action ? (
                <button
                  type="button"
                  onClick={() =>
                    onAction(
                      action,
                      action === 'record-salt-measurement' ? selectedSaltG : undefined,
                    )
                  }
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-dark"
                >
                  <ClipboardCheck size={17} aria-hidden="true" />
                  {action === 'validate-step' && step.legalActions.includes('finish-review')
                    ? 'Validate experiment completion'
                    : actionLabels[action]}
                </button>
              ) : (
                <p className="mt-4 rounded-lg border border-line bg-white px-3 py-3 text-xs font-semibold leading-relaxed text-ink/80">
                  Use the matching operation controls below. This step cannot be skipped.
                </p>
              )}
            </>
          ) : null}
          {feedback && (
            <p
              role="status"
              className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed ${feedback.valid ? 'border-teal/30 bg-teal-soft/70 text-teal-dark' : 'border-warning/40 bg-warning-soft/60 text-navy'}`}
            >
              {feedback.valid ? (
                <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </p>
          )}
          <p className="mt-3 text-xs text-ink/65">
            Safety acknowledged: {safetyAcknowledged ? 'Yes' : 'No'} · Water recorded:{' '}
            {waterRecordedMl === null ? 'Not yet' : `${waterRecordedMl} mL`} · Salt selected:{' '}
            {saltRecordedG === null ? 'Not yet' : `${saltRecordedG} g`}
          </p>
        </div>

        <ol
          className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1"
          aria-label="Required experiment steps"
        >
          {steps.map((item, index) => {
            const isDone = completed || index < stepIndex
            const active = !completed && index === stepIndex
            return (
              <li
                key={item.id}
                className={`flex min-h-9 items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${active ? 'border-teal bg-teal-soft text-teal-dark' : 'border-line bg-white text-ink/75'}`}
                aria-current={active ? 'step' : undefined}
              >
                {isDone ? (
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-teal-dark"
                    aria-label="Validated"
                  />
                ) : (
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border font-bold ${active ? 'border-teal text-teal-dark' : 'border-line-strong text-ink/60'}`}
                  >
                    {index + 1}
                  </span>
                )}
                <span className={active ? 'font-semibold' : ''}>{item.title}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
