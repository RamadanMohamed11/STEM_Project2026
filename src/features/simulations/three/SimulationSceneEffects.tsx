import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { SimulationEffect } from '@/features/simulations/engine/types'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { LaboratoryVisualEffect, LivePourStream, type WorldPoint } from './effects'
import type { PourFrame } from './effects/LaboratoryEffects'
import {
  getBoatSaltSurfaceHeight,
  getLiquidSurfaceHeight,
  getPourPose,
  PIVOT_HEIGHT,
  POUR_ASSIST_ANGLE,
  RECEIVER_RIM_HEIGHTS,
  SALT_JAR_RIM_HEIGHT,
} from './equipmentPose'
import {
  readEquipmentPointWorld,
  readOutletWorld,
  readSpatulaSpoonWorld,
  visualAnchors,
} from './equipmentVisualAnchors'
import { getTransferFlowProgress, TRANSFER_POUR_ANGLE } from './transferMotion'
import { DirectStirResponse } from './effects/DirectStirResponse'
import { BENCH_TOP, equipmentRegistry, type Point2D } from './sceneConfig'

const PROGRESS_STEP = 1 / 24
const ORIGIN: WorldPoint = [0, 0, 0]
const DEFAULT_POSITIONS = Object.fromEntries(
  equipmentRegistry.map((item) => [item.id, item.defaultPosition]),
) as Record<string, Point2D>

function effectProgress(effect: SimulationEffect): number {
  return effect.durationMs > 0
    ? Math.min(1, Math.max(0, (performance.now() - effect.startedAt) / effect.durationMs))
    : 1
}

interface AnchoredPourProps {
  sourceId: string
  targetId: string
  /** Omitted for a held, continuous gesture. */
  effect?: SimulationEffect
}

/** Samples rendering refs and authoritative volume, without a React frame loop. */
function AnchoredPour({ sourceId, targetId, effect }: AnchoredPourProps) {
  const updateFrame = (frame: PourFrame): boolean => {
    const simulation = useSaltSimulationStore.getState()
    const scene = useLabSceneStore.getState()
    if (!scene.placedIds.includes(sourceId) || !scene.placedIds.includes(targetId)) return false
    if (effect) {
      if (simulation.effect?.id !== effect.id) return false
      frame.progress = effectProgress(effect)
      frame.angle = 0.5 * Math.sin(Math.PI * frame.progress)
      if (frame.progress <= 0 || frame.progress >= 1) return false
    } else {
      const live = simulation.livePour
      if (
        !live ||
        live.sourceId !== sourceId ||
        live.targetId !== targetId ||
        live.angle < POUR_ASSIST_ANGLE
      )
        return false
      frame.angle = live.angle
    }

    const source = scene.positions[sourceId] ?? DEFAULT_POSITIONS[sourceId]
    const target = scene.positions[targetId] ?? DEFAULT_POSITIONS[targetId]
    const rim = RECEIVER_RIM_HEIGHTS[targetId]
    if (!source || !target || rim === undefined) return false

    if (!readOutletWorld(sourceId, target, frame.start)) {
      // A deterministic fallback for a not-yet-mounted renderer. Once registered,
      // the interpolated visual pose, not the requested angle, owns the outlet.
      const yaw = scene.rotations[sourceId] ?? 0
      const pose = getPourPose(sourceId, source, targetId, target, frame.angle, yaw)
      const cos = Math.cos(yaw)
      const sin = Math.sin(yaw)
      frame.start.set(
        source.x + cos * pose.outlet[0] + sin * pose.outlet[2],
        BENCH_TOP + pose.outlet[1],
        source.z - sin * pose.outlet[0] + cos * pose.outlet[2],
      )
    }

    const volume =
      targetId === 'graduated-cylinder'
        ? simulation.experiment.waterMl['graduated-cylinder']
        : simulation.experiment.waterMl.beaker
    const surface = getLiquidSurfaceHeight(targetId, volume)
    const receiver = visualAnchors.get(targetId)
    if (receiver) {
      receiver.updateWorldMatrix(true, false)
      frame.end.set(0, surface - PIVOT_HEIGHT, 0).applyMatrix4(receiver.matrixWorld)
    } else {
      frame.end.set(target.x, BENCH_TOP + surface, target.z)
    }
    const rimY = frame.end.y + (rim - surface) * (receiver?.matrixWorld.elements[5] ?? 1)
    // Never draw an uphill jet while the renderer is still easing into its lift.
    return frame.start.y > rimY + 0.005
  }

  if (!effect) {
    return <LivePourStream start={ORIGIN} end={ORIGIN} angle={0} updateFrame={updateFrame} />
  }
  return (
    <LaboratoryVisualEffect
      effect={effect.kind === 'salt-addition' ? 'pour-salt' : 'pour-water'}
      start={ORIGIN}
      end={ORIGIN}
      progress={0}
      updateFrame={updateFrame}
    />
  )
}

