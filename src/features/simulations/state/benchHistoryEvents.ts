import type { ContainerState } from '../engine/core/index.ts'

/** Only the vessels touched by a practice action, never the generic lab or salt workflow. */
export interface PracticeLiquidSnapshot {
  containers: Readonly<Record<string, ContainerState | null>>
  spilledTotalMl?: number
  /** Engine-read volume of the affected containers; excludes unrelated vessels. */
  volumeMl?: number
}

type HistoryEvent =
  | {
      kind: 'pour'
      label: string
      before: PracticeLiquidSnapshot
      after: PracticeLiquidSnapshot
      blockedReason?: string
    }
  | { kind: 'reset' }

// The liquid store publishes completed actions without importing the scene store.
// The scene owns the one undo/redo timeline; there is no second history stack.
const listeners = new Set<(event: HistoryEvent) => void>()
export function publishBenchHistory(event: HistoryEvent) {
  for (const listener of listeners) listener(event)
}
export function subscribeBenchHistory(listener: (event: HistoryEvent) => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
