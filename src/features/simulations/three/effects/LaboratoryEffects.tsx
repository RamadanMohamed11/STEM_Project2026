import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DynamicDrawUsage, InstancedMesh, Object3D, QuadraticBezierCurve3, Vector3 } from 'three'
import type { Vector3Tuple } from 'three'

/** World coordinates in the lab scene: metres, Y-up. */
export type WorldPoint = Vector3Tuple

interface ProgressProps {
  /** Deterministic effect progress, from 0 (inactive) to 1 (finished). */
  progress: number
}

function boundedProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
}

type Endpoints =
  | { start: WorldPoint; end: WorldPoint; source?: never; target?: never }
  | { source: WorldPoint; target: WorldPoint; start?: never; end?: never }

/** Reused mutable samples: update in useFrame, without a React state write. */
export interface PourFrame {
  start: Vector3
  end: Vector3
  angle: number
  progress: number
}

/** Return false to hide a stream when a gesture/effect is no longer active. */
export type PourFrameUpdater = (frame: PourFrame) => boolean

type FrameDriven = { updateFrame?: PourFrameUpdater }
type PourStreamProps = ProgressProps & Endpoints & FrameDriven & { radius?: number }

function usePourFrame() {
  return useRef<PourFrame>({ start: new Vector3(), end: new Vector3(), angle: 0, progress: 0 })
}

const LIVE_DROPLET_COUNT = 14

interface WaterJetProps extends FrameDriven {
  start: WorldPoint
  end: WorldPoint
  progress: number
  angle: number
  live: boolean
  radius?: number
}

