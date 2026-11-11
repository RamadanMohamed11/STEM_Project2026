import { BackSide, FrontSide, type Vector2 } from 'three'
import { glassEdgeOpacity } from './glassMaterial'

interface GlassVesselShellProps {
  profile: Vector2[]
  segments?: number
  selected: boolean
  tint?: string
}

/** Closed wall cross-sections, shaded without screen-space transmission or fake opaque glass. */
export function GlassVesselShell({
  profile,
  segments = 56,
  selected,
  tint = '#e8f1fa',
}: GlassVesselShellProps) {
  return (
    <group>
      <mesh renderOrder={2}>
        <latheGeometry args={[profile, segments]} />
        <meshPhysicalMaterial
          color="#cde1f2"
          side={BackSide}
          transparent
          opacity={0.06}
          depthWrite={false}
          metalness={0}
          roughness={0.16}
          clearcoat={0.65}
          clearcoatRoughness={0.1}
          envMapIntensity={0.65}
        />
      </mesh>
      <mesh renderOrder={5}>
        <latheGeometry args={[profile, segments]} />
        <meshPhysicalMaterial
          color={tint}
          side={FrontSide}
          transparent
          opacity={0.65}
          onBeforeCompile={glassEdgeOpacity}
          depthWrite={false}
          metalness={0}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.07}
          envMapIntensity={0.85}
          emissive={selected ? '#3d5a80' : '#000000'}
          emissiveIntensity={selected ? 0.055 : 0}
        />
      </mesh>
    </group>
  )
}
