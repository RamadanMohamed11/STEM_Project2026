import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/** Keep Tab cycling inside native navigation dialogs, including at the browser chrome boundary. */
export function containDialogTab(event: ReactKeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]',
    ),
  ).filter((el) => el.getClientRects().length > 0)
  const first = items[0],
    last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
