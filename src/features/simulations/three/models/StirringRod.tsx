import { glassEdgeOpacity } from './glassMaterial'

interface StirringRodProps {
  selected: boolean
}

// Preserve both tip centres and the registered .2 footprint; use fire-polished ends.
const lean = 0.168
const incline = -Math.atan2(lean, 1.075)
const length = Math.hypot(lean, 1.075)

export function StirringRod({ selected }: StirringRodProps) {
  return (
    <group>
      <mesh position={[lean / 2, 0.5625, 0]} rotation={[0, 0, incline]}>
        <capsuleGeometry args={[0.024, length, 6, 24]} />
        <meshPhysicalMaterial
          color="#e2ede5"
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.06}
          transparent
          opacity={0.7}
          onBeforeCompile={glassEdgeOpacity}
          depthWrite={false}
          envMapIntensity={0.9}
          emissive={selected ? '#497c71' : '#000000'}
          emissiveIntensity={selected ? 0.06 : 0}
        />
      </mesh>
      {/* A subtle frosted identification band, not a metallic grip on a glass rod. */}
      <mesh position={[0.143, 0.94, 0]} rotation={[0, 0, incline]}>
        <cylinderGeometry args={[0.0242, 0.0242, 0.043, 24, 1, true]} />
        <meshStandardMaterial
          color="#b5c9be"
          roughness={0.72}
          transparent
          opacity={0.44}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
