import { useEffect } from 'react'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore.ts'

const TICK_MS = 1000 / 30
const MAX_DELTA_MS = 250

/** Mount once beside the scene (HTML or Canvas both work). Never uses a GPU frame. */
export function MaterialTransferController() {
  useEffect(() => {
    let frame: number | null = null
    let activeId: string | null = null
    let previousTime = performance.now()
    let disposed = false
    let finalizing = false

    const stopFrame = () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      frame = null
    }

    const schedule = () => {
      if (disposed || frame !== null || !activeId || document.hidden) return
      const operationId = activeId
      const handle = window.requestAnimationFrame((now) => {
        // A cancelled callback must never clear/advance a replacement operation.
        if (disposed || frame !== handle || activeId !== operationId) return
        frame = null
        const state = useSaltSimulationStore.getState()
        if (state.transfer?.operationId !== operationId) return
        const elapsed = Math.max(0, now - previousTime)
        if (elapsed >= TICK_MS) {
          previousTime = now
          state.advanceTransfer(Math.min(MAX_DELTA_MS, elapsed), operationId)
        }
        schedule()
      })
      frame = handle
    }

    const interrupt = (finishImmediately: boolean) => {
      const operationId = useSaltSimulationStore.getState().transfer?.operationId
      if (!operationId || finalizing) return
      finalizing = true
      useSaltSimulationStore.getState().cancelTransfer(operationId)
      previousTime = performance.now()
      if (finishImmediately) {
        // Hidden documents suspend rAF; unmount removes this driver entirely.
        // Finish only the cancelled safe return, retaining quantities already
        // delivered. Every authority call still obeys the 250-ms tick bound.
        for (;;) {
          const state = useSaltSimulationStore.getState()
          const op = state.transfer
          if (!op || op.operationId !== operationId || !op.cancelled) break
          state.advanceTransfer(
            Math.min(MAX_DELTA_MS, Math.max(1, op.durationMs - op.elapsedMs)),
            operationId,
          )
          const next = useSaltSimulationStore.getState().transfer
          if (next?.operationId === operationId && next.elapsedMs <= op.elapsedMs) break
        }
      }
      finalizing = false
      schedule()
    }

    const sync = () => {
      const nextId = useSaltSimulationStore.getState().transfer?.operationId ?? null
      if (nextId !== activeId) {
        stopFrame()
        activeId = nextId
        previousTime = performance.now()
      }
      if (document.hidden && nextId) interrupt(true)
      else schedule()
    }
    const onBlur = () => interrupt(document.hidden)
    const onVisibility = () => {
      if (document.hidden) interrupt(true)
      else sync()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') interrupt(false)
    }

    const unsubscribe = useSaltSimulationStore.subscribe(sync)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibility)
    sync()

    return () => {
      disposed = true
      stopFrame()
      unsubscribe()
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibility)
      interrupt(true)
    }
  }, [])

  return null
}