/** Numeric transfers use only registered model anchors and their own domain timeline. */
function MaterialTransferEffect({
  operationId,
  kind,
}: {
  operationId: string
  kind: 'liquid' | 'solid'
}) {
  const updateFrame = (frame: PourFrame): boolean => {
    const state = useSaltSimulationStore.getState()
    const op = state.transfer
    const progress = getTransferFlowProgress(op)
    if (!op || op.operationId !== operationId || progress === null) return false
    frame.progress = Math.max(1e-6, progress)
    frame.angle = TRANSFER_POUR_ANGLE

    if (op.method === 'scoop') {
      // A short settling cascade into the actual spoon inside the open jar;
      // the jar stays upright. The receiving anchor follows the moving tool.
      return (
        !!readSpatulaSpoonWorld(frame.end) &&
        !!readEquipmentPointWorld(op.sourceId, 0, SALT_JAR_RIM_HEIGHT - 0.005, 0, frame.start) &&
        frame.start.y > frame.end.y
      )
    }

    let height: number
    if (op.kind === 'liquid') {
      if (op.targetId !== 'beaker' && op.targetId !== 'graduated-cylinder') return false
      height = getLiquidSurfaceHeight(op.targetId, state.experiment.waterMl[op.targetId])
    } else if (op.targetId === 'weighing-boat') {
      height = getBoatSaltSurfaceHeight(state.experiment.saltOnBoatG)
    } else if (op.targetId === 'beaker') {
      height = getLiquidSurfaceHeight('beaker', state.experiment.waterMl.beaker)
    } else return false

    return (
      !!readEquipmentPointWorld(op.targetId, 0, height, 0, frame.end) &&
      !!readOutletWorld(op.sourceId, frame.end, frame.start) &&
      frame.start.y > frame.end.y
    )
  }

  return kind === 'liquid' ? (
    <LivePourStream
      start={ORIGIN}
      end={ORIGIN}
      angle={TRANSFER_POUR_ANGLE}
      updateFrame={updateFrame}
    />
  ) : (
    <LaboratoryVisualEffect
      effect="pour-salt"
      start={ORIGIN}
      end={ORIGIN}
      progress={0}
      updateFrame={updateFrame}
    />
  )
}

/** Only the legacy stirring illustrations need throttled React progress. */
function StirringSceneEffect({ effect }: { effect: SimulationEffect }) {
  const [progress, setProgress] = useState(0)
  const lastProgress = useRef(0)
  const beakerWaterMl = useSaltSimulationStore((state) => state.experiment.waterMl.beaker)
  const beaker = useLabSceneStore((state) => state.positions.beaker ?? DEFAULT_POSITIONS.beaker)

  useFrame(() => {
    if (lastProgress.current === 1) return
    const next = effectProgress(effect)
    if (next - lastProgress.current < PROGRESS_STEP && next !== 1) return
    lastProgress.current = next
    setProgress(next)
  })

  const surface = getLiquidSurfaceHeight('beaker', beakerWaterMl)
  return (
    <group>
      <LaboratoryVisualEffect
        effect="stir"
        center={[beaker.x, BENCH_TOP + surface, beaker.z]}
        progress={progress}
      />
      <LaboratoryVisualEffect
        effect="dissolve"
        center={[beaker.x, BENCH_TOP + Math.max(0.14, surface / 2), beaker.z]}
        progress={progress}
      />
    </group>
  )
}

export function SimulationSceneEffects() {
  const effect = useSaltSimulationStore((state) => state.effect)
  const transferId = useSaltSimulationStore((state) => state.transfer?.operationId ?? null)
  const transferKind = useSaltSimulationStore((state) => state.transfer?.kind ?? null)
  // Subscribe to pair/lifetime only. Angle and volume are read into reusable
  // Three vectors in useFrame, not pushed through React on every stream tick.
  const liveSourceId = useSaltSimulationStore((state) => state.livePour?.sourceId ?? null)
  const liveTargetId = useSaltSimulationStore((state) => state.livePour?.targetId ?? null)
  const completed = useSaltSimulationStore((state) => state.workflow.completed)
  const beaker = useLabSceneStore((state) => state.positions.beaker ?? DEFAULT_POSITIONS.beaker)

  return (
    <group>
      <DirectStirResponse />
      {transferId && transferKind && (
        <MaterialTransferEffect key={transferId} operationId={transferId} kind={transferKind} />
      )}
      {!transferId &&
        effect &&
        !(effect.kind === 'liquid-transfer' && liveSourceId) &&
        (effect.kind === 'stirring' ? (
          <StirringSceneEffect key={effect.id} effect={effect} />
        ) : (
          <AnchoredPour
            key={effect.id}
            sourceId={effect.sourceId}
            targetId={effect.targetId}
            effect={effect}
          />
        ))}
      {!transferId && liveSourceId && liveTargetId && (
        <AnchoredPour
          key={`${liveSourceId}:${liveTargetId}`}
          sourceId={liveSourceId}
          targetId={liveTargetId}
        />
      )}
      {completed && (
        <group position={[beaker.x, BENCH_TOP + 0.82, beaker.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.012, 8, 48]} />
            <meshBasicMaterial color="#a8c5e0" transparent opacity={0.75} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  )
}
