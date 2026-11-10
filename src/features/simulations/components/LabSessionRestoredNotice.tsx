import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { labSessionPersistence } from '../state/labSessionPersistence'

export function LabSessionRestoredNotice() {
  const restored = useSyncExternalStore(
    labSessionPersistence.subscribe,
    labSessionPersistence.wasRestored,
    () => false,
  )
  if (!restored) return null
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-muted px-3 py-1 text-sm text-navy">
      <p role="status">Your lab session was restored.</p>
      <button
        type="button"
        onClick={() => labSessionPersistence.dismiss()}
        aria-label="Dismiss restored session message"
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-dark"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
