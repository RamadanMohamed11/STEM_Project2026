import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { boundedFraction } from './effectMath'

interface LiquidFillProps {
  volumeMl: number
  capacityMl: number
  bottomY: number
  maxHeight: number
  radius: number
  color?: string
}

/**
 * An inexpensive cylindrical fill approximation for vessels with near-constant
 * bore diameter. The geometry is immutable; only transforms change per frame.
 * The surface/meniscus stay at the top, and empty vessels show no liquid.
 */
export function LiquidFill({
  volumeMl,
  capacityMl,
  bottomY,
  maxHeight,
  radius,
  color = '#a8c5e0',
}: LiquidFillProps) {
  const targetHeight = boundedFraction(volumeMl, capacityMl) * maxHeight
  const currentHeight = useRef(targetHeight)
  const body = useRef<Mesh>(null)
  const surface = useRef<Mesh>(null)
  const meniscus = useRef<Mesh>(null)
  const reflectedEdge = useRef<Mesh>(null)

  useFrame((_, delta) => {
    const nextTarget = boundedFraction(volumeMl, capacityMl) * maxHeight
    const previous = currentHeight.current
    const diff = nextTarget - previous
    // Most frames are idle. Avoid touching Three objects once the displayed
    // level matches the authoritative quantity.
    if (diff === 0) return
    const next =
      Math.abs(diff) < 0.0001
        ? nextTarget
        : previous + diff * (1 - Math.exp(-7 * Math.min(delta, 0.1)))
    currentHeight.current = next
    const hasLiquid = next > 0.001

    if (body.current) {
      body.current.visible = hasLiquid
      body.current.scale.y = Math.max(next, 0.00001)
      body.current.position.y = bottomY + next / 2
    }
    if (surface.current) {
      surface.current.visible = hasLiquid
      surface.current.position.y = bottomY + next - 0.002
    }
    if (meniscus.current) {
      meniscus.current.visible = hasLiquid
      meniscus.current.position.y = bottomY + next - 0.001
    }
    if (reflectedEdge.current) {
      reflectedEdge.current.visible = hasLiquid
      reflectedEdge.current.position.y = bottomY + next / 2
      reflectedEdge.current.scale.y = Math.max(next, 0.00001)
    }
  })

  const initialVisible = targetHeight > 0.001

  return (
    <group>
      <mesh
        ref={body}
        renderOrder={3}
        visible={initialVisible}
        position={[0, bottomY + targetHeight / 2, 0]}
        scale={[1, Math.max(targetHeight, 0.00001), 1]}
      >
        <cylinderGeometry args={[radius, radius, 1, 36]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.17}
          clearcoat={0.38}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.61}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={reflectedEdge}
        renderOrder={3}
        visible={initialVisible}
        position={[0, bottomY + targetHeight / 2, 0]}
        scale={[1, Math.max(targetHeight, 0.00001), 1]}
      >
        {/* Narrow glancing reflection along the outer front of the liquid column. */}
        <cylinderGeometry args={[radius + 0.001, radius + 0.001, 1, 16, 1, true, 0.4, 0.35]} />
        <meshBasicMaterial color="#e8f1fa" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh
        ref={surface}
        renderOrder={4}
        visible={initialVisible}
        position={[0, bottomY + targetHeight, 0]}
      >
        <cylinderGeometry args={[radius, radius, 0.004, 36]} />
        <meshPhysicalMaterial
          color="#cde1f2"
          roughness={0.09}
          transparent
          opacity={0.84}
          depthWrite={false}
          clearcoat={0.45}
        />
      </mesh>
      <mesh
        ref={meniscus}
        renderOrder={4}
        visible={initialVisible}
        position={[0, bottomY + targetHeight, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[radius - 0.004, 0.0038, 6, 40]} />
        <meshStandardMaterial
          color="#e8f1fa"
          transparent
          opacity={0.94}
          depthWrite={false}
          roughness={0.19}
        />
      </mesh>
    </group>
  )
}
