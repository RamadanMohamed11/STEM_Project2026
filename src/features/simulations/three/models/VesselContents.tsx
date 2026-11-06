import { useMemo } from 'react'
import { Vector2 } from 'three'
import { boundedFraction } from '../effects/effectMath'
import { glassEdgeOpacity } from './glassMaterial'

interface VesselContentsProps {
  volumeMl: number
  capacityMl: number
  bottomY: number
  maxHeight: number
  radius: number
}

/** Calibrated display volume, not a fluid solver. No independent or animated quantity. */
export function VesselContents({
  volumeMl,
  capacityMl,
  bottomY,
  maxHeight,
  radius,
}: VesselContentsProps) {
  const height = boundedFraction(volumeMl, capacityMl) * maxHeight
  const meniscusDepth = Math.min(0.003, height * 0.25)
  const surfaceProfile = useMemo(
    () => [
      new Vector2(radius, 0),
      new Vector2(radius - 0.003, -meniscusDepth * 0.4),
      new Vector2(radius - 0.009, -meniscusDepth),
      new Vector2(0, -meniscusDepth),
    ],
    [radius, meniscusDepth],
  )
  if (height <= 0) return null

  return (
    <group name="vessel-contents">
      <mesh
        name="liquid-volume"
        position={[0, bottomY + height / 2, 0]}
        scale={[1, height, 1]}
        renderOrder={3}
      >
        <cylinderGeometry args={[radius, radius, 1, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#d5e9e9"
          transparent
          opacity={0.2}
          depthWrite={false}
          roughness={0.13}
          metalness={0}
          clearcoat={0.8}
          clearcoatRoughness={0.09}
          envMapIntensity={0.65}
        />
      </mesh>
      <mesh name="liquid-surface" position={[0, bottomY + height, 0]} renderOrder={4}>
        <latheGeometry args={[surfaceProfile, 48]} />
        <meshPhysicalMaterial
          color="#e0efed"
          transparent
          opacity={0.65}
          onBeforeCompile={glassEdgeOpacity}
          depthWrite={false}
          roughness={0.1}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={0.8}
        />
      </mesh>
      <mesh
        position={[0, bottomY + height - meniscusDepth * 0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={4}
      >
        <torusGeometry args={[radius - 0.0015, Math.min(0.0015, height * 0.15), 6, 48]} />
        <meshStandardMaterial
          color="#c6dcd3"
          transparent
          opacity={0.55}
          depthWrite={false}
          roughness={0.24}
        />
      </mesh>
    </group>
  )
}
