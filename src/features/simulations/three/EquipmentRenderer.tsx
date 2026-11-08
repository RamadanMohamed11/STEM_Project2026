import { useEffect } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { benchColor, benchVolumeMl, useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { pourSourceDimensions, receiverRimHeight } from '../lib/benchLiquids'
import { getPourPose } from './equipmentPose'
import { undissolvedSaltG } from '../engine/saltExperiment'
import { EquipmentPhysicsCollider } from './LaboratoryPhysics'
import { BeakerSaltContent } from './effects/BeakerSaltContent'
import { EquipmentModel } from './models'
import { PIVOT_HEIGHT } from './equipmentPose'
import { registerVisualAnchor } from './equipmentVisualAnchors'
import { getTransferEquipmentPose } from './transferMotion'
import { boatPanOffset, useEquipmentManipulation } from './useEquipmentManipulation'
import { snapElevation } from './benchLayout'
import { balanceDisplayG, isPracticeBalance } from '../state/benchInstruments'
import { useMeasurementLogStore } from '../state/useMeasurementLogStore'
import type { EquipmentRegistryEntry } from './sceneConfig'

/** Rendering follows quantities and operation poses; native pointer ownership is isolated in a hook. */
export function EquipmentRenderer({ entry }: { entry: EquipmentRegistryEntry }) {
  const position = useLabSceneStore((state) => state.positions[entry.id] ?? entry.defaultPosition)
  const rotation = useLabSceneStore((state) => state.rotations[entry.id] ?? 0)
  const selected = useLabSceneStore((state) => state.selectedIds.includes(entry.id))
  const hovered = useLabSceneStore((state) => state.hoveredId === entry.id)
  // L4: items snapped onto a holder (tripod ring, clamp jaws) are raised to the snap point.
  const elevation = useLabSceneStore((state) => snapElevation(entry.id, state.relationships))
  const waterMl = useSaltSimulationStore((state) =>
    entry.id === 'water' || entry.id === 'beaker' || entry.id === 'graduated-cylinder'
      ? state.experiment.waterMl[entry.id]
      : undefined,
  )
  // L5: practice liquid (library vessels and practice copies), from the L1 engine.
  const benchMl = useBenchLiquidsStore((state) =>
    state.lab.containers[entry.id] ? benchVolumeMl(state, entry.id) : undefined,
  )
  const benchTint = useBenchLiquidsStore((state) => benchColor(state, entry.id) ?? undefined)
  // L8: a practice balance shows the tared mass of the vessel on its pan.
  const practiceBalance = isPracticeBalance(entry.id)
  const relationships = useLabSceneStore((state) => (practiceBalance ? state.relationships : null))
  const tare = useMeasurementLogStore((state) => (practiceBalance ? state.tare : null))
  const balanceReading = useBenchLiquidsStore((state) =>
    relationships && tare
      ? balanceDisplayG(entry.id, relationships, state, tare).toFixed(2)
      : undefined,
  )
  const remainingSaltG = useSaltSimulationStore((state) =>
    entry.id === 'sodium-chloride' ? state.experiment.saltStockG : undefined,
  )
  const remainingSolidG = useSaltSimulationStore((state) =>
    entry.id === 'beaker' ? undissolvedSaltG(state.experiment) : 0,
  )
  const pouring = useSaltSimulationStore(
    (state) =>
      (state.transfer?.sourceId === entry.id && state.transfer.method === 'pour') ||
      state.livePour?.sourceId === entry.id,
  )
  const {
    pivot,
    active,
    handTip,
    handHeight,
    preview,
    previewMaterial,
    invalidDrop,
    handlePointerDown,
  } = useEquipmentManipulation(entry)

  useEffect(() => {
    if (pivot.current) return registerVisualAnchor(entry.id, pivot.current)
  }, [entry.id, pivot])

  useFrame((_, delta) => {
    const visual = pivot.current
    if (!visual) return
    const scene = useLabSceneStore.getState()
    const session = active.current
    const boatAttached =
      entry.id === 'weighing-boat' && scene.relationships[entry.id]?.targetId === 'digital-balance'
    const pan = boatAttached ? boatPanOffset(scene.positions, rotation) : null
    const benchPour = useBenchLiquidsStore.getState().pour
    if (benchPour?.sourceId === entry.id && benchPour.angle > 0.001) {
      const from = scene.positions[entry.id]
      const to = scene.positions[benchPour.targetId]
      if (from && to) {
        const pose = getPourPose(
          entry.id,
          from,
          benchPour.targetId,
          to,
          benchPour.angle,
          rotation,
          {
            source: pourSourceDimensions(entry.id),
            targetRim:
              (receiverRimHeight(benchPour.targetId) ?? 0) +
              snapElevation(benchPour.targetId, scene.relationships),
          },
        )
        visual.position.set(pose.x, pose.y, pose.z)
        visual.rotation.set(pose.rotationX, 0, pose.rotationZ)
        return
      }
    }
    const transfer = useSaltSimulationStore.getState().transfer
    const automated = getTransferEquipmentPose(
      transfer,
      entry.id,
      scene.positions,
      scene.rotations,
      pan ?? undefined,
    )
    if (automated) {
      // The operation timeline is authoritative. Applying its absolute pose avoids
      // frame-rate-dependent lag between stream, tilt and delivered quantity.
      visual.position.set(automated.x, automated.y, automated.z)
      visual.rotation.set(automated.rotationX, 0, automated.rotationZ)
      return
    }
    const tip = handTip.current
    const current = scene.positions[entry.id] ?? entry.defaultPosition
    const dx = tip ? tip.x - current.x : 0,
      dz = tip ? tip.z - current.z : 0
    const cos = Math.cos(rotation),
      sin = Math.sin(rotation)
    const detachBlend =
      session?.dragging && session.detachOffset ? (1 - Math.min(1, session.travel / 0.38)) ** 2 : 0
    const detach = session?.detachOffset
    const carry = session?.dragging && !tip ? 0.045 : 0
    const targetX =
      (pan?.x ?? 0) +
      cos * dx -
      sin * dz -
      (tip && entry.id === 'spatula' ? 0.286 : 0) +
      (detach?.x ?? 0) * detachBlend
    const targetY =
      PIVOT_HEIGHT + (pan?.y ?? 0) + carry + handHeight.current + (detach?.y ?? 0) * detachBlend
    const targetZ = (pan?.z ?? 0) + sin * dx + cos * dz + (detach?.z ?? 0) * detachBlend
    const blend = 1 - Math.exp(-20 * Math.min(delta, 0.15))
    visual.position.set(
      visual.position.x + (targetX - visual.position.x) * blend,
      visual.position.y + (targetY - visual.position.y) * blend,
      visual.position.z + (targetZ - visual.position.z) * blend,
    )
    visual.rotation.set(visual.rotation.x * (1 - blend), 0, visual.rotation.z * (1 - blend))
  })

  return (
    <>
      <EquipmentPhysicsCollider
        id={entry.id}
        position={position}
        footprintRadius={entry.footprintRadius}
      >
        <group
          name={entry.id}
          position={[0, elevation, 0]}
          rotation={[0, rotation, 0]}
          userData={{ equipmentId: entry.id, label: entry.label, draggable: true }}
          onPointerDown={handlePointerDown}
          onPointerOver={(event) => {
            event.stopPropagation()
            if (!active.current && !useSaltSimulationStore.getState().transfer)
              useLabSceneStore.getState().setHovered(entry.id)
          }}
          onPointerOut={() => {
            const scene = useLabSceneStore.getState()
            if (!active.current && scene.hoveredId === entry.id) scene.setHovered(null)
          }}
        >
          <group ref={pivot} position={[0, PIVOT_HEIGHT, 0]}>
            <group position={[0, -PIVOT_HEIGHT, 0]}>
              <EquipmentModel
                visual={entry.visual}
                modelId={entry.modelId}
                selected={selected || hovered}
                waterMl={waterMl ?? benchMl}
                liquidMl={benchMl}
                liquidColor={benchTint}
                balanceReading={balanceReading}
                remainingSaltG={remainingSaltG}
                pouring={pouring}
              />
              {entry.id === 'beaker' && <BeakerSaltContent undissolvedG={remainingSolidG} />}
            </group>
          </group>
          {(selected || hovered) && (
            <mesh
              raycast={() => undefined}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.018, 0]}
            >
              <ringGeometry
                args={[
                  entry.footprintRadius + 0.025,
                  entry.footprintRadius + (selected ? 0.065 : 0.045),
                  48,
                ]}
              />
              <meshBasicMaterial
                color={selected ? '#27cbb8' : '#c9aa77'}
                transparent
                opacity={selected ? 0.9 : 0.6}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      </EquipmentPhysicsCollider>
      <group ref={preview} visible={false} raycast={() => undefined}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
          <ringGeometry args={[entry.footprintRadius + 0.04, entry.footprintRadius + 0.09, 48]} />
          <meshBasicMaterial
            ref={previewMaterial}
            color="#159f8a"
            transparent
            opacity={0.7}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        {invalidDrop && (
          <Html
            center
            position={[0, 0.16, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <span className="block whitespace-nowrap rounded-md bg-[#6d3332]/95 px-2 py-1 text-[10px] font-semibold text-white">
              Blocked · move around equipment
            </span>
          </Html>
        )}
      </group>
    </>
  )
}
