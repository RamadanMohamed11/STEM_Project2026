import type { Experiment } from '../../../types/experiment.ts'
import type { HazardId } from '../data/hazards.ts'
import { getHazards } from '../data/hazards.ts'

export function getExperimentHazardIds(
  experiment: Pick<Experiment, 'hazards' | 'safety' | 'hazardSteps'>,
  materials: readonly { hazards?: readonly HazardId[] }[] = [],
): readonly HazardId[] {
  return getHazards([
    ...(experiment.hazards ?? []),
    ...(experiment.safety?.hazards ?? []),
    ...(experiment.hazardSteps ?? []).flatMap((step) => step.hazards),
    ...materials.flatMap((item) => item.hazards ?? []),
  ]).map((item) => item.id)
}
export function requiresHazardAcknowledgement(
  experiment: Pick<Experiment, 'hazards' | 'safety' | 'hazardSteps'>,
  ids = getExperimentHazardIds(experiment),
): boolean {
  return experiment.safety?.level === 'high' && ids.length > 0
}
export function hazardAcknowledgementKey(
  experiment: Experiment,
  ids = getExperimentHazardIds(experiment),
): string {
  return JSON.stringify([
    experiment.id,
    experiment.safety?.level,
    [...ids].sort(),
    experiment.hazardSteps ?? [],
  ])
}
