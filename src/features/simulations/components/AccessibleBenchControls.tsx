import { useEffect, useState } from 'react'
import { useLabSceneStore } from '../state/useLabSceneStore'
import {
  describeBench,
  moveBenchItem,
  attachBenchItem,
  benchControlsLocked,
} from '../lib/accessibleBench'
import { resolveEquipment } from '../three/sceneConfig'
import { handlePhysicalInteraction, inspectFinalSolution } from '../state/directInteractions'

export function BenchDescription() {
  const ids = useLabSceneStore((s) => s.placedIds)
  const selected = useLabSceneStore((s) => s.selectedIds)
  return (
    <p id="bench-description" className="sr-only" role="status" aria-live="polite">
      {describeBench(ids, selected)}
    </p>
  )
}

export function AccessibleBenchControls() {
  const ids = useLabSceneStore((s) => s.placedIds)
  const selected = useLabSceneStore((s) => s.selectedIds)
  const positions = useLabSceneStore((s) => s.positions)
  const feedback = useLabSceneStore((s) => s.feedback)
  const [holder, setHolder] = useState('')
  const [message, setMessage] = useState('')
  const [stirring, setStirring] = useState(false)
  const id = selected.length === 1 ? selected[0] : null
  const position = id ? positions[id] : null
  useEffect(() => {
    if (!stirring) return
    let previous = performance.now()
    const stop = () => setStirring(false)
    const hidden = () => {
      if (document.hidden) stop()
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') stop()
    }
    const timer = window.setInterval(() => {
      const now = performance.now(),
        elapsedMs = Math.min(150, Math.max(0, now - previous))
      previous = now
      const scene = useLabSceneStore.getState()
      if (
        document.hidden ||
        !scene.selectedIds.includes('stirring-rod') ||
        !scene.selectedIds.includes('beaker') ||
        !handlePhysicalInteraction({
          actorId: 'stirring-rod',
          targetId: 'beaker',
          gesture: 'stir',
          elapsedMs,
        })
      )
        stop()
    }, 100)
    window.addEventListener('blur', stop)
    window.addEventListener('keydown', key)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      clearInterval(timer)
      window.removeEventListener('blur', stop)
      window.removeEventListener('keydown', key)
      document.removeEventListener('visibilitychange', hidden)
    }
  }, [stirring])
  const action = (ok: boolean) =>
    setMessage(
      ok
        ? 'Bench action completed.'
        : 'This action could not be completed. Check placement, temperature and the current instructions.',
    )
  const control =
    'min-h-11 rounded-lg border border-white/25 px-3 py-2 text-sm disabled:opacity-40 focus-visible:outline-teal-light'
  return (
    <>
      <details
        onToggle={(event) => {
          if (!event.currentTarget.open) setStirring(false)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          setStirring(false)
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus()
        }}
        className="absolute top-32 left-3 z-30 max-h-[65dvh] w-fit max-w-[calc(100vw-24px)] open:w-[min(350px,calc(100vw-24px))] overflow-y-auto rounded-xl bg-navy p-3 text-white shadow-xl"
      >
        <summary id="bench-controls" className="min-h-11 cursor-pointer py-3 font-semibold">
          Bench controls
        </summary>
        <p className="mb-3 text-xs">
          Use Tab and Space to select up to two items. Existing transfer, heating and measurement
          controls use this selection.
        </p>
        <fieldset className="mb-3">
          <legend>Camera</legend>
          <div className="grid grid-cols-2 gap-2">
            {['left', 'right', 'zoom-in', 'zoom-out'].map((command) => (
              <button
                key={command}
                className={control}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent('lab-camera-command', { detail: command }))
                }
              >
                {command === 'left'
                  ? 'View left'
                  : command === 'right'
                    ? 'View right'
                    : command === 'zoom-in'
                      ? 'Zoom in'
                      : 'Zoom out'}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-1">
          <legend>Select bench items</legend>
          {ids.map((item) => (
            <label key={item} className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => {
                  if (!benchControlsLocked())
                    useLabSceneStore.getState().toggleSelection(item, true)
                }}
                className="size-5"
              />
              {resolveEquipment(item)?.label ?? item} · {item}
            </label>
          ))}
        </fieldset>
        {id && position && (
          <div className="mt-3 space-y-2">
            <p className="text-xs">
              Position: X {position.x.toFixed(2)}, Z {position.z.toFixed(2)} metres.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Left', x: -0.15, z: 0 },
                { label: 'Right', x: 0.15, z: 0 },
                { label: 'Forward', x: 0, z: -0.15 },
                { label: 'Back', x: 0, z: 0.15 },
              ].map((move) => (
                <button
                  key={move.label}
                  className={control}
                  onClick={() =>
                    action(moveBenchItem(id, { x: position.x + move.x, z: position.z + move.z }))
                  }
                >
                  Move {move.label}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              Holder
              <select
                className={`${control} mt-1 w-full bg-navy`}
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
              >
                <option value="">Choose a holder</option>
                {ids
                  .filter((item) => item !== id)
                  .map((item) => (
                    <option key={item} value={item}>
                      {resolveEquipment(item)?.label ?? item} · {item}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className={control}
              disabled={!holder}
              onClick={() => action(attachBenchItem(id, holder))}
            >
              Place on holder
            </button>
            {id === 'beaker' && (
              <button className={control} onClick={() => action(inspectFinalSolution(id))}>
                Inspect solution
              </button>
            )}
          </div>
        )}
        {selected.includes('stirring-rod') && selected.includes('beaker') && (
          <button
            className={`${control} mt-3`}
            aria-pressed={stirring}
            onClick={() => setStirring(!stirring)}
          >
            {stirring ? 'Stop stirring' : 'Start stirring'}
          </button>
        )}
        <p role="status" className="mt-3 text-xs">
          {message || feedback || 'Choose an item to move it, or two items to interact.'}
        </p>
        <button
          className={`${control} mt-2`}
          onClick={(event) => {
            const panel = event.currentTarget.closest('details')
            if (panel) {
              panel.open = false
              panel.querySelector('summary')?.focus()
            }
          }}
        >
          Close bench controls
        </button>
        <p className="mt-2 text-xs">
          Close Bench controls to use the transfer panel. Use Inventory to add items. Rotate, remove
          and undo with Bench tools. Stirring stops on Escape, leaving this page, or hiding the tab.
        </p>
      </details>
    </>
  )
}
