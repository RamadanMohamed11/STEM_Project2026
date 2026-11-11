import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SceneLabel as Html } from './SceneLabels'

/** Check whether developer debug mode is active via URL query parameter or localStorage. */
function isLabPerformanceDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (
      params.has('debug') ||
      params.has('fps') ||
      params.has('perf') ||
      params.get('debug') === 'true' ||
      params.get('fps') === 'true'
    ) {
      return true
    }
    if (
      window.localStorage?.getItem('lab_debug') === 'true' ||
      window.localStorage?.getItem('debug') === 'true'
    ) {
      return true
    }
  } catch {
    // In restricted iframe or storage-blocked environments, fail safe
  }
  return false
}

function ScenePerformanceTracker() {
  const gl = useThree((s) => s.gl)
  const sample = useRef({ start: 0, frames: 0 })
  const [reading, setReading] = useState('Measuring rendered FPS…')

  useEffect(() => {
    const reset = () => {
      sample.current = { start: performance.now(), frames: 0 }
    }
    document.addEventListener('visibilitychange', reset)
    return () => document.removeEventListener('visibilitychange', reset)
  }, [])

  useFrame(() => {
    if (document.hidden) return
    const now = performance.now(),
      current = sample.current
    if (current.start === 0) {
      current.start = now
      return
    }
    current.frames++
    if (now - current.start < 2000) return
    setReading(
      `${((current.frames * 1000) / (now - current.start)).toFixed(1)} FPS · ${gl.info.render.calls} draws · DPR ${gl.getPixelRatio().toFixed(2)}`,
    )
    sample.current = { start: now, frames: 0 }
  })

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <output
        data-lab-fps
        className="absolute bottom-32 right-2 rounded bg-navy/90 p-2 text-xs text-white shadow-lg border border-white/20 backdrop-blur-sm"
      >
        {reading}
      </output>
    </Html>
  )
}

/**
 * Development-only, actual rendered frames; not a simulated performance score.
 * Hidden by default so it does not distract students or obstruct lab controls.
 * To enable in development, append ?debug or ?fps to the URL, or run
 * `localStorage.setItem('lab_debug', 'true')` in DevTools.
 */
export function ScenePerformance() {
  const [enabled] = useState(() => isLabPerformanceDebugEnabled())
  if (!enabled) return null
  return <ScenePerformanceTracker />
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as unknown as { toggleLabFps?: () => void }).toggleLabFps = () => {
    const current = window.localStorage.getItem('lab_debug') === 'true'
    window.localStorage.setItem('lab_debug', current ? 'false' : 'true')
    window.location.reload()
  }
}

