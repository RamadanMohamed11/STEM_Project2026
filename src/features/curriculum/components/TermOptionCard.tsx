import { Check, Circle } from 'lucide-react'
import type { Term } from '@/types/curriculum'
import type { TermCardDetail } from '../data/termMetadata'

interface TermOptionCardProps {
  term: Term
  detail?: TermCardDetail
  isSelected: boolean
  onSelect: (termId: string) => void
}

export function TermOptionCard({ term, detail, isSelected, onSelect }: TermOptionCardProps) {
  const Icon = detail?.icon

  return (
    <article
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : 0}
      onClick={() => onSelect(term.id)}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          onSelect(term.id)
        }
      }}
      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ease-out select-none sm:p-7 hover:-translate-y-1.5 hover:shadow-xl ${
        isSelected
          ? 'border-teal bg-teal-soft/20 shadow-md ring-2 ring-teal/30'
          : 'border-line bg-white shadow-card hover:border-teal/40'
      } focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.99]`}
    >
      <div>
        {/* Header: Icon, Period Badge, and Selection Indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <span
                className={`flex size-12 items-center justify-center rounded-xl shadow-xs transition-all duration-300 ${
                  isSelected ? 'bg-teal text-white scale-105' : 'bg-teal-soft text-teal-dark group-hover:bg-teal group-hover:text-white group-hover:scale-105'
                }`}
              >
                <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
              </span>
            )}
            <div>
              <span className="rounded-md border border-line bg-canvas px-2.5 py-0.5 text-xs font-semibold text-slate transition-colors group-hover:border-teal/20">
                {detail?.period ?? `Term ${term.order}`}
              </span>
              <p className="mt-1 text-xs font-semibold text-teal-dark">
                {detail?.subtitle}
              </p>
            </div>
          </div>

          {/* Radio / Selection Check Circle */}
          <div
            className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
              isSelected
                ? 'border-teal bg-teal text-white shadow-sm scale-110'
                : 'border-line-strong bg-canvas text-transparent group-hover:border-teal/50 group-hover:scale-105'
            }`}
            aria-hidden="true"
          >
            {isSelected ? <Check size={14} strokeWidth={3} className="animate-celebrate-pop" /> : <Circle size={10} className="opacity-0" />}
          </div>
        </div>

        {/* Term Title */}
        <h3
          className={`mt-5 text-2xl font-bold tracking-tight transition-colors ${
            isSelected ? 'text-teal-dark' : 'text-navy group-hover:text-navy'
          }`}
        >
          {term.title}
        </h3>

        {/* Short Description */}
        <p className="mt-2 text-xs leading-relaxed text-ink/75 sm:text-sm">
          {detail?.description ?? 'Curriculum units and hands-on experiments for this term.'}
        </p>

        {/* Topic Pills */}
        {detail?.topics && detail.topics.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {detail.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-md border border-line/70 bg-canvas/70 px-2.5 py-1 text-xs font-medium text-slate"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected Status Text */}
      <div className="mt-6 border-t border-line/60 pt-3 text-xs font-semibold">
        {isSelected ? (
          <span className="inline-flex items-center gap-1.5 text-teal-dark">
            <span className="size-2 rounded-full bg-teal" aria-hidden="true" />
            Selected Term
          </span>
        ) : (
          <span className="text-slate group-hover:text-ink">Click or press Enter to select</span>
        )}
      </div>
    </article>
  )
}
