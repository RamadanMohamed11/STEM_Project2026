import { Vector2 } from 'three'
import { GlassVesselShell } from './GlassVesselShell'
import { SurfaceLabel } from './SurfaceLabel'
import { VesselContents } from './VesselContents'
import { VesselMarkings } from './VesselMarkings'

interface BeakerProps {
  selected: boolean
  /** Current water volume, clamped visually to 0–250 mL. */
  waterMl?: number
}

// Retain the registered bore, lip height and floor. The return path is the inner wall.
const glassProfile = [
  [0, 0.035],
  [0.224, 0.035],
  [0.245, 0.041],
  [0.257, 0.049],
  [0.262, 0.055],
  [0.273, 0.66],
  [0.278, 0.746],
  [0.291, 0.755],
  [0.297, 0.765],
  [0.292, 0.774],
  [0.279, 0.78],
  [0.266, 0.775],
  [0.255, 0.759],
  [0.251, 0.666],
  [0.242, 0.101],
  [0.234, 0.09],
  [0, 0.088],
].map(([radius, height]) => new Vector2(radius, height))

export function Beaker({ selected, waterMl = 0 }: BeakerProps) {
  return (
    <group>
      <GlassVesselShell profile={glassProfile} selected={selected} />
      <VesselContents
        volumeMl={waterMl}
        capacityMl={250}
        bottomY={0.09}
        maxHeight={0.65}
        radius={0.236}
      />
      <mesh position={[0, 0.769, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.281, 0.005, 8, 64]} />
        <meshPhysicalMaterial
          color="#e8f1fa"
          transparent
          opacity={0.63}
          depthWrite={false}
          roughness={0.14}
          clearcoat={0.8}
        />
      </mesh>
      <mesh position={[0, 0.054, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.251, 0.004, 8, 56]} />
        <meshPhysicalMaterial
          color="#cde1f2"
          transparent
          opacity={0.38}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>
      <VesselMarkings
        capacityMl={250}
        stepMl={25}
        labelEveryMl={50}
        bottomY={0.09}
        maxHeight={0.65}
        radiusBottom={0.2626}
        radiusTop={0.2776}
      />
      <group position={[0, 0.49, 0]} rotation={[0, 1.7, 0]}>
        <SurfaceLabel
          lines={['250 mL', 'APPROX. VOL.']}
          width={0.2}
          height={0.085}
          radius={0.271}
        />
      </group>
    </group>
  )
}
