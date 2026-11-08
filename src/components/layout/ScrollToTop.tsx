import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * Ensures smooth scroll restoration to the top of the viewport on route changes.
 * Preserves anchor hash navigation and browser Back/Forward (POP) scroll restoration.
 * Bypasses execution during server-side rendering or non-browser environments.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If an anchor hash exists in the URL, scroll to that target element
    if (hash) {
      const targetId = decodeURIComponent(hash.replace(/^#/, ''))
      const targetElement = document.getElementById(targetId)
      if (targetElement) {
        targetElement.scrollIntoView()
        return
      }
    }

    // On POP navigation (browser Back/Forward buttons), let native scroll restoration proceed
    if (navigationType === 'POP') {
      return
    }

    // On forward/direct route navigation (PUSH/REPLACE), reset scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash, navigationType])

  return null
}
