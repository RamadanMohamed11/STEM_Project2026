import { Html } from '@react-three/drei'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { SegmentLabel } from './SegmentLabel'

interface DigitalBalanceProps {
  selected: boolean
}

/** Net salt mass is derived from a weigh boat resting on the balance. */
export function DigitalBalance({ selected }: DigitalBalanceProps) {
  const hasBoat = useLabSceneStore(
    (state) =>
      state.placedIds.includes('digital-balance') &&
      state.placedIds.includes('weighing-boat') &&
      state.relationships['weighing-boat']?.targetId === 'digital-balance',
  )
  const saltOnBoatG = useSaltSimulationStore((state) => state.experiment.saltOnBoatG)
  const reading = hasBoat
    ? `${Math.max(0, Number.isFinite(saltOnBoatG) ? saltOnBoatG : 0).toFixed(1)}g`
    : '--'

  return (
    <group>
      {[-0.275, 0.275].flatMap((x) =>
        [-0.181, 0.181].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.013, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.033, 0.033, 0.026, 16]} />
            <meshStandardMaterial color="#293b4c" roughness={0.74} />
          </mesh>
        )),
      )}
      <mesh castShadow receiveShadow position={[0, 0.087, 0]}>
        <boxGeometry args={[0.72, 0.132, 0.51]} />
        <meshStandardMaterial
          color={selected ? '#678fa0' : '#9bacb6'}
          metalness={0.31}
          roughness={0.39}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.166, -0.017]}>
        <boxGeometry args={[0.706, 0.046, 0.473]} />
        <meshStandardMaterial color="#dbe4e8" roughness={0.28} metalness={0.25} />
      </mesh>
      <mesh receiveShadow position={[0, 0.193, -0.047]}>
        <boxGeometry args={[0.504, 0.018, 0.35]} />
        <meshStandardMaterial color="#889ba6" roughness={0.3} metalness={0.42} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.213, -0.047]}>
        <cylinderGeometry args={[0.225, 0.225, 0.023, 64]} />
        <meshPhysicalMaterial
          color="#e4edf0"
          metalness={0.7}
          roughness={0.22}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.227, -0.047]}>
        <cylinderGeometry args={[0.212, 0.212, 0.002, 64]} />
        <meshStandardMaterial color="#f8fbfc" roughness={0.32} metalness={0.64} />
      </mesh>
      <mesh position={[0, 0.229, -0.047]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.208, 0.003, 5, 48]} />
        <meshStandardMaterial color="#6e8f9e" metalness={0.6} roughness={0.34} />
      </mesh>
      {[-0.274, 0.274].map((x) => (
        <mesh key={x} position={[x, 0.16, 0.22]}>
          <boxGeometry args={[0.034, 0.006, 0.004]} />
          <meshStandardMaterial color="#7e9ba5" metalness={0.46} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.096, 0.26]} receiveShadow>
        <boxGeometry args={[0.31, 0.084, 0.013]} />
        <meshStandardMaterial color="#233a48" metalness={0.12} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.096, 0.268]}>
        <boxGeometry args={[0.293, 0.067, 0.003]} />
        <meshStandardMaterial
          color="#17323a"
          emissive={selected ? '#064e4e' : '#071c1b'}
          emissiveIntensity={selected ? 0.35 : 0.1}
          roughness={0.14}
        />
      </mesh>
      <group position={[-0.038, 0.096, 0.273]}>
        <SegmentLabel
          value={reading}
          height={0.045}
          color="#a8f7cd"
          emissive="#44dfa3"
          glow={selected ? 1.25 : 0.7}
        />
      </group>
      {/* This is a tared educational value, not an actual load-cell reading. */}
      <Html
        transform
        center
        distanceFactor={0.35}
        position={[0, 0.035, 0.27]}
        style={{ pointerEvents: 'none' }}
      >
        <span
          style={{
            display: 'block',
            width: 100,
            textAlign: 'center',
            font: 'bold 8px/1 sans-serif',
            color: '#294a55',
            whiteSpace: 'nowrap',
          }}
        >
          SIMULATED · TARED
        </span>
      </Html>
      <mesh position={[0.24, 0.1, 0.266]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.012, 32]} />
        <meshStandardMaterial color="#eff5f7" roughness={0.42} metalness={0.11} />
      </mesh>
      <mesh position={[0.24, 0.1, 0.274]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.012, 0.0022, 8, 28]} />
        <meshStandardMaterial
          color={selected ? '#34ddb4' : '#5e96a0'}
          emissive={selected ? '#12b8a6' : '#000000'}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[0.196, 0.15, 0.254]}>
        <boxGeometry args={[0.04, 0.005, 0.005]} />
        <meshStandardMaterial color="#677e88" roughness={0.6} />
      </mesh>
    </group>
  )
}
