import { Vector2 } from 'three'
import { GlassVesselShell } from './GlassVesselShell'
import { SurfaceLabel } from './SurfaceLabel'
import { VesselContents } from './VesselContents'

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
  [0.196, 0.037],
  [0.205, 0.052],
  [0.209, 0.14],
  [0.211, 0.62],
  [0.206, 0.675],
  [0.198, 0.704],
  [0.149, 0.762],
  [0.092, 0.801],
  [0.088, 0.89],
  [0.084, 0.9],
  [0.078, 0.903],
  [0.072, 0.895],
  [0.072, 0.795],
  [0.179, 0.694],
  [0.186, 0.13],
  [0.163, 0.064],
  [0, 0.064],
].map(([radius, height]) => new Vector2(radius, height))

const capGrooves = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2
  return { x: Math.sin(angle) * 0.103, z: Math.cos(angle) * 0.103, angle }
})

export function WaterContainer({ selected, waterMl = 0, pouring = false }: WaterContainerProps) {
  return (
    <group>
      <GlassVesselShell profile={bottleProfile} selected={selected} />
      <VesselContents
        volumeMl={waterMl}
        capacityMl={500}
        bottomY={0.09}
        maxHeight={0.59}
        radius={0.162}
      />
      {[0.13, 0.164, 0.58, 0.613].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.21, 0.0025, 6, 56]} />
          <meshPhysicalMaterial
            color="#d8e5df"
            transparent
            opacity={0.32}
            depthWrite={false}
            roughness={0.2}
          />
        </mesh>
      ))}
      <group position={[0, 0.4, 0]} rotation={[0, 0.25, 0]}>
        <SurfaceLabel
          lines={['WATER', 'H₂O', '500 mL CAPACITY']}
          width={0.3}
          height={0.18}
          radius={0.213}
          color="#356b6d"
          background="#f0f1e9"
        />
      </group>
      {/* Neck threads remain visible when the existing pour state removes the closure. */}
      {[0.843, 0.868].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.088, 0.003, 6, 40]} />
          <meshPhysicalMaterial
            color="#e5ede5"
            transparent
            opacity={0.55}
            depthWrite={false}
            roughness={0.22}
          />
        </mesh>
      ))}
      {!pouring && (
        <group>
          <mesh castShadow receiveShadow position={[0, 0.922, 0]}>
            <cylinderGeometry args={[0.101, 0.104, 0.092, 48]} />
            <meshStandardMaterial
              color={selected ? '#478a86' : '#527f7c'}
              roughness={0.44}
              metalness={0}
            />
          </mesh>
          <mesh position={[0, 0.969, 0]}>
            <cylinderGeometry args={[0.095, 0.1, 0.009, 48]} />
            <meshStandardMaterial color="#739691" roughness={0.5} />
          </mesh>
          {capGrooves.map(({ x, z, angle }) => (
            <mesh key={angle} position={[x, 0.919, z]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.0035, 0.064, 0.0025]} />
              <meshStandardMaterial color="#86a49d" roughness={0.55} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
