import { useEffect, useRef, useState } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Group, MeshBasicMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { handlePhysicalInteraction, inspectFinalSolution } from '../state/directInteractions'
import { BENCH_TOP, type EquipmentRegistryEntry, type Point2D } from './sceneConfig'
import { constrainDragMovement, validatePlacement } from './movement'
import { findGestureTarget, overVesselOpening } from './equipmentGestures'
import {
  initialCircularGesture,
  isCircularStir,
  traceCircularGesture,
  type CircularGesture,
} from './gestureMath'
import { exceedsGrabThreshold } from './selectionLogic'

const benchPlane = new Plane(new Vector3(0, 1, 0), -BENCH_TOP)
const beakerPlane = new Plane(new Vector3(0, 1, 0), -(BENCH_TOP + 0.74))
const jarPlane = new Plane(new Vector3(0, 1, 0), -(BENCH_TOP + 0.72))
const distance = (a: Point2D, b: Point2D) => Math.hypot(a.x - b.x, a.z - b.z)

export function boatPanOffset(positions: Record<string, Point2D>, yaw: number) {
  const boat = positions['weighing-boat'],
    balance = positions['digital-balance']
  if (!boat || !balance) return null
  const dx = balance.x - boat.x,
    dz = balance.z - 0.047 - boat.z
  return {
    x: Math.cos(yaw) * dx - Math.sin(yaw) * dz,
    y: 0.208,
    z: Math.sin(yaw) * dx + Math.cos(yaw) * dz,
  }
}

interface GrabSession {
  pointerId: number
  startX: number
  startY: number
  additive: boolean
  dragging: boolean
  offset: Point2D
  initial: Point2D
  lastValid: Point2D
  last: Point2D | null
  travel: number
  insideBeaker: boolean
  insideJar: boolean
  circular: CircularGesture
  stirCreditedMs: number
  scoopSince: number | null
  scoopLast: Point2D | null
  scoopTravel: number
  wasOnBalance: boolean
  detachOffset: { x: number; y: number; z: number } | null
}

