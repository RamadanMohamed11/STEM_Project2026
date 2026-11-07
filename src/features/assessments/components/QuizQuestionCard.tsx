import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ListChecks, RotateCcw } from 'lucide-react'
import type { MultipleChoiceQuestion } from '../../../types/assessment.ts'

interface QuizQuestionCardProps {
  question: MultipleChoiceQuestion
  questionIndex: number
  totalQuestions: number
  selectedOptionId: string | undefined
  onSelectOption: (questionId: string, optionId: string) => void
  onClearOption: (questionId: string) => void
  onPrevious: () => void
  onNext: () => void
  onOpenReview: () => void
  isFirst: boolean
  isLast: boolean
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  onSelectOption,
  onClearOption,
  onPrevious,
  onNext,
  onOpenReview,
  isFirst,
  isLast,
}: QuizQuestionCardProps) {
  const isAnswered = Boolean(selectedOptionId)

  return (
    <article
      key={question.id}
      aria-labelledby={`question-title-${question.id}`}
      className="animate-fade-in-up space-y-6 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
    >
      {/* Question Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-teal-dark">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          {question.difficulty && (
            <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-medium capitalize text-slate">
              {question.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isAnswered
                ? 'bg-teal-soft text-teal-dark'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isAnswered ? (
              <>
                <CheckCircle2 size={13} aria-hidden="true" /> Answered
              </>
            ) : (
              <>
                <Circle size={13} aria-hidden="true" /> Unanswered
              </>
            )}
          </span>
          {isAnswered && (
            <button
              type="button"
              onClick={() => onClearOption(question.id)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate hover:bg-canvas hover:text-navy focus-visible:outline-teal"
              title="Clear selected answer"
              aria-label="Clear selected answer"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Fieldset & Radio Options */}
      <fieldset className="space-y-4">
        <legend
          id={`question-title-${question.id}`}
          className="text-lg font-semibold leading-relaxed text-navy sm:text-xl"
        >
          {question.prompt}
        </legend>

        <p className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
          Choose one answer.
        </p>

        <div
          role="radiogroup"
          aria-label={`Answer choices for question ${questionIndex + 1}`}
          className="space-y-3"
        >
          {question.options.map((option, optIdx) => {
            const isSelected = selectedOptionId === option.id
            const letter = OPTION_LETTERS[optIdx] ?? `${optIdx + 1}`
            const inputId = `option-${question.id}-${option.id}`

            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={`group flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all duration-200 select-none focus-within:ring-2 focus-within:ring-teal focus-within:ring-offset-1 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                  isSelected
                    ? 'border-teal bg-teal-soft/50 font-medium text-navy shadow-md ring-2 ring-teal/25 scale-[1.01]'
                    : 'border-line bg-white text-ink/90 hover:border-teal/40 hover:bg-canvas/60 hover:shadow-sm'
                }`}
              >
                <input
                  type="radio"
                  id={inputId}
                  name={`quiz-question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelectOption(question.id, option.id)}
                  className="mt-0.5 size-4 shrink-0 accent-teal transition-transform duration-150 group-hover:scale-110 focus:outline-none"
                />

                <span className="flex min-w-0 flex-1 items-start gap-2.5 text-sm leading-relaxed sm:text-base">
                  <span
                    className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-teal text-white shadow-sm scale-110'
                        : 'bg-canvas text-slate group-hover:bg-teal-soft group-hover:text-teal-dark group-hover:scale-110'
                    }`}
                    aria-hidden="true"
                  >
                    {letter}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{option.text}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst}
          className={`group/btn inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all select-none focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.98] ${
            isFirst
              ? 'cursor-not-allowed border border-line bg-canvas/60 text-slate/50'
              : 'border border-line bg-white text-navy hover:bg-canvas hover:border-slate/40'
          }`}
        >
          <ArrowLeft size={16} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:-translate-x-1" />
          <span>Previous</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenReview}
            className="group/btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas hover:border-slate/40 focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.98] transition-all"
          >
            <ListChecks size={16} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:scale-110" />
            <span>Review Answers</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="group/btn inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-dark hover:shadow-md focus-visible:outline-2 focus-visible:outline-teal focus-visible:outline-offset-2 active:scale-[0.98] transition-all"
          >
            <span>{isLast ? 'Review Answers' : 'Next'}</span>
            <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  )
}
