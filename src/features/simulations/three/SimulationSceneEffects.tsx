import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { SimulationEffect } from '@/features/simulations/engine/types'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { LaboratoryVisualEffect, LivePourStream, type WorldPoint } from './effects'
import { BENCH_TOP, equipmentRegistry } from './sceneConfig'

const PROGRESS_STEP = 1 / 24
const DEFAULT_POSITIONS = Object.fromEntries(
  equipmentRegistry.map((item) => [item.id, item.defaultPosition]),
) as Record<string, { x: number; z: number }>

interface ActiveSceneEffectProps {
  effect: SimulationEffect
  positions: Record<string, { x: number; z: number }>
  beakerWaterMl: number
}

/** Mounted only during a running effect, so idle scenes have no progress callback. */
function ActiveSceneEffect({ effect, positions, beakerWaterMl }: ActiveSceneEffectProps) {
  const [progress, setProgress] = useState(0)
  const lastProgress = useRef(0)

  useFrame(() => {
    if (lastProgress.current === 1) return
    const next =
      effect.durationMs > 0
        ? Math.min(1, Math.max(0, (performance.now() - effect.startedAt) / effect.durationMs))
        : 1
    if (next - lastProgress.current < PROGRESS_STEP && next !== 1) return
    lastProgress.current = next
    setProgress(next)
  })

  const world = (id: string, height: number): [number, number, number] => {
    const position = positions[id] ?? DEFAULT_POSITIONS[id]
    return [position?.x ?? 0, BENCH_TOP + height, position?.z ?? 0]
  }

  const waterSurface = BENCH_TOP + 0.09 + (beakerWaterMl / 250) * 0.65
  const destinationRim = effect.targetId === 'graduated-cylinder' ? 0.95 : 0.55
  const sourceRim = effect.sourceId === 'water' ? 0.79 : 0.99
  const sourceLift =
    effect.kind === 'liquid-transfer' ? Math.max(0, destinationRim + 0.2 - sourceRim) : 0

  return (
    <group>
      {effect.kind === 'liquid-transfer' && (
        <LaboratoryVisualEffect
          key={effect.id}
          effect="pour-water"
          start={world(effect.sourceId, sourceRim + sourceLift)}
          end={world(effect.targetId, destinationRim)}
          progress={progress}
        />
      )}
      {effect.kind === 'salt-addition' && (
        <LaboratoryVisualEffect
          key={effect.id}
          effect="pour-salt"
          start={world(effect.sourceId, effect.sourceId === 'weighing-boat' ? 0.13 : 0.71)}
          end={world('beaker', Math.max(0.16, waterSurface - BENCH_TOP))}
          progress={progress}
        />
      )}
      {effect.kind === 'stirring' && (
        <>
          <LaboratoryVisualEffect
            key={`${effect.id}-ripples`}
            effect="stir"
            center={world('beaker', waterSurface - BENCH_TOP)}
            progress={progress}
          />
          <LaboratoryVisualEffect
            key={`${effect.id}-dissolve`}
            effect="dissolve"
            center={world('beaker', Math.max(0.14, (waterSurface - BENCH_TOP) / 2))}
            progress={progress}
          />
        </>
      )}
    </group>
  )
}

export function SimulationSceneEffects() {
  const effect = useSaltSimulationStore((state) => state.effect)
  const livePour = useSaltSimulationStore((state) => state.livePour)
  const beakerWaterMl = useSaltSimulationStore((state) => state.experiment.waterMl.beaker)
  const completed = useSaltSimulationStore((state) => state.workflow.completed)
  const positions = useLabSceneStore((state) => state.positions)
  const rotations = useLabSceneStore((state) => state.rotations)
  const placedIds = useLabSceneStore((state) => state.placedIds)
  const beaker = positions.beaker ?? DEFAULT_POSITIONS.beaker

  // The renderer lifts the tilted source by this same amount so its outlet clears
  // the destination rim. Coordinates track placement, yaw and the actual tilt.
  let liveStream: { start: WorldPoint; end: WorldPoint; angle: number } | null = null
  if (
    livePour &&
    livePour.angle >= 0.45 &&
    placedIds.includes(livePour.sourceId) &&
    placedIds.includes(livePour.targetId) &&
    (livePour.sourceId === 'water' || livePour.sourceId === 'graduated-cylinder') &&
    (livePour.targetId === 'graduated-cylinder' || livePour.targetId === 'beaker')
  ) {
    const source = positions[livePour.sourceId] ?? DEFAULT_POSITIONS[livePour.sourceId]
    const target = positions[livePour.targetId] ?? DEFAULT_POSITIONS[livePour.targetId]
    const sourceRim = livePour.sourceId === 'water' ? 0.79 : 0.99
    const destinationRim = livePour.targetId === 'graduated-cylinder' ? 0.95 : 0.55
    const lift = Math.max(0, destinationRim + 0.2 - sourceRim)
    const opening = livePour.sourceId === 'water' ? 0.9 : 1.115
    const openingRadius = opening - 0.42
    const mouthOffset = -Math.sin(livePour.angle) * openingRadius
    const yaw = rotations[livePour.sourceId] ?? 0
    const targetHeight = livePour.targetId === 'graduated-cylinder' ? 1.1 : 0.755
    if (source && target) {
      liveStream = {
        start: [
          source.x + mouthOffset * Math.cos(yaw),
          BENCH_TOP + 0.42 + openingRadius * Math.cos(livePour.angle) + lift,
          source.z - mouthOffset * Math.sin(yaw),
        ],
        end: [target.x, BENCH_TOP + targetHeight, target.z],
        angle: livePour.angle,
      }
    }
  }

  return (
    <group>
      {effect && !(effect.kind === 'liquid-transfer' && liveStream) && (
        <ActiveSceneEffect
          key={effect.id}
          effect={effect}
          positions={positions}
          beakerWaterMl={beakerWaterMl}
        />
      )}
      {liveStream && (
        <LivePourStream start={liveStream.start} end={liveStream.end} angle={liveStream.angle} />
      )}
      {completed && (
        <group position={[beaker.x, BENCH_TOP + 0.82, beaker.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.012, 8, 48]} />
            <meshBasicMaterial color="#0f9f93" transparent opacity={0.75} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
