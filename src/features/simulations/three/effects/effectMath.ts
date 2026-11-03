/** Clamp a possibly invalid measurement into the visible vessel capacity. */
export function boundedFraction(amount: number, capacity: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(capacity) || capacity <= 0) return 0
  return Math.min(1, Math.max(0, amount / capacity))
}
