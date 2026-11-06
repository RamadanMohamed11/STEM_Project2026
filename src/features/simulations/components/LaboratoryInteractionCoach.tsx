import { MousePointer2 } from 'lucide-react'
import { saltExperimentDefinition } from '../data/saltExperimentDefinition'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'

/** The visible coach teaches selection; legacy gesture selectors remain available to old callers. */
export function LaboratoryInteractionCoach() {
  const sceneFeedback = useLabSceneStore((state) => state.feedback)
  const placement = useLabSceneStore((state) => state.placement)
  const draggingId = useLabSceneStore((state) => state.draggingId)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const selectionCount = useLabSceneStore((state) => state.selectedIds?.length ?? 0)
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const transfer = useSaltSimulationStore((state) => state.transfer)
  const step = saltExperimentDefinition.steps[workflow.stepIndex]
  const warning = Boolean(
    !transfer &&
    !placement &&
    sceneFeedback &&
    /invalid|collision|overlap|outside|cannot|blocked|too close|no free|failed/i.test(
      sceneFeedback,
    ) &&
    !/tilt/i.test(sceneFeedback),
  )
  let text: string
  if (transfer)
    text = transfer.cancelled
      ? 'Waiting for safe return. Delivered material is retained; controls unlock when equipment is back.'
      : 'Transfer in progress. Use Cancel transfer to stop and return equipment safely.'
  else if (placement)
    text = placement.valid
      ? 'Move the preview to a clear bench spot, then click to place. Esc cancels placement.'
      : 'Move the red preview to a clear bench spot. Click only when green; Esc cancels placement.'
  else if (warning) text = sceneFeedback!
  else if (draggingId === 'stirring-rod')
    text =
      'Guide the rod tip inside the beaker and draw complete circles; release to finish a stroke.'
  else if (draggingId)
    text =
      'Drag to reposition, then release. To transfer material, click a source and a receiver and enter an amount.'
  else if (workflow.completed)
    text = 'All steps verified. Review the results or restart the experiment.'
  else if (workflow.stepIndex === 0)
    text = 'Read the safety rules and confirm safety. Add the required objects from Inventory.'
  else if (step?.id === 'stir' || selectedId === 'stirring-rod')
    text = 'Drag the stirring rod inside the beaker and draw complete circles with the mouse.'
  else if (step?.id === 'review')
    text = 'Select the beaker to inspect the finished solution and complete the review.'
  else if (selectionCount === 2)
    text =
      'Choose a transfer direction and amount in Object interaction. Disabled directions explain what is needed.'
  else if (selectionCount === 1 || selectedId)
    text =
      'Click a second object to see transfer directions and enter an amount. No modifier key is needed.'
  else if (hoveredId)
    text =
      'Click to select this object, then click a second object to transfer. Drag only to reposition.'
  else
    text = `Read “${step?.title ?? 'Current step'}”. Click a source, then a receiver; choose an amount in Object interaction.`

  return (
    <div
      className={`pointer-events-none absolute bottom-2 left-1/2 z-10 flex w-[min(92vw,560px)] -translate-x-1/2 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-center text-[10px] leading-relaxed font-medium shadow-lg backdrop-blur-md sm:bottom-3 sm:text-[11px] ${warning || placement?.valid === false ? 'border-amber-300/50 bg-[#3b2715]/95 text-amber-100' : 'border-white/15 bg-[#071d29]/90 text-white'}`}
      role="status"
    >
      <MousePointer2 size={13} className="shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  )
}
