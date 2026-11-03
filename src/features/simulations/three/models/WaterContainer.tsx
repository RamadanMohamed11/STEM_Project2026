import { DoubleSide, Vector2 } from 'three'
import { LiquidFill } from '../effects/LiquidFill'
import { GlassVesselShell } from './GlassVesselShell'
import { SegmentLabel } from './SegmentLabel'

interface WaterContainerProps {
  selected: boolean
  /** Remaining water, clamped visually to 0–500 mL. */
  waterMl?: number
  /** Removes the cap for a pouring demonstration; does not change liquid volume. */
  pouring?: boolean
}

const bottleProfile = [
  [0, 0.026],
  [0.174, 0.026],
  [0.205, 0.052],
  [0.209, 0.14],
  [0.211, 0.62],
  [0.198, 0.704],
  [0.149, 0.762],
  [0.092, 0.801],
  [0.088, 0.89],
  [0.078, 0.903],
  [0.072, 0.882],
  [0.072, 0.795],
  [0.179, 0.694],
  [0.186, 0.13],
  [0.163, 0.064],
  [0, 0.064],
].map(([radius, height]) => new Vector2(radius, height))

const shoulderRidges = [0.13, 0.164, 0.198, 0.232, 0.58, 0.613]
const capGrooves = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2
  return { x: Math.sin(angle) * 0.102, z: Math.cos(angle) * 0.102, angle }
})

export function WaterContainer({ selected, waterMl = 0, pouring = false }: WaterContainerProps) {
  return (
    <group>
      <GlassVesselShell profile={bottleProfile} selected={selected} segments={48} tint="#d2edf3" />
      <LiquidFill
        volumeMl={waterMl}
        capacityMl={500}
        bottomY={0.09}
        maxHeight={0.59}
        radius={0.162}
        color="#55bfd8"
      />
      {shoulderRidges.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.211, 0.003, 6, 56]} />
          <meshStandardMaterial color="#a4cdd6" transparent opacity={0.73} roughness={0.27} />
        </mesh>
      ))}
      <mesh position={[0, 0.402, 0]} receiveShadow>
        <cylinderGeometry args={[0.216, 0.216, 0.202, 56, 1, true]} />
        <meshStandardMaterial color="#f4fbfc" roughness={0.66} metalness={0.03} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.494, 0]}>
        <cylinderGeometry args={[0.217, 0.217, 0.017, 56, 1, true]} />
        <meshStandardMaterial color="#0d8b9c" side={DoubleSide} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.217, 0.217, 0.016, 56, 1, true]} />
        <meshStandardMaterial color="#64bad0" side={DoubleSide} roughness={0.49} />
      </mesh>
      <group position={[-0.078, 0.396, 0.224]}>
        <SegmentLabel value="500" height={0.041} color="#317d91" />
      </group>
      {/* Long neck reflection and side facet remain visible against pale backgrounds. */}
      <mesh position={[0.064, 0.848, 0.061]}>
        <boxGeometry args={[0.005, 0.081, 0.003]} />
        <meshBasicMaterial color="#f7ffff" transparent opacity={0.76} depthWrite={false} />
      </mesh>
      <mesh position={[-0.18, 0.397, 0.095]}>
        <boxGeometry args={[0.006, 0.41, 0.003]} />
        <meshBasicMaterial color="#c6f2fa" transparent opacity={0.43} depthWrite={false} />
      </mesh>
      {/* Raised droplet emblem on the front of the label. */}
      <mesh position={[0, 0.399, 0.218]}>
        <sphereGeometry args={[0.038, 16, 12]} />
        <meshStandardMaterial color="#188fa9" metalness={0.1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.44, 0.219]}>
        <coneGeometry args={[0.039, 0.086, 18]} />
        <meshStandardMaterial color="#188fa9" metalness={0.1} roughness={0.25} />
      </mesh>
      {!pouring && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.922, 0]}>
            <cylinderGeometry args={[0.104, 0.104, 0.092, 40]} />
            <meshStandardMaterial
              color={selected ? '#1890a5' : '#21849b'}
              roughness={0.31}
              metalness={0.13}
            />
          </mesh>
          <mesh position={[0, 0.971, 0]}>
            <cylinderGeometry args={[0.099, 0.099, 0.011, 40]} />
            <meshStandardMaterial color="#4aadc1" roughness={0.23} />
          </mesh>
          {capGrooves.map(({ x, z, angle }) => (
            <mesh key={angle} position={[x, 0.919, z]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.008, 0.064, 0.005]} />
              <meshStandardMaterial color="#60b8cc" roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
