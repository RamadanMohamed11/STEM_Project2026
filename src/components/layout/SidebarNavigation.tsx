import { BookMarked, FlaskConical } from 'lucide-react'
import { Link } from 'react-router'
import { NavigationLinks } from '@/components/layout/NavigationLinks'

export function SidebarNavigation() {
  return (
    <aside className="sticky top-0 hidden h-dvh min-h-[520px] flex-col overflow-y-auto bg-navy px-3 py-7 text-white md:flex xl:px-5 xl:py-8">
      <Link
        to="/"
        aria-label="STEM Virtual Lab home"
        className="flex min-h-12 items-center justify-center gap-3 rounded-lg focus-visible:outline-3 focus-visible:outline-teal-light focus-visible:outline-offset-2 xl:justify-start xl:px-3"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-teal text-white shadow-sm">
          <FlaskConical size={23} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="hidden min-w-0 flex-col xl:flex">
          <span className="text-[15px] font-bold tracking-tight">STEM Virtual Lab</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Interactive Science
          </span>
        </span>
      </Link>

      <div className="mt-12 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 max-xl:sr-only">
        Explore
      </div>
      <div className="mt-4">
        <NavigationLinks variant="sidebar" />
      </div>

      <div className="mt-auto pt-8">
        <div className="hidden rounded-xl border border-white/12 bg-white/5 p-4 xl:block">
          <BookMarked size={20} strokeWidth={1.8} className="text-teal-light" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">Explore Science</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/70">
            Try interactive 3D experiments and learn practical chemistry step by step.
          </p>
        </div>
        <p className="mt-4 hidden px-2 text-[11px] text-white/55 xl:block">
          STEM Virtual Learning
        </p>
        <div
          className="mx-auto hidden size-2 rounded-full bg-teal-light md:block xl:hidden"
          aria-hidden="true"
        />
      </div>
    </aside>
  )
}
