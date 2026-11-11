import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Info,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition'
import { getContextualSafetyState, type SafetyWarningLevel } from '../lib/contextualSafety'
import { semanticEventLabels } from '../lib/semanticFeedback'
import { acknowledgeLabSafety } from '../state/directInteractions'
import { useContextualGuidance } from '../state/useContextualGuidance'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import type { LaboratoryPresentation } from '@/types/laboratory'

const HUD_SAFETY_ICONS: Readonly<Record<SafetyWarningLevel, typeof Info>> = {
  info: Info,
  caution: AlertTriangle,
  warning: ShieldAlert,
  blocked: Ban,
}

/** Only this small HUD subscribes to world positions; physics and layout stay separate. */
export function ContextualInstruction({
  inventoryOpen,
  presentation,
}: {
  inventoryOpen: boolean
  presentation: LaboratoryPresentation
}) {
  const [hintOpen, setHintOpen] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [dismissedWarningText, setDismissedWarningText] = useState<string | null>(null)
  const [recentSuccess, setRecentSuccess] = useState<string | null>(null)
  const guidance = useContextualGuidance()
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const chemistry = useSaltSimulationStore((state) => state.experiment)
  const transfer = useSaltSimulationStore((state) => state.transfer)
  const validation = useSaltSimulationStore((state) => state.validation)
  const feedback = useSaltSimulationStore((state) => state.feedback)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
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
  const rawVisibleWarning = warning?.match(/tilt/i)
    ? 'Read the current step, then select a source and receiver to transfer a measured amount.'
    : warning
  const visibleWarning =
    rawVisibleWarning && rawVisibleWarning !== dismissedWarningText ? rawVisibleWarning : null
  const visibleSuccess = !visibleWarning
    ? (recentSuccess ?? (guidance.tone === 'success' ? guidance.feedback : null))
    : null

  const safetyState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow,
    validation,
    feedback,
    hoveredId,
    placedIds,
    actorId: guidance.actorId,
    targetId: guidance.targetId,
  })

  const stepPrecaution = safetyState.stepPrecaution
  const StepPrecautionIcon = stepPrecaution ? HUD_SAFETY_ICONS[stepPrecaution.level] : ShieldCheck

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
      <div className="pointer-events-auto rounded-xl border border-white/20 bg-[#0d1b2a]/90 px-3 py-2.5 text-white shadow-xl backdrop-blur-md sm:px-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#a8c5e0]">
            {workflow.completed
              ? 'Experiment complete'
              : `Step ${workflow.stepIndex + 1} / ${saltExperimentDefinition.steps.length} · ${guidance.stepTitle}`}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {stepPrecaution && (
              <button
                type="button"
                aria-label={safetyOpen ? 'Hide safety notice' : 'Show safety notice'}
                aria-expanded={safetyOpen}
                onClick={() => setSafetyOpen((open) => !open)}
                className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold ${
                  safetyOpen
                    ? 'bg-[#1b3a6b] text-[#cde1f2]'
                    : stepPrecaution.level === 'warning'
                      ? 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <StepPrecautionIcon size={12} aria-hidden="true" />
                <span>{stepPrecaution.badgeLabel}</span>
              </button>
            )}
            <button
              type="button"
              aria-label={hintOpen ? 'Hide contextual hint' : 'Show contextual hint'}
              aria-expanded={hintOpen}
              onClick={() => setHintOpen((open) => !open)}
              className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold ${hintOpen ? 'bg-[#1b3a6b] text-[#cde1f2]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Lightbulb size={13} aria-hidden="true" /> Hint
            </button>
            {guidance.stepId === 'prepare' && !workflow.safetyAcknowledged && (
              <button
                type="button"
                onClick={acknowledgeLabSafety}
                className="flex shrink-0 items-center gap-1 rounded-md bg-[#1b3a6b] px-2 py-1.5 text-[10px] font-bold text-[#e8f1fa] hover:bg-[#3d5a80]"
              >
                <ShieldCheck size={13} /> Confirm safety
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs leading-[1.45] font-medium text-white/95">{instruction}</p>
        {safetyOpen && stepPrecaution && (
          <div
            role="status"
            data-safety-level={stepPrecaution.level}
            className="mt-1.5 flex items-start justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-[#e8f1fa]"
          >
            <div>
              <p className="font-semibold text-[#cde1f2]">{stepPrecaution.title}</p>
              <p className="mt-0.5 text-white/90">{stepPrecaution.message}</p>
            </div>
            <button
              type="button"
              aria-label="Close safety notice"
              onClick={() => setSafetyOpen(false)}
              className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}
        {showInteractionHint && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[#a8c5e0]">
            <Lightbulb size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{interactionHint}</span>
          </p>
        )}
        {hintOpen && !interactionHint && !transfer && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#a8c5e0]">
            {guidance.actorId
              ? `Select the ${presentation.inventory.find((item) => item.id === guidance.actorId)?.title ?? 'required apparatus'} and follow the current step.`
              : 'Follow the current safety or observation instruction. Hints never perform an action.'}
          </p>
        )}
        {visibleWarning && (
          <div
            role="status"
            data-safety-level={safetyState.blockedNotice?.level ?? 'blocked'}
            className="mt-1.5 flex items-start justify-between gap-2 rounded-md bg-amber-200/15 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-200"
          >
            <div className="flex items-start gap-1.5">
              <Ban size={13} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <span>
                <strong className="font-semibold">
                  {safetyState.blockedNotice?.badgeLabel ?? 'This Action Is Not Allowed'}:
                </strong>{' '}
                {visibleWarning}
              </span>
            </div>
            <button
              type="button"
              aria-label="Dismiss safety warning"
              onClick={() => setDismissedWarningText(rawVisibleWarning)}
              className="rounded p-0.5 text-amber-200/80 hover:bg-amber-200/20 hover:text-white"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}
        {visibleSuccess && (
          <p role="status" className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#a8c5e0]">
            <CheckCircle2 size={13} aria-hidden="true" /> {visibleSuccess}
          </p>
        )}
        <div
          aria-label={`${guidance.progress}% of experiment steps validated`}
          className="mt-2 h-1 overflow-hidden rounded-full bg-white/15 md:hidden"
        >
          <div
            className="h-full rounded-full bg-[#3d5a80] transition-[width]"
            style={{ width: guidance.progress + '%' }}
          />
        </div>
      </div>
    </section>
  )
}
