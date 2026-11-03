import { Vector2 } from 'three'
import { LiquidFill } from '../effects/LiquidFill'
import { GlassVesselShell } from './GlassVesselShell'
import { SegmentLabel } from './SegmentLabel'

interface BeakerProps {
  selected: boolean
  /** Current water volume, clamped visually to 0–250 mL. */
  waterMl?: number
}

// A continuous cross-section gives the vessel a real bottom, rim and inner glass wall.
const glassProfile = [
  [0, 0.035],
  [0.235, 0.035],
  [0.262, 0.055],
  [0.273, 0.66],
  [0.278, 0.746],
  [0.297, 0.765],
  [0.279, 0.78],
  [0.255, 0.759],
  [0.251, 0.666],
  [0.242, 0.088],
  [0, 0.088],
].map(([radius, height]) => new Vector2(radius, height))

const graduations = Array.from({ length: 11 }, (_, index) => ({
  volumeMl: index * 25,
  y: 0.09 + (index / 10) * 0.65,
  labelled: index > 0 && index % 4 === 0,
  long: index % 2 === 0,
}))

export function Beaker({ selected, waterMl = 0 }: BeakerProps) {
  return (
    <group>
      <GlassVesselShell profile={glassProfile} segments={56} selected={selected} tint="#d3f1f4" />

      <LiquidFill
        volumeMl={waterMl}
        capacityMl={250}
        bottomY={0.09}
        maxHeight={0.65}
        radius={0.236}
        color="#67c3d5"
      />

      <mesh position={[0, 0.772, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.282, 0.008, 8, 64]} />
        <meshPhysicalMaterial
          color="#e2f3f7"
          metalness={0.05}
          roughness={0.1}
          transparent
          opacity={0.78}
        />
      </mesh>
      <mesh position={[0, 0.063, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.006, 6, 48]} />
        <meshStandardMaterial color="#8eafb9" roughness={0.27} metalness={0.14} />
      </mesh>
      {/* Raised lip on one side indicates the pouring edge. */}
      <mesh position={[0, 0.776, 0.289]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.029, 16, 10, 0, Math.PI]} />
        <meshPhysicalMaterial color="#deedf0" transparent opacity={0.64} roughness={0.12} />
      </mesh>

      {graduations.map(({ y, long, volumeMl, labelled }) => (
        <group key={volumeMl}>
          <mesh position={[-0.15, y, 0.232]}>
            <boxGeometry args={[long ? 0.073 : 0.038, 0.005, 0.005]} />
            <meshStandardMaterial color={selected ? '#036d7f' : '#315a67'} roughness={0.36} />
          </mesh>
          {labelled && (
            <group position={[-0.046, y, 0.259]}>
              <SegmentLabel value={String(volumeMl)} height={0.033} color="#285665" />
            </group>
          )}
        </group>
      ))}
      <mesh position={[0.095, 0.39, 0.247]} rotation={[0, 0, -0.07]}>
        <boxGeometry args={[0.012, 0.53, 0.003]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.52} depthWrite={false} />
      </mesh>
      <mesh position={[-0.225, 0.42, 0.129]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[0.008, 0.45, 0.003]} />
        <meshBasicMaterial color="#dbfbff" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}
