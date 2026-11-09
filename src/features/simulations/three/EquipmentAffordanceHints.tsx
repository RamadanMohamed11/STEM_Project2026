import { Html } from '@react-three/drei'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { resolveEquipment, BENCH_TOP } from './sceneConfig'

const heights: Record<string, number> = {
  beaker: 0.78,
  'graduated-cylinder': 1.13,
  water: 0.98,
  'sodium-chloride': 0.83,
  'digital-balance': 0.24,
  'stirring-rod': 1.1,
  spatula: 0.31,
  'weighing-boat': 0.18,
}

/** Selection labels are presentation-only; compatibility comes from the domain resolver. */
export function EquipmentAffordanceHints() {
  const selectedIds = useLabSceneStore((state) => state.selectedIds)
  const hoveredId = useLabSceneStore((state) => state.hoveredId)
  const positions = useLabSceneStore((state) => state.positions)
  const dragging = useLabSceneStore((state) => state.draggingId !== null)
  const placing = useLabSceneStore((state) => state.placement !== null)
  const transferring = useSaltSimulationStore((state) => state.transfer !== null)
  if (dragging || placing || transferring) return null
  const ids =
    hoveredId && !selectedIds.includes(hoveredId) ? [...selectedIds, hoveredId] : selectedIds
  return (
    <group>
      {ids.map((id) => {
        const entry = resolveEquipment(id)
        const position = positions[id]
        if (!entry || !position) return null
        return (
          <Html
            key={id}
            center
            position={[position.x, BENCH_TOP + (heights[id] ?? 0.8) + 0.16, position.z]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            zIndexRange={[19, 0]}
          >
            <div className="whitespace-nowrap rounded-md border border-white/25 bg-[#082833]/90 px-2 py-1 text-[10px] font-semibold text-white shadow-md">
              {entry.label}
            </div>
          </Html>
        )
      })}
    </group>
  )
}
