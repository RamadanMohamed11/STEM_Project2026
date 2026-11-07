import type { ExperimentGuideStage } from '@/types/laboratory'

interface ExperimentStageNavigationProps {
  stages: readonly ExperimentGuideStage[]
  activeIndex: number
  onNavigate: (index: number) => void
}

export function ExperimentStageNavigation({
  stages,
  activeIndex,
  onNavigate,
}: ExperimentStageNavigationProps) {
  return (
    <nav aria-label="Instructional stage navigation">
      <ol className="space-y-1">
        {stages.map((stage, index) => (
          <li key={stage.id}>
            <button
              type="button"
              onClick={() => onNavigate(index)}
              aria-current={activeIndex === index ? 'step' : undefined}
              className={`group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-xs transition-all duration-200 active:scale-[0.98] ${
                activeIndex === index
                  ? 'bg-teal-soft font-semibold text-teal-dark shadow-xs'
                  : 'text-ink/75 hover:bg-surface-muted hover:text-navy hover:translate-x-0.5'
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-200 group-hover:scale-105 ${
                  activeIndex === index
                    ? 'border-teal bg-teal text-white shadow-xs'
                    : 'border-line-strong bg-white text-ink/75 group-hover:border-teal/50'
                }`}
              >
                {index + 1}
              </span>
              <span className="leading-4 transition-colors group-hover:text-navy">{stage.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
