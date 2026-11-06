import type { Point2D } from './sceneConfig'

/** Explicit cancellation ends a gesture; low rendering rates must not invalidate hand motion. */
export const STIR_SAMPLE_GAP_MS = 1500

export interface CircularGesture {
  previousAngle: number | null
  signedRadians: number
  arcLength: number
  samples: number
  startedAtMs: number | null
  lastAtMs: number | null
  /** Moving time only, bounded by angular travel; pauses/jitter never dissolve salt. */
  activeMs: number
}

export function initialCircularGesture(): CircularGesture {
  return {
    previousAngle: null,
    signedRadians: 0,
    arcLength: 0,
    samples: 0,
    startedAtMs: null,
    lastAtMs: null,
    activeMs: 0,
  }
}

/** World-space opening samples, using the native event timestamp rather than render time. */
export function traceCircularGesture(
  gesture: CircularGesture,
  point: Point2D,
  center: Point2D,
  nowMs: number,
  openingRadius = 0.22,
): CircularGesture {
  const radius = Math.hypot(point.x - center.x, point.z - center.z)
  if (
    !Number.isFinite(nowMs) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(openingRadius) ||
    openingRadius <= 0 ||
    radius < openingRadius * 0.28 ||
    radius > openingRadius
  )
    return initialCircularGesture()

  const angle = Math.atan2(point.z - center.z, point.x - center.x)
  const first = (): CircularGesture => ({
    ...initialCircularGesture(),
    previousAngle: angle,
    startedAtMs: nowMs,
    lastAtMs: nowMs,
    samples: 1,
  })
  if (gesture.previousAngle === null || gesture.lastAtMs === null) return first()
  const elapsed = nowMs - gesture.lastAtMs
  if (elapsed < 0 || elapsed > STIR_SAMPLE_GAP_MS) return first()
  if (elapsed === 0) return gesture
  const delta = Math.atan2(
    Math.sin(angle - gesture.previousAngle),
    Math.cos(angle - gesture.previousAngle),
  )
  // Reject discontinuous jumps and deliberate reversals, including shaking after a valid lap.
  if (Math.abs(delta) > Math.PI * 0.65 || gesture.signedRadians * delta < -0.02) return first()
  if (Math.abs(delta) < 0.012) return { ...gesture, lastAtMs: nowMs }
  return {
    previousAngle: angle,
    signedRadians: gesture.signedRadians + delta,
    arcLength: gesture.arcLength + Math.abs(delta) * radius,
    samples: gesture.samples + 1,
    startedAtMs: gesture.startedAtMs,
    lastAtMs: nowMs,
    // A stalled renderer is not extra stirring work. Cap credit per sample and per radian.
    activeMs: gesture.activeMs + Math.min(elapsed, Math.abs(delta) * 350, 250),
  }
}

export function isCircularStir(gesture: CircularGesture, nowMs: number): boolean {
  return (
    gesture.startedAtMs !== null &&
    gesture.lastAtMs !== null &&
    nowMs >= gesture.lastAtMs &&
    nowMs - gesture.lastAtMs <= STIR_SAMPLE_GAP_MS &&
    gesture.samples >= 8 &&
    nowMs - gesture.startedAtMs >= 550 &&
    Math.abs(gesture.signedRadians) >= Math.PI * 1.5 &&
    gesture.arcLength >= 0.43
  )
}
