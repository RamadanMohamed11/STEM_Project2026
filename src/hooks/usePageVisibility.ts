import { useSyncExternalStore } from 'react'

interface VisibilitySource {
  readonly hidden: boolean
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}
export function subscribeToPageVisibility(source: VisibilitySource, listener: () => void) {
  source.addEventListener('visibilitychange', listener)
  return () => source.removeEventListener('visibilitychange', listener)
}
const subscribe = (listener: () => void) => subscribeToPageVisibility(document, listener)
const snapshot = () => !document.hidden
export function usePageVisibility() {
  return useSyncExternalStore(subscribe, snapshot, () => true)
}
