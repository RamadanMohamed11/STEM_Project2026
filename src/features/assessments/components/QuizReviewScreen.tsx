import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Edit3,
  Info,
  Send,
} from 'lucide-react'
import { Link } from 'react-router'
import type { MultipleChoiceQuestion } from '../../../types/assessment.ts'

interface QuizReviewScreenProps {
  questions: readonly MultipleChoiceQuestion[]
  answers: Readonly<Record<string, string>>
  onGoToQuestion: (index: number) => void
  onBackToQuestions: () => void
  onRequestSubmit?: () => void
  onConfirmSubmit?: () => void
  onCancelConfirmation?: () => void
  isConfirmingUnanswered?: boolean
  detailsPath: string
  resultsPath: string
}

export function QuizReviewScreen({
  questions,
  answers,
  onGoToQuestion,
  onBackToQuestions,
  onRequestSubmit,
  onConfirmSubmit,
  onCancelConfirmation,
  isConfirmingUnanswered = false,
  detailsPath,
  resultsPath,
}: QuizReviewScreenProps) {
  const total = questions.length
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length
  const unansweredCount = Math.max(0, total - answeredCount)

  return (
    <div className="space-y-6">
      {/* Review Header & Summary Stats */}
      <section
        aria-labelledby="review-answers-title"
        className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
              Assessment Summary
            </span>
            <h2
              id="review-answers-title"
              className="mt-1 text-xl font-semibold text-navy sm:text-2xl"
            >
              Review Answers
            </h2>
          </div>

          <button
            type="button"
            onClick={onBackToQuestions}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-canvas focus-visible:outline-teal"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Continue Answering</span>
          </button>
        </div>

        <p className="text-sm leading-relaxed text-slate">
          Review your answers before submitting your practice attempt. You can return to
          any question to select or change your answer before final submission.
        </p>

        {/* Counters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">
              Total Questions
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-navy">{total}</p>
          </div>

          <div className="rounded-xl border border-teal/30 bg-teal-soft/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
              Answered Questions
            </span>
            <p className="mt-1 text-2xl font-bold tabular-nums text-teal-dark">
              {answeredCount}
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              unansweredCount > 0
                ? 'border-amber-300 bg-amber-50/70'
                : 'border-line bg-canvas/60'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-slate">
              Unanswered Questions
            </span>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${
                unansweredCount > 0 ? 'text-amber-900' : 'text-slate'
              }`}
            >
              {unansweredCount}
            </p>
          </div>
        </div>
      </section>

      {/* Unanswered Confirmation Prompt */}
      {isConfirmingUnanswered && unansweredCount > 0 && (
        <section
          role="alert"
          aria-labelledby="unanswered-confirm-title"
          className="space-y-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-card sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h3
                id="unanswered-confirm-title"
                className="text-base font-semibold text-amber-950"
              >
                You have {unansweredCount} unanswered{' '}
                {unansweredCount === 1 ? 'question' : 'questions'}
              </h3>
              <p className="text-sm leading-relaxed text-amber-900">
                Unanswered questions will be marked as not answered and receive 0 points.
                Once submitted, your answers are locked for this attempt. Would you like to
                submit your quiz anyway or return to answer the remaining questions?
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-amber-300/70 pt-3">
            <button
              type="button"
              onClick={onConfirmSubmit}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-teal"
            >
              <Send size={15} aria-hidden="true" />
              <span>Submit Anyway</span>
            </button>

            <button
              type="button"
              onClick={onCancelConfirmation ?? onBackToQuestions}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas focus-visible:outline-teal"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Return to Questions</span>
            </button>
          </div>
        </section>
      )}

      {/* Questions Review List */}
      <section
        aria-labelledby="question-checklist-title"
        className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7"
      >
        <h3
          id="question-checklist-title"
          className="text-base font-semibold text-navy"
        >
          Questions & Selected Choices
        </h3>

        <div className="space-y-3">
          {questions.map((question, index) => {
            const selectedOptionId = answers[question.id]
            const selectedOption = selectedOptionId
              ? question.options.find((opt) => opt.id === selectedOptionId)
              : undefined
            const isAnswered = Boolean(selectedOption)

            return (
              <div
                key={question.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                  isAnswered
                    ? 'border-line bg-white'
                    : 'border-amber-300/80 bg-amber-50/40'
                }`}
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-teal-dark">
                      Question {index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isAnswered
                          ? 'bg-teal-soft text-teal-dark'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isAnswered ? (
                        <>
                          <CheckCircle2 size={12} aria-hidden="true" /> Answered
                        </>
                      ) : (
                        <>
                          <Circle size={12} aria-hidden="true" /> Unanswered
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-navy">{question.prompt}</p>

                  {selectedOption ? (
                    <p className="text-xs text-slate">
                      <span className="font-semibold text-teal-dark">Selected:</span>{' '}
                      {selectedOption.text}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-800">
                      No answer selected yet.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onGoToQuestion(index)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas px-3.5 py-1.5 text-xs font-semibold text-navy hover:border-slate hover:bg-white focus-visible:outline-teal"
                  aria-label={`${isAnswered ? 'Change' : 'Answer'} Question ${index + 1}`}
                >
                  <Edit3 size={13} aria-hidden="true" />
                  <span>{isAnswered ? 'Change Answer' : 'Answer Question'}</span>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Submission Action Box */}
      <section
        aria-labelledby="submission-prep-title"
        className="space-y-4 rounded-2xl border border-teal/30 bg-teal-soft/30 p-5 shadow-card sm:p-7"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal-dark">
            <Info size={18} aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h3 id="submission-prep-title" className="text-base font-semibold text-navy">
              Assessment Submission Notice
            </h3>
            <p className="text-sm leading-relaxed text-ink/80">
              Submit your practice attempt when you are ready to check your answers and read
              scientific explanations. Once submitted, your choices for this attempt are locked,
              and you can start a fresh attempt anytime.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-teal/20 pt-4">
          <button
            type="button"
            onClick={onRequestSubmit}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-dark focus-visible:outline-teal"
          >
            <Send size={15} aria-hidden="true" />
            <span>Submit Quiz</span>
          </button>

          <button
            type="button"
            onClick={onBackToQuestions}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas focus-visible:outline-teal"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Questions</span>
          </button>

          <Link
            to={detailsPath}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas focus-visible:outline-teal"
          >
            Back to Experiment
          </Link>

          <Link
            to={resultsPath}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal-dark hover:underline focus-visible:outline-teal"
          >
            View Quiz Results (Coming Soon)
          </Link>
        </div>
      </section>
    </div>
  )
}
