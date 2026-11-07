import { CheckCircle2 } from 'lucide-react'
import type { MultipleChoiceQuestion } from '../../../types/assessment.ts'

interface QuizProgressBarProps {
  questions: readonly MultipleChoiceQuestion[]
  currentIndex: number
  answers: Readonly<Record<string, string>>
  onSelectIndex: (index: number) => void
}

export function QuizProgressBar({
  questions,
  currentIndex,
  answers,
  onSelectIndex,
}: QuizProgressBarProps) {
  const total = questions.length
  if (total === 0) return null

  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length
  const percent = Math.round((answeredCount / total) * 100)

  return (
    <nav
      aria-label="Quiz question navigation"
      className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate">
        <span className="text-navy">
          Question <span className="tabular-nums">{currentIndex + 1}</span> of{' '}
          <span className="tabular-nums">{total}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-teal-dark">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span className="tabular-nums">{answeredCount}</span> of{' '}
          <span className="tabular-nums">{total}</span> answered ({percent}%)
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${answeredCount} of ${total} questions answered`}
      >
        <div
          className="h-full rounded-full bg-teal transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {questions.map((question, index) => {
          const isCurrent = index === currentIndex
          const isAnswered = Boolean(answers[question.id])

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelectIndex(index)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Question ${index + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}${isCurrent ? ' (Current)' : ''}`}
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all select-none focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 ${
                isCurrent
                  ? 'border-2 border-teal bg-teal text-white shadow-sm'
                  : isAnswered
                    ? 'border border-teal/40 bg-teal-soft text-teal-dark hover:bg-teal-soft/80'
                    : 'border border-line bg-canvas/60 text-slate hover:border-slate hover:bg-canvas'
              }`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
