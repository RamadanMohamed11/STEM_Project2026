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
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-xs transition-colors ${
                activeIndex === index
                  ? 'bg-teal-soft font-semibold text-teal-dark'
                  : 'text-ink/75 hover:bg-surface-muted'
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                  activeIndex === index
                    ? 'border-teal bg-teal text-white'
                    : 'border-line-strong bg-white text-ink/75'
                }`}
              >
                {index + 1}
              </span>
              <span className="leading-4">{stage.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
