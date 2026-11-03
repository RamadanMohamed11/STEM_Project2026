import { Vector2 } from 'three'
import { LiquidFill } from '../effects/LiquidFill'
import { GlassVesselShell } from './GlassVesselShell'
import { SegmentLabel } from './SegmentLabel'

interface GraduatedCylinderProps {
  selected: boolean
  /** Measured volume, clamped visually to 0–100 mL. */
  waterMl?: number
}

const tubeProfile = [
  [0, 0.168],
  [0.101, 0.168],
  [0.115, 0.188],
  [0.115, 1.075],
  [0.126, 1.119],
  [0.109, 1.129],
  [0.097, 1.104],
  [0.097, 0.198],
  [0, 0.198],
].map(([radius, height]) => new Vector2(radius, height))

// The meniscus and the printed scale reference the same 100 mL / 0.874 m bore.
const graduations = Array.from({ length: 21 }, (_, index) => ({
  volumeMl: index * 5,
  y: 0.2 + (index / 20) * 0.874,
  labelled: index % 4 === 0,
  middle: index % 2 === 0,
}))

export function GraduatedCylinder({ selected, waterMl = 0 }: GraduatedCylinderProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.027, 0]}>
        <cylinderGeometry args={[0.221, 0.23, 0.054, 4, 1]} />
        <meshStandardMaterial color="#ccd8dc" roughness={0.48} metalness={0.13} />
      </mesh>
      <mesh receiveShadow position={[0, 0.059, 0]}>
        <cylinderGeometry args={[0.195, 0.209, 0.022, 4]} />
        <meshStandardMaterial color="#f5f8f9" roughness={0.28} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.121, 0]}>
        <cylinderGeometry args={[0.061, 0.075, 0.116, 40]} />
        <meshStandardMaterial color="#c6d3d9" metalness={0.25} roughness={0.26} />
      </mesh>

      <GlassVesselShell profile={tubeProfile} selected={selected} tint="#d4f3f6" />
      <LiquidFill
        volumeMl={waterMl}
        capacityMl={100}
        bottomY={0.2}
        maxHeight={0.874}
        radius={0.092}
        color="#62c6d8"
      />
      <mesh position={[0, 1.123, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.113, 0.006, 7, 48]} />
        <meshPhysicalMaterial color="#c7e7ed" roughness={0.09} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.186, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.105, 0.004, 5, 36]} />
        <meshStandardMaterial color="#88b5c0" roughness={0.29} />
      </mesh>

      {graduations.map(({ y, volumeMl, labelled, middle }) => (
        <group key={volumeMl}>
          <mesh position={[-0.059, y, 0.106]}>
            <boxGeometry args={[labelled ? 0.065 : middle ? 0.042 : 0.027, 0.0035, 0.003]} />
            <meshStandardMaterial color={selected ? '#005f79' : '#315b68'} roughness={0.35} />
          </mesh>
          {labelled && (
            <group position={[0.036, y, 0.108]}>
              <SegmentLabel
                value={String(volumeMl)}
                height={0.032}
                color={selected ? '#07586a' : '#2e5869'}
              />
            </group>
          )}
        </group>
      ))}
      <mesh position={[0.042, 0.64, 0.104]}>
        <boxGeometry args={[0.006, 0.7, 0.003]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.49} depthWrite={false} />
      </mesh>
      <mesh position={[-0.088, 0.61, 0.058]}>
        <boxGeometry args={[0.003, 0.76, 0.003]} />
        <meshBasicMaterial color="#d7f9ff" transparent opacity={0.44} depthWrite={false} />
      </mesh>
    </group>
  )
}
