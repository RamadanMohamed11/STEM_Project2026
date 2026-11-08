import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import {
  equipmentRegistry,
  isChemistryLinked,
  resolveEquipment,
  type EquipmentRegistryEntry,
} from '../three/sceneConfig.ts'
import { useLabSceneStore } from './useLabSceneStore.ts'
import { useSaltSimulationStore } from './useSaltSimulationStore.ts'

export type InteractionStatus = 'idle' | 'placing' | 'dragging' | 'animating'

/** Cross-store summary for diagnostics, reports and future save/load operations. */
export function getExperimentSessionSnapshot() {
  const spatial = useLabSceneStore.getState()
  const educational = useSaltSimulationStore.getState()
  const interactionStatus: InteractionStatus =
    educational.effect || educational.livePour
      ? 'animating'
      : spatial.placement
        ? 'placing'
        : spatial.draggingId
          ? 'dragging'
          : 'idle'

  return {
    activeExperimentId: educational.activeExperimentId,
    definitionId: educational.definitionId,
    definitionVersion: educational.definitionVersion,
    currentStepIndex: educational.workflow.stepIndex,
    currentStageIndex: educational.workflow.stageIndex,
    experimentCompleted: educational.workflow.completed,
    selectedEquipmentId: spatial.selectedId,
    interactionStatus,
    equipmentInstances: [
      ...equipmentRegistry,
      ...spatial.placedIds
        .filter((id) => !isChemistryLinked(id))
        .map(resolveEquipment)
        .filter((item): item is EquipmentRegistryEntry => item !== undefined),
    ].map((item) => ({
      id: item.id,
      equipmentType: item.visual,
      placed: spatial.placedIds.includes(item.id),
      position: { ...(spatial.positions[item.id] ?? item.defaultPosition) },
      rotationY: spatial.rotations[item.id] ?? 0,
    })),
    containers: { ...educational.experiment.waterMl },
    substances: {
      saltStockG: educational.experiment.saltStockG,
      saltOnSpatulaG: educational.experiment.saltOnSpatulaG,
      saltOnBoatG: educational.experiment.saltOnBoatG,
      saltInBeakerG: educational.experiment.saltInBeakerG,
      dissolvedSaltG: educational.experiment.dissolvedSaltG,
    },
    measurements: { ...educational.workflow.measurements },
    modelBalanceNetG:
      spatial.relationships['weighing-boat']?.targetId === 'digital-balance'
        ? educational.experiment.saltOnBoatG
        : null,
    validation: educational.validation ?? educational.workflow.validation,
    safetyWarnings: saltExperimentDefinition.safetyRules.map((rule) => ({
      id: rule.id,
      message: rule.instruction,
      blocking: rule.required && !educational.workflow.safetyAcknowledged,
    })),
  }
}
