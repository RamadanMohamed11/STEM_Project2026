import type { TransferOperation } from '../engine/materialTransfers.ts'
import type { Point2D } from './sceneConfig.ts'
import {
  getPourPose,
  PIVOT_HEIGHT,
  POUR_CLEARANCE,
  POUR_SOURCE_DIMENSIONS,
  RECEIVER_RIM_HEIGHTS,
  SALT_JAR_RIM_HEIGHT,
  SPATULA_SPOON_CENTER,
  SPATULA_SPOON_OUTLET,
} from './equipmentPose.ts'

export interface TransferEquipmentPose {
  /** Absolute visualPivot position in its yawed equipment root's local frame. */
  x: number
  y: number
  z: number
  /** Default Three XYZ Euler order, rotation.y = 0. */
  rotationX: number
  rotationZ: number
}

/** Extra root-local rest translation beyond [0, PIVOT_HEIGHT, 0]. */
export interface TransferHomeOffset {
  x: number
  y: number
  z: number
}

export type TransferPositions = Readonly<Record<string, Point2D | undefined>>
export type TransferRotations = Readonly<Record<string, number | undefined>>
export const TRANSFER_POUR_ANGLE = 0.72
export const TRANSFER_TRAVEL_CLEARANCE = 0.16
export const TRANSFER_LIFT_END = 0.22
export const TRANSFER_TRAVEL_END = 0.78

const home = (offset?: TransferHomeOffset): TransferEquipmentPose => ({
  x: offset?.x ?? 0,
  y: PIVOT_HEIGHT + (offset?.y ?? 0),
  z: offset?.z ?? 0,
  rotationX: 0,
  rotationZ: 0,
})
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => {
  const p = clamp(value)
  return p * p * (3 - 2 * p)
}

function validTiming(op: TransferOperation): boolean {
  return (
    [op.elapsedMs, op.durationMs, op.approachMs, op.flowMs, op.returnMs].every(Number.isFinite) &&
    op.elapsedMs >= 0 &&
    op.durationMs > 0 &&
    op.approachMs > 0 &&
    op.flowMs > 0 &&
    op.returnMs > 0
  )
}

function validPoint(point: Point2D | undefined): point is Point2D {
  return !!point && Number.isFinite(point.x) && Number.isFinite(point.z)
}

/** The receiving spatula moves for a scoop; for deposit/pour the source moves. */
export function getTransferMovingEquipmentId(op: TransferOperation): string {
  return op.method === 'scoop' ? op.targetId : op.sourceId
}

/** Null outside the authoritative flow interval, including all cancelled operations. */
export function getTransferFlowProgress(op: TransferOperation | null | undefined): number | null {
  if (
    !op ||
    !validTiming(op) ||
    op.cancelled ||
    op.elapsedMs >= op.durationMs ||
    op.elapsedMs < op.approachMs ||
    op.elapsedMs >= op.approachMs + op.flowMs
  )
    return null
  return (op.elapsedMs - op.approachMs) / op.flowMs
}

/** Place a particular spoon point, rather than the spatula root, at the opening. */
function spoonPose(
  source: Point2D,
  target: Point2D,
  targetHeight: number,
  yaw: number,
  anchor: readonly [number, number, number],
  rotationZ: number,
): TransferEquipmentPose {
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  const dx = target.x - source.x
  const dz = target.z - source.z
  const y = anchor[1] - PIVOT_HEIGHT
  const rotatedX = Math.cos(rotationZ) * anchor[0] - Math.sin(rotationZ) * y
  const rotatedY = Math.sin(rotationZ) * anchor[0] + Math.cos(rotationZ) * y
  return {
    x: cos * dx - sin * dz - rotatedX,
    y: targetHeight - rotatedY,
    z: sin * dx + cos * dz - anchor[2],
    rotationX: 0,
    rotationZ,
  }
}

function workingPose(
  op: TransferOperation,
  moving: Point2D,
  source: Point2D,
  target: Point2D,
  yaw: number,
): TransferEquipmentPose | null {
  if (op.method === 'scoop') {
    if (op.kind !== 'solid' || op.sourceId !== 'sodium-chloride' || op.targetId !== 'spatula')
      return null
    // The bowl enters the open jar mouth while its handle remains above the lip.
    // The stock jar itself never tips or travels for a scoop.
    return spoonPose(moving, source, SALT_JAR_RIM_HEIGHT - 0.045, yaw, SPATULA_SPOON_CENTER, -0.22)
  }
  if (op.method === 'deposit') {
    if (op.kind !== 'solid' || op.sourceId !== 'spatula' || op.targetId !== 'weighing-boat')
      return null
    return spoonPose(moving, target, 0.13 + POUR_CLEARANCE, yaw, SPATULA_SPOON_OUTLET, -0.55)
  }
  if (
    op.method !== 'pour' ||
    !Object.hasOwn(POUR_SOURCE_DIMENSIONS, op.sourceId) ||
    !Object.hasOwn(RECEIVER_RIM_HEIGHTS, op.targetId)
  )
    return null
  if (op.kind === 'liquid' && !['water', 'graduated-cylinder', 'beaker'].includes(op.sourceId))
    return null
  if (op.kind === 'solid' && (op.sourceId !== 'weighing-boat' || op.targetId !== 'beaker'))
    return null
  const pose = getPourPose(op.sourceId, source, op.targetId, target, TRANSFER_POUR_ANGLE, yaw)
  return { x: pose.x, y: pose.y, z: pose.z, rotationX: pose.rotationX, rotationZ: pose.rotationZ }
}

