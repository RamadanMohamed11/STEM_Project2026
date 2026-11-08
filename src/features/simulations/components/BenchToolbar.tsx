import { useEffect, useState } from 'react'
import { Redo2, RotateCcw, RotateCw, Trash2, Undo2, LayoutTemplate } from 'lucide-react'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useSaltSimulationStore } from '../state/useSaltSimulationStore'
import { isExtraInstance, resolveEquipment } from '../three/sceneConfig'

function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return (
    !!element &&
    (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.isContentEditable)
  )
}

/**
 * L3 bench controls: undo/redo (last 20 layout changes), rotate and remove the selected item,
 * and reset the bench layout. Keyboard: Ctrl/⌘+Z, Ctrl/⌘+Shift+Z or Ctrl+Y, Delete, [ and ].
 * Disabled while a material transfer or effect is running.
 */
export function BenchToolbar() {
  const pastLabel = useLabSceneStore((state) => state.past.at(-1)?.label ?? null)
  const futureLabel = useLabSceneStore((state) => state.future.at(-1)?.label ?? null)
  const selectedId = useLabSceneStore((state) =>
    state.selectedIds.length === 1 ? state.selectedIds[0] : null,
  )
  const interacting = useLabSceneStore(
    (state) => !!state.placement || !!state.draggingId || !!state.pressedId,
  )
  const busy = useSaltSimulationStore(
    (state) => !!state.transfer || !!state.effect || !!state.livePour,
  )
  const [confirmReset, setConfirmReset] = useState(false)
  const locked = busy || interacting
  const selectedLabel = selectedId ? (resolveEquipment(selectedId)?.label ?? selectedId) : null

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const scene = useLabSceneStore.getState()
      const simulation = useSaltSimulationStore.getState()
      if (simulation.transfer || simulation.effect || simulation.livePour) return
      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (mod && key === 'z' && !event.shiftKey) {
        if (scene.undo()) event.preventDefault()
      } else if (mod && ((key === 'z' && event.shiftKey) || key === 'y')) {
        if (scene.redo()) event.preventDefault()
      } else if (!mod && (event.key === 'Delete' || event.key === 'Backspace')) {
        const id = scene.selectedIds.length === 1 ? scene.selectedIds[0] : null
        if (id && !scene.placement && !scene.draggingId) {
          event.preventDefault()
          scene.removeFromBench(id)
        }
      } else if (!mod && (event.key === '[' || event.key === ']')) {
        const id = scene.selectedIds.length === 1 ? scene.selectedIds[0] : null
        if (id) scene.rotate(id, event.key === ']' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const button =
    'flex size-10 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-[#55d6c4]'

  return (
    <div
      role="toolbar"
      aria-label="Bench tools"
      className="pointer-events-auto absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/20 bg-[#071d29]/90 p-1 shadow-xl backdrop-blur-md sm:bottom-3"
    >
      <button
        type="button"
        className={button}
        disabled={locked || !pastLabel}
        onClick={() => useLabSceneStore.getState().undo()}
        aria-label={pastLabel ? `Undo: ${pastLabel}` : 'Undo'}
        title={pastLabel ? `Undo: ${pastLabel} (Ctrl+Z)` : 'Nothing to undo'}
      >
        <Undo2 size={18} />
      </button>
      <button
        type="button"
        className={button}
        disabled={locked || !futureLabel}
        onClick={() => useLabSceneStore.getState().redo()}
        aria-label={futureLabel ? `Redo: ${futureLabel}` : 'Redo'}
        title={futureLabel ? `Redo: ${futureLabel} (Ctrl+Shift+Z)` : 'Nothing to redo'}
      >
        <Redo2 size={18} />
      </button>
      <span className="mx-0.5 h-6 w-px bg-white/15" aria-hidden="true" />
      <button
        type="button"
        className={button}
        disabled={locked || !selectedId}
        onClick={() => selectedId && useLabSceneStore.getState().rotate(selectedId, -1)}
        aria-label={selectedLabel ? `Rotate ${selectedLabel} left` : 'Rotate left'}
        title="Rotate left 22.5° ([)"
      >
        <RotateCcw size={18} />
      </button>
      <button
        type="button"
        className={button}
        disabled={locked || !selectedId}
        onClick={() => selectedId && useLabSceneStore.getState().rotate(selectedId, 1)}
        aria-label={selectedLabel ? `Rotate ${selectedLabel} right` : 'Rotate right'}
        title="Rotate right 22.5° (])"
      >
        <RotateCw size={18} />
      </button>
      <button
        type="button"
        className={button}
        disabled={locked || !selectedId}
        onClick={() => selectedId && useLabSceneStore.getState().removeFromBench(selectedId)}
        aria-label={
          selectedLabel
            ? selectedId && isExtraInstance(selectedId)
              ? `Remove ${selectedLabel}`
              : `Return ${selectedLabel} to inventory`
            : 'Remove selected item'
        }
        title="Remove selected item (Delete). You can also drag items onto the bin."
      >
        <Trash2 size={18} />
      </button>
      <span className="mx-0.5 h-6 w-px bg-white/15" aria-hidden="true" />
      {confirmReset ? (
        <span className="flex items-center gap-1 px-1 text-[11px] text-white">
          Reset layout?
          <button
            type="button"
            className="rounded-md bg-[#b4544c] px-2 py-1.5 font-semibold hover:bg-[#c8645b]"
            onClick={() => {
              useLabSceneStore.getState().resetBench()
              setConfirmReset(false)
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-md px-2 py-1.5 hover:bg-white/10"
            onClick={() => setConfirmReset(false)}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          type="button"
          className={button}
          disabled={locked}
          onClick={() => setConfirmReset(true)}
          aria-label="Reset bench layout"
          title="Reset bench layout (chemistry is not changed; you can undo this)"
        >
          <LayoutTemplate size={18} />
        </button>
      )}
    </div>
  )
}
