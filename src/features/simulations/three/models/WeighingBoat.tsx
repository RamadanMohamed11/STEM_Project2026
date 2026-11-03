import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { SaltCrystalCluster } from './SaltCrystalCluster'

interface WeighingBoatProps {
  selected: boolean
  saltG?: number
}

const grains = Array.from({ length: 35 }, (_, index) => {
  const angle = index * 2.399963
  const radial = Math.sqrt((index + 0.4) / 35)
  return {
    x: Math.cos(angle) * radial * 0.105,
    z: Math.sin(angle) * radial * 0.072,
    y: 0.059 + (1 - radial) * 0.035 + (index % 4) * 0.003,
    size: 0.013 + (index % 4) * 0.003,
    rotation: angle,
  }
})

/** Lightweight folded weigh dish with an actual visible salt portion, or an empty interior. */
export function WeighingBoat({ selected, saltG = 0 }: WeighingBoatProps) {
  const fraction = Number.isFinite(saltG) ? Math.min(1, Math.max(0, saltG / 5)) : 0
  const count = Math.ceil(fraction * grains.length)
  const positions = useLabSceneStore((state) => state.positions)
  const rotations = useLabSceneStore((state) => state.rotations)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const onBalance = useLabSceneStore(
    (state) => state.relationships['weighing-boat']?.targetId === 'digital-balance',
  )
  const source = positions['weighing-boat']
  const balance = positions['digital-balance']
  const attached = Boolean(
    onBalance &&
    source &&
    balance &&
    placedIds.includes('weighing-boat') &&
    placedIds.includes('digital-balance'),
  )
  const yaw = rotations['weighing-boat'] ?? 0
  const dx = attached && source && balance ? balance.x - source.x : 0
  const dz = attached && source && balance ? balance.z - 0.047 - source.z : 0
  // The scene keeps non-overlapping drag footprints, while the confirmed contact
  // snaps the visible dish onto the instrument's actual weighing pan.
  const displayOffset: [number, number, number] = attached
    ? [Math.cos(yaw) * dx - Math.sin(yaw) * dz, 0.208, Math.sin(yaw) * dx + Math.cos(yaw) * dz]
    : [0, 0, 0]

  return (
    <group position={displayOffset}>
      <mesh castShadow receiveShadow position={[0, 0.037, 0]}>
        <boxGeometry args={[0.344, 0.031, 0.27]} />
        <meshStandardMaterial
          color={selected ? '#f9fffe' : '#e6eef1'}
          roughness={0.44}
          metalness={0.02}
        />
      </mesh>
      <mesh receiveShadow position={[0, 0.054, 0]}>
        <boxGeometry args={[0.317, 0.005, 0.243]} />
        <meshStandardMaterial color="#ffffff" roughness={0.54} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh key={`rim-${direction}`} position={[0, 0.128, direction * 0.145]}>
          <boxGeometry args={[0.354, 0.008, 0.008]} />
          <meshStandardMaterial color="#f9fdfe" roughness={0.27} />
        </mesh>
      ))}
      <mesh position={[0, 0.021, 0]} receiveShadow>
        <boxGeometry args={[0.33, 0.01, 0.252]} />
        <meshStandardMaterial color="#b2c7d1" roughness={0.48} />
      </mesh>
      {[-1, 1].map((direction) => (
        <group key={direction}>
          <mesh
            castShadow
            receiveShadow
            position={[direction * 0.174, 0.083, 0]}
            rotation={[0, 0, direction * -0.17]}
          >
            <boxGeometry args={[0.012, 0.089, 0.282]} />
            <meshStandardMaterial color="#e9f1f4" roughness={0.47} side={2} />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0, 0.083, direction * 0.139]}
            rotation={[direction * 0.17, 0, 0]}
          >
            <boxGeometry args={[0.357, 0.089, 0.012]} />
            <meshStandardMaterial color="#eff4f6" roughness={0.47} side={2} />
          </mesh>
        </group>
      ))}
      {/* Bulk mound follows the simulated mass; discrete cubic grains make it identifiable as salt. */}
      {fraction > 0 && (
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.06 + 0.024 * Math.cbrt(fraction), 0]}
          scale={[
            0.1 * Math.cbrt(fraction),
            0.04 * Math.cbrt(fraction),
            0.075 * Math.cbrt(fraction),
          ]}
        >
          <sphereGeometry args={[1, 24, 12]} />
          <meshStandardMaterial color="#f7f9f8" roughness={0.92} />
        </mesh>
      )}
      <SaltCrystalCluster crystals={grains} count={count} />
    </group>
  )
}
