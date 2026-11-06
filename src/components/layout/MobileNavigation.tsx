import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { NavigationLinks } from '@/components/layout/NavigationLinks'

interface MobileNavigationProps {
  open: boolean
  onClose: () => void
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      closeButtonRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // A viewport expansion must never leave a mobile modal covering the desktop layout.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const onResize = () => {
      if (media.matches && dialogRef.current?.open) dialogRef.current.close()
    }

    media.addEventListener('change', onResize)
    return () => media.removeEventListener('change', onResize)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      id="mobile-navigation"
      aria-label="Navigation menu"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="ms-auto me-0 h-dvh max-h-dvh w-[min(21rem,calc(100vw-2rem))] max-w-none border-0 bg-navy p-0 text-white shadow-elevated backdrop:bg-navy/65 md:hidden"
    >
      <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-11 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-teal-light focus-visible:outline-offset-2"
          >
            <X size={23} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-10 mb-3 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
          Explore
        </p>
        <NavigationLinks variant="drawer" onNavigate={onClose} />

        <div className="mt-auto border-t border-white/15 pt-6 text-xs leading-relaxed text-white/70">
          STEM Virtual Lab — Interactive virtual experiments for science students.
        </div>
      </div>
    </dialog>
  )
}
