import { BackSide, FrontSide, type Vector2 } from 'three'

interface GlassVesselShellProps {
  profile: Vector2[]
  segments?: number
  selected: boolean
  tint?: string
}

/**
 * Two inexpensive, transmission-free glass passes: shaded rear glass gives the
 * vessel a readable silhouette and a paler front pass leaves the fill visible.
 * Both use the same physical profile and introduce no new collision geometry.
 */
export function GlassVesselShell({
  profile,
  segments = 48,
  selected,
  tint = '#d4edf1',
}: GlassVesselShellProps) {
  return (
    <group>
      <mesh receiveShadow renderOrder={2}>
        <latheGeometry args={[profile, segments]} />
        <meshPhysicalMaterial
          color="#78aab7"
          side={BackSide}
          transparent
          opacity={0.33}
          depthWrite={false}
          metalness={0}
          roughness={0.21}
          clearcoat={0.55}
          clearcoatRoughness={0.15}
        />
      </mesh>
      <mesh receiveShadow renderOrder={5}>
        <latheGeometry args={[profile, segments]} />
        <meshPhysicalMaterial
          color={tint}
          side={FrontSide}
          transparent
          opacity={0.43}
          depthWrite={false}
          metalness={0.01}
          roughness={0.13}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
          emissive={selected ? '#1f93a3' : '#000000'}
          emissiveIntensity={selected ? 0.13 : 0}
        />
      </mesh>
    </group>
  )
}
