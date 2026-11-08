import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Shape, Vector2 } from 'three'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { SegmentLabel } from './SegmentLabel'
import { SurfaceLabel } from './SurfaceLabel'

interface DigitalBalanceProps {
  selected: boolean
  /** L8: practice balance reading (the salt balance computes its own). */
  readingOverride?: string
}

const panProfile = [
  [0, 0.202],
  [0.211, 0.202],
  [0.222, 0.207],
  [0.225, 0.216],
  [0.222, 0.226],
  [0.212, 0.23],
  [0, 0.23],
].map(([radius, height]) => new Vector2(radius, height))

/** The display is a model-derived, tared salt mass, not a fabricated sensor signal. */
export function DigitalBalance({ selected, readingOverride }: DigitalBalanceProps) {
  const hasBoat = useLabSceneStore(
    (state) =>
      state.placedIds.includes('digital-balance') &&
      state.placedIds.includes('weighing-boat') &&
      state.relationships['weighing-boat']?.targetId === 'digital-balance',
  )
  const saltOnBoatG = useSaltSimulationStore((state) => state.experiment.saltOnBoatG)
  const boatMoving = useSaltSimulationStore((state) => state.transfer?.sourceId === 'weighing-boat')
  const reading =
    readingOverride !== undefined
      ? readingOverride
      : hasBoat && !boatMoving
        ? `${Math.max(0, Number.isFinite(saltOnBoatG) ? saltOnBoatG : 0)
            .toFixed(3)
            .replace(/\.?0+$/, '')}`
        : '--'
  const housing = useMemo(() => {
    // Extruded side elevation: the front console is genuinely sloped, not a decal inside a box.
    const shape = new Shape()
    shape.moveTo(-0.232, 0.029)
    shape.lineTo(-0.243, 0.062)
    shape.lineTo(-0.151, 0.175)
    shape.lineTo(0.23, 0.175)
    shape.lineTo(0.243, 0.156)
    shape.lineTo(0.243, 0.04)
    shape.lineTo(0.23, 0.029)
    shape.closePath()
    const geometry = new ExtrudeGeometry(shape, {
      depth: 0.69,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.011,
      bevelThickness: 0.011,
      curveSegments: 1,
    })
    geometry.rotateY(Math.PI / 2)
    geometry.translate(-0.345, 0, 0)
    return geometry
  }, [])
  useEffect(() => () => housing.dispose(), [housing])

  return (
    <group>
      {[-0.275, 0.275].flatMap((x) =>
        [-0.181, 0.181].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.013, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.031, 0.033, 0.026, 20]} />
            <meshStandardMaterial color="#343c3b" roughness={0.8} />
          </mesh>
        )),
      )}
      <mesh geometry={housing} castShadow receiveShadow>
        <meshStandardMaterial
          color={selected ? '#b5c6c0' : '#bfc8c2'}
          roughness={0.43}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.183, -0.047]} receiveShadow>
        <cylinderGeometry args={[0.184, 0.193, 0.014, 56]} />
        <meshStandardMaterial color="#414d4b" roughness={0.55} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.198, -0.047]}>
        <cylinderGeometry args={[0.085, 0.103, 0.018, 40]} />
        <meshStandardMaterial color="#8e9c99" metalness={0.65} roughness={0.32} />
      </mesh>
      {/* Pan centre and its Y=.23 contact plane match the existing boat attachment. */}
      <mesh position={[0, 0, -0.047]} castShadow receiveShadow>
        <latheGeometry args={[panProfile, 64]} />
        <meshStandardMaterial color="#c5cfcb" metalness={0.86} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2285, -0.047]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.213, 0.0015, 6, 64]} />
        <meshStandardMaterial color="#e5e9e2" metalness={0.8} roughness={0.24} />
      </mesh>
      <group position={[0, 0.127, 0.211]} rotation={[-0.684, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.38, 0.094, 0.012]} />
          <meshStandardMaterial color="#3b4944" roughness={0.47} />
        </mesh>
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.351, 0.073]} />
          <meshStandardMaterial
            color="#bdcda8"
            roughness={0.4}
            emissive="#8da678"
            emissiveIntensity={0.14}
          />
        </mesh>
        <group position={[-0.018, 0.002, 0.009]}>
          <SegmentLabel value={reading} height={0.049} color="#203e31" />
        </group>
        <group position={[0.142, -0.012, 0.01]}>
          <SurfaceLabel lines={['g']} width={0.018} height={0.025} color="#203e31" />
        </group>
        <group position={[0, -0.063, 0.003]}>
          <SurfaceLabel lines={['SIMULATED · TARED']} width={0.24} height={0.015} color="#344b43" />
        </group>
        {[-0.256, 0.256].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.027, 0.016, 32]} />
              <meshStandardMaterial color={x < 0 ? '#607e71' : '#e0e4d9'} roughness={0.55} />
            </mesh>
            <group position={[0, -0.039, 0.002]}>
              <SurfaceLabel lines={[x < 0 ? 'ON/OFF' : 'TARE']} width={0.073} height={0.013} />
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
