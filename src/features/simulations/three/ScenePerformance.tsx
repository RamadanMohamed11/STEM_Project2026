import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

/** Development-only, actual rendered frames; not a simulated performance score. */
export function ScenePerformance() {
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
        className="absolute bottom-32 right-2 rounded bg-navy p-2 text-xs text-white"
      >
        {reading}
      </output>
    </Html>
  )
}
