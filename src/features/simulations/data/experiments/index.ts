import type { CoreExperimentDefinition } from '../../engine/core/index.ts'
import { sodiumWaterCoreExperiment } from './sodiumWaterDefinition.ts'
import { silverNitratePrecipitationCoreExperiment } from './silverNitratePrecipitationDefinition.ts'
import { calciumCarbonateHclCoreExperiment } from './calciumCarbonateHclDefinition.ts'
import { flameTestsCoreExperiment } from './flameTestsDefinition.ts'
import { acidBaseTitrationCoreExperiment } from './acidBaseTitrationDefinition.ts'
import { copperSulfateCrystallizationCoreExperiment } from './copperSulfateCrystallizationDefinition.ts'

export {
  sodiumWaterCoreExperiment,
  silverNitratePrecipitationCoreExperiment,
  calciumCarbonateHclCoreExperiment,
  flameTestsCoreExperiment,
  acidBaseTitrationCoreExperiment,
  copperSulfateCrystallizationCoreExperiment,
}

export const l11CoreExperiments: readonly CoreExperimentDefinition[] = [
  sodiumWaterCoreExperiment,
  silverNitratePrecipitationCoreExperiment,
  calciumCarbonateHclCoreExperiment,
  flameTestsCoreExperiment,
  acidBaseTitrationCoreExperiment,
  copperSulfateCrystallizationCoreExperiment,
]

export const coreExperimentsById: ReadonlyMap<string, CoreExperimentDefinition> = new Map(
  l11CoreExperiments.map((def) => [def.experimentId, def]),
)

export function getL11CoreExperiment(experimentId: string): CoreExperimentDefinition | undefined {
  return coreExperimentsById.get(experimentId)
}
