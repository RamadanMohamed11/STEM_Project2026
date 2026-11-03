/**
 * Mouse-only 3D tilt-handle affordance. Pure, rendering-independent metadata:
 * the grip is offset from the equipment silhouette and remains attached to
 * the un-tilted scene group, never to the rotating liquid container mesh.
 */
export type TiltHandleId = 'water' | 'graduated-cylinder' | 'weighing-boat'

export interface TiltHandleAnchor {
  x: number
  y: number
  z: number
}

const TILT_HANDLE_HEIGHT: Readonly<Record<TiltHandleId, number>> = {
  water: 0.74,
  'graduated-cylinder': 0.88,
  'weighing-boat': 0.31,
}

export const TILT_ANGLE_MIN = 0.45
export const TILT_ANGLE_MAX = 0.75
export const TILT_RADIANS_PER_PIXEL = 0.011

export function isTiltHandleEligible(id: string): id is TiltHandleId {
  return Object.prototype.hasOwnProperty.call(TILT_HANDLE_HEIGHT, id)
}

/** Mouse movement in screen pixels; upward dragging straightens the source. */
export function tiltAngleFromVerticalDrag(startY: number, currentY: number): number {
  if (!Number.isFinite(startY) || !Number.isFinite(currentY)) return 0
  return Math.max(0, Math.min(TILT_ANGLE_MAX, (currentY - startY) * TILT_RADIANS_PER_PIXEL))
}

/** Non-intersecting position in the *equipment parent's local coordinates*. */
export function tiltHandleAnchor(id: string, footprintRadius: number): TiltHandleAnchor | null {
  if (!isTiltHandleEligible(id)) return null
  const radius = Number.isFinite(footprintRadius) ? Math.max(0.1, footprintRadius) : 0.34
  // Positive X and Z put the ring at the near-right shoulder from the usual
  // teaching camera. Leave the centre available for ordinary object dragging.
  return {
    x: radius + 0.14,
    y: TILT_HANDLE_HEIGHT[id],
    z: 0.16,
  }
}
