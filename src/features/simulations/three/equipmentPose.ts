import type { Point2D } from './sceneConfig.ts'

/** Metres above the equipment root; models are nested at -PIVOT_HEIGHT. */
export const PIVOT_HEIGHT = 0.42
export const POUR_CLEARANCE = 0.12
/** Full visual reach/clearance by the direct-control pouring threshold (radians). */
export const POUR_ASSIST_ANGLE = 0.45
export const MAX_POUR_TILT = Math.PI / 2

export interface PourSourceDimensions {
  rim: number
  radius: number
}

export const POUR_SOURCE_DIMENSIONS: Readonly<Record<string, PourSourceDimensions | undefined>> = {
  water: { rim: 0.9, radius: 0.15 },
  'graduated-cylinder': { rim: 1.115, radius: 0.13 },
  beaker: { rim: 0.755, radius: 0.291 },
  'weighing-boat': { rim: 0.13, radius: 0.2 },
  // Retain the legacy jar-to-beaker salt effect.
  'sodium-chloride': { rim: 0.71, radius: 0.15 },
}

export const RECEIVER_RIM_HEIGHTS: Readonly<Record<string, number | undefined>> = {
  'graduated-cylinder': 1.115,
  beaker: 0.755,
  'weighing-boat': 0.13,
}

export const SALT_JAR_RIM_HEIGHT = 0.754
/** Model-space points on the actual spoon, not the handle/tool root. */
export const SPATULA_SPOON_CENTER = [0.25, 0.012, 0] as const
export const SPATULA_SPOON_OUTLET = [0.32, 0.032, 0] as const

export function getBoatSaltSurfaceHeight(massG: number): number {
  const fraction = Number.isFinite(massG) ? Math.max(0, Math.min(1, massG / 5)) : 0
  return 0.029 + 0.042 * Math.cbrt(fraction)
}

/** Matches the calibrated liquid displays, not an independently simulated volume. */
export const LIQUID_SURFACE_DIMENSIONS: Readonly<
  Record<string, { capacityMl: number; bottomY: number; maxHeight: number } | undefined>
> = {
  water: { capacityMl: 500, bottomY: 0.09, maxHeight: 0.59 },
  'graduated-cylinder': { capacityMl: 100, bottomY: 0.2, maxHeight: 0.874 },
  beaker: { capacityMl: 250, bottomY: 0.09, maxHeight: 0.65 },
}

export function getLiquidSurfaceHeight(id: string, volumeMl: number): number {
  const dimensions = LIQUID_SURFACE_DIMENSIONS[id]
  if (!dimensions) return 0
  const fraction = Number.isFinite(volumeMl)
    ? Math.max(0, Math.min(1, volumeMl / dimensions.capacityMl))
    : 0
  return dimensions.bottomY + fraction * dimensions.maxHeight
}

export interface PourPose {
  /** Absolute visualPivot position in the yawed equipment root's local frame. */
  x: number
  y: number
  z: number
  /** Three's default XYZ Euler order, with rotation.y = 0. Radians. */
  rotationX: number
  rotationZ: number
  /** Low-side lip after this pose, in that same root frame (not world space). */
  outlet: [number, number, number]
}

const finite = (value: number) => (Number.isFinite(value) ? value : 0)

/**
 * Rendering-only assistance: never moves the equipment's domain position/collider.
 * Apply position/rotation to visualPivot, leave the root yaw untouched, and nest
 * the model at [0, -PIVOT_HEIGHT, 0]. At POUR_ASSIST_ANGLE the actual low-side lip
 * is over the receiver centre and at least POUR_CLEARANCE above its rim.
 */
export function getPourPose(
  sourceId: string,
  source: Point2D,
  targetId: string,
  target: Point2D,
  tilt: number,
  yaw = 0,
): PourPose {
  const dimensions = POUR_SOURCE_DIMENSIONS[sourceId]
  if (!dimensions) {
    return { x: 0, y: PIVOT_HEIGHT, z: 0, rotationX: 0, rotationZ: 0, outlet: [0, PIVOT_HEIGHT, 0] }
  }

  const angle = Math.max(0, Math.min(MAX_POUR_TILT, finite(tilt)))
  const cosYaw = Math.cos(finite(yaw))
  const sinYaw = Math.sin(finite(yaw))
  const dx = finite(target.x) - finite(source.x)
  const dz = finite(target.z) - finite(source.z)
  // Inverse of the root's Three.js Y rotation, not a screen-space rotation.
  const localX = cosYaw * dx - sinYaw * dz
  const localZ = sinYaw * dx + cosYaw * dz
  const distance = Math.hypot(localX, localZ)
  const forwardX = distance > 1e-9 ? localX / distance : 1
  const forwardZ = distance > 1e-9 ? localZ / distance : 0
  const sinTilt = Math.sin(angle)
  const cosTilt = Math.cos(angle)

  // Exact XYZ decomposition: R_x * R_z sends +Y toward the receiver even on
  // diagonals. Multiplying the angle by X/Z direction is only an approximation.
  const rotationZ = -Math.asin(Math.max(-1, Math.min(1, sinTilt * forwardX)))
  const rotationX = Math.atan2(sinTilt * forwardZ, cosTilt)
  const lipHeight = dimensions.rim - PIVOT_HEIGHT
  const reach = lipHeight * sinTilt + dimensions.radius * cosTilt
  const unassistedY = PIVOT_HEIGHT + lipHeight * cosTilt - dimensions.radius * sinTilt
  const rim = RECEIVER_RIM_HEIGHTS[targetId]
  const phase = Math.min(1, angle / POUR_ASSIST_ANGLE)
  const blend = rim === undefined ? 0 : phase * phase * (3 - 2 * phase)
  const x = (localX - reach * forwardX) * blend
  const z = (localZ - reach * forwardZ) * blend
  const lift = rim === undefined ? 0 : Math.max(0, rim + POUR_CLEARANCE - unassistedY) * blend

  return {
    x,
    y: PIVOT_HEIGHT + lift,
    z,
    rotationX,
    rotationZ,
    outlet: [x + reach * forwardX, unassistedY + lift, z + reach * forwardZ],
  }
}