/** Pointer capture owns one pending click/grab. Scientific transfers never depend on this gesture. */
export function useEquipmentManipulation(entry: EquipmentRegistryEntry) {
  const { gl, camera } = useThree()
  const pivot = useRef<Group>(null)
  const active = useRef<GrabSession | null>(null)
  const releaseListeners = useRef<(() => void) | null>(null)
  const handTip = useRef<Point2D | null>(null)
  const handHeight = useRef(0)
  const preview = useRef<Group>(null)
  const previewMaterial = useRef<MeshBasicMaterial>(null)
  const [invalidDrop, setInvalidDrop] = useState(false)
  const raycaster = useRef(new Raycaster())
  const ndc = useRef(new Vector2())
  const hit = useRef(new Vector3())
  const mouthHit = useRef(new Vector3())

  const project = (x: number, y: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    ndc.current.set(((x - rect.left) / rect.width) * 2 - 1, 1 - ((y - rect.top) / rect.height) * 2)
    raycaster.current.setFromCamera(ndc.current, camera)
    return raycaster.current.ray.intersectPlane(benchPlane, hit.current)
      ? { x: hit.current.x, z: hit.current.z }
      : null
  }

  const restoreContact = (session: GrabSession) => {
    const scene = useLabSceneStore.getState()
    if (
      session.wasOnBalance &&
      scene.placedIds.includes('digital-balance') &&
      scene.placedIds.includes(entry.id)
    ) {
      scene.setRelationship({
        actorId: entry.id,
        targetId: 'digital-balance',
        kind: 'balance-contact',
      })
    }
  }

  const finish = (cancelled: boolean, resetting = false) => {
    const session = active.current
    if (!session) return
    active.current = null
    handTip.current = null
    handHeight.current = 0
    if (pivot.current) pivot.current.userData.stirringUntil = 0
    if (preview.current) preview.current.visible = false
    setInvalidDrop(false)
    releaseListeners.current?.()
    releaseListeners.current = null
    const scene = useLabSceneStore.getState()
    if (scene.pressedId === entry.id) scene.endPress()
    if (scene.draggingId === entry.id) scene.finishDrag()
    if (resetting) return
    if (cancelled) {
      if (session.dragging) {
        scene.move(entry.id, session.initial)
        restoreContact(session)
      }
      return
    }
    if (!session.dragging) {
      scene.toggleSelection(entry.id, session.additive)
      if (entry.id === 'beaker') inspectFinalSolution(entry.id)
      return
    }
    if (useSaltSimulationStore.getState().effect || useSaltSimulationStore.getState().transfer)
      return
    if (entry.id === 'stirring-rod' && session.insideBeaker) return
    const latest = useLabSceneStore.getState()
    const position = latest.positions[entry.id] ?? entry.defaultPosition
    if (
      entry.id === 'spatula' &&
      session.insideJar &&
      session.scoopSince !== null &&
      performance.now() - session.scoopSince >= 300 &&
      session.scoopTravel >= 0.12
    ) {
      handlePhysicalInteraction({
        actorId: entry.id,
        targetId: 'sodium-chloride',
        gesture: 'scoop',
      })
      return
    }
    // Preserve physical balance placement and optional manual spatula deposits.
    if (session.travel < 0.08) {
      restoreContact(session)
      return
    }
    const target = findGestureTarget(
      entry.id,
      'release',
      position,
      latest.placedIds,
      latest.positions,
    )
    if (target)
      handlePhysicalInteraction({ actorId: entry.id, targetId: target, gesture: 'release' })
  }

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    const scene = useLabSceneStore.getState(),
      simulation = useSaltSimulationStore.getState()
    if (
      event.button !== 0 ||
      active.current ||
      scene.pressedId ||
      scene.draggingId ||
      scene.placement ||
      simulation.effect ||
      simulation.transfer
    )
      return
    event.stopPropagation()
    // touchAction:none replaces preventDefault in R3F's passive native pointer listener.
    const point = project(event.clientX, event.clientY)
    if (!point) return
    const initial = scene.positions[entry.id] ?? entry.defaultPosition
    const wasOnBalance =
      entry.id === 'weighing-boat' && scene.relationships[entry.id]?.targetId === 'digital-balance'
    const session: GrabSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      additive: event.ctrlKey || event.metaKey,
      dragging: false,
      offset: { x: initial.x - point.x, z: initial.z - point.z },
      initial: { ...initial },
      lastValid: initial,
      last: point,
      travel: 0,
      insideBeaker: false,
      insideJar: false,
      circular: initialCircularGesture(),
      stirCreditedMs: 0,
      scoopSince: null,
      scoopLast: null,
      scoopTravel: 0,
      wasOnBalance,
      detachOffset: wasOnBalance
        ? boatPanOffset(scene.positions, scene.rotations[entry.id] ?? 0)
        : null,
    }
    scene.beginPress(entry.id)
    if (useLabSceneStore.getState().pressedId !== entry.id) return
    active.current = session
    const canvas = gl.domElement

    const moveSample = (pointer: PointerEvent) => {
      if (active.current !== session || pointer.pointerId !== session.pointerId) return
      if (pointer.type === 'pointermove' && (pointer.buttons & 1) === 0) {
        finish(true)
        return
      }
      if (!session.dragging) {
        if (!exceedsGrabThreshold(session.startX, session.startY, pointer.clientX, pointer.clientY))
          return
        useLabSceneStore.getState().beginDrag(entry.id)
        if (useLabSceneStore.getState().draggingId !== entry.id) {
          finish(true)
          return
        }
        session.dragging = true
      }
      const raw = project(pointer.clientX, pointer.clientY)
      if (!raw) return
      if (session.last) session.travel += distance(raw, session.last)
      session.last = raw
      const latest = useLabSceneStore.getState()
      const requested = { x: raw.x + session.offset.x, z: raw.z + session.offset.z }
      const tipTool = entry.id === 'stirring-rod' || entry.id === 'spatula'
      const opening = tipTool
        ? raycaster.current.ray.intersectPlane(
            entry.id === 'spatula' ? jarPlane : beakerPlane,
            mouthHit.current,
          )
        : null
      const openingPoint = opening ? { x: opening.x, z: opening.z } : null
      const vessel = entry.id === 'spatula' ? 'sodium-chloride' : 'beaker'
      const gesture = entry.id === 'spatula' ? 'scoop' : 'stir'
      const inside =
        tipTool &&
        openingPoint &&
        overVesselOpening(vessel, openingPoint, latest.placedIds, latest.positions) &&
        findGestureTarget(
          entry.id,
          gesture,
          latest.positions[entry.id] ?? entry.defaultPosition,
          latest.placedIds,
          latest.positions,
        ) === vessel
      session.insideBeaker = Boolean(inside && entry.id === 'stirring-rod')
      session.insideJar = Boolean(inside && entry.id === 'spatula')
      if (inside && openingPoint) {
        handTip.current = openingPoint
        handHeight.current = session.insideJar ? 0.6 : 0.12
        if (session.insideBeaker) {
          const previous = session.circular
          session.circular = traceCircularGesture(
            previous,
            openingPoint,
            latest.positions.beaker,
            pointer.timeStamp,
          )
          if (session.circular.activeMs < previous.activeMs) session.stirCreditedMs = 0
          if (
            isCircularStir(session.circular, pointer.timeStamp) &&
            session.circular.activeMs > previous.activeMs
          ) {
            const elapsedMs = Math.min(250, session.circular.activeMs - session.stirCreditedMs)
            if (elapsedMs >= 30) {
              const accepted = handlePhysicalInteraction({
                actorId: entry.id,
                targetId: 'beaker',
                gesture: 'stir',
                elapsedMs,
              })
              session.stirCreditedMs = session.circular.activeMs
              if (accepted && pivot.current)
                pivot.current.userData.stirringUntil = performance.now() + 500
            }
          }
        } else {
          session.scoopSince ??= performance.now()
          if (session.scoopLast) {
            const displacement = distance(openingPoint, session.scoopLast)
            if (displacement > 0.012 && displacement < 0.16) session.scoopTravel += displacement
          }
          session.scoopLast = openingPoint
        }
      } else {
        handTip.current = null
        handHeight.current = 0
        session.circular = initialCircularGesture()
        session.stirCreditedMs = 0
        session.scoopSince = null
        session.scoopLast = null
        session.scoopTravel = 0
      }
      const check = validatePlacement(entry.id, requested, latest.positions, latest.placedIds)
      setInvalidDrop(!check.valid)
      if (preview.current) {
        preview.current.visible = !inside
        preview.current.position.set(requested.x, BENCH_TOP + 0.025, requested.z)
      }
      previewMaterial.current?.color.set(check.valid ? '#159f8a' : '#cf5d55')
      if (!inside) {
        const safe = constrainDragMovement(
          entry.id,
          session.lastValid,
          requested,
          latest.positions,
          latest.placedIds,
        )
        if (distance(safe, session.lastValid) > 0.002) {
          latest.move(entry.id, safe)
          session.lastValid = safe
        }
      }
    }
    const onMove = (pointer: PointerEvent) => {
      // Preserve real pen/mouse path evidence when the browser batches samples.
      const samples = pointer.getCoalescedEvents?.() ?? []
      for (const sample of samples.slice(-32)) moveSample(sample)
      moveSample(pointer)
    }
    const onUp = (pointer: PointerEvent) => {
      if (pointer.pointerId !== session.pointerId) return
      const rect = canvas.getBoundingClientRect()
      const outside =
        pointer.clientX < rect.left ||
        pointer.clientX > rect.right ||
        pointer.clientY < rect.top ||
        pointer.clientY > rect.bottom
      if (!outside) moveSample(pointer)
      finish(outside)
    }
    const onCancel = (pointer: PointerEvent) => {
      if (pointer.pointerId === session.pointerId) finish(true)
    }
    const onBlur = () => finish(true)
    const onKey = (key: KeyboardEvent) => {
      if (key.key === 'Escape') finish(true)
    }
    const onHidden = () => {
      if (document.hidden) finish(true)
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onCancel, true)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHidden)
    canvas.addEventListener('lostpointercapture', onCancel)
    releaseListeners.current = () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onCancel, true)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHidden)
      canvas.removeEventListener('lostpointercapture', onCancel)
      if (canvas.hasPointerCapture(session.pointerId))
        canvas.releasePointerCapture(session.pointerId)
    }
    try {
      canvas.setPointerCapture(session.pointerId)
    } catch {
      /* Window capture still owns release. */
    }
  }

  useEffect(() => {
    const unsubscribe = useSaltSimulationStore.subscribe((state, previous) => {
      if (state.resetRevision !== previous.resetRevision) finish(true, true)
    })
    return () => {
      unsubscribe()
      finish(true, true)
    }
    // A session owns its native listeners and refs until release; do not rebuild on pointer motion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id])

  return {
    pivot,
    active,
    handTip,
    handHeight,
    preview,
    previewMaterial,
    invalidDrop,
    handlePointerDown,
  }
}
