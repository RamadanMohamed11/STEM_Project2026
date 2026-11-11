import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { NavigationLinks } from '@/components/layout/NavigationLinks'
import { containDialogTab } from '@/components/ui/dialogKeyboard'

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
      onKeyDown={containDialogTab}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="mobile-drawer-left ms-0 me-auto h-dvh max-h-dvh w-[min(22rem,calc(100vw-2.5rem))] max-w-none border-0 border-e border-white/10 bg-navy p-0 text-white shadow-2xl rounded-e-2xl backdrop:bg-navy/70 backdrop:backdrop-blur-sm md:hidden"
    >
      <div className="flex h-full flex-col overflow-y-auto px-5 py-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <Brand />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-11 items-center justify-center rounded-xl text-white/85 transition-all duration-200 hover:rotate-90 hover:bg-white/15 active:scale-95 focus-visible:outline-2 focus-visible:outline-teal-light focus-visible:outline-offset-2"
          >
            <X size={23} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-8 mb-3 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-light/80">
          Navigation
        </p>
        <div className="animate-fade-in-up">
          <NavigationLinks variant="drawer" onNavigate={onClose} />
        </div>

        <div className="mt-auto border-t border-white/15 pt-5 text-xs leading-relaxed text-white/70">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-light">
            <span className="size-2 rounded-full bg-teal-light animate-pulse" aria-hidden="true" />
            STEM Virtual Lab
          </div>
          <p className="mt-1 text-[11px] text-white/60">
            Interactive virtual experiments for science students.
          </p>
        </div>
      </div>
    </dialog>
  )
}
