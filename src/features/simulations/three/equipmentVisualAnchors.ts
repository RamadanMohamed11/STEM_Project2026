import type { Object3D, Vector3 } from 'three'
import {
  PIVOT_HEIGHT,
  POUR_SOURCE_DIMENSIONS,
  SPATULA_SPOON_CENTER,
  SPATULA_SPOON_OUTLET,
} from './equipmentPose.ts'
import type { Point2D } from './sceneConfig.ts'

/** Rendering refs only: register the visualPivot, not the model's -0.42 child. */
export const visualAnchors = new Map<string, Object3D>()

/** Cleanup is identity-guarded so an old mount cannot unregister its replacement. */
export function registerVisualAnchor(id: string, pivot: Object3D): () => void {
  visualAnchors.set(id, pivot)
  return () => unregisterVisualAnchor(id, pivot)
}

export function unregisterVisualAnchor(id: string, pivot: Object3D): void {
  if (visualAnchors.get(id) === pivot) visualAnchors.delete(id)
}

/** Read a MODEL-space point through its registered visual pivot. No fallback positions. */
export function readEquipmentPointWorld(
  id: string,
  x: number,
  y: number,
  z: number,
  out: Vector3,
): Vector3 | null {
  const pivot = visualAnchors.get(id)
  if (!pivot) return null
  pivot.updateWorldMatrix(true, false)
  return out.set(x, y - PIVOT_HEIGHT, z).applyMatrix4(pivot.matrixWorld)
}

export function readSpatulaSpoonWorld(out: Vector3): Vector3 | null {
  return readEquipmentPointWorld('spatula', ...SPATULA_SPOON_CENTER, out)
}

/**
 * Writes the actual lowest point on the model's circular lip into `out`.
 * For a spatula, reads the actual working spoon edge instead of an axial rim.
 * `target` is a WORLD/tabletop XZ position, used to select a side when upright.
 * Includes the pivot's interpolated pose, root yaw, and all ancestor transforms.
 * Returns null without modifying out if the source/pivot is not registered.
 */
export function readOutletWorld(id: string, target: Point2D, out: Vector3): Vector3 | null {
  if (id === 'spatula') return readEquipmentPointWorld(id, ...SPATULA_SPOON_OUTLET, out)
  const pivot = visualAnchors.get(id)
  const dimensions = POUR_SOURCE_DIMENSIONS[id]
  if (!pivot || !dimensions) return null
  pivot.updateWorldMatrix(true, false)
  const m = pivot.matrixWorld.elements
  // World Y of a local rim point is m[1] * x + m[9] * z + constant.
  // Its negative gradient is the true low side, including smoothed rotations.
  let x = -m[1]
  let z = -m[9]
  let length = Math.hypot(x, z)
  if (length < 1e-9) {
    const dx = target.x - m[12]
    const dz = target.z - m[14]
    x = m[0] * dx + m[2] * dz
    z = m[8] * dx + m[10] * dz
    length = Math.hypot(x, z)
  }
  const scale = length > 1e-9 ? dimensions.radius / length : 0
  return out
    .set(length > 1e-9 ? x * scale : dimensions.radius, dimensions.rim - PIVOT_HEIGHT, z * scale)
    .applyMatrix4(pivot.matrixWorld)
}
