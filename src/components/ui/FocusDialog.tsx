import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react'

/** Focus containment for existing custom dialogs; native dialogs use showModal instead. */
export function FocusDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const close = useEffectEvent(onClose)
  useEffect(() => {
    const panel = root.current?.querySelector<HTMLElement>('[role="dialog"]')
    if (!panel) return
    const previous = document.activeElement as HTMLElement | null
    const controls = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0)
    panel.tabIndex = -1
    const focusFirst = () => (controls()[0] ?? panel).focus()
    focusFirst()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const items = controls(),
        first = items[0],
        last = items.at(-1)
      if (!first) {
        event.preventDefault()
        panel.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const contain = (event: FocusEvent) => {
      if (!panel.contains(event.target as Node)) focusFirst()
    }
    document.addEventListener('keydown', key, true)
    document.addEventListener('focusin', contain)
    return () => {
      document.removeEventListener('keydown', key, true)
      document.removeEventListener('focusin', contain)
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return (
    <div ref={root} className="contents">
      {children}
    </div>
  )
}
