import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, QuadraticBezierCurve3, Vector3 } from 'three'
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

type PourStreamProps = ProgressProps & Endpoints & { radius?: number }

/** Thin coherent stream with regularly spaced highlights indicating moving water. */
export function PourStream(props: PourStreamProps) {
  const { progress, radius = 0.012 } = props
  const start = props.source ?? props.start!
  const end = props.target ?? props.end!
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const p = boundedProgress(progress)
  const active = p > 0 && p < 1
  const streamRadius = Math.min(0.025, Math.max(0.004, radius))
  const curve = useMemo(() => {
    const startPoint = new Vector3(sx, sy, sz)
    const endPoint = new Vector3(ex, ey, ez)
    // Nearly horizontal at the outlet, then falling toward the receiving vessel.
    const control = new Vector3(
      (startPoint.x + endPoint.x) / 2,
      startPoint.y + (endPoint.y - startPoint.y) * 0.12,
      (startPoint.z + endPoint.z) / 2,
    )
    return new QuadraticBezierCurve3(startPoint, control, endPoint)
  }, [sx, sy, sz, ex, ey, ez])
  const hasLength = curve.getLength() > 0.03
  const droplets = Array.from({ length: 6 }, (_, index) =>
    curve.getPointAt((p * 3.2 + index / 6) % 1),
  )

  return (
    <group visible={active && hasLength}>
      <mesh>
        <tubeGeometry args={[curve, 24, streamRadius, 6, false]} />
        <meshPhysicalMaterial
          color="#85dbe9"
          transparent
          opacity={0.57}
          roughness={0.08}
          depthWrite={false}
        />
      </mesh>
      {droplets.map((point, index) => (
        <mesh key={index} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[streamRadius * 1.23, 7, 5]} />
          <meshStandardMaterial color="#c9f7fb" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

interface LivePourStreamProps {
  start: WorldPoint
  end: WorldPoint
  angle: number
}

const LIVE_DROPLET_COUNT = 13

/** Continuous water jet driven by the held 3D tilt gesture, not a timed effect. */
export function LivePourStream({ start, end, angle }: LivePourStreamProps) {
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const drops = useRef<InstancedMesh>(null)
  const marker = useMemo(() => new Object3D(), [])
  const radius = 0.011 + Math.min(0.008, Math.max(0, angle - 0.45) * 0.025)
  const curve = useMemo(() => {
    const origin = new Vector3(sx, sy, sz)
    const destination = new Vector3(ex, ey, ez)
    const guide = new Vector3(sx + (ex - sx) * 0.41, sy - 0.02, sz + (ez - sz) * 0.41)
    return new QuadraticBezierCurve3(origin, guide, destination)
  }, [sx, sy, sz, ex, ey, ez])

  useFrame(({ clock }) => {
    if (!drops.current) return
    const flow = clock.elapsedTime * (1.6 + (angle - 0.45) * 1.4)
    for (let index = 0; index < LIVE_DROPLET_COUNT; index += 1) {
      const t = (flow + index / LIVE_DROPLET_COUNT) % 1
      const point = curve.getPointAt(t)
      marker.position.copy(point)
      marker.scale.setScalar(0.65 + (index % 3) * 0.11)
      marker.rotation.set(0, 0, 0)
      marker.updateMatrix()
      drops.current.setMatrixAt(index, marker.matrix)
    }
    drops.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group raycast={() => undefined}>
      <mesh raycast={() => undefined}>
        <tubeGeometry args={[curve, 28, radius, 7, false]} />
        <meshPhysicalMaterial
          color="#8cdfee"
          transparent
          opacity={0.69}
          roughness={0.1}
          depthWrite={false}
          metalness={0.03}
        />
      </mesh>
      <instancedMesh
        ref={drops}
        args={[undefined, undefined, LIVE_DROPLET_COUNT]}
        raycast={() => undefined}
      >
        <sphereGeometry args={[radius * 0.92, 8, 6]} />
        <meshBasicMaterial color="#d2f8fc" transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

type SaltGranulesProps = ProgressProps & Endpoints

const GRANULE_COUNT = 18

/** Dry salt grain trajectories. Instancing keeps all grains to one draw call. */
export function SaltGranules(props: SaltGranulesProps) {
  const { progress } = props
  const start = props.source ?? props.start!
  const end = props.target ?? props.end!
  const [sx, sy, sz] = start
  const [ex, ey, ez] = end
  const mesh = useRef<InstancedMesh>(null)
  const p = boundedProgress(progress)

  useLayoutEffect(() => {
    if (!mesh.current) return
    const object = new Object3D()
    for (let i = 0; i < GRANULE_COUNT; i += 1) {
      const t = (p * 3.7 + i / GRANULE_COUNT) % 1
      const lateral = Math.sin((i + 1) * 2.39996) * 0.042 * Math.sin(t * Math.PI)
      const depth = Math.cos((i + 1) * 1.913) * 0.037 * Math.sin(t * Math.PI)
      object.position.set(
        sx + (ex - sx) * t + lateral,
        sy + (ey - sy) * t * t,
        sz + (ez - sz) * t + depth,
      )
      object.rotation.set(i * 0.67 + t * 2.1, i * 1.31 + t * 1.2, i * 0.93)
      object.scale.setScalar(0.68 + (i % 5) * 0.12)
      object.updateMatrix()
      mesh.current.setMatrixAt(i, object.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [p, sx, sy, sz, ex, ey, ez])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, GRANULE_COUNT]} visible={p > 0 && p < 1}>
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
