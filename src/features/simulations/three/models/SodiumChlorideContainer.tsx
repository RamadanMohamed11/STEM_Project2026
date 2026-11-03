import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { DoubleSide, Vector2 } from 'three'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { boundedFraction } from '../effects/effectMath'
import { GlassVesselShell } from './GlassVesselShell'

interface SodiumChlorideContainerProps {
  selected: boolean
  /** Remaining dry NaCl mass in grams; 100 g denotes a full demonstration jar. */
  remainingSaltG?: number
}

const jarProfile = [
  [0, 0.024],
  [0.211, 0.024],
  [0.232, 0.051],
  [0.238, 0.717],
  [0.225, 0.754],
  [0.219, 0.762],
  [0.209, 0.752],
  [0.216, 0.715],
  [0.211, 0.065],
  [0, 0.065],
].map(([radius, height]) => new Vector2(radius, height))

const crystals = [
  { x: -0.113, z: -0.044, y: 0.453, s: 0.042, r: 0.21 },
  { x: -0.049, z: -0.096, y: 0.45, s: 0.047, r: -0.29 },
  { x: 0.062, z: -0.094, y: 0.455, s: 0.045, r: 0.14 },
  { x: 0.136, z: 0.005, y: 0.455, s: 0.043, r: -0.12 },
  { x: 0.052, z: 0.107, y: 0.453, s: 0.038, r: 0.33 },
  { x: -0.072, z: 0.112, y: 0.456, s: 0.047, r: 0.27 },
  { x: 0, z: 0, y: 0.462, s: 0.063, r: 0.17 },
  { x: -0.012, z: -0.15, y: 0.444, s: 0.036, r: 0.47 },
]

const lidGrooves = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * 2 * Math.PI
  return { x: Math.sin(angle) * 0.253, z: Math.cos(angle) * 0.253, angle }
})

const SALT_BOTTOM = 0.065
const SALT_MAX_HEIGHT = 0.39

export function SodiumChlorideContainer({
  selected,
  remainingSaltG = 100,
}: SodiumChlorideContainerProps) {
  const initialHeight = boundedFraction(remainingSaltG, 100) * SALT_MAX_HEIGHT
  const height = useRef(initialHeight)
  const saltBody = useRef<Mesh>(null)
  const surfaceCrystals = useRef<Group>(null)
  const lid = useRef<Group>(null)
  const draggingSpatula = useLabSceneStore((state) => state.draggingId === 'spatula')
  const positions = useLabSceneStore((state) => state.positions)
  const jarPosition = positions['sodium-chloride']
  const spatulaPosition = positions.spatula
  const nearScoop = Boolean(
    draggingSpatula &&
    jarPosition &&
    spatulaPosition &&
    Math.hypot(jarPosition.x - spatulaPosition.x, jarPosition.z - spatulaPosition.z) < 1.12,
  )

  useFrame((_, delta) => {
    if (lid.current) {
      const desiredAngle = nearScoop ? -1.23 : 0
      lid.current.rotation.z +=
        (desiredAngle - lid.current.rotation.z) * (1 - Math.exp(-12 * Math.min(delta, 0.1)))
    }
    const target = boundedFraction(remainingSaltG, 100) * SALT_MAX_HEIGHT
    const difference = target - height.current
    if (difference === 0) return
    const next =
      Math.abs(difference) < 0.0001
        ? target
        : height.current + difference * (1 - Math.exp(-7 * Math.min(delta, 0.1)))
    height.current = next
    if (saltBody.current) {
      saltBody.current.visible = next > 0.001
      saltBody.current.scale.y = Math.max(next, 0.00001)
      saltBody.current.position.y = SALT_BOTTOM + next / 2
    }
    if (surfaceCrystals.current) {
      surfaceCrystals.current.visible = next > 0.04
      surfaceCrystals.current.position.y = SALT_BOTTOM + next
    }
  })

  return (
    <group>
      {/* Constant jar diameter makes mass-proportional height a teaching approximation. */}
      <mesh
        ref={saltBody}
        visible={initialHeight > 0.001}
        position={[0, SALT_BOTTOM + initialHeight / 2, 0]}
        scale={[1, Math.max(initialHeight, 0.00001), 1]}
        receiveShadow
      >
        <cylinderGeometry args={[0.205, 0.205, 1, 48]} />
        <meshStandardMaterial color="#f2f6f5" roughness={0.91} />
      </mesh>
      <group
        ref={surfaceCrystals}
        visible={initialHeight > 0.04}
        position={[0, SALT_BOTTOM + initialHeight, 0]}
      >
        {crystals.map(({ x, z, y, s, r }, index) => (
          <mesh
            key={index}
            castShadow
            receiveShadow
            position={[x, y - (SALT_BOTTOM + SALT_MAX_HEIGHT), z]}
            rotation={[0, r, r / 3]}
          >
            <boxGeometry args={[s, s, s]} />
            <meshStandardMaterial color="#f7fbfa" roughness={0.62} metalness={0.02} />
          </mesh>
        ))}
      </group>
      <GlassVesselShell profile={jarProfile} selected={selected} segments={48} tint="#dfedef" />
      <mesh position={[0, 0.352, 0]} receiveShadow>
        <cylinderGeometry args={[0.243, 0.243, 0.236, 56, 1, true]} />
        <meshStandardMaterial color="#f8fbfa" side={DoubleSide} roughness={0.73} />
      </mesh>
      <mesh position={[0, 0.468, 0]}>
        <cylinderGeometry args={[0.244, 0.244, 0.025, 56, 1, true]} />
        <meshStandardMaterial color="#118b96" roughness={0.43} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.233, 0]}>
        <cylinderGeometry args={[0.244, 0.244, 0.014, 56, 1, true]} />
        <meshStandardMaterial color="#8ac6cd" roughness={0.53} side={DoubleSide} />
      </mesh>
      <mesh position={[-0.18, 0.59, 0.127]}>
        <boxGeometry args={[0.009, 0.19, 0.003]} />
        <meshBasicMaterial color="#f7ffff" transparent opacity={0.47} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.005, 6, 48]} />
        <meshStandardMaterial color="#b9d9df" metalness={0.13} roughness={0.25} />
      </mesh>
      {/* Cubic lattice graphic identifies the NaCl jar without label sprites. */}
      {[
        [-0.045, 0.358, 0.253],
        [0.015, 0.358, 0.253],
        [-0.015, 0.4, 0.253],
        [0.052, 0.403, 0.249],
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]} rotation={[0, 0.24, 0.22]}>
          <boxGeometry args={[0.037, 0.037, 0.012]} />
          <meshStandardMaterial color={index % 2 ? '#b9dbe0' : '#2b8b9f'} roughness={0.35} />
        </mesh>
      ))}
      {/* Swing the existing lid away when the physical spatula is brought to the jar. */}
      <group ref={lid} position={[0.225, 0.778, 0]}>
        <group position={[-0.225, -0.778, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.778, 0]}>
            <cylinderGeometry args={[0.262, 0.257, 0.085, 56]} />
            <meshStandardMaterial
              color={selected ? '#4d828c' : '#607783'}
              metalness={0.12}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0.825, 0]}>
            <cylinderGeometry args={[0.258, 0.258, 0.01, 56]} />
            <meshStandardMaterial color="#a9bbc1" roughness={0.29} />
          </mesh>
          {lidGrooves.map(({ x, z, angle }) => (
            <mesh key={angle} position={[x, 0.779, z]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.008, 0.066, 0.004]} />
              <meshStandardMaterial color="#a4b8bf" roughness={0.47} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
