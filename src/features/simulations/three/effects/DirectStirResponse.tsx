import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { useSaltSimulationStore } from '../../state/useSaltSimulationStore.ts'
import { getLiquidSurfaceHeight } from '../equipmentPose.ts'
import { readEquipmentPointWorld, visualAnchors } from '../equipmentVisualAnchors.ts'

/** Restrained surface response only to accepted circular rod motion. No bubbles. */
export function DirectStirResponse() {
  const rings = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = rings.current
    if (!group) return
    const until = visualAnchors.get('stirring-rod')?.userData.stirringUntil
    const now = performance.now()
    const volume = useSaltSimulationStore.getState().experiment.waterMl.beaker
    group.visible = typeof until === 'number' && Number.isFinite(until) && until > now && volume > 0
    if (!group.visible) return
    const surface = getLiquidSurfaceHeight('beaker', volume)
    if (!readEquipmentPointWorld('beaker', 0, surface + 0.002, 0, group.position)) {
      group.visible = false
      return
    }
    const fade = Math.min(1, (until - now) / 220)
    for (let index = 0; index < group.children.length; index += 1) {
      const ring = group.children[index] as Mesh
      const phase = (clock.elapsedTime * 1.15 + index / 3) % 1
      ring.scale.setScalar(0.3 + phase * 0.65)
      ;(ring.material as MeshBasicMaterial).opacity = (1 - phase) * 0.18 * fade
    }
  })

  return (
    <group ref={rings} visible={false} raycast={() => undefined}>
      {[0, 1, 2].map((index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
          <torusGeometry args={[0.2, 0.0018, 4, 40]} />
          <meshBasicMaterial color="#b2edf4" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
