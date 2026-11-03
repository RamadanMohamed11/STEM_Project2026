import type { Point2D } from './sceneConfig.ts'

/**
 * Skip high-frequency pointer samples which cannot produce a visible change.
 * Placement validation and authoritative commit still run in the scene store.
 * Invalid/nonfinite coordinates are never passed through to that store.
 */
export function shouldUpdatePlacementHint(
  previous: Point2D | null | undefined,
  next: Point2D,
  toleranceMetres = 0.001,
): boolean {
  if (!Number.isFinite(next.x) || !Number.isFinite(next.z)) return false
  if (!previous) return true
  return (
    Math.abs(previous.x - next.x) > toleranceMetres ||
    Math.abs(previous.z - next.z) > toleranceMetres
  )
}
