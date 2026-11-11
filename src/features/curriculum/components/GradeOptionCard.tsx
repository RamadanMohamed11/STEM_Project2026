import { Check, Circle } from 'lucide-react'
import type { Grade } from '@/types/curriculum'
import type { GradeCardDetail } from '../data/gradeMetadata'

interface GradeOptionCardProps {
  grade: Grade
  detail?: Omit<GradeCardDetail, 'id'>
  isSelected: boolean
  onSelect: (gradeId: string) => void
  index?: number
}

export function GradeOptionCard({ grade, detail, isSelected, onSelect, index }: GradeOptionCardProps) {
  const Icon = detail?.icon
  const staggerClass = index !== undefined ? `stagger-${(index % 3) + 1}` : ''

  return (
    <article
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : 0}
      onClick={() => onSelect(grade.id)}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          onSelect(grade.id)
        }
      }}
      className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-300 ease-out select-none sm:p-6 hover:-translate-y-1.5 hover:shadow-xl animate-card-reveal ${staggerClass} ${
        isSelected
          ? 'border-teal bg-teal-soft/30 shadow-md ring-2 ring-teal/20'
          : 'border-line-strong/40 bg-white shadow-card hover:border-teal/60'
      } focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.99]`}
    >
      <div>
        {/* Header: Icon, Badge, and Selection Indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <span
                className={`flex size-12 items-center justify-center rounded-xl shadow-xs transition-all duration-300 ${
                  isSelected
                    ? 'bg-teal text-white scale-105 shadow-sm'
                    : 'bg-surface-muted text-navy border border-line-strong/30 group-hover:bg-teal group-hover:text-white group-hover:border-transparent group-hover:scale-105'
                }`}
              >
                <Icon size={24} strokeWidth={1.9} aria-hidden="true" />
              </span>
            )}
            <div>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-xs font-bold transition-colors ${
                  isSelected
                    ? 'border-teal/30 bg-teal/10 text-teal'
                    : 'border-line-strong/40 bg-surface-muted text-navy group-hover:border-teal/30'
                }`}
              >
                {detail?.levelBadge ?? `Order ${grade.order}`}
              </span>
              <p
                className={`mt-1 text-xs font-semibold transition-colors ${
                  isSelected ? 'text-teal' : 'text-slate group-hover:text-navy'
                }`}
              >
                {detail?.subtitle}
              </p>
            </div>
          </div>

          {/* Radio / Selection Badge or Circle */}
          {isSelected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal bg-teal px-2.5 py-1 text-xs font-bold text-white shadow-xs animate-celebrate-pop">
              <Check size={13} strokeWidth={3} aria-hidden="true" />
              Selected
            </span>
          ) : (
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-slate/35 bg-white text-transparent transition-all duration-200 group-hover:border-teal group-hover:scale-105"
              aria-hidden="true"
            >
              <Circle size={8} className="fill-slate/25 group-hover:fill-teal/30 transition-colors" />
            </div>
          )}
        </div>

        {/* Grade Title */}
        <h2 className="mt-5 text-xl font-bold tracking-tight text-navy">
          {grade.title}
        </h2>

        {/* Short Description */}
        <p className="mt-2 text-xs leading-relaxed text-ink sm:text-sm">
          {detail?.description ?? 'Curriculum topics and interactive laboratory experiments.'}
        </p>

        {/* Topic Pills */}
        {detail?.topics && detail.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {detail.topics.map((topic) => (
              <span
                key={topic}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  isSelected
                    ? 'border-teal/20 bg-teal-soft text-teal'
                    : 'border-line bg-surface-muted/60 text-slate group-hover:text-navy group-hover:border-line-strong'
                }`}
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected Status Text */}
      <div
        className={`mt-5 border-t pt-3 text-xs font-semibold transition-colors ${
          isSelected ? 'border-teal/20 text-teal' : 'border-line text-slate'
        }`}
      >
        {isSelected ? (
          <span className="inline-flex items-center gap-2 font-bold text-teal">
            <span className="size-2 rounded-full bg-teal animate-pulse" aria-hidden="true" />
            Selected Grade · Click continue below
          </span>
        ) : (
          <div className="flex items-center justify-between text-slate group-hover:text-navy">
            <span>Click or press Enter to select</span>
            <span className="text-[11px] font-medium text-slate group-hover:text-teal">Choose →</span>
          </div>
        )}
      </div>
    </article>
  )
}
