/**
 * L10: the particle scene of a container from whichever engine state holds it: the bench's
 * practice liquids, or the salt experiment (projected to the core engine state).
 */
import { useMemo } from 'react'
import { saltCoreExperiment } from '../data/saltCoreDefinition'
import { saltStateToLabState } from '../engine/saltExperiment'
import { buildParticleScene } from '../lib/particleModel'
import { useBenchLiquidsStore } from './useBenchLiquidsStore'
import { useSaltSimulationStore } from './useSaltSimulationStore'

const saltContainerIds = new Set(saltCoreExperiment.chemistry.containers.map((c) => c.id))

export const hasParticleView = (id: string, benchIds: readonly string[]) =>
  benchIds.includes(id) || saltContainerIds.has(id)

export function useParticleScene(containerId: string | null) {
  const benchLab = useBenchLiquidsStore((state) => state.lab)
  const benchDefinition = useBenchLiquidsStore((state) => state.definition)
  const salt = useSaltSimulationStore((state) => state.experiment)
  return useMemo(() => {
    if (!containerId) return null
    if (benchLab.containers[containerId])
      return buildParticleScene(benchDefinition, benchLab, containerId)
    if (saltContainerIds.has(containerId))
      return buildParticleScene(
        saltCoreExperiment.chemistry,
        saltStateToLabState(salt),
        containerId,
      )
    return null
  }, [containerId, benchLab, benchDefinition, salt])
}
