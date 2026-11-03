import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { EquipmentRenderer } from './EquipmentRenderer'
import { equipmentRegistry } from './sceneConfig'

export function SceneInteractionManager() {
  const select = useLabSceneStore((state) => state.select)
  const placedIds = useLabSceneStore((state) => state.placedIds)

  return (
    <group onPointerMissed={() => select(null)}>
      {equipmentRegistry
        .filter((entry) => placedIds.includes(entry.id))
        .map((entry) => (
          <EquipmentRenderer key={entry.id} entry={entry} />
        ))}
    </group>
  )
}
