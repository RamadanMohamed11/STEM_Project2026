import { Menu } from 'lucide-react'
import { useLocation } from 'react-router'
import { getPageContext } from '@/app/navigation'
import { Brand } from '@/components/layout/Brand'
import { StatusPill } from '@/components/ui/StatusPill'

interface HeaderProps {
  onMenuOpen: () => void
  menuOpen: boolean
}

export function Header({ onMenuOpen, menuOpen }: HeaderProps) {
  const { pathname } = useLocation()
  const page = getPageContext(pathname)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label="Open navigation"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            className="-ms-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-navy transition-all duration-200 hover:bg-teal-soft hover:text-teal active:scale-95 focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 md:hidden"
          >
            <Menu size={23} aria-hidden="true" />
          </button>
          <span className="md:hidden">
            <Brand compact />
          </span>
          <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
            <span className="font-semibold text-navy">STEM Virtual Lab</span>
            <span className="text-line-strong" aria-hidden="true">
              /
            </span>
            <span className="truncate text-ink/75" aria-current="page">
              {page}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-ink/75 sm:inline">Interactive Science Lab</span>
          <StatusPill tone="ready" dot>Student Preview</StatusPill>
        </div>
      </div>
    </header>
  )
}
