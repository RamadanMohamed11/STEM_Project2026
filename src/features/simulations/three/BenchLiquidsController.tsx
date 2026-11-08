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
    liquids().reset()
    liquids().sync(useLabSceneStore.getState().placedIds)
    const unsubscribe = useLabSceneStore.subscribe((state, previous) => {
      if (state.placedIds !== previous.placedIds) liquids().sync(state.placedIds)
    })
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const state = liquids()
      const dt = Math.min(100, now - last)
      if (state.pour || state.readout) state.tick(dt)
      state.react(dt)
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
      unsubscribe()
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', straighten)
      document.removeEventListener('visibilitychange', onVisibility)
      liquids().reset()
      useReactionEffectsStore.getState().clear()
    }
  }, [])
  return null
}
