import { useEffect } from 'react'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { EquipmentRenderer } from './EquipmentRenderer'
import { resolveEquipment, type EquipmentRegistryEntry } from './sceneConfig'

export function SceneInteractionManager() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const scene = useLabSceneStore.getState()
      if (
        event.key === 'Escape' &&
        !scene.pressedId &&
        !scene.draggingId &&
        !scene.placement &&
        !useSaltSimulationStore.getState().transfer
      )
        scene.clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const placedIds = useLabSceneStore((state) => state.placedIds)

  return (
    <group>
      {/* L3: render every placed id, including extra instances such as 'beaker~2'. */}
      {placedIds
        .map(resolveEquipment)
        .filter((entry): entry is EquipmentRegistryEntry => entry !== undefined)
        .map((entry) => (
          <EquipmentRenderer key={entry.id} entry={entry} />
        ))}
    </group>
  )
}
