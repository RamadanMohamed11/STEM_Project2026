import type { Experiment } from '@/types/experiment'
import { useSyncExternalStore } from 'react'
import { resolveSimulation } from '../lib/simulationRegistry'
import { getSimulationSessionStatus } from './simulationSession'
import { useSaltSimulationStore } from './useSaltSimulationStore'
import { useLabSceneStore } from './useLabSceneStore'
// Hydrates the implemented adapter before the first session snapshot is read.
import './labSessionPersistence.ts'

const getPlacedIds = () => useLabSceneStore.getState().placedIds

export function useSimulationSession(experiment: Experiment | undefined) {
  // Read the same authoritative snapshot for client navigation and static rendering.
  // No server session or second copy of scientific state is created.
  const state = useSyncExternalStore(
    useSaltSimulationStore.subscribe,
    useSaltSimulationStore.getState,
    useSaltSimulationStore.getState,
  )
  const placedIds = useSyncExternalStore(useLabSceneStore.subscribe, getPlacedIds, getPlacedIds)
  const simulation = resolveSimulation(experiment)
  return {
    state,
    placedIds,
    simulation,
    ...getSimulationSessionStatus(simulation, state, { placedIds }),
  }
}
