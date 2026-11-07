import { useEffect, useState } from 'react'

/**
 * Hook for animated numerical count-up celebration effects.
 *
 * Design constraints:
 * 1. Initializes with `target` so SSR (e.g. renderToStaticMarkup) renders the authoritative target number.
 * 2. On client-side mount, if not in reduced motion mode, animates smoothly from 0 to target using requestAnimationFrame.
 * 3. Respects `prefers-reduced-motion: reduce` by staying at target immediately.
 * 4. Fails safe in non-browser environments and avoids synchronous setState inside effect bodies.
 */
export function useAnimatedCounter(target: number, duration = 800): number {
  const [current, setCurrent] = useState(target)

  useEffect(() => {
    if (target <= 0) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) return

    let startTime: number | null = null
    let frameId: number

    // Asynchronously begin animation in the next animation frame to prevent synchronous cascading renders
    frameId = requestAnimationFrame((initTimestamp) => {
      startTime = initTimestamp
      setCurrent(0)

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic: 1 - (1 - t)^3
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCurrent(Math.round(easeOut * target))

        if (progress < 1) {
          frameId = requestAnimationFrame(step)
        } else {
          setCurrent(target)
        }
      }

      frameId = requestAnimationFrame(step)
    })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [target, duration])

  return current
}
