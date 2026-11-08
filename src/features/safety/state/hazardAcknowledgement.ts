import { useSyncExternalStore } from 'react'

// In-memory acknowledgement only: no browser storage, account data or workflow completion.
const acknowledged = new Set<string>()
const listeners = new Set<() => void>()
export function acknowledgeHazards(key: string) {
  acknowledged.add(key)
  listeners.forEach((listener) => listener())
}
export function hasAcknowledgedHazards(key: string) {
  return acknowledged.has(key)
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function useHazardAcknowledgement(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => hasAcknowledgedHazards(key),
    () => false,
  )
}
