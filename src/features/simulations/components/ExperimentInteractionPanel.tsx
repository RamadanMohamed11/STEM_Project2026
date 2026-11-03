import { useEffect, useState } from 'react'
import { ArrowRightLeft, RotateCcw, RotateCw, Waves, FlaskConical } from 'lucide-react'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { DEMO_ACTION_RULES } from '../engine/saltExperiment.ts'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import type { LiquidContainerId, TransferDestination } from '../engine/types.ts'
import { ExperimentExecutionPanel, type ProcedureButtonKind } from './ExperimentExecutionPanel'
import { SimulationMeasurements } from './SimulationMeasurements'

const controlClass =
  'min-h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-navy focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal'
const primaryClass =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-dark disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink/60'

export function ExperimentInteractionPanel({ onRestart }: { onRestart: () => void }) {
  const [source, setSource] = useState<'water' | 'graduated-cylinder'>('water')
  const [target, setTarget] = useState<TransferDestination>('beaker')
  const [amountMl, setAmountMl] = useState(100)
  const [saltMassG, setSaltMassG] = useState(5)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const experiment = useSaltSimulationStore((state) => state.experiment)
  const effect = useSaltSimulationStore((state) => state.effect)
  const feedback = useSaltSimulationStore((state) => state.feedback)
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const validation = useSaltSimulationStore((state) => state.validation)
  const execute = useSaltSimulationStore((state) => state.execute)
  const dispatch = useSaltSimulationStore((state) => state.dispatch)
  const stopEffect = useSaltSimulationStore((state) => state.stopEffect)

  useEffect(() => {
    if (!effect) return
    const timer = window.setTimeout(() => stopEffect(effect.id), effect.durationMs)
    return () => window.clearTimeout(timer)
  }, [effect, stopEffect])

  const pourReady = placedIds.includes(source) && placedIds.includes(target) && source !== target
  const saltReady = ['beaker', 'sodium-chloride', 'digital-balance'].every((id) =>
    placedIds.includes(id),
  )
  const stirReady = ['beaker', 'stirring-rod'].every((id) => placedIds.includes(id))

  const performWorkflowAction = (kind: ProcedureButtonKind, massG?: number) => {
    switch (kind) {
      case 'acknowledge-safety':
      case 'validate-step':
      case 'finish-review':
        dispatch({ kind })
        break
      case 'record-water-measurement':
        dispatch({ kind, valueMl: experiment.waterMl['graduated-cylinder'] })
        break
      case 'record-salt-measurement':
        dispatch({ kind, selectedMassG: massG ?? saltMassG })
        break
      case 'record-observation':
        dispatch({ kind, observation: 'no-visible-solid' })
        break
    }
  }

  return (
    <section aria-labelledby="experiment-operations-title" className="space-y-4">
      <ExperimentExecutionPanel
        safetyRules={saltExperimentDefinition.safetyRules}
        resultExplanation={saltExperimentDefinition.resultExplanation}
        steps={saltExperimentDefinition.steps.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
          stage:
            saltExperimentDefinition.stages.find((stage) => stage.id === step.stageId)?.title ??
            step.stageId,
          legalActions: step.legalActions,
        }))}
        stepIndex={workflow.stepIndex}
        completed={workflow.completed}
        safetyAcknowledged={workflow.safetyAcknowledged}
        observationRecorded={workflow.observationRecorded}
        reviewRecorded={workflow.reviewRecorded}
        waterRecordedMl={workflow.measurements.waterMl}
        saltRecordedG={workflow.measurements.saltG}
        selectedSaltG={saltMassG}
        feedback={validation}
        onAction={performWorkflowAction}
      />
      <div className="rounded-xl border border-line bg-white px-4 py-5 shadow-card sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-teal">
              04 / Real-time operations
            </p>
            <h2 id="experiment-operations-title" className="mt-1 text-lg font-semibold text-navy">
              Run the demonstration
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink/70">
              Follow the validated procedure above. Equipment and quantities must satisfy each step
              before chemistry commands can update the experiment.
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-semibold text-navy hover:bg-surface-muted"
          >
            <RotateCcw size={16} aria-hidden="true" /> Restart experiment
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-teal" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-navy">1. Transfer water</h3>
            </div>
            <label htmlFor="water-source" className="text-xs font-semibold text-ink/80">
              Source
            </label>
            <select
              id="water-source"
              className={`${controlClass} mt-1`}
              value={source}
              onChange={(event) => setSource(event.target.value as 'water' | 'graduated-cylinder')}
            >
              <option value="water">Water container</option>
              <option value="graduated-cylinder">Graduated cylinder</option>
            </select>
            <label
              htmlFor="water-destination"
              className="mt-3 block text-xs font-semibold text-ink/80"
            >
              Destination
            </label>
            <select
              id="water-destination"
              className={`${controlClass} mt-1`}
              value={target}
              onChange={(event) => setTarget(event.target.value as TransferDestination)}
            >
              <option value="beaker">Beaker</option>
              <option value="graduated-cylinder">Graduated cylinder</option>
            </select>
            <label htmlFor="water-amount" className="mt-3 block text-xs font-semibold text-ink/80">
              Volume (mL)
            </label>
            <select
              id="water-amount"
              className={`${controlClass} mt-1`}
              value={amountMl}
              onChange={(event) => setAmountMl(Number(event.target.value))}
            >
              {[25, 50, 100].map((amount) => (
                <option key={amount} value={amount}>
                  {amount} mL
                </option>
              ))}
            </select>
            <p className="my-3 text-xs leading-relaxed text-ink/70">
              {pourReady
                ? `Available: ${experiment.waterMl[source]} mL · destination has ${experiment.waterMl[target]} mL`
                : 'Place both vessels on the bench to transfer water.'}
            </p>
            <button
              type="button"
              disabled={Boolean(effect)}
              onClick={() =>
                execute({ kind: 'pour', source: source as LiquidContainerId, target, amountMl })
              }
              className={primaryClass}
            >
              Pour water
            </button>
          </div>

          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical size={18} className="text-teal" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-navy">2. Add sodium chloride</h3>
            </div>
            <label htmlFor="salt-amount" className="text-xs font-semibold text-ink/80">
              Selected demonstration mass (g)
            </label>
            <select
              id="salt-amount"
              className={`${controlClass} mt-1`}
              value={saltMassG}
              onChange={(event) => setSaltMassG(Number(event.target.value))}
            >
              {[1, 2, 5, 10].map((mass) => (
                <option key={mass} value={mass}>
                  {mass} g
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs leading-relaxed text-ink/70">
              This is a chosen demonstration mass, not a reading from a calibrated physical balance.
            </p>
            <p className="my-3 text-xs leading-relaxed text-ink/70">
              {saltReady
                ? `Salt remaining in jar: ${experiment.saltStockG} g`
                : 'Requires the salt container, beaker and digital balance on the bench.'}
            </p>
            <button
              type="button"
              disabled={Boolean(effect)}
              onClick={() =>
                execute({
                  kind: 'add-substance',
                  source: 'sodium-chloride',
                  target: 'beaker',
                  massG: saltMassG,
                })
              }
              className={primaryClass}
            >
              Add measured salt
            </button>
          </div>

          <div className="rounded-lg border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <Waves size={18} className="text-teal" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-navy">3. Stir solution</h3>
            </div>
            <p className="text-xs leading-relaxed text-ink/75">
              Use the stirring rod to disperse existing solid NaCl into water. Each action models at
              most 4 g dissolving, subject to the approximate solubility limit.
            </p>
            <p className="my-3 text-xs leading-relaxed text-ink/70">
              {stirReady
                ? `${experiment.saltInBeakerG} g NaCl added; ${experiment.stirCount} stir actions completed.`
                : 'Requires a placed beaker and stirring rod.'}
            </p>
            <button
              type="button"
              disabled={Boolean(effect)}
              onClick={() => execute({ kind: 'stir', tool: 'stirring-rod', target: 'beaker' })}
              className={primaryClass}
            >
              <RotateCw size={16} aria-hidden="true" /> Stir and dissolve
            </button>
            <p className="mt-3 text-xs leading-relaxed text-ink/65">
              {DEMO_ACTION_RULES.stir.prerequisite}
            </p>
          </div>
        </div>

        {effect && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-teal/30 bg-teal-soft/75 px-4 py-3 text-sm font-semibold text-teal-dark"
          >
            Animating {effect.kind.replaceAll('-', ' ')}…
          </p>
        )}
        {feedback && !effect && (
          <p
            role="status"
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${feedback.ok ? 'border-teal/30 bg-teal-soft/70 text-teal-dark' : 'border-warning/50 bg-warning-soft/60 text-navy'}`}
          >
            {feedback.message}
          </p>
        )}
      </div>
      <SimulationMeasurements experiment={experiment} completed={workflow.completed} />
    </section>
  )
}
