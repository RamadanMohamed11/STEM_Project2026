import { SaltCrystalCluster } from './SaltCrystalCluster'

interface SpatulaProps {
  selected: boolean
  saltG?: number
}

const scoopCrystals = Array.from({ length: 22 }, (_, index) => {
  const angle = index * 2.399963
  const radius = Math.sqrt((index + 0.5) / 22) * 0.049
  return {
    x: 0.251 + Math.cos(angle) * radius,
    z: Math.sin(angle) * radius * 0.56,
    y: 0.134 + ((index * 7) % 5) * 0.007,
    size: 0.011 + (index % 3) * 0.003,
    rotation: angle,
  }
})

/** A tapered stainless lab spatula, with a shallow spoon at the working end. */
export function Spatula({ selected, saltG = 0 }: SpatulaProps) {
  const fraction = Number.isFinite(saltG) ? Math.min(1, Math.max(0, saltG / 5)) : 0
  const crystalCount = Math.ceil(fraction * scoopCrystals.length)

  return (
    // Lower the spoon to the local tabletop while leaving the external pivot at Y=0.
    <group position={[0, -0.097, 0]}>
      {/* The shaft rises off the bench so the spoon is easy to grab in 3D. */}
      <mesh castShadow receiveShadow position={[-0.007, 0.205, 0]} rotation={[0, 0, -1.34]}>
        <cylinderGeometry args={[0.013, 0.018, 0.49, 14]} />
        <meshStandardMaterial
          color={selected ? '#e0f5f7' : '#b8c9d2'}
          metalness={0.78}
          roughness={0.23}
        />
      </mesh>
      <mesh castShadow position={[-0.208, 0.253, 0]} rotation={[0, 0, -1.34]}>
        <cylinderGeometry args={[0.024, 0.024, 0.15, 16]} />
        <meshStandardMaterial color={selected ? '#257d94' : '#254d66'} roughness={0.46} />
      </mesh>
      {[-0.24, -0.21, -0.18].map((x) => (
        <mesh key={x} castShadow position={[x, 0.253 + (x + 0.21) * -0.23, 0]}>
          <boxGeometry args={[0.003, 0.014, 0.045]} />
          <meshStandardMaterial color="#91b4c2" metalness={0.36} roughness={0.46} />
        </mesh>
      ))}
      {/* Smooth spoon bowl with a clearly raised edge and visible NaCl crystals. */}
      <mesh castShadow receiveShadow position={[0.25, 0.113, 0]} scale={[1, 0.18, 0.65]}>
        <sphereGeometry args={[0.077, 24, 12]} />
        <meshStandardMaterial color="#c8d8df" roughness={0.24} metalness={0.82} />
      </mesh>
      <mesh position={[0.25, 0.12, 0]} scale={[1, 0.12, 0.57]}>
        <sphereGeometry args={[0.072, 24, 12]} />
        <meshStandardMaterial color="#dce8ed" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.25, 0.131, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.59, 1]}>
        <torusGeometry args={[0.068, 0.0045, 7, 28]} />
        <meshStandardMaterial color="#9fb8c5" metalness={0.72} roughness={0.24} />
      </mesh>
      <SaltCrystalCluster crystals={scoopCrystals} count={crystalCount} />
    </group>
  )
}
