import { saltExperimentDefinition } from '../data/saltExperimentDefinition.ts'
import { getLaboratoryPresentation } from './workspaceSelectors.ts'
import type { Experiment } from '../../../types/experiment.ts'

/** Register only implemented engine adapters. A presentation alone is not a playable experiment. */
export function resolveSimulation(experiment: Experiment | undefined) {
  if (experiment?.status !== 'demo' || experiment.id !== saltExperimentDefinition.experimentId)
    return undefined
  const presentation = getLaboratoryPresentation(experiment.id)
  if (
    !presentation ||
    presentation.experimentId !== saltExperimentDefinition.experimentId ||
    saltExperimentDefinition.chemistryEngine !== 'salt-dissolution'
  )
    return undefined
  return { definition: saltExperimentDefinition, presentation }
}

export type SimulationRegistration = NonNullable<ReturnType<typeof resolveSimulation>>

/** Stable compatibility alias, independent of catalog ordering or future available entries. */
export const previewExperimentId = saltExperimentDefinition.experimentId
