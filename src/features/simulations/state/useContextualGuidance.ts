import { getContextualGuidance } from '../lib/contextualGuidance'
import { useLabSceneStore } from './useLabSceneStore'
import { useSaltSimulationStore } from './useSaltSimulationStore'

/** Isolated to guidance UI so high-frequency positions do not rerender the entire lab shell. */
export function useContextualGuidance() {
  const workflow = useSaltSimulationStore((state) => state.workflow)
  const experiment = useSaltSimulationStore((state) => state.experiment)
  const livePour = useSaltSimulationStore((state) => state.livePour)
  const validation = useSaltSimulationStore((state) => state.validation)
  const feedback = useSaltSimulationStore((state) => state.feedback)
  const events = useSaltSimulationStore((state) => state.events)

  const placedIds = useLabSceneStore((state) => state.placedIds)
  const selectedId = useLabSceneStore((state) => state.selectedId)
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
  const draggingId = useLabSceneStore((state) => state.draggingId)
  const positions = useLabSceneStore((state) => state.positions)
  const relationships = useLabSceneStore((state) => state.relationships)
  const placementId = useLabSceneStore((state) => state.placement?.id ?? null)

  return getContextualGuidance({
    workflow,
    experiment,
    placedIds,
    selectedId,
    hoveredId,
    draggingId,
    positions,
    relationships,
    livePour,
    validation,
    feedback,
    events,
    placementId,
  })
}
