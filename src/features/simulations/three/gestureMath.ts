import type { Point2D } from './sceneConfig'

/**
 * One uninterrupted sweep around a vessel's centre, in world (X,Z) metres.
 * Net signed rotation prevents a back-and-forth shake from counting as a stir.
 */
export interface CircularGesture {
  previousAngle: number | null
  signedRadians: number
  arcLength: number
  samples: number
  startedAtMs: number | null
  lastAtMs: number | null
}

export function initialCircularGesture(): CircularGesture {
  return {
    previousAngle: null,
    signedRadians: 0,
    arcLength: 0,
    samples: 0,
    startedAtMs: null,
    lastAtMs: null,
  }
}

/**
 * Positions must be physically inside the recipient opening. A minimum radius
 * excludes pivot jitter at the centre; gross jump samples are discarded.
 */
export function traceCircularGesture(
  gesture: CircularGesture,
  point: Point2D,
  center: Point2D,
  nowMs: number,
  openingRadius = 0.22,
): CircularGesture {
  const dx = point.x - center.x
  const dz = point.z - center.z
  const radius = Math.hypot(dx, dz)
  if (
    !Number.isFinite(nowMs) ||
    radius < openingRadius * 0.28 ||
    radius > openingRadius ||
    (gesture.lastAtMs !== null && nowMs - gesture.lastAtMs > 400)
  ) {
    return initialCircularGesture()
  }
  const angle = Math.atan2(dz, dx)
  if (gesture.previousAngle === null) {
    return {
      ...gesture,
      previousAngle: angle,
      startedAtMs: nowMs,
      lastAtMs: nowMs,
      samples: 1,
    }
  }
  const deltaAngle = Math.atan2(
    Math.sin(angle - gesture.previousAngle),
    Math.cos(angle - gesture.previousAngle),
  )
  // Consecutive angular samples must describe plausible continuous hand motion.
  if (Math.abs(deltaAngle) > Math.PI * 0.65) return initialCircularGesture()
  return {
    previousAngle: angle,
    signedRadians: gesture.signedRadians + deltaAngle,
    arcLength: gesture.arcLength + Math.abs(deltaAngle) * radius,
    samples: gesture.samples + 1,
    startedAtMs: gesture.startedAtMs,
    lastAtMs: nowMs,
  }
}

export function isCircularStir(gesture: CircularGesture, nowMs: number): boolean {
  return (
    gesture.startedAtMs !== null &&
    gesture.samples >= 8 &&
    nowMs - gesture.startedAtMs >= 550 &&
    Math.abs(gesture.signedRadians) >= Math.PI * 1.5 &&
    gesture.arcLength >= 0.43
  )
}