/** A reversible lifted route: no horizontal travel near the bench or vessel rims. */
function routePose(
  working: TransferEquipmentPose,
  progress: number,
  rest: TransferEquipmentPose,
): TransferEquipmentPose {
  if (progress <= 0) return rest
  if (progress >= 1) return { ...working }
  // Clear even a cylinder/rod crossed by a long, non-proximity transfer. The
  // lowest model point is at pivotY - .42 while the vessel travels upright.
  const travelY = Math.max(
    PIVOT_HEIGHT + 1.115 + TRANSFER_TRAVEL_CLEARANCE,
    working.y + TRANSFER_TRAVEL_CLEARANCE,
    rest.y + TRANSFER_TRAVEL_CLEARANCE,
  )
  const lifted = smooth(progress / TRANSFER_LIFT_END)
  const travelled = smooth(
    (progress - TRANSFER_LIFT_END) / (TRANSFER_TRAVEL_END - TRANSFER_LIFT_END),
  )
  const settled = smooth((progress - TRANSFER_TRAVEL_END) / (1 - TRANSFER_TRAVEL_END))
  return {
    x: rest.x + (working.x - rest.x) * travelled,
    y: rest.y + (travelY - rest.y) * lifted + (working.y - travelY) * settled,
    z: rest.z + (working.z - rest.z) * travelled,
    rotationX: working.rotationX * settled,
    rotationZ: working.rotationZ * settled,
  }
}

/**
 * Pure operation-derived motion. No default placements, proximity checks, clocks,
 * Three refs or scientific-state writes. Apply directly when non-null, instead
 * of layering it onto the gesture pose. The moving equipment starts/returns at
 * [homeOffset.x, .42 + homeOffset.y, homeOffset.z] / zero rotation, including
 * interrupted approaches. The optional rest offset never changes the working pose.
 */
export function getTransferEquipmentPose(
  operation: TransferOperation | null | undefined,
  equipmentId: string,
  positions: TransferPositions,
  rotations: TransferRotations,
  homeOffset?: TransferHomeOffset,
): TransferEquipmentPose | null {
  if (!operation || !validTiming(operation)) return null
  const op = operation
  const movingId = getTransferMovingEquipmentId(op)
  if (equipmentId !== movingId) return null
  if (homeOffset && ![homeOffset.x, homeOffset.y, homeOffset.z].every(Number.isFinite)) return null
  const rest = home(homeOffset)
  const source = positions[op.sourceId]
  const target = positions[op.targetId]
  const moving = positions[movingId]
  if (!validPoint(source) || !validPoint(target) || !validPoint(moving)) return null
  const requestedYaw = rotations[movingId]
  const yaw = requestedYaw !== undefined && Number.isFinite(requestedYaw) ? requestedYaw : 0
  const working = workingPose(op, moving, source, target, yaw)
  if (!working || !Object.values(working).every(Number.isFinite)) return null
  if (op.elapsedMs >= op.durationMs) return rest

  const flowEnd = op.approachMs + op.flowMs
  const normalDuration = flowEnd + op.returnMs
  let progress: number
  if (op.cancelled && op.durationMs < normalDuration) {
    // Before normal return, the domain shortens duration to cancelTime + returnMs.
    // During normal return duration stays unchanged: preserve that original route
    // below, rather than interpreting flowEnd as a new cancellation/teleport point.
    const cancelStart = Math.max(0, op.durationMs - op.returnMs)
    const startProgress = Math.min(1, cancelStart / op.approachMs)
    const returnProgress = smooth((op.elapsedMs - cancelStart) / op.returnMs)
    progress = startProgress * (1 - returnProgress)
  } else if (op.elapsedMs <= op.approachMs) {
    progress = op.elapsedMs / op.approachMs
  } else if (op.elapsedMs < flowEnd) {
    progress = 1
  } else {
    progress = 1 - clamp((op.elapsedMs - flowEnd) / op.returnMs)
  }
  return routePose(working, progress, rest)
}
