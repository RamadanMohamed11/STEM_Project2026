import { useLabSceneStore } from './useLabSceneStore.ts'
import { useMeasurementLogStore } from './useMeasurementLogStore.ts'
import { useSaltSimulationStore } from './useSaltSimulationStore.ts'

/**
 * One user-facing retry boundary. Reset simulation first to cancel any
 * in-flight effect, then restore spatial equipment and the default camera.
 * Components can also key local form controls to resetRevision.
 */
export function restartExperimentSession(): void {
  useSaltSimulationStore.getState().reset()
  // L8: a restarted experiment starts a fresh measurement log.
  useMeasurementLogStore.getState().clear()
  const scene = useLabSceneStore.getState()
  scene.resetEquipment()
  scene.resetCamera()
}

/** Drop presentation-only work on navigation. The transfer controller owns its safe interrupted return. */
export function suspendLaboratoryInteractions(): void {
  const session = useSaltSimulationStore.getState()
  if (session.effect) session.stopEffect(session.effect.id)
  session.stopStream()
  const scene = useLabSceneStore.getState()
  if (scene.placement) scene.cancelPlacement()
  if (scene.pressedId) scene.endPress()
  if (scene.draggingId) scene.finishDrag()
  if (scene.hoveredId) scene.setHovered(null)
}