/** One persistent geometry/draw call; only instance matrices change per frame. */
function WaterJet({
  start,
  end,
  progress,
  angle,
  live,
  radius = 0.012,
  updateFrame,
}: WaterJetProps) {
  const drops = useRef<InstancedMesh>(null)
  const frameRef = usePourFrame()
  const marker = useMemo(() => new Object3D(), [])
  const tangent = useMemo(() => new Vector3(), [])
  const up = useMemo(() => new Vector3(0, 1, 0), [])
  const curve = useMemo(
    () => new QuadraticBezierCurve3(new Vector3(), new Vector3(), new Vector3()),
    [],
  )

  useLayoutEffect(() => {
    drops.current?.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useFrame(({ clock }) => {
    const frame = frameRef.current
    const mesh = drops.current
    if (!mesh) return
    frame.start.fromArray(start)
    frame.end.fromArray(end)
    frame.angle = angle
    frame.progress = progress
    const sampled = updateFrame ? updateFrame(frame) : true
    const p = boundedProgress(frame.progress)
    mesh.visible =
      sampled &&
      (live || (p > 0 && p < 1)) &&
      Number.isFinite(frame.start.lengthSq() + frame.end.lengthSq()) &&
      frame.start.distanceToSquared(frame.end) > 0.0009
    if (!mesh.visible) return

    curve.v0.copy(frame.start)
    curve.v2.copy(frame.end)
    curve.v1.set(
      frame.start.x + (frame.end.x - frame.start.x) * 0.41,
      frame.start.y + (frame.end.y - frame.start.y) * 0.12,
      frame.start.z + (frame.end.z - frame.start.z) * 0.41,
    )
    const safeAngle = Number.isFinite(frame.angle) ? Math.max(0, frame.angle) : 0
    const r = live
      ? 0.011 + Math.min(0.008, Math.max(0, safeAngle - 0.45) * 0.025)
      : Math.min(0.025, Math.max(0.004, Number.isFinite(radius) ? radius : 0.012))
    const flow = clock.elapsedTime * (1.6 + Math.min(1, safeAngle) * 1.4)
    for (let index = 0; index < LIVE_DROPLET_COUNT; index += 1) {
      const t = (flow + index / LIVE_DROPLET_COUNT) % 1
      curve.getPoint(t, marker.position)
      tangent.set(
        2 * ((1 - t) * (curve.v1.x - curve.v0.x) + t * (curve.v2.x - curve.v1.x)),
        2 * ((1 - t) * (curve.v1.y - curve.v0.y) + t * (curve.v2.y - curve.v1.y)),
        2 * ((1 - t) * (curve.v1.z - curve.v0.z) + t * (curve.v2.z - curve.v1.z)),
      )
      const speed = tangent.length()
      marker.quaternion.setFromUnitVectors(up, tangent.normalize())
      // Clip the elongated drops at both ends, rather than extending below the
      // current liquid surface or back into the source vessel.
      const halfLength = Math.max(
        0.0001,
        Math.min((speed * 0.65) / LIVE_DROPLET_COUNT, speed * t, speed * (1 - t)),
      )
      marker.scale.set(r, halfLength, r)
      marker.updateMatrix()
      mesh.setMatrixAt(index, marker.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={drops}
      args={[undefined, undefined, LIVE_DROPLET_COUNT]}
      visible={false}
      frustumCulled={false}
      raycast={() => undefined}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshPhysicalMaterial
        color="#8cdfee"
        transparent
        opacity={live ? 0.69 : 0.57}
        roughness={0.1}
        depthWrite={false}
        metalness={0.03}
      />
    </instancedMesh>
  )
}

/** Timed legacy API, also supporting live anchor sampling through updateFrame. */
export function PourStream(props: PourStreamProps) {
  return (
    <WaterJet
      start={props.source ?? props.start!}
      end={props.target ?? props.end!}
      progress={props.progress}
      radius={props.radius}
      angle={0.5}
      live={false}
      updateFrame={props.updateFrame}
    />
  )
}

interface LivePourStreamProps extends FrameDriven {
  start: WorldPoint
  end: WorldPoint
  angle: number
}

/** Continuous water jet driven by the held 3D tilt gesture, not a timed effect. */
export function LivePourStream({ start, end, angle, updateFrame }: LivePourStreamProps) {
  return (
    <WaterJet start={start} end={end} angle={angle} progress={0.5} live updateFrame={updateFrame} />
  )
}

type SaltGranulesProps = ProgressProps & Endpoints & FrameDriven

const GRANULE_COUNT = 18

/** Dry salt grain trajectories, sampled from the same actual outlet as water. */
export function SaltGranules(props: SaltGranulesProps) {
  const start = props.source ?? props.start!
  const end = props.target ?? props.end!
  const mesh = useRef<InstancedMesh>(null)
  const frameRef = usePourFrame()
  const object = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    mesh.current?.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useFrame(() => {
    if (!mesh.current) return
    const frame = frameRef.current
    frame.start.fromArray(start)
    frame.end.fromArray(end)
    frame.progress = props.progress
    frame.angle = 0
    const sampled = props.updateFrame ? props.updateFrame(frame) : true
    const p = boundedProgress(frame.progress)
    mesh.current.visible =
      sampled && p > 0 && p < 1 && Number.isFinite(frame.start.lengthSq() + frame.end.lengthSq())
    if (!mesh.current.visible) return
    for (let i = 0; i < GRANULE_COUNT; i += 1) {
      const t = (p * 3.7 + i / GRANULE_COUNT) % 1
      const lateral = Math.sin((i + 1) * 2.39996) * 0.042 * Math.sin(t * Math.PI)
      const depth = Math.cos((i + 1) * 1.913) * 0.037 * Math.sin(t * Math.PI)
      object.position.set(
        frame.start.x + (frame.end.x - frame.start.x) * t + lateral,
        frame.start.y + (frame.end.y - frame.start.y) * t * t,
        frame.start.z + (frame.end.z - frame.start.z) * t + depth,
      )
      object.rotation.set(i * 0.67 + t * 2.1, i * 1.31 + t * 1.2, i * 0.93)
      object.scale.setScalar(0.68 + (i % 5) * 0.12)
      object.updateMatrix()
      mesh.current.setMatrixAt(i, object.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, GRANULE_COUNT]}
      visible={false}
      frustumCulled={false}
      raycast={() => undefined}
    >
      <boxGeometry args={[0.009, 0.009, 0.009]} />
      <meshStandardMaterial color="#f5f7f5" roughness={0.83} metalness={0} />
    </instancedMesh>
  )
}

interface StirRipplesProps extends ProgressProps {
  /** Water surface in world coordinates; caller supplies its current height. */
  center: WorldPoint
  radius?: number
}

/** Shallow surface ripples; no vortex, foam or bubbling is implied. */
export function StirRipples({ center, progress, radius = 0.2 }: StirRipplesProps) {
  const p = boundedProgress(progress)
  const r = Math.max(0.03, radius)

  return (
    <group position={center} visible={p > 0 && p < 1}>
      {Array.from({ length: 3 }, (_, index) => {
        const phase = (p * 3.5 + index / 3) % 1
        const scale = 0.12 + phase * 0.83
        return (
          <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, 1]}>
            <torusGeometry args={[r, 0.003, 5, 32]} />
            <meshStandardMaterial
              color="#b2edf4"
              transparent
              opacity={(1 - phase) * 0.44}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface DissolutionHazeProps extends ProgressProps {
  /** Center of the liquid body in world coordinates. */
  center: WorldPoint
  radius?: number
  height?: number
}

const HAZE_COUNT = 24

/**
 * Temporary illustrative suspended specks. Real dissolved ions are invisible:
 * the effect fades completely when progress reaches 1; no gas is generated.
 */
export function DissolutionHaze({
  center,
  progress,
  radius = 0.17,
  height = 0.25,
}: DissolutionHazeProps) {
  const mesh = useRef<InstancedMesh>(null)
  const p = boundedProgress(progress)
  const safeRadius = Math.max(0.01, radius)
  const safeHeight = Math.max(0.01, height)
  const [cx, cy, cz] = center

  useLayoutEffect(() => {
    if (!mesh.current) return
    const object = new Object3D()
    for (let i = 0; i < HAZE_COUNT; i += 1) {
      // Golden-angle spiral and incommensurate cycles, without Math.random().
      const azimuth = i * 2.399963 + p * 0.5
      const radial = Math.sqrt(((i * 0.618034) % 1) * 0.76) * safeRadius
      object.position.set(
        cx + radial * Math.cos(azimuth),
        cy + (((i * 0.414214 + p * 0.3) % 1) - 0.5) * safeHeight,
        cz + radial * Math.sin(azimuth),
      )
      object.rotation.set(0, 0, 0)
      object.scale.setScalar(0.6 + (i % 4) * 0.15)
      object.updateMatrix()
      mesh.current.setMatrixAt(i, object.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [cx, cy, cz, p, safeRadius, safeHeight])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, HAZE_COUNT]} visible={p > 0 && p < 1}>
      <sphereGeometry args={[0.006, 6, 4]} />
      <meshPhysicalMaterial
        color="#d6e8ee"
        transparent
        opacity={0.43 * Math.sin(Math.PI * p)}
        roughness={0.42}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/** Discriminated union for data-driven orchestration without embedding timeline state here. */
export type LaboratoryVisualEffectProps =
  | ({ effect: 'pour-water' } & PourStreamProps)
  | ({ effect: 'pour-salt' } & SaltGranulesProps)
  | ({ effect: 'stir' } & StirRipplesProps)
  | ({ effect: 'dissolve' } & DissolutionHazeProps)

export function LaboratoryVisualEffect(props: LaboratoryVisualEffectProps) {
  switch (props.effect) {
    case 'pour-water':
      return <PourStream {...props} />
    case 'pour-salt':
      return <SaltGranules {...props} />
    case 'stir':
      return <StirRipples center={props.center} progress={props.progress} radius={props.radius} />
    case 'dissolve':
      return (
        <DissolutionHaze
          center={props.center}
          progress={props.progress}
          radius={props.radius}
          height={props.height}
        />
      )
  }
}
