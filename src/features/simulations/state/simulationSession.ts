import type { SimulationRegistration } from '../lib/simulationRegistry.ts'
import type { useSaltSimulationStore } from './useSaltSimulationStore.ts'
import type { useLabSceneStore } from './useLabSceneStore.ts'

export const sessionLifetimeMessage =
  'Your lab session is saved in this tab. Refresh to continue. A new tab starts fresh. Changes from the last second may not be saved.'

/** Derived navigation state only. The workflow engine owns completion and all recorded quantities. */
export function getSimulationSessionStatus(
  simulation: SimulationRegistration | undefined,
  state: ReturnType<typeof useSaltSimulationStore.getState>,
  scene: Pick<ReturnType<typeof useLabSceneStore.getState>, 'placedIds'>,
) {
  if (!simulation)
    return { phase: 'unavailable' as const, completed: false, started: false, validatedSteps: 0 }
  const definition = simulation.definition
  const matching =
    state.activeExperimentId === definition.experimentId &&
    state.definitionId === definition.id &&
    state.definitionVersion === definition.version
  if (!matching)
    return { phase: 'incompatible' as const, completed: false, started: false, validatedSteps: 0 }
  const completed = state.workflow.completed
  const started =
    completed ||
    state.workflow.safetyAcknowledged ||
    state.workflow.stepIndex > 0 ||
    state.experiment.operations > 0 ||
    scene.placedIds.some((id) => !definition.initialConditions.placedIds.includes(id))
  return {
    phase: completed
      ? ('completed' as const)
      : started
        ? ('in-progress' as const)
        : ('ready' as const),
    completed,
    started,
    validatedSteps: completed ? definition.steps.length : state.workflow.stepIndex,
  }
}
