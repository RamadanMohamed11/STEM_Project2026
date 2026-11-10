// Neutral bridge: scene actions do not import the persistence coordinator/stores again.
const listeners = new Set<() => void>()
export function notifyLabSessionReset() {
  for (const listener of listeners) listener()
}
export function subscribeLabSessionReset(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
