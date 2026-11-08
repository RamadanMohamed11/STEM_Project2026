import { useMemo, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import {
  formatMl,
  liquidSurfaceY,
  pourSourceDimensions,
  receiverRimHeight,
} from '../lib/benchLiquids'
import { benchColor, benchVolumeMl, useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { snapElevation } from './benchLayout'
import { getPourPose } from './equipmentPose'
import { BENCH_TOP, resolveEquipment } from './sceneConfig'

const UP = new Vector3(0, 1, 0)
const DROP_FALL_S = 0.4
const SPILL_FADE_S = 5

/** World position of a root-local point of a yawed bench item. */
function toWorld(at: { x: number; z: number }, yaw: number, local: readonly number[], lift = 0) {
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  return new Vector3(
    at.x + cos * local[0] + sin * local[2],
    BENCH_TOP + lift + local[1],
    at.z - sin * local[0] + cos * local[2],
  )
}

/** The pouring stream: a tapered column from the source lip to the receiver's liquid surface. */
function PourStream() {
  const stream = useRef<Mesh>(null)
  const material = useRef<MeshBasicMaterial>(null)
  const droplets = useRef<Group>(null)
  const scratch = useMemo(() => ({ q: new Quaternion(), d: new Vector3() }), [])

  useFrame(({ clock }) => {
    const mesh = stream.current
    if (!mesh) return
    const liquids = useBenchLiquidsStore.getState()
    const pour = liquids.pour
    const scene = useLabSceneStore.getState()
    const from = pour && scene.positions[pour.sourceId]
    const to = pour && scene.positions[pour.targetId]
    if (!pour || !from || !to || pour.rateMlPerS <= 0) {
      mesh.visible = false
      if (droplets.current) droplets.current.visible = false
      return
    }
    const targetLift = snapElevation(pour.targetId, scene.relationships)
    const pose = getPourPose(
      pour.sourceId,
      from,
      pour.targetId,
      to,
      pour.angle,
      scene.rotations[pour.sourceId] ?? 0,
      {
        source: pourSourceDimensions(pour.sourceId),
        targetRim: (receiverRimHeight(pour.targetId) ?? 0) + targetLift,
      },
    )
    const top = toWorld(from, scene.rotations[pour.sourceId] ?? 0, pose.outlet)
    const surface = liquidSurfaceY(pour.targetId, benchVolumeMl(liquids, pour.targetId))
    const bottom = new Vector3(top.x, BENCH_TOP + targetLift + surface, top.z)
    const length = Math.max(0.01, top.y - bottom.y)
    const radius = 0.005 + 0.0028 * Math.sqrt(pour.rateMlPerS)
    mesh.visible = true
    mesh.position.set(top.x, (top.y + bottom.y) / 2, top.z)
    mesh.scale.set(radius, length, radius)
    scratch.d.subVectors(top, bottom).normalize()
    mesh.quaternion.copy(scratch.q.setFromUnitVectors(UP, scratch.d))
    const color =
      benchColor(liquids, pour.sourceId) ?? benchColor(liquids, pour.targetId) ?? '#d5e9e9'
    material.current?.color.set(color)
    // Falling droplets inside the column show the direction and speed of flow.
    const group = droplets.current
    if (group) {
      group.visible = true
      group.children.forEach((child, i) => {
        const phase = (clock.elapsedTime * 2.4 + i / group.children.length) % 1
        child.position.set(top.x, top.y - phase * length, top.z)
        child.scale.setScalar(radius * 1.25)
      })
    }
  })

  return (
    <group raycast={() => undefined}>
      <mesh ref={stream} visible={false} renderOrder={6} raycast={() => undefined}>
        <cylinderGeometry args={[1, 1, 1, 10, 1, true]} />
        <meshBasicMaterial
          ref={material}
          color="#d5e9e9"
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      <group ref={droplets} visible={false}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} raycast={() => undefined} renderOrder={6}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#e8f4f4" transparent opacity={0.7} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** One falling drop from the dropper, replayed for every drop. */
function FallingDrop() {
  const drop = useRef<Mesh>(null)
  const started = useRef<{ seq: number; at: number } | null>(null)
  useFrame(({ clock }) => {
    const mesh = drop.current
    if (!mesh) return
    const liquids = useBenchLiquidsStore.getState()
    const event = liquids.drop
    if (!event) {
      mesh.visible = false
      return
    }
    if (started.current?.seq !== event.seq)
      started.current = { seq: event.seq, at: clock.elapsedTime }
    const t = (clock.elapsedTime - started.current.at) / DROP_FALL_S
    const scene = useLabSceneStore.getState()
    const at = scene.positions[event.targetId]
    if (!at || t > 1) {
      mesh.visible = false
      return
    }
    const lift = snapElevation(event.targetId, scene.relationships)
    const rim = (receiverRimHeight(event.targetId) ?? 0.3) + lift
    const surface = liquidSurfaceY(event.targetId, benchVolumeMl(liquids, event.targetId)) + lift
    const startY = rim + 0.22
    mesh.visible = true
    mesh.position.set(at.x, BENCH_TOP + startY - (startY - surface) * t * t, at.z)
  })
  return (
    <mesh ref={drop} visible={false} raycast={() => undefined} renderOrder={6}>
      <sphereGeometry args={[0.014, 10, 8]} />
      <meshStandardMaterial color="#cfe8ee" transparent opacity={0.8} roughness={0.1} />
    </mesh>
  )
}

/** A puddle on the bench after an overflow, fading out. */
function SpillPuddle() {
  const spill = useBenchLiquidsStore((state) => state.spill)
  const position = useLabSceneStore((state) =>
    spill ? state.positions[spill.containerId] : undefined,
  )
  const material = useRef<MeshBasicMaterial>(null)
  const born = useRef<{ seq: number; at: number } | null>(null)
  useFrame(({ clock }) => {
    if (!spill || !material.current) return
    if (born.current?.seq !== spill.seq) born.current = { seq: spill.seq, at: clock.elapsedTime }
    const age = clock.elapsedTime - born.current.at
    material.current.opacity = Math.max(0, 0.45 * (1 - age / SPILL_FADE_S))
  })
  if (!spill || !position) return null
  const footprint = resolveEquipment(spill.containerId)?.footprintRadius ?? 0.3
  const radius = footprint + Math.min(0.35, 0.04 + Math.sqrt(spill.spilledMl) * 0.03)
  return (
    <mesh
      raycast={() => undefined}
      position={[position.x, BENCH_TOP + 0.003, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <circleGeometry args={[radius, 40]} />
      <meshBasicMaterial
        ref={material}
        color="#bcd9e2"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </mesh>
  )
}

/** Live "poured / total" readout above the receiving vessel (to 0.1 mL), with pH when acidic. */
function PourReadout() {
  const readout = useBenchLiquidsStore((state) => state.readout)
  const spill = useBenchLiquidsStore((state) => state.spill)
  const position = useLabSceneStore((state) =>
    readout ? state.positions[readout.targetId] : undefined,
  )
  const lift = useLabSceneStore((state) =>
    readout ? snapElevation(readout.targetId, state.relationships) : 0,
  )
  if (!readout || !position) return null
  // Above the item name tags so the two never overlap.
  const top = (receiverRimHeight(readout.targetId) ?? 0.5) + lift + 0.5
  const overflowed = spill?.containerId === readout.targetId
  return (
    <Html
      center
      position={[position.x, BENCH_TOP + top, position.z]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[20, 0]}
    >
      <div
        role="status"
        aria-live="polite"
        className={`whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-semibold tabular-nums shadow-lg ${
          overflowed
            ? 'border-red-300/70 bg-[#5b2324]/95 text-red-50'
            : 'border-white/25 bg-[#082a37]/92 text-white'
        }`}
      >
        <span className="text-[#7fe3d0]">poured</span> {formatMl(readout.pouredMl)}
        <span className="mx-1 text-white/40">/</span>
        <span className="text-[#7fe3d0]">total</span> {formatMl(readout.totalMl)}
        {readout.ph !== null && readout.ph < 6.5 && (
          <span className="ml-1.5 text-amber-200">pH {readout.ph.toFixed(1)}</span>
        )}
        {overflowed && <span className="ml-1.5">· overflow</span>}
      </div>
    </Html>
  )
}

/** L5 practice-pour visuals, driven only by the bench-liquids store. */
export function BenchPourEffects() {
  return (
    <>
      <PourStream />
      <FallingDrop />
      <SpillPuddle />
      <PourReadout />
    </>
  )
}
