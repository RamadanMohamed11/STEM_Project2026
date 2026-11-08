import type { Vector3Tuple } from 'three'
import { getModelAnchors, getVesselFill } from '../../models/library/modelSpecs'

/** Where a container's effects are drawn, in world coordinates. */
export interface EffectAnchor {
  /** Centre of the inner floor (liquid base). */
  base: Vector3Tuple
  /** World Y of the liquid surface (equals base Y when empty). */
  surfaceY: number
  /** Centre of the mouth / rim. */
  mouth: Vector3Tuple
  /** Inner radius around the liquid (for bubbles, particles). */
  innerRadius: number
  /** Radius of the mouth (gas, smoke, flame). */
  mouthRadius: number
}

export type EffectAnchorResolver = (containerId: string) => EffectAnchor | null

/**
 * Anchor for an upright L4 library vessel standing with its origin at `origin` (world), holding
 * `volumeMl`. Falls back to a generic small vessel for models without a fill model.
 */
export function vesselEffectAnchor(
  modelId: string,
  origin: Vector3Tuple,
  volumeMl: number,
  fallback: { rim: number; radius: number } = { rim: 0.3, radius: 0.1 },
): EffectAnchor {
  const anchors = getModelAnchors(modelId)
  const fill = getVesselFill(modelId)
  const [x, y, z] = origin
  if (!anchors || !fill) {
    return {
      base: [x, y + 0.02, z],
      surfaceY: y + Math.min(fallback.rim * 0.4, 0.15),
      mouth: [x, y + fallback.rim, z],
      innerRadius: fallback.radius * 0.8,
      mouthRadius: fallback.radius,
    }
  }
  const baseY = y + anchors.liquidBase
  const surfaceY = baseY + Math.max(0, fill.heightForVolume(volumeMl) - fill.floorY)
  // Radius halfway up the liquid (or near the floor when nearly empty).
  const probe = Math.max(volumeMl * 0.5, fill.capacityMl * 0.05)
  const innerRadius = Math.max(0.01, fill.surfaceRadius(probe) * 0.85)
  return {
    base: [x + anchors.mouth[0], baseY, z + anchors.mouth[2]],
    surfaceY,
    mouth: [x + anchors.mouth[0], y + anchors.mouth[1], z + anchors.mouth[2]],
    innerRadius,
    mouthRadius: Math.max(0.01, anchors.pourLip[0] - anchors.mouth[0]),
  }
}
