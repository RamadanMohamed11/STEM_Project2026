import { Vector2 } from 'three'
import { GlassVesselShell } from './GlassVesselShell'
import { SurfaceLabel } from './SurfaceLabel'
import { VesselContents } from './VesselContents'
import { VesselMarkings } from './VesselMarkings'

interface GraduatedCylinderProps {
  selected: boolean
  /** Measured volume, clamped visually to 0–100 mL. */
  waterMl?: number
}

const tubeProfile = [
  [0, 0.168],
  [0.092, 0.168],
  [0.108, 0.178],
  [0.115, 0.188],
  [0.115, 1.075],
  [0.121, 1.101],
  [0.126, 1.119],
  [0.12, 1.126],
  [0.109, 1.129],
  [0.101, 1.119],
  [0.097, 1.104],
  [0.097, 0.208],
  [0.09, 0.198],
  [0, 0.198],
].map(([radius, height]) => new Vector2(radius, height))

export function GraduatedCylinder({ selected, waterMl = 0 }: GraduatedCylinderProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.027, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.221, 0.23, 0.054, 6, 1]} />
        <meshStandardMaterial color="#c4ceca" roughness={0.52} metalness={0} />
      </mesh>
      <mesh receiveShadow position={[0, 0.059, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.195, 0.209, 0.022, 6]} />
        <meshStandardMaterial color="#e4e9e4" roughness={0.4} metalness={0} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.121, 0]}>
        <cylinderGeometry args={[0.061, 0.075, 0.116, 40]} />
        <meshPhysicalMaterial color="#e0e8e2" roughness={0.3} clearcoat={0.25} />
      </mesh>
      <GlassVesselShell profile={tubeProfile} selected={selected} />
      <VesselContents
        volumeMl={waterMl}
        capacityMl={100}
        bottomY={0.2}
        maxHeight={0.874}
        radius={0.092}
      />
      <mesh position={[0, 1.123, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.113, 0.0045, 8, 56]} />
        <meshPhysicalMaterial
          color="#deece7"
          roughness={0.12}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      <VesselMarkings
        capacityMl={100}
        stepMl={2}
        labelEveryMl={10}
        bottomY={0.2}
        maxHeight={0.874}
        radiusBottom={0.115}
        radiusTop={0.115}
        textHeight={0.027}
      />
      <group position={[0, 0.96, 0]} rotation={[0, 1.7, 0]}>
        <SurfaceLabel lines={['100 mL']} width={0.11} height={0.03} radius={0.116} />
      </group>
    </group>
  )
}
