import { useOutletContext } from 'react-router'
import { Link } from 'react-router'
import { getExperimentPaths } from '@/app/paths'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { getAssessmentForExperiment } from '@/features/assessments/lib/assessmentSelectors'
import { useQuizState } from '@/features/assessments/state/useQuizState'
import { QuizProgressBar } from '@/features/assessments/components/QuizProgressBar'
import { QuizQuestionCard } from '@/features/assessments/components/QuizQuestionCard'
import { QuizReviewScreen } from '@/features/assessments/components/QuizReviewScreen'
import { QuizUnavailable } from '@/features/assessments/components/QuizUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Experiment } from '@/types/experiment'

export function ExperimentQuizPage() {
  const experiment = useOutletContext<Experiment>()
  const paths = getExperimentPaths(experiment.id)
  usePageTitle(`${experiment.title} — Quiz`)

  const assessment = getAssessmentForExperiment(experiment.id)
  const quizState = useQuizState(assessment)

  const hasQuestions = quizState.questions.length > 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Experiments', to: '/experiments' },
          { label: experiment.title, to: paths.details },
          { label: 'Quiz' },
        ]}
      />

      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
          Experiments / Quiz
        </p>
        <h1 className="text-3xl font-semibold text-navy">Experiment Quiz</h1>
        <p className="text-base font-medium text-slate">{experiment.title}</p>
      </header>

      {!hasQuestions || !assessment ? (
        <QuizUnavailable
          experimentTitle={experiment.title}
          detailsPath={paths.details}
          resultsPath={paths.results}
        />
      ) : (
        <div className="space-y-6">
          {/* Demonstration disclaimer notice */}
          {assessment.reviewStatus === 'draft' && (
            <aside
              aria-label="Demonstration assessment disclaimer"
              className="rounded-xl border border-teal/25 bg-teal-soft/40 px-4 py-3 text-xs leading-relaxed text-ink/85 shadow-sm"
            >
              <strong className="font-semibold text-teal-dark">
                Learning Practice · Draft Assessment:
              </strong>{' '}
              This assessment includes {quizState.totalCount} demonstration review questions for the{' '}
              {experiment.title.toLowerCase()} experiment. Quiz questions are coming soon with
              automatic grading and scoring in Task T27.
            </aside>
          )}

          {quizState.isReviewMode ? (
            <QuizReviewScreen
              questions={quizState.questions}
              answers={quizState.answers}
              onGoToQuestion={quizState.goToQuestion}
              onBackToQuestions={quizState.exitReview}
              detailsPath={paths.details}
              resultsPath={paths.results}
            />
          ) : (
            <div className="space-y-5">
              <QuizProgressBar
                questions={quizState.questions}
                currentIndex={quizState.currentQuestionIndex}
                answers={quizState.answers}
                onSelectIndex={quizState.goToQuestion}
              />

              {quizState.currentQuestion && (
                <QuizQuestionCard
                  question={quizState.currentQuestion}
                  questionIndex={quizState.currentQuestionIndex}
                  totalQuestions={quizState.totalCount}
                  selectedOptionId={quizState.answers[quizState.currentQuestion.id]}
                  onSelectOption={quizState.selectOption}
                  onClearOption={quizState.clearOption}
                  onPrevious={quizState.previousQuestion}
                  onNext={quizState.nextQuestion}
                  onOpenReview={quizState.openReview}
                  isFirst={quizState.isFirstQuestion}
                  isLast={quizState.isLastQuestion}
                />
              )}

              {/* Auxiliary Navigation */}
              <nav
                aria-label="Additional quiz links"
                className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold"
              >
                <Link
                  to={paths.details}
                  className="inline-flex min-h-11 items-center rounded text-slate hover:text-navy hover:underline focus-visible:outline-teal"
                >
                  Back to Experiment
                </Link>
                <Link
                  to={paths.results}
                  className="inline-flex min-h-11 items-center rounded text-teal-dark hover:underline focus-visible:outline-teal"
                >
                  View Quiz Results (Coming Soon)
                </Link>
              </nav>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
