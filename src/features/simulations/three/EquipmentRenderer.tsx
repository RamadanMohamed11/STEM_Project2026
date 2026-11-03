import { useEffect, useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Group, MeshBasicMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three'
import {
  handlePhysicalInteraction,
  inspectFinalSolution,
  stopPhysicalPour,
  updatePhysicalPour,
} from '@/features/simulations/state/directInteractions'
import { useLabSceneStore } from '@/features/simulations/state/useLabSceneStore'
import { useSaltSimulationStore } from '@/features/simulations/state/useSaltSimulationStore'
import { undissolvedSaltG } from '@/features/simulations/engine/saltExperiment'
import { BeakerSaltContent } from './effects/BeakerSaltContent'
import { EquipmentModel } from './models'
import { BENCH_TOP, type EquipmentRegistryEntry, type Point2D } from './sceneConfig'
import { findGestureTarget, overVesselOpening } from './equipmentGestures'
import {
  initialCircularGesture,
  isCircularStir,
  traceCircularGesture,
  type CircularGesture,
} from './gestureMath'
import { validatePlacement } from './movement'
import { EquipmentPhysicsCollider } from './LaboratoryPhysics'
import {
  isTiltHandleEligible,
  tiltAngleFromVerticalDrag,
  tiltHandleAnchor,
  TILT_ANGLE_MIN,
} from './mouseGestureLogic'

const benchPlane = new Plane(new Vector3(0, 1, 0), -BENCH_TOP)
// Target the beaker mouth, not its lower tabletop silhouette, to avoid parallax.
const beakerOpeningPlane = new Plane(new Vector3(0, 1, 0), -(BENCH_TOP + 0.74))
const saltJarOpeningPlane = new Plane(new Vector3(0, 1, 0), -(BENCH_TOP + 0.72))
const TILT_MIN_ANGLE = TILT_ANGLE_MIN
const RELEASE_MIN_DISTANCE = 0.08
const SCOOP_MIN_DISTANCE = 0.12
const SCOOP_MIN_SECONDS = 0.3
const POUR_TICK_SECONDS = 0.1

interface GrabSession {
  pointerId: number
  pointerButton: number
  mode: 'move' | 'tilt'
  startedY: number
  offset: Point2D
  last: Point2D | null
  travel: number
  tilt: number
  initial: Point2D
  lastValid: Point2D
  previewValid: boolean
  insideBeaker: boolean
  circular: CircularGesture
  scoopSince: number | null
  scoopLast: Point2D | null
  scoopTravel: number
  insideJar: boolean
  pourElapsed: number
  pourActive: boolean
  everPoured: boolean
  blockedPourTarget: string | null
  wasOnBalance: boolean
  detachOffset: { x: number; y: number; z: number } | null
}

const planarDistance = (a: Point2D, b: Point2D) => Math.hypot(a.x - b.x, a.z - b.z)

/** Mirrors the weighing-boat's visual pan offset without moving its collider. */
function boatPanOffset(
  positions: Record<string, Point2D>,
  rotations: Record<string, number>,
): { x: number; y: number; z: number } | null {
  const boat = positions['weighing-boat']
  const balance = positions['digital-balance']
  if (!boat || !balance) return null
  const yaw = rotations['weighing-boat'] ?? 0
  const dx = balance.x - boat.x
  const dz = balance.z - 0.047 - boat.z
  return {
    x: Math.cos(yaw) * dx - Math.sin(yaw) * dz,
    y: 0.208,
    z: Math.sin(yaw) * dx + Math.cos(yaw) * dz,
  }
}

export function EquipmentRenderer({ entry }: { entry: EquipmentRegistryEntry }) {
  const { gl, camera } = useThree()
  const position = useLabSceneStore((state) => state.positions[entry.id] ?? entry.defaultPosition)
  const selected = useLabSceneStore((state) => state.selectedId === entry.id)
  const hovered = useLabSceneStore((state) => state.hoveredId === entry.id)
  const dragging = useLabSceneStore((state) => state.draggingId === entry.id)
  const setHovered = useLabSceneStore((state) => state.setHovered)
  const rotation = useLabSceneStore((state) => state.rotations[entry.id] ?? 0)
  const balancePosition = useLabSceneStore((state) => state.positions['digital-balance'])
  const boatAttached = useLabSceneStore(
    (state) => state.relationships['weighing-boat']?.targetId === 'digital-balance',
  )
  const [tiltHandleHovered, setTiltHandleHovered] = useState(false)
  const [invalidDrop, setInvalidDrop] = useState(false)
  const beginDrag = useLabSceneStore((state) => state.beginDrag)
  const finishDrag = useLabSceneStore((state) => state.finishDrag)
  const move = useLabSceneStore((state) => state.move)
  const activeGesture = useRef<GrabSession | null>(null)
  const suppressContextMenuUntil = useRef(0)
  const cleanupCapture = useRef<(() => void) | null>(null)
  const dragPreview = useRef<Group>(null)
  const previewMaterial = useRef<MeshBasicMaterial>(null)
  const handTip = useRef<Point2D | null>(null)
  const handTipHeight = useRef(0)
  const raycaster = useRef(new Raycaster())
  const ndc = useRef(new Vector2())
  const intersection = useRef(new Vector3())
  const openingIntersection = useRef(new Vector3())
  const experiment = useSaltSimulationStore((state) => state.experiment)
  const effect = useSaltSimulationStore((state) => state.effect)
  const livePour = useSaltSimulationStore((state) => state.livePour)
  const visualPivot = useRef<Group>(null)
  const tiltHandleGroup = useRef<Group>(null)
  const baseTiltHandle = tiltHandleAnchor(entry.id, entry.footprintRadius)
  const boatHandleOffset =
    boatAttached && entry.id === 'weighing-boat' && balancePosition
      ? boatPanOffset(
          { 'weighing-boat': position, 'digital-balance': balancePosition },
          { 'weighing-boat': rotation },
        )
      : null
  const tiltHandlePosition = baseTiltHandle
    ? ([
        baseTiltHandle.x + (boatHandleOffset?.x ?? 0),
        baseTiltHandle.y + (boatHandleOffset?.y ?? 0),
        baseTiltHandle.z + (boatHandleOffset?.z ?? 0),
      ] as const)
    : null
  const affected = effect?.sourceId === entry.id && effect.kind !== 'stirring'
  const destinationRim = effect?.targetId === 'graduated-cylinder' ? 1.13 : 0.74
  const sourceRim = entry.id === 'water' ? 0.9 : entry.id === 'graduated-cylinder' ? 1.13 : 0.71
  const lift =
    affected && effect?.kind === 'liquid-transfer'
      ? Math.max(0, destinationRim + 0.2 - sourceRim)
      : 0

  useFrame((_, delta) => {
    if (!visualPivot.current) return
    const gesture = activeGesture.current
    if (gesture?.mode === 'tilt' && (entry.id === 'water' || entry.id === 'graduated-cylinder')) {
      const spatial = useLabSceneStore.getState()
      const source = spatial.positions[entry.id] ?? entry.defaultPosition
      const recipient =
        gesture.previewValid && gesture.tilt >= TILT_MIN_ANGLE
          ? findGestureTarget(entry.id, 'tilt', source, spatial.placedIds, spatial.positions)
          : null
      if (!recipient) {
        gesture.pourElapsed = 0
        gesture.blockedPourTarget = null
        if (gesture.pourActive) {
          stopPhysicalPour()
          gesture.pourActive = false
        }
      } else if (gesture.blockedPourTarget !== recipient) {
        gesture.pourElapsed += Math.min(delta, 0.15)
        // Handle a slow render frame in at most two 100-ms slices. The
        // chemistry bridge remains authoritative for every transferred mL.
        let ticks = 0
        while (gesture.pourElapsed + 0.000001 >= POUR_TICK_SECONDS && ticks < 2) {
          gesture.pourElapsed -= POUR_TICK_SECONDS
          ticks += 1
          const accepted = updatePhysicalPour({
            actorId: entry.id,
            targetId: recipient,
            angle: gesture.tilt,
            deltaMs: POUR_TICK_SECONDS * 1000,
          })
          if (!accepted) {
            gesture.pourActive = false
            gesture.blockedPourTarget = recipient
            gesture.pourElapsed = 0
            stopPhysicalPour()
            break
          }
          gesture.pourActive = true
          gesture.everPoured = true
        }
      }
    }
    const elapsed = effect ? performance.now() - effect.startedAt : 0
    const phase = effect ? Math.max(0, Math.min(1, elapsed / effect.durationMs)) : 0
    const ongoingPour = livePour?.sourceId === entry.id
    const targetTilt =
      (affected ? 0.5 * Math.sin(Math.PI * phase) : 0) +
      (activeGesture.current?.tilt ?? (ongoingPour ? livePour.angle : 0))
    const targetStir =
      effect?.kind === 'stirring' && entry.id === 'stirring-rod'
        ? 0.2 * Math.sin(phase * Math.PI * 6) * Math.sin(Math.PI * phase)
        : 0
    const k = 1 - Math.exp(-14 * Math.min(delta, 0.1))
    const scene = useLabSceneStore.getState()
    const sourcePosition = scene.positions[entry.id] ?? entry.defaultPosition
    const receiverId =
      gesture?.mode === 'tilt'
        ? findGestureTarget(entry.id, 'tilt', sourcePosition, scene.placedIds, scene.positions)
        : ongoingPour
          ? livePour.targetId
          : affected
            ? effect?.targetId
            : null
    const receiverPosition = receiverId ? scene.positions[receiverId] : null
    const aimX = receiverPosition ? receiverPosition.x - sourcePosition.x : 0
    const aimZ = receiverPosition ? receiverPosition.z - sourcePosition.z : 0
    const aimDistance = Math.hypot(aimX, aimZ)
    const cr = Math.cos(rotation)
    const sr = Math.sin(rotation)
    // Direct the vessel's tilted mouth toward the receiver in world space,
    // while respecting the equipment parent's own Y rotation.
    const localX = aimDistance > 0.01 ? (cr * aimX - sr * aimZ) / aimDistance : -1
    const localZ = aimDistance > 0.01 ? (sr * aimX + cr * aimZ) / aimDistance : 0
    visualPivot.current.rotation.x += (targetTilt * localZ - visualPivot.current.rotation.x) * k
    visualPivot.current.rotation.z +=
      (-targetTilt * localX + targetStir - visualPivot.current.rotation.z) * k
    const liveTargetRim = livePour?.targetId === 'graduated-cylinder' ? 1.13 : 0.74
    const activeLift = ongoingPour ? Math.max(0, liveTargetRim + 0.2 - sourceRim) : 0
    const targetLift =
      (affected && effect?.kind === 'liquid-transfer' ? lift * Math.sin(Math.PI * phase) : 0) +
      activeLift
    const detach = gesture?.detachOffset
    const detachProgress = gesture ? Math.min(1, gesture.travel / 0.38) : 1
    const detachBlend = detach ? Math.pow(1 - detachProgress, 2) : 0
    const tip = handTip.current
    const current = useLabSceneStore.getState().positions[entry.id] ?? entry.defaultPosition
    const toolFollowing = (entry.id === 'stirring-rod' || entry.id === 'spatula') && tip !== null
    const dx = toolFollowing ? tip.x - current.x : 0
    const dz = toolFollowing ? tip.z - current.z : 0
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    visualPivot.current.position.y +=
      (0.42 +
        targetLift +
        (toolFollowing ? handTipHeight.current : 0) +
        (detach ? detach.y * detachBlend : 0) -
        visualPivot.current.position.y) *
      k
    const scoopTipOffset = entry.id === 'spatula' && toolFollowing ? 0.286 : 0
    visualPivot.current.position.x +=
      (cos * dx -
        sin * dz -
        scoopTipOffset +
        (detach ? detach.x * detachBlend : 0) -
        visualPivot.current.position.x) *
      k
    visualPivot.current.position.z +=
      (sin * dx +
        cos * dz +
        (detach ? detach.z * detachBlend : 0) -
        visualPivot.current.position.z) *
      k
    if (tiltHandleGroup.current && baseTiltHandle) {
      // Mirror the model's animated lift / snap compensation but do not spin
      // the grip around the tip as the vessel tilts. Model and grip now stay
      // together both on the digital balance and while the tool is in hand.
      tiltHandleGroup.current.position.set(
        baseTiltHandle.x + (boatHandleOffset?.x ?? 0) + visualPivot.current.position.x,
        baseTiltHandle.y + (boatHandleOffset?.y ?? 0) + visualPivot.current.position.y - 0.42,
        baseTiltHandle.z + (boatHandleOffset?.z ?? 0) + visualPivot.current.position.z,
      )
    }
  })

  const pointerPoint = (event: ThreeEvent<PointerEvent>) => {
    return event.ray.intersectPlane(benchPlane, intersection.current)
  }

  const projectClientPoint = (clientX: number, clientY: number): Point2D | null => {
    const bounds = gl.domElement.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return null
    ndc.current.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    )
    raycaster.current.setFromCamera(ndc.current, camera)
    const hit = raycaster.current.ray.intersectPlane(benchPlane, intersection.current)
    return hit ? { x: hit.x, z: hit.z } : null
  }

  const finishGesture = (cancelled: boolean) => {
    const sceneHover = useLabSceneStore.getState()
    if (sceneHover.tiltHandleHoveredId === entry.id) sceneHover.setTiltHandleHovered(null)
    const session = activeGesture.current
    if (!session) return
    setInvalidDrop(false)
    if (session.pointerButton === 2) {
      // Some browsers dispatch contextmenu AFTER pointerup. Keep the canvas
      // capture guard alive briefly without suppressing unrelated right-pans.
      suppressContextMenuUntil.current = performance.now() + 450
    }
    const restoreBoatAttachment = () => {
      if (!session.wasOnBalance || entry.id !== 'weighing-boat') return
      const state = useLabSceneStore.getState()
      if (!state.placedIds.includes(entry.id) || !state.placedIds.includes('digital-balance'))
        return
      state.move(entry.id, session.initial)
      useLabSceneStore.getState().setRelationship({
        actorId: 'weighing-boat',
        targetId: 'digital-balance',
        kind: 'balance-contact',
      })
      visualPivot.current?.position.set(0, 0.42, 0)
    }
    activeGesture.current = null
    handTip.current = null
    handTipHeight.current = 0
    if (dragPreview.current) dragPreview.current.visible = false
    cleanupCapture.current?.()
    cleanupCapture.current = null
    if (useLabSceneStore.getState().draggingId === entry.id) finishDrag()
    // Water is already committed incrementally while tilted; releasing only
    // ends the real stream and never fabricates a completed transfer event.
    if (session.everPoured) stopPhysicalPour()
    if (cancelled) {
      // Cancelling an aligned lateral tilt is as reversible as a normal grab.
      // Already transferred liquid is intentionally NOT rolled back.
      if (useLabSceneStore.getState().placedIds.includes(entry.id)) move(entry.id, session.initial)
      restoreBoatAttachment()
      return
    }
    if (session.wasOnBalance && session.mode === 'move' && session.travel < RELEASE_MIN_DISTANCE) {
      // A click on a loaded balance dish is selection, not detachment.
      restoreBoatAttachment()
      return
    }
    if (useSaltSimulationStore.getState().effect) return

    const scene = useLabSceneStore.getState()
    const finalPosition = scene.positions[entry.id] ?? entry.defaultPosition
    if (session.mode === 'tilt') {
      if (session.tilt < TILT_MIN_ANGLE || !session.previewValid) return
      // Water has already flowed while held. Never execute a second fixed-volume
      // legacy pour on release.
      if (entry.id !== 'weighing-boat') return
      const target = findGestureTarget(
        entry.id,
        'tilt',
        finalPosition,
        scene.placedIds,
        scene.positions,
      )
      if (target)
        handlePhysicalInteraction({
          actorId: entry.id,
          targetId: target,
          gesture: 'tilt',
          magnitude: Math.min(1, session.tilt / TILT_MIN_ANGLE),
        })
      return
    }

    if (
      entry.id === 'stirring-rod' &&
      session.insideBeaker &&
      isCircularStir(session.circular, performance.now()) &&
      findGestureTarget(entry.id, 'stir', finalPosition, scene.placedIds, scene.positions) ===
        'beaker'
    ) {
      handlePhysicalInteraction({
        actorId: entry.id,
        targetId: 'beaker',
        gesture: 'stir',
        magnitude: 1,
      })
      return
    }
    if (
      entry.id === 'spatula' &&
      session.insideJar &&
      session.scoopSince !== null &&
      performance.now() - session.scoopSince >= SCOOP_MIN_SECONDS * 1000 &&
      session.scoopTravel >= SCOOP_MIN_DISTANCE &&
      findGestureTarget(entry.id, 'scoop', finalPosition, scene.placedIds, scene.positions) ===
        'sodium-chloride'
    ) {
      handlePhysicalInteraction({
        actorId: entry.id,
        targetId: 'sodium-chloride',
        gesture: 'scoop',
        magnitude: 1,
      })
      return
    }
    if (session.travel < RELEASE_MIN_DISTANCE) {
      // The final learning action is a real 3D inspection of the finished
      // beaker, not a Next/Validate procedure button or animation callback.
      if (entry.id === 'beaker' && session.mode === 'move') inspectFinalSolution(entry.id)
      return
    }
    if (!session.previewValid) return
    const target = findGestureTarget(
      entry.id,
      'release',
      finalPosition,
      scene.placedIds,
      scene.positions,
    )
    if (target) {
      const committed = handlePhysicalInteraction({
        actorId: entry.id,
        targetId: target,
        gesture: 'release',
        magnitude: 1,
      })
      if (committed && entry.id === 'weighing-boat' && target === 'digital-balance') {
        const offset = boatPanOffset(scene.positions, scene.rotations)
        if (offset && visualPivot.current) {
          // New attachment is applied inside the model at the next render.
          // Counteract it immediately, then ease this offset to zero so the
          // boat rises onto the balance pan without teleportation.
          visualPivot.current.position.x -= offset.x
          visualPivot.current.position.y -= offset.y
          visualPivot.current.position.z -= offset.z
        }
      }
    }
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>, fromTiltHandle = false) => {
    const scene = useLabSceneStore.getState()
    const canTilt = isTiltHandleEligible(entry.id)
    const rightClickTilt = event.button === 2 && canTilt
    if (
      (fromTiltHandle && (!canTilt || event.button !== 0)) ||
      (event.button !== 0 && !rightClickTilt) ||
      activeGesture.current ||
      scene.draggingId ||
      scene.placement ||
      useSaltSimulationStore.getState().effect
    )
      return
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    const point = pointerPoint(event)
    const original = scene.positions[entry.id] ?? entry.defaultPosition
    const wantsTilt =
      fromTiltHandle || rightClickTilt || (event.button === 0 && event.shiftKey && canTilt)
    const wasOnBalance =
      entry.id === 'weighing-boat' &&
      scene.relationships['weighing-boat']?.targetId === 'digital-balance'
    const detachOffset = wasOnBalance ? boatPanOffset(scene.positions, scene.rotations) : null
    const session: GrabSession = {
      pointerId: event.pointerId,
      pointerButton: event.button,
      mode: wantsTilt ? 'tilt' : 'move',
      startedY: event.clientY,
      offset: point ? { x: original.x - point.x, z: original.z - point.z } : { x: 0, z: 0 },
      last: point ? { x: point.x, z: point.z } : null,
      travel: 0,
      tilt: 0,
      initial: { ...original },
      lastValid: { ...original },
      previewValid: true,
      insideBeaker: false,
      circular: initialCircularGesture(),
      scoopSince: null,
      scoopLast: null,
      scoopTravel: 0,
      insideJar: false,
      pourElapsed: 0,
      pourActive: false,
      everPoured: false,
      blockedPourTarget: null,
      wasOnBalance,
      detachOffset,
    }
    // The model was visibly located on the balance while its kinematic
    // collider stayed in a valid adjacent bench slot. The store clears the
    // attachment on beginDrag; preserve the pre-detach visual world position.
    if (detachOffset && visualPivot.current) {
      visualPivot.current.position.set(detachOffset.x, 0.42 + detachOffset.y, detachOffset.z)
    }
    beginDrag(entry.id)
    if (useLabSceneStore.getState().draggingId !== entry.id) return
    activeGesture.current = session
    setInvalidDrop(false)
    const canvas = gl.domElement

    const onMove = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== session.pointerId || activeGesture.current !== session) return
      if (session.mode === 'tilt') {
        session.tilt = tiltAngleFromVerticalDrag(session.startedY, pointerEvent.clientY)
      }
      // The Shift+vertical motion exclusively controls angle; lateral hand
      // movement translates the vessel on the bench to align with its receiver.
      const raw = projectClientPoint(
        pointerEvent.clientX,
        session.mode === 'tilt' ? session.startedY : pointerEvent.clientY,
      )
      if (!raw) return
      if (session.last) session.travel += planarDistance(raw, session.last)
      session.last = raw
      const latest = useLabSceneStore.getState()
      const requested = { x: raw.x + session.offset.x, z: raw.z + session.offset.z }
      const tipMode =
        session.mode === 'move' && (entry.id === 'stirring-rod' || entry.id === 'spatula')
      const mouthPlane = entry.id === 'spatula' ? saltJarOpeningPlane : beakerOpeningPlane
      const openingHit = tipMode
        ? raycaster.current.ray.intersectPlane(mouthPlane, openingIntersection.current)
        : null
      const openingPoint = openingHit ? { x: openingHit.x, z: openingHit.z } : null
      const insideBeaker =
        entry.id === 'stirring-rod' &&
        openingPoint !== null &&
        overVesselOpening('beaker', openingPoint, latest.placedIds, latest.positions) &&
        findGestureTarget(
          entry.id,
          'stir',
          latest.positions[entry.id] ?? entry.defaultPosition,
          latest.placedIds,
          latest.positions,
        ) === 'beaker'
      const insideJar =
        entry.id === 'spatula' &&
        openingPoint !== null &&
        overVesselOpening('sodium-chloride', openingPoint, latest.placedIds, latest.positions) &&
        findGestureTarget(
          entry.id,
          'scoop',
          latest.positions[entry.id] ?? entry.defaultPosition,
          latest.placedIds,
          latest.positions,
        ) === 'sodium-chloride'
      session.insideBeaker = insideBeaker
      session.insideJar = insideJar
      const inside = insideBeaker || insideJar
      if (inside && openingPoint) {
        handTip.current = openingPoint
        // The spatula spoon is locally y~0.11; lift it to the jar lip y~0.72.
        handTipHeight.current = insideJar ? 0.6 : 0.12
        if (insideBeaker) {
          const center = latest.positions.beaker
          if (center)
            session.circular = traceCircularGesture(
              session.circular,
              openingPoint,
              center,
              performance.now(),
            )
        } else if (insideJar) {
          if (session.scoopSince === null) {
            session.scoopSince = performance.now()
          } else if (session.scoopLast) {
            const displacement = planarDistance(openingPoint, session.scoopLast)
            // Only meaningful in-mouth motion, not tiny mouse jitter.
            if (displacement > 0.012 && displacement < 0.16) session.scoopTravel += displacement
          }
          session.scoopLast = openingPoint
        }
      } else {
        handTip.current = null
        handTipHeight.current = 0
        session.circular = initialCircularGesture()
        session.scoopSince = null
        session.scoopLast = null
        session.scoopTravel = 0
      }

      const result = validatePlacement(entry.id, requested, latest.positions, latest.placedIds)
      if (session.previewValid !== result.valid) setInvalidDrop(!result.valid)
      session.previewValid = result.valid
      if (dragPreview.current) {
        dragPreview.current.visible = !inside
        dragPreview.current.position.set(requested.x, BENCH_TOP + 0.025, requested.z)
      }
      previewMaterial.current?.color.set(result.valid ? '#0c9d88' : '#d35454')
      if (result.valid && !inside && planarDistance(session.lastValid, requested) > 0.008) {
        move(entry.id, requested)
        session.lastValid = requested
      }
    }

    const onUp = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId === session.pointerId) {
        const bounds = canvas.getBoundingClientRect()
        if (
          pointerEvent.clientX < bounds.left ||
          pointerEvent.clientX > bounds.right ||
          pointerEvent.clientY < bounds.top ||
          pointerEvent.clientY > bounds.bottom
        ) {
          finishGesture(true)
          return
        }
        onMove(pointerEvent)
        finishGesture(false)
      }
    }
    const onCancel = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId === session.pointerId) finishGesture(true)
    }
    const onLostCapture = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId === session.pointerId) finishGesture(true)
    }
    const onBlur = () => finishGesture(true)
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') finishGesture(true)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') finishGesture(true)
    }
    // Capture phase runs before R3F hit-testing or other scene-level handlers,
    // so a grab keeps its movement/release even if another mesh is hovered.
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onCancel, true)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)
    canvas.addEventListener('lostpointercapture', onLostCapture)
    cleanupCapture.current = () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onCancel, true)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      canvas.removeEventListener('lostpointercapture', onLostCapture)
      if (canvas.hasPointerCapture(session.pointerId))
        canvas.releasePointerCapture(session.pointerId)
    }
    try {
      canvas.setPointerCapture(session.pointerId)
    } catch {
      // Window listeners still handle release on browsers that refuse capture.
    }
  }

  useEffect(
    () => () => {
      // The grip can still be hovered when no drag session exists.
      const scene = useLabSceneStore.getState()
      if (scene.tiltHandleHoveredId === entry.id) scene.setTiltHandleHovered(null)
      const session = activeGesture.current
      if (!session) return
      activeGesture.current = null
      handTip.current = null
      handTipHeight.current = 0
      cleanupCapture.current?.()
      cleanupCapture.current = null
      if (useLabSceneStore.getState().draggingId === entry.id)
        useLabSceneStore.getState().finishDrag()
      if (session.everPoured || useSaltSimulationStore.getState().livePour?.sourceId === entry.id)
        stopPhysicalPour()
    },
    [entry.id],
  )

  useEffect(() => {
    let revision = useSaltSimulationStore.getState().resetRevision
    return useSaltSimulationStore.subscribe((state) => {
      if (state.resetRevision === revision) return
      revision = state.resetRevision
      const scene = useLabSceneStore.getState()
      if (scene.tiltHandleHoveredId === entry.id) scene.setTiltHandleHovered(null)
      setTiltHandleHovered(false)
      const session = activeGesture.current
      if (!session) return
      activeGesture.current = null
      handTip.current = null
      handTipHeight.current = 0
      if (dragPreview.current) dragPreview.current.visible = false
      setInvalidDrop(false)
      cleanupCapture.current?.()
      cleanupCapture.current = null
      if (useLabSceneStore.getState().draggingId === entry.id)
        useLabSceneStore.getState().finishDrag()
      if (session.everPoured || state.livePour?.sourceId === entry.id) stopPhysicalPour()
    })
  }, [entry.id])

  useEffect(() => {
    if (entry.id !== 'water' && entry.id !== 'graduated-cylinder' && entry.id !== 'weighing-boat')
      return
    const canvas = gl.domElement
    const onContextMenu = (event: MouseEvent) => {
      if (
        activeGesture.current?.pointerButton === 2 ||
        performance.now() < suppressContextMenuUntil.current
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    canvas.addEventListener('contextmenu', onContextMenu, true)
    return () => canvas.removeEventListener('contextmenu', onContextMenu, true)
  }, [entry.id, gl])

  return (
    <>
      <EquipmentPhysicsCollider
        id={entry.id}
        position={position}
        footprintRadius={entry.footprintRadius}
      >
        <group
          rotation={[0, rotation, 0]}
          onPointerDown={handlePointerDown}
          onContextMenu={(event) => {
            if (
              entry.id === 'water' ||
              entry.id === 'graduated-cylinder' ||
              entry.id === 'weighing-boat'
            ) {
              event.stopPropagation()
              event.nativeEvent.preventDefault()
            }
          }}
          onPointerOver={(event) => {
            event.stopPropagation()
            if (!activeGesture.current) setHovered(entry.id)
          }}
          onPointerOut={() => {
            if (!activeGesture.current) setHovered(null)
          }}
          name={entry.id}
          userData={{ equipmentId: entry.id, label: entry.label, draggable: true }}
        >
          <group ref={visualPivot} position={[0, 0.42, 0]}>
            <group position={[0, -0.42, 0]}>
              <EquipmentModel
                visual={entry.visual}
                selected={selected}
                waterMl={
                  entry.id === 'water' || entry.id === 'beaker' || entry.id === 'graduated-cylinder'
                    ? experiment.waterMl[entry.id]
                    : undefined
                }
                remainingSaltG={entry.id === 'sodium-chloride' ? experiment.saltStockG : undefined}
                pouring={Boolean(
                  (affected && effect?.kind === 'liquid-transfer') ||
                  livePour?.sourceId === entry.id,
                )}
              />
              {entry.id === 'beaker' && (
                <BeakerSaltContent undissolvedG={undissolvedSaltG(experiment)} />
              )}
            </group>
          </group>
          {tiltHandlePosition && (
            <group
              ref={tiltHandleGroup}
              name={`${entry.id}-tilt-handle`}
              userData={{ equipmentId: entry.id, role: 'tilt-handle', gesture: 'tilt' }}
              position={[...tiltHandlePosition]}
              onPointerDown={(event) => {
                // Handle clicks MUST NOT bubble into the normal-body grab path.
                // Existing native capture then owns movement and suspends OrbitControls.
                event.stopPropagation()
                const scene = useLabSceneStore.getState()
                if (scene.tiltHandleHoveredId === entry.id) scene.setTiltHandleHovered(null)
                setTiltHandleHovered(false)
                handlePointerDown(event, event.button === 0)
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                setHovered(entry.id)
                setTiltHandleHovered(true)
                useLabSceneStore.getState().setTiltHandleHovered(entry.id)
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                setTiltHandleHovered(false)
                const scene = useLabSceneStore.getState()
                if (scene.tiltHandleHoveredId === entry.id) scene.setTiltHandleHovered(null)
                if (!activeGesture.current) {
                  setHovered(null)
                }
              }}
            >
              {/* Enlarged invisible sphere is the primary mouse target. Visible
                  geometry is intentionally smaller, outside the vessel body. */}
              <mesh>
                <sphereGeometry args={[0.19, 12, 10]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              <mesh raycast={() => undefined}>
                <torusGeometry args={[0.116, 0.026, 10, 32]} />
                <meshStandardMaterial
                  color={
                    dragging
                      ? '#16e8cb'
                      : selected || hovered || tiltHandleHovered
                        ? '#19d1be'
                        : '#75b8b0'
                  }
                  metalness={0.12}
                  roughness={0.38}
                  emissive={selected || hovered || dragging ? '#0b6a62' : '#133e44'}
                  emissiveIntensity={0.46}
                  depthTest={false}
                />
              </mesh>
              <mesh position={[0, -0.15, 0]} rotation={[0, 0, Math.PI]} raycast={() => undefined}>
                <coneGeometry args={[0.055, 0.1, 3]} />
                <meshBasicMaterial color={dragging ? '#1ff2cc' : '#1da797'} depthTest={false} />
              </mesh>
              <mesh
                position={[-0.162, 0, -0.012]}
                rotation={[0, 0, Math.PI / 2]}
                raycast={() => undefined}
              >
                <cylinderGeometry args={[0.012, 0.012, 0.18, 6]} />
                <meshStandardMaterial color="#7ba8aa" metalness={0.22} roughness={0.48} />
              </mesh>
              {(tiltHandleHovered || (selected && !dragging)) && (
                <Html
                  center
                  position={[0, 0.29, 0]}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  <span
                    style={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      padding: '5px 9px',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#eafffb',
                      background: 'rgba(5, 40, 48, 0.93)',
                      border: '1px solid rgba(87, 215, 197, 0.65)',
                    }}
                  >
                    {entry.id === 'weighing-boat' ? 'Left-drag ↓ to tip' : 'Left-drag ↓ to pour'}
                  </span>
                </Html>
              )}
            </group>
          )}
          {(selected || hovered) && (
            <mesh
              raycast={() => undefined}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.018, 0]}
            >
              <ringGeometry
                args={[
                  entry.footprintRadius + 0.025,
                  entry.footprintRadius + (selected ? 0.07 : 0.05),
                  48,
                ]}
              />
              <meshBasicMaterial
                color={selected ? '#24e7d1' : '#ffbf62'}
                transparent
                opacity={selected ? 0.96 : 0.78}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      </EquipmentPhysicsCollider>
      <group ref={dragPreview} visible={false} raycast={() => undefined}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => undefined}>
          <ringGeometry args={[entry.footprintRadius + 0.04, entry.footprintRadius + 0.095, 48]} />
          <meshBasicMaterial
            ref={previewMaterial}
            color="#0c9d88"
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
            <span
              style={{
                display: 'block',
                color: '#fff7f2',
                background: 'rgba(125, 35, 41, 0.94)',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                borderRadius: '7px',
              }}
            >
              Invalid position · move into clear space
            </span>
          </Html>
        )}
      </group>
    </>
  )
}
