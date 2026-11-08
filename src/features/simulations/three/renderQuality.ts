/**
 * L3 performance: the lab is fill-rate bound (glass and lighting per pixel), so the effective
 * render resolution is lowered in small steps only when the measured frame rate falls below the
 * target, and raised again when there is headroom. Geometry and simulation are unaffected.
 */
export const DPR_LEVELS = [1.5, 1.25, 1, 0.875, 0.75] as const
export const MIN_DPR = DPR_LEVELS[DPR_LEVELS.length - 1]

/** Highest level allowed on this display (never above the device ratio or 1.5). */
export function maxDprFor(devicePixelRatio: number) {
  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1
  return DPR_LEVELS.find((level) => level <= Math.max(1, Math.min(1.5, ratio))) ?? 1
}

/** One step down (-1) or up (+1) the level list, clamped to [MIN_DPR, max]. */
export function stepDpr(current: number, direction: -1 | 1, max: number) {
  const allowed = DPR_LEVELS.filter((level) => level <= max)
  const index = allowed.findIndex((level) => level <= current + 1e-9)
  const at = index === -1 ? allowed.length - 1 : index
  return allowed[Math.min(allowed.length - 1, Math.max(0, at - direction))]
}
