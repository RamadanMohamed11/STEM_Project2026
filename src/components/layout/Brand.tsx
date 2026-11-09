import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex min-h-11 items-center gap-3 rounded-md text-inherit transition-transform duration-200 active:scale-[0.98]"
      aria-label="STEM Virtual Lab home"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:shadow-md">
        <FlaskConical size={22} strokeWidth={1.9} aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110" />
      </span>
      <span className="flex flex-col leading-tight">
        <strong className="text-base font-bold tracking-tight">STEM</strong>
        <span
          className={`text-[11px] font-semibold tracking-[0.14em] ${compact ? 'text-slate' : 'text-white/65'}`}
        >
          VIRTUAL LAB
        </span>
      </span>
    </Link>
  )
}
