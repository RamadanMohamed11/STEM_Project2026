import { useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.head, { childList: true, subtree: true, characterData: true })
  return () => observer.disconnect()
}

/** Page titles are set after lazy routes resolve, so announce the resolved title. */
export function RouteAnnouncement() {
  const { pathname } = useLocation()
  const title = useSyncExternalStore(
    subscribe,
    () => document.title,
    () => '',
  )
  if (/\/experiments\/[^/]+\/lab\/?$/.test(pathname)) return null
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {title}
    </p>
  )
}
