import { MousePointer2 } from 'lucide-react'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition'
import { getMouseInteractionCoach } from '../lib/mouseInteractionCoach'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'

/** Pointer-only coach; React renders after state changes, not for raw mouse pixels. */
export function LaboratoryInteractionCoach() {
  const sceneFeedback = useLabSceneStore((state) => state.feedback)
  const placement = useLabSceneStore((state) => state.placement)
  const draggingId = useLabSceneStore((state) => state.draggingId)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
  const stepIndex = useSaltSimulationStore((state) => state.workflow.stepIndex)
  const eventCount = useSaltSimulationStore((state) => state.events.length)

  const message = getMouseInteractionCoach({
    stepId: saltExperimentDefinition.steps[stepIndex]?.id ?? null,
    selectedId,
    hoveredId,
    draggingId,
    placementId: placement?.id ?? null,
    placementValid: placement?.valid ?? null,
    sceneFeedback,
    acceptedEvents: eventCount,
  })
  if (!message) return null

  return (
    <div
      className={`pointer-events-none absolute bottom-2 left-1/2 z-10 flex w-[min(92vw,560px)] -translate-x-1/2 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-center text-[10px] leading-relaxed font-medium shadow-lg backdrop-blur-md sm:bottom-3 sm:text-[11px] ${message.tone === 'warning' ? 'border-amber-300/50 bg-[#3b2715]/95 text-amber-100' : 'border-white/15 bg-[#071d29]/90 text-white'}`}
      role="status"
    >
      <MousePointer2 size={13} className="shrink-0" aria-hidden="true" />
      <span>{message.text}</span>
    </div>
  )
}
