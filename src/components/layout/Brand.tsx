import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 rounded-md text-inherit"
      aria-label="STEM Virtual Lab home"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal text-white">
        <FlaskConical size={22} strokeWidth={1.9} aria-hidden="true" />
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
