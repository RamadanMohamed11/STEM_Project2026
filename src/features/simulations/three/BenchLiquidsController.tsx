import { useEffect } from 'react'
import { useBenchLiquidsStore } from '../state/useBenchLiquidsStore'
import { useLabSceneStore } from '../state/useLabSceneStore'
import { useReactionEffectsStore } from '../state/useReactionEffectsStore'

/**
 * L5: keeps the practice-liquid containers in step with the bench and runs the pour clock.
 * Mount once beside the scene. Escape, a hidden tab or leaving the window straightens a pour.
 */
export function BenchLiquidsController() {
  useEffect(() => {
    const liquids = useBenchLiquidsStore.getState
    liquids().sync(useLabSceneStore.getState().placedIds)
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const state = liquids()
      const dt = Math.min(100, now - last)
      if (state.pour || state.readout) state.tick(dt)
      state.react(dt, useLabSceneStore.getState().relationships)
      last = now
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    const straighten = () => liquids().straighten()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') straighten()
    }
    const onVisibility = () => {
      if (document.hidden) straighten()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', straighten)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', straighten)
      document.removeEventListener('visibilitychange', onVisibility)
      // Navigation/refresh does not discard contents or temperature. Only clocks/effects stop.
      liquids().straighten()
      useReactionEffectsStore.getState().clear()
    }
  }, [])
  return null
}
