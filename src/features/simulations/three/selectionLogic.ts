/** CSS pixels, independent of canvas DPR, zoom or equipment size. */
export const GRAB_THRESHOLD_PX = 5

export function exceedsGrabThreshold(
  startX: number,
  startY: number,
  x: number,
  y: number,
): boolean {
  return (
    [startX, startY, x, y].every(Number.isFinite) &&
    Math.hypot(x - startX, y - startY) > GRAB_THRESHOLD_PX
  )
}
