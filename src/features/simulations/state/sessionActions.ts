import { useLabSceneStore } from './useLabSceneStore.ts'
import { useSaltSimulationStore } from './useSaltSimulationStore.ts'

/**
 * One user-facing retry boundary. Reset simulation first to cancel any
 * in-flight effect, then restore spatial equipment and the default camera.
 * Components can also key local form controls to resetRevision.
 */
export function restartExperimentSession(): void {
  useSaltSimulationStore.getState().reset()
  const scene = useLabSceneStore.getState()
  scene.resetEquipment()
  scene.resetCamera()
}
