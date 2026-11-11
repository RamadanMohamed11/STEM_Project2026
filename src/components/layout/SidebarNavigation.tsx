import { useEffect } from 'react'
import { BookMarked, FlaskConical, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link } from 'react-router'
import { NavigationLinks } from '@/components/layout/NavigationLinks'
import { useSidebarStore } from '@/components/layout/useSidebarStore'

interface SidebarNavigationProps {
  collapsed?: boolean
}

export function SidebarNavigation({ collapsed }: SidebarNavigationProps = {}) {
  const storeCollapsed = useSidebarStore((s) => s.isCollapsed)
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar)
  const isCollapsed = collapsed !== undefined ? collapsed : storeCollapsed

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
          return
        }
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  return (
    <aside
      aria-label="Main desktop sidebar"
      className={`sticky top-0 hidden h-dvh min-h-[520px] flex-col overflow-y-auto overflow-x-hidden bg-navy text-white transition-[width] duration-300 ease-in-out md:flex ${
        isCollapsed ? 'w-[76px] px-2.5 py-6' : 'w-[252px] px-4 py-6'
      }`}
    >
      {/* Header: Brand and Toggle Button */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'flex-col gap-3' : 'justify-between gap-2 px-1'
        }`}
      >
        <Link
          to="/"
          aria-label="STEM Virtual Lab home"
          title="STEM Virtual Lab home"
          className={`flex min-h-12 items-center rounded-xl focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2 ${
            isCollapsed ? 'justify-center' : 'min-w-0 gap-3'
          }`}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-teal text-white shadow-sm transition-transform hover:scale-105 active:scale-95">
            <FlaskConical size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          {!isCollapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-bold tracking-tight">STEM Virtual Lab</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Interactive Science
              </span>
            </span>
          )}
        </Link>

        {/* Sidebar Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar (show labels)' : 'Collapse sidebar (icons only)'}
          title={isCollapsed ? 'Expand sidebar (show labels)' : 'Collapse sidebar (icons only)'}
          aria-expanded={!isCollapsed}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/75 hover:bg-white/15 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-teal-light"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      </div>

      <div
        className={`mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 ${
          isCollapsed ? 'sr-only' : 'block'
        }`}
      >
        Explore
      </div>
      <div className="mt-3">
        <NavigationLinks variant="sidebar" isCollapsed={isCollapsed} />
      </div>

      {/* Footer info & bottom toggle */}
      <div className="mt-auto pt-6">
        {!isCollapsed ? (
          <div className="rounded-xl border border-white/12 bg-white/5 p-4">
            <BookMarked
              size={20}
              strokeWidth={1.8}
              className="text-teal-light"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold">Explore Science</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/70">
              Try interactive 3D experiments and learn practical chemistry step by step.
            </p>
          </div>
        ) : (
          <div className="mx-auto size-2 rounded-full bg-teal-light" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mt-4 flex min-h-10 w-full items-center rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors ${
            isCollapsed ? 'justify-center px-2' : 'justify-start gap-2.5 px-3'
          }`}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>

        {!isCollapsed && (
          <p className="mt-3 px-2 text-[11px] text-white/50">STEM Virtual Learning</p>
        )}
      </div>
    </aside>
  )
}
