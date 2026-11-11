import { useEffect, useId, useRef, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'

export interface LabOptionsAction {
  id: string
  label: string
  icon: ReactNode
  onSelect: () => void
  pressed?: boolean
  expanded?: boolean
}

/**
 * I15: small-screen "Lab options" popover for the lab header (below `sm`). Follows the
 * ToolNotePopover pattern: Escape and outside clicks close it; focus moves into the panel on
 * open and back to the trigger on Escape. The mobile header's z-25 stacking context is above
 * drei Html labels (z 0–19) and below the SafetyAlertToast (z-30).
 */
export function LabOptionsMenu({
  open,
  onOpenChange,
  controls,
  actions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Stateful controls kept as-is (e.g. the Lab mode radiogroup and goggles toggle). */
  controls: ReactNode
  actions: readonly LabOptionsAction[]
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const firstControl =
      panel?.querySelector<HTMLElement>('[aria-checked="true"]') ??
      panel?.querySelector<HTMLElement>('button, [href], [tabindex="0"]')
    firstControl?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onOpenChange(false)
      triggerRef.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onOpenChange(false)
    }
    const desktop = window.matchMedia('(min-width: 640px)')
    const onResize = () => {
      if (desktop.matches) onOpenChange(false)
    }
    // Consume Escape before the workbench's global cancellation shortcuts.
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointer)
    desktop.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointer)
      desktop.removeEventListener('change', onResize)
    }
  }, [open, onOpenChange])

  return (
    <div
      ref={rootRef}
      className="relative sm:hidden"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label="Lab options"
        title="Lab options"
        className="flex size-11 items-center justify-center rounded-xl text-white/85 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-teal-light"
      >
        <MoreVertical size={19} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Lab options"
          className="absolute right-0 top-full mt-2 flex max-h-[calc(100dvh-80px)] w-[min(260px,calc(100vw-24px))] flex-col gap-2 overflow-y-auto rounded-xl border border-white/15 bg-[#0d1b2a] p-2 text-white shadow-2xl"
        >
          <div className="flex flex-col gap-2 border-b border-white/10 pb-2">{controls}</div>
          <ul className="flex flex-col">
            {actions.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  aria-pressed={action.pressed}
                  aria-expanded={action.expanded}
                  onClick={() => {
                    onOpenChange(false)
                    triggerRef.current?.focus()
                    action.onSelect()
                  }}
                  className="flex min-h-11 min-w-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-teal-light"
                >
                  <span aria-hidden="true" className="flex size-5 items-center justify-center">
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
