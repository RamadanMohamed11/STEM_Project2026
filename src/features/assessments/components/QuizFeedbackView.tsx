import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Info,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router'
import type { AssessmentResultRecord } from '../../../types/assessment.ts'

interface QuizFeedbackViewProps {
  result: AssessmentResultRecord
  onRetakeQuiz: () => void
  detailsPath: string
  resultsPath: string
}

export function QuizFeedbackView({
  result,
  onRetakeQuiz,
  detailsPath,
  resultsPath,
}: QuizFeedbackViewProps) {
  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <section
        aria-labelledby="your-score-heading"
        className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
              Practice Assessment Completed
            </span>
            <h2
              id="your-score-heading"
              className="text-xl font-semibold text-navy sm:text-2xl"
            >
              Your Score
            </h2>
          </div>

          <div className="flex items-baseline gap-3 rounded-xl border border-teal/30 bg-teal-soft/40 px-4 py-2.5">
            <span className="text-2xl font-bold tabular-nums text-navy sm:text-3xl">
              {result.score} / {result.maxScore}
            </span>
            <span className="text-base font-bold tabular-nums text-teal-dark sm:text-lg">
              ({result.percentage}%)
            </span>
          </div>
        </div>

        {/* Optional Pass/Fail indicator ONLY when an approved threshold is configured */}
        {result.passStatus !== 'unconfigured' && (
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              result.passStatus === 'passed'
                ? 'bg-teal-soft text-teal-dark'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            <span>
              Threshold Status: {result.passStatus === 'passed' ? 'Passed' : 'Needs Review'}
            </span>
          </div>
        )}

        {/* Score Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="group rounded-xl border border-line bg-canvas/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">
              Total Questions
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-navy transition-transform duration-200 group-hover:scale-105">
              {result.totalQuestions}
            </p>
          </div>

          <div className="group rounded-xl border border-teal/30 bg-teal-soft/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-soft/60 hover:shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
              Correct
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-dark transition-transform duration-200 group-hover:scale-105">
              {result.correctCount}
            </p>
          </div>

          <div className="group rounded-xl border border-rose-200 bg-rose-50/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">
              Incorrect
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900 transition-transform duration-200 group-hover:scale-105">
              {result.incorrectCount}
            </p>
          </div>

          <div className="group rounded-xl border border-amber-300 bg-amber-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100/70 hover:shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Unanswered
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900 transition-transform duration-200 group-hover:scale-105">
              {result.unansweredCount}
            </p>
          </div>
        </div>

        {/* Educational Integrity Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-line bg-canvas/60 p-4 text-xs leading-relaxed text-slate transition-all duration-200 hover:border-slate/40">
          <Info size={16} className="mt-0.5 shrink-0 text-teal-dark" aria-hidden="true" />
          <p>
            <strong className="font-semibold text-navy">Practice Assessment Notice:</strong>{' '}
            This score is calculated in your browser to help you review scientific concepts
            after your experiment. It is a self-study practice result and is not an official
            school examination grade.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="group/btn inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
          >
            <RotateCcw size={16} aria-hidden="true" className="transition-transform duration-300 group-hover/btn:-rotate-90" />
            <span>Try Again (Retake Quiz)</span>
          </button>

          <Link
            to={detailsPath}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas hover:border-slate/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
          >
            Back to Experiment
          </Link>

          <Link
            to={resultsPath}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal-dark hover:underline hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
          >
            View Quiz Results
          </Link>
        </div>
      </section>

      {/* Question-by-Question Answer Feedback */}
      <section
        aria-labelledby="review-your-answers-heading"
        className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
      >
        <div className="border-b border-line pb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
            Concept Breakdown
          </span>
          <h3
            id="review-your-answers-heading"
            className="mt-1 text-lg font-semibold text-navy sm:text-xl"
          >
            Review Your Answers
          </h3>
        </div>

        <div className="space-y-4">
          {result.questionFeedback.map((item, index) => {
            const isCorrect = item.status === 'correct'
            const isUnanswered = item.status === 'unanswered'

            return (
              <article
                key={item.questionId}
                aria-label={`Question ${index + 1} feedback`}
                className={`space-y-4 rounded-xl border p-4 sm:p-5 ${
                  isCorrect
                    ? 'border-teal/35 bg-teal-soft/15'
                    : isUnanswered
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                {/* Header & Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-navy">
                    Question {index + 1}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
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
                </div>

                {/* Question Prompt */}
                <p className="text-base font-semibold leading-snug text-navy">
                  {item.prompt}
                </p>

                {/* Student Answer vs Correct Answer */}
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

                {/* Scientific Explanation */}
                <div className="rounded-lg border border-line bg-white/90 p-3.5">
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
      </section>
    </div>
  )
}
