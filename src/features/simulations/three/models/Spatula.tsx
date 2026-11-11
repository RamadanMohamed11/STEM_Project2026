import { Vector2 } from 'three'
import { SaltCrystalCluster } from './SaltCrystalCluster'

interface SpatulaProps {
  selected: boolean
  saltG?: number
}

// A closed spoon cross-section: underside to rolled edge, returning down the concavity.
const scoopProfile = [
  [0, 0.001],
  [0.03, 0.002],
  [0.052, 0.009],
  [0.068, 0.022],
  [0.077, 0.031],
  [0.075, 0.034],
  [0.07, 0.032],
  [0.061, 0.023],
  [0.047, 0.014],
  [0.028, 0.008],
  [0, 0.006],
].map(([radius, height]) => new Vector2(radius, height))

const scoopCrystals = Array.from({ length: 22 }, (_, index) => {
  const angle = index * 2.399963
  const radial = Math.sqrt((index + 0.5) / 22)
  return {
    x: Math.cos(angle) * radial * 0.048,
    z: Math.sin(angle) * radial * 0.026,
    y: 0.008 + (1 - radial) * 0.017 + (index % 3) * 0.002,
    size: 0.007 + (index % 3) * 0.002,
    rotation: angle,
  }
})
const shaftAngle = -Math.atan2(0.446, -0.125)
const shaftLength = Math.hypot(0.446, 0.125)

export function Spatula({ selected, saltG = 0 }: SpatulaProps) {
  const fraction = Number.isFinite(saltG) ? Math.min(1, Math.max(0, saltG / 5)) : 0
  const portionScale = Math.cbrt(fraction)

  return (
    <group>
      {/* The handle and shaft actually join the scoop; the working end stays at X≈.286. */}
      <mesh castShadow receiveShadow position={[-0.027, 0.0945, 0]} rotation={[0, 0, shaftAngle]}>
        <cylinderGeometry args={[0.008, 0.012, shaftLength, 16]} />
        <meshStandardMaterial color="#cde1f2" metalness={0.88} roughness={0.29} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.224, 0.15, 0]} rotation={[0, 0, shaftAngle]}>
        <capsuleGeometry args={[0.017, 0.106, 4, 16]} />
        <meshStandardMaterial
          color={selected ? '#1b3a6b' : '#3d5a80'}
          roughness={0.56}
          metalness={0.05}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0.25, 0, 0]} scale={[1, 1, 0.65]}>
        <latheGeometry args={[scoopProfile, 48]} />
        <meshStandardMaterial color="#cde1f2" metalness={0.9} roughness={0.26} />
      </mesh>
      {fraction > 0 && (
        <group position={[0.251, 0.008, 0]} scale={portionScale}>
          <SaltCrystalCluster
            crystals={scoopCrystals}
            count={Math.ceil(fraction * scoopCrystals.length)}
          />
        </group>
      )}
    </group>
  )
}
