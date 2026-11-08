import { useLabSceneStore } from '../state/useLabSceneStore'
import { WASTE_BIN } from './benchLayout'

/**
 * L3: the waste-bin corner on the bench. Brighter while an item is being dragged.
 * Purely visual: removal is decided by `isOverWasteBin` when the drag ends.
 */
export function WasteBinMarker() {
  const dragging = useLabSceneStore((state) => state.draggingId !== null)
  const ring = dragging ? '#e05a4f' : '#b4544c'
  return (
    <group position={[WASTE_BIN.x, WASTE_BIN.y, WASTE_BIN.z]} name="waste-bin">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[WASTE_BIN.radius - 0.035, WASTE_BIN.radius, 48]} />
        <meshStandardMaterial color={ring} transparent opacity={dragging ? 0.95 : 0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[WASTE_BIN.radius - 0.035, 48]} />
        <meshStandardMaterial color="#f3dcd9" transparent opacity={dragging ? 0.55 : 0.3} />
      </mesh>
      {/* Simple bin glyph: body and lid. */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.06, 0.14, 20]} />
        <meshStandardMaterial color="#7e8f97" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.148, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.014, 20]} />
        <meshStandardMaterial color="#5f6f77" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  )
}
