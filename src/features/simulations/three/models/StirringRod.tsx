interface StirringRodProps {
  selected: boolean
}

// Keep the tip inside the registered 0.2 m footprint without moving either Y endpoint.
const lean = 0.168
const incline = -Math.atan2(lean, 1.075)
const length = Math.hypot(lean, 1.075)

export function StirringRod({ selected }: StirringRodProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[lean / 2, 0.5625, 0]} rotation={[0, 0, incline]}>
        <cylinderGeometry args={[0.024, 0.024, length, 20]} />
        <meshPhysicalMaterial
          color={selected ? '#a9f4ff' : '#9fd1df'}
          metalness={0.02}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.04}
          transparent
          opacity={0.82}
          emissive={selected ? '#167c8e' : '#000000'}
          emissiveIntensity={selected ? 0.16 : 0}
        />
      </mesh>
      <mesh castShadow position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.024, 20, 12]} />
        <meshPhysicalMaterial color="#d0f3f9" roughness={0.08} transparent opacity={0.75} />
      </mesh>
      <mesh castShadow position={[lean, 1.1, 0]}>
        <sphereGeometry args={[0.024, 20, 12]} />
        <meshPhysicalMaterial color="#d0f3f9" roughness={0.08} transparent opacity={0.75} />
      </mesh>
      {/* A narrow internal reflection makes the thin glass shaft visible from a distance. */}
      <mesh position={[lean / 2, 0.563, 0.018]} rotation={[0, 0, incline]}>
        <cylinderGeometry args={[0.005, 0.005, length - 0.055, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh position={[lean / 2, 0.563, -0.011]} rotation={[0, 0, incline]}>
        <cylinderGeometry args={[0.012, 0.012, length - 0.045, 12]} />
        <meshStandardMaterial
          color="#87bfd0"
          metalness={0.12}
          roughness={0.12}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
      {/* Two etched bands make the upper working end easy to distinguish. */}
      {[0.88, 0.925].map((y) => (
        <mesh key={y} position={[(y - 0.025) * (lean / 1.075), y, 0]} rotation={[0, 0, incline]}>
          <cylinderGeometry args={[0.025, 0.025, 0.011, 20]} />
          <meshStandardMaterial color="#4d879a" metalness={0.24} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
