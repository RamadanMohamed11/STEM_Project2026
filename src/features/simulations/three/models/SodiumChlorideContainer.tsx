import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector2, type Group } from 'three'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { boundedFraction } from '../effects/effectMath'
import { GlassVesselShell } from './GlassVesselShell'
import { SaltCrystalCluster } from './SaltCrystalCluster'
import { SurfaceLabel } from './SurfaceLabel'

interface SodiumChlorideContainerProps {
  selected: boolean
  /** Remaining dry NaCl mass in grams; 100 g denotes a full demonstration jar. */
  remainingSaltG?: number
}

const jarProfile = [
  [0, 0.024],
  [0.202, 0.024],
  [0.224, 0.036],
  [0.232, 0.051],
  [0.238, 0.717],
  [0.231, 0.742],
  [0.225, 0.754],
  [0.219, 0.762],
  [0.212, 0.759],
  [0.209, 0.752],
  [0.216, 0.715],
  [0.211, 0.077],
  [0.2, 0.065],
  [0, 0.065],
].map(([radius, height]) => new Vector2(radius, height))

const crystals = Array.from({ length: 72 }, (_, index) => {
  const angle = index * 2.399963
  const radial = Math.sqrt((index + 0.5) / 72) * 0.193
  return {
    x: Math.cos(angle) * radial,
    z: Math.sin(angle) * radial,
    y: 0.002 + (index % 3) * 0.002,
    size: 0.007 + (index % 4) * 0.002,
    rotation: angle,
  }
})
const lidGrooves = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2
  return { x: Math.sin(angle) * 0.257, z: Math.cos(angle) * 0.257, angle }
})

export function SodiumChlorideContainer({
  selected,
  remainingSaltG = 100,
}: SodiumChlorideContainerProps) {
  const fraction = boundedFraction(remainingSaltG, 100)
  const height = fraction * 0.39
  const lid = useRef<Group>(null)
  const draggingSpatula = useLabSceneStore((state) => state.draggingId === 'spatula')
  const positions = useLabSceneStore((state) => state.positions)
  const jarPosition = positions['sodium-chloride']
  const spatulaPosition = positions.spatula
  const automatedScoop = useSaltSimulationStore(
    (state) => state.transfer?.method === 'scoop' && state.transfer.sourceId === 'sodium-chloride',
  )
  const nearScoop =
    automatedScoop ||
    Boolean(
      draggingSpatula &&
      jarPosition &&
      spatulaPosition &&
      Math.hypot(jarPosition.x - spatulaPosition.x, jarPosition.z - spatulaPosition.z) < 1.12,
    )

  useFrame((_, delta) => {
    if (!lid.current) return
    const blend = 1 - Math.exp(-12 * Math.min(delta, 0.1))
    // Lift the screw cap clear, rather than depicting a nonexistent hinge through the mouth.
    lid.current.position.x += ((nearScoop ? 0.34 : 0) - lid.current.position.x) * blend
    lid.current.position.y += ((nearScoop ? 1.02 : 0.778) - lid.current.position.y) * blend
    lid.current.rotation.z += ((nearScoop ? -0.65 : 0) - lid.current.rotation.z) * blend
  })

  return (
    <group>
      {/* Stock height is a constant-bore teaching approximation; zero stock is truly empty. */}
      {height > 0 && (
        <group>
          <mesh position={[0, 0.065 + height / 2, 0]} scale={[1, height, 1]} receiveShadow>
            <cylinderGeometry args={[0.205, 0.205, 1, 56]} />
            <meshStandardMaterial color="#ffffff" roughness={0.94} />
          </mesh>
          <group position={[0, 0.065 + height, 0]} scale={[1, Math.min(1, height / 0.02), 1]}>
            <SaltCrystalCluster crystals={crystals} count={crystals.length} />
          </group>
        </group>
      )}
      <GlassVesselShell profile={jarProfile} selected={selected} />
      <group position={[0, 0.35, 0]} rotation={[0, 0.25, 0]}>
        <SurfaceLabel
          lines={['NaCl', 'SODIUM CHLORIDE', '100 g INITIAL STOCK']}
          width={0.36}
          height={0.19}
          radius={0.237}
          color="#0d1b2a"
          background="#ffffff"
        />
      </group>
      {[0.717, 0.735].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.229, 0.003, 6, 48]} />
          <meshPhysicalMaterial
            color="#cde1f2"
            transparent
            opacity={0.52}
            roughness={0.21}
            depthWrite={false}
          />
        </mesh>
      ))}
      <group ref={lid} position={[0, 0.778, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.255, 0.259, 0.085, 56]} />
          <meshStandardMaterial color={selected ? '#1b3a6b' : '#3d5a80'} roughness={0.52} />
        </mesh>
        <mesh position={[0, 0.044, 0]}>
          <cylinderGeometry args={[0.245, 0.254, 0.009, 56]} />
          <meshStandardMaterial color="#6b8cae" roughness={0.58} />
        </mesh>
        {lidGrooves.map(({ x, z, angle }) => (
          <mesh key={angle} position={[x, 0, z]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.0035, 0.063, 0.003]} />
            <meshStandardMaterial color="#6b8cae" roughness={0.59} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
