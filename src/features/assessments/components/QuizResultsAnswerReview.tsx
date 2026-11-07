import { useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Filter,
  XCircle,
} from 'lucide-react'
import type { QuestionFeedbackItem } from '../../../types/assessment.ts'

interface QuizResultsAnswerReviewProps {
  feedbackItems: readonly QuestionFeedbackItem[]
}

type FilterOption = 'all' | 'missed' | 'correct'

export function QuizResultsAnswerReview({ feedbackItems }: QuizResultsAnswerReviewProps) {
  const [filter, setFilter] = useState<FilterOption>('all')

  const totalCount = feedbackItems.length
  const correctCount = feedbackItems.filter((item) => item.status === 'correct').length
  const missedCount = totalCount - correctCount

  const filteredItems = useMemo(() => {
    if (filter === 'correct') {
      return feedbackItems.filter((item) => item.status === 'correct')
    }
    if (filter === 'missed') {
      return feedbackItems.filter((item) => item.status !== 'correct')
    }
    return feedbackItems
  }, [feedbackItems, filter])

  return (
    <section
      id="answer-review"
      aria-labelledby="review-answers-section-title"
      className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
            Detailed Review
          </span>
          <h3
            id="review-answers-section-title"
            className="mt-1 text-xl font-semibold text-navy sm:text-2xl"
          >
            Review Answers
          </h3>
          <p className="mt-1 text-xs text-slate">
            Read the explanations to understand the chemistry behind every question.
          </p>
        </div>

        {/* Filter controls */}
        <div
          role="group"
          aria-label="Filter questions by outcome"
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-canvas p-1 text-xs font-semibold"
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 active:scale-95 ${
              filter === 'all'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate hover:text-navy'
            }`}
          >
            <Filter size={13} aria-hidden="true" />
            <span>All ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('missed')}
            aria-pressed={filter === 'missed'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 active:scale-95 ${
              filter === 'missed'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate hover:text-navy'
            }`}
          >
            <XCircle size={13} className="text-rose-600" aria-hidden="true" />
            <span>Needs Review ({missedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('correct')}
            aria-pressed={filter === 'correct'}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all duration-150 active:scale-95 ${
              filter === 'correct'
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate hover:text-navy'
            }`}
          >
            <CheckCircle2 size={13} className="text-teal" aria-hidden="true" />
            <span>Correct ({correctCount})</span>
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-slate">
          No questions match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isCorrect = item.status === 'correct'
            const isUnanswered = item.status === 'unanswered'

            return (
              <article
                key={item.questionId}
                aria-label={`Question ${item.order} feedback`}
                className={`space-y-4 rounded-xl border p-4 sm:p-5 transition-all duration-200 hover:shadow-xs ${
                  isCorrect
                    ? 'border-teal/30 bg-teal-soft/20'
                    : isUnanswered
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-rose-200 bg-rose-50/35'
                }`}
              >
                {/* Header & Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-navy">
                    Question {item.order}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      isCorrect
                        ? 'bg-teal-soft text-teal-dark'
                        : isUnanswered
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span>{item.feedbackHeading}</span>
                      </>
                    ) : isUnanswered ? (
                      <>
                        <AlertCircle size={14} aria-hidden="true" />
                        <span>{item.feedbackHeading} · Not Answered</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} aria-hidden="true" />
                        <span>{item.feedbackHeading}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Question Prompt */}
                <p className="text-base font-semibold leading-snug text-navy">
                  {item.prompt}
                </p>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-line bg-white p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                      Your Answer
                    </span>
                    {item.selectedOptionText ? (
                      <p className="mt-1 text-sm font-medium text-navy">
                        <span className="font-bold text-teal-dark">
                          {item.selectedOptionLabel}.
                        </span>{' '}
                        {item.selectedOptionText}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-amber-900">
                        Not answered — You skipped this question.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-teal/30 bg-white p-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                      Correct Answer
                    </span>
                    <p className="mt-1 text-sm font-medium text-navy">
                      <span className="font-bold text-teal-dark">
                        {item.correctOptionLabel}.
                      </span>{' '}
                      {item.correctOptionText}
                    </p>
                  </div>
                </div>

                {/* Scientific Explanation ("Here's Why") */}
                <div className="rounded-lg border border-line bg-white/95 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-dark">
                    <BookOpen size={14} aria-hidden="true" />
                    <span>Here&apos;s Why</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/90">
                    {item.explanation}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
