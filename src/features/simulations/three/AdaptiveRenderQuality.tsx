import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { MIN_DPR, maxDprFor, stepDpr } from './renderQuality'

/** L3: adaptive render resolution (see renderQuality.ts). */
export function AdaptiveRenderQuality() {
  const setDpr = useThree((state) => state.setDpr)
  const [max] = useState(() =>
    maxDprFor(typeof window === 'undefined' ? 1 : window.devicePixelRatio),
  )
  const [dpr, setLevel] = useState(max)

  useEffect(() => {
    setDpr(dpr)
  }, [dpr, setDpr])

  return (
    <PerformanceMonitor
      // Target ≥ 53 fps on 60 Hz displays (keeps ≥ 45 fps under load); raise quality above 59.
      bounds={(refreshRate) => (refreshRate > 90 ? [58, 90] : [53, 59])}
      flipflops={6}
      onDecline={() => setLevel((current) => stepDpr(current, -1, max))}
      onIncline={() => setLevel((current) => stepDpr(current, 1, max))}
      onFallback={() => setLevel(MIN_DPR)}
    />
  )
}
