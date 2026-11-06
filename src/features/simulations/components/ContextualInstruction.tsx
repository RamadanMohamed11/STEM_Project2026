import { useEffect, useState } from 'react'
import { CheckCircle2, Lightbulb, ShieldCheck } from 'lucide-react'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition'
import { semanticEventLabels } from '../lib/semanticFeedback'
import { acknowledgeLabSafety } from '../state/directInteractions'
import { useContextualGuidance } from '../state/useContextualGuidance'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import type { LaboratoryPresentation } from '@/types/laboratory'

/** Only this small HUD subscribes to world positions; physics and layout stay separate. */
export function ContextualInstruction({
  inventoryOpen,
  presentation,
}: {
  inventoryOpen: boolean
  presentation: LaboratoryPresentation
}) {
  const [hintOpen, setHintOpen] = useState(false)
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null)
  const guidance = useContextualGuidance()
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const transfer = useSaltSimulationStore((state) => state.transfer)
  const validation = useSaltSimulationStore((state) => state.validation)
  const feedback = useSaltSimulationStore((state) => state.feedback)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const selectionCount = useLabSceneStore((state) => state.selectedIds?.length ?? 0)
  const draggingId = useLabSceneStore((state) => state.draggingId)
  const placement = useLabSceneStore((state) => state.placement)
  const selectedInteraction = Boolean(selectionCount || selectedId || draggingId || placement)
  const transferStep = ['measure-water', 'transfer-water', 'measure-salt', 'add-salt'].includes(
    guidance.stepId,
  )
  const waterGoal = saltExperimentDefinition.measurementRequirements.waterMl.exact
  const saltGoal = saltExperimentDefinition.measurementRequirements.saltG.exact
  const remaining = (goal: number, value: number) => Number(Math.max(0, goal - value).toFixed(3))
  let instruction = guidance.instruction
  if (guidance.stepId === 'measure-water')
    instruction = `Select the water container and graduated cylinder. Transfer ${remaining(waterGoal, chemistry.waterMl['graduated-cylinder'])} mL more to measure ${waterGoal} mL water.`
  else if (guidance.stepId === 'transfer-water')
    instruction = `Select the graduated cylinder and beaker. Transfer the measured water; ${remaining(waterGoal, chemistry.waterMl.beaker)} mL remains.`
  else if (guidance.stepId === 'measure-salt') {
    if (chemistry.saltOnSpatulaG > 0)
      instruction = `Select the spatula and weighing boat. Deposit the ${chemistry.saltOnSpatulaG} g NaCl on the spatula.`
    else if (chemistry.saltOnBoatG < saltGoal)
      instruction = `Select the sodium chloride jar and spatula. Scoop ${remaining(saltGoal, chemistry.saltOnBoatG)} g more, then select the spatula and weighing boat to deposit it.`
    else
      instruction = `Drag the weighing boat containing ${chemistry.saltOnBoatG} g NaCl onto the balance to record its modelled net mass.`
  } else if (guidance.stepId === 'add-salt')
    instruction = `Select the weighing boat and beaker. Transfer the measured NaCl; ${remaining(saltGoal, chemistry.saltInBeakerG)} g remains.`
  if (transfer)
    instruction = transfer.cancelled
      ? 'Transfer cancelled. Delivered material is retained; wait for equipment to return safely.'
      : `Transferring ${transfer.amount} ${transfer.unit}. Follow progress in Object interaction; wait for safe return before another action.`

  const interactionHint = transfer
    ? null
    : placement
      ? guidance.interactionHint
      : transferStep
        ? 'Click one object, then a second. In Object interaction, choose the direction and enter an amount; no modifier key is needed.'
        : guidance.interactionHint
  const showInteractionHint = Boolean(interactionHint && (selectedInteraction || hintOpen))
  const warning =
    validation && !validation.valid && validation.stepId === guidance.stepId
      ? validation.message
      : feedback && !feedback.ok
        ? feedback.message
        : null
  const visibleWarning = warning?.match(/tilt/i)
    ? 'Read the current step, then select a source and receiver to transfer a measured amount.'
    : warning
  const visibleSuccess = !visibleWarning
    ? (recentSuccess ?? (guidance.tone === 'success' ? guidance.feedback : null))
    : null

  useEffect(() => {
    let previousCount = useSaltSimulationStore.getState().events.length
    let timeoutId: number | undefined
    const unsubscribe = useSaltSimulationStore.subscribe((state) => {
      const count = state.events.length
      if (count === 0 && previousCount > 0) {
        window.clearTimeout(timeoutId)
        setRecentSuccess(null)
      } else if (count > previousCount) {
        const event = state.events[count - 1]
        if (event) {
          window.clearTimeout(timeoutId)
          setRecentSuccess(`Verified · ${semanticEventLabels[event.type]}`)
          timeoutId = window.setTimeout(() => setRecentSuccess(null), 3200)
        }
      }
      previousCount = count
    })
    return () => {
      unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <section
      aria-label="Current experiment instruction"
      className={`pointer-events-none absolute left-1/2 z-10 w-[min(92vw,470px)] -translate-x-1/2 ${selectionCount || transfer ? 'top-3 sm:top-4' : 'bottom-[62px] sm:bottom-[66px]'} ${inventoryOpen ? 'max-sm:hidden' : ''}`}
    >
      <div className="pointer-events-auto rounded-xl border border-white/20 bg-[#071d29]/90 px-3 py-2.5 text-white shadow-xl backdrop-blur-md sm:px-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#69dec8]">
            {workflow.completed
              ? 'Experiment complete'
              : `Step ${workflow.stepIndex + 1} / ${saltExperimentDefinition.steps.length} · ${guidance.stepTitle}`}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label={hintOpen ? 'Hide contextual hint' : 'Show contextual hint'}
              aria-expanded={hintOpen}
              onClick={() => setHintOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold ${hintOpen ? 'bg-[#205d61] text-[#c0fff2]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Lightbulb size={13} aria-hidden="true" /> Hint
            </button>
            {guidance.stepId === 'prepare' && !workflow.safetyAcknowledged && (
              <button
                type="button"
                onClick={acknowledgeLabSafety}
                className="flex shrink-0 items-center gap-1 rounded-md bg-[#26bda9] px-2 py-1.5 text-[10px] font-bold text-[#062b30] hover:bg-[#62dfca]"
              >
                <ShieldCheck size={13} /> Confirm safety
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs leading-[1.45] font-medium text-white/95">{instruction}</p>
        {showInteractionHint && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#a6e9df]">
            <Lightbulb size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{interactionHint}</span>
          </p>
        )}
        {hintOpen && !interactionHint && !transfer && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#a6e9df]">
            {guidance.actorId
              ? `Select the ${presentation.inventory.find((item) => item.id === guidance.actorId)?.title ?? 'required apparatus'} and follow the current step.`
              : 'Follow the current safety or observation instruction. Hints never perform an action.'}
          </p>
        )}
        {visibleWarning && (
          <p
            role="status"
            className="mt-1.5 rounded-md bg-amber-200/10 px-2 py-1 text-[11px] leading-relaxed text-amber-200"
          >
            {visibleWarning}
          </p>
        )}
        {visibleSuccess && (
          <p role="status" className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#85efd4]">
            <CheckCircle2 size={13} aria-hidden="true" /> {visibleSuccess}
          </p>
        )}
        <div
          aria-label={`${guidance.progress}% of experiment steps validated`}
          className="mt-2 h-1 overflow-hidden rounded-full bg-white/15 md:hidden"
        >
          <div
            className="h-full rounded-full bg-[#31c7b3] transition-[width]"
            style={{ width: guidance.progress + '%' }}
          />
        </div>
      </div>
    </section>
  )
}
