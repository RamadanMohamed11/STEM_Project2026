import { useEffect, useMemo } from 'react'

import { SaltCrystalCluster } from './SaltCrystalCluster'
import { roundedTrayGeometry } from './modelGeometry'

interface WeighingBoatProps {
  selected: boolean
  saltG?: number
}

const grains = Array.from({ length: 48 }, (_, index) => {
  const angle = index * 2.399963
  const radial = Math.sqrt((index + 0.4) / 48)
  return {
    x: Math.cos(angle) * radial * 0.1,
    z: Math.sin(angle) * radial * 0.069,
    y: 0.009 + (1 - radial * radial) * 0.035 + (index % 3) * 0.002,
    size: 0.008 + (index % 4) * 0.002,
    rotation: angle,
  }
})

/** Thermoformed dish with a continuous interior, thin flared walls and a rolled rim. */
export function WeighingBoat({ selected, saltG = 0 }: WeighingBoatProps) {
  const fraction = Number.isFinite(saltG) ? Math.min(1, Math.max(0, saltG / 5)) : 0
  const portionScale = Math.cbrt(fraction)

  const dish = useMemo(
    () =>
      roundedTrayGeometry([
        { halfWidth: 0.15, halfDepth: 0.108, cornerRadius: 0.024, y: 0.022 },
        { halfWidth: 0.157, halfDepth: 0.115, cornerRadius: 0.028, y: 0.03 },
        { halfWidth: 0.184, halfDepth: 0.148, cornerRadius: 0.032, y: 0.122 },
        { halfWidth: 0.187, halfDepth: 0.151, cornerRadius: 0.033, y: 0.127 },
        { halfWidth: 0.185, halfDepth: 0.149, cornerRadius: 0.032, y: 0.131 },
        { halfWidth: 0.18, halfDepth: 0.144, cornerRadius: 0.031, y: 0.127 },
        { halfWidth: 0.151, halfDepth: 0.109, cornerRadius: 0.026, y: 0.035 },
        { halfWidth: 0.143, halfDepth: 0.101, cornerRadius: 0.023, y: 0.028 },
      ]),
    [],
  )
  useEffect(() => () => dish.dispose(), [dish])

  return (
    <group>
      <mesh geometry={dish} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={selected ? '#a8c5e0' : '#e8f1fa'}
          roughness={0.48}
          metalness={0}
          clearcoat={0.2}
          clearcoatRoughness={0.35}
        />
      </mesh>
      {/* Size encodes mass schematically; individual cubes are not a literal grain count. */}
      {fraction > 0 && (
        <group position={[0, 0.029, 0]} scale={portionScale}>
          <mesh castShadow receiveShadow position={[0, 0.004, 0]} scale={[0.1, 0.038, 0.07]}>
            <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.94} />
          </mesh>
          <SaltCrystalCluster crystals={grains} count={Math.ceil(fraction * grains.length)} />
        </group>
      )}
    </group>
  )
}
