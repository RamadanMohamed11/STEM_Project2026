import { ArrowDown, HelpCircle, RotateCcw } from 'lucide-react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { AchievementIllustration } from '@/features/assessments/components/AchievementIllustration'
import { CelebrationEffect } from '@/features/assessments/components/CelebrationEffect'
import { QuizResultsAnswerReview } from '@/features/assessments/components/QuizResultsAnswerReview'
import { ScoreRingMeter } from '@/features/assessments/components/ScoreRingMeter'
import { getAssessmentForExperiment } from '@/features/assessments/lib/assessmentSelectors'
import { getPerformanceFeedback } from '@/features/assessments/lib/performanceFeedback'
import {
  clearLatestAssessmentResult,
  getLatestAssessmentResult,
} from '@/features/assessments/state/assessmentResultsStore'
import { useStudentAssessmentCatalog } from '@/features/assessments/state/useStudentAssessmentCatalog'
import { useStudentExperimentCatalog } from '@/features/experiments/state/useStudentExperimentCatalog'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { AssessmentResultRecord } from '@/types/assessment'
import type { Experiment } from '@/types/experiment'

export function QuizResultsPage() {
  const experiment = useOutletContext<Experiment>()
  const location = useLocation()
  const navigate = useNavigate()
  const paths = getExperimentPaths(experiment.id)
  usePageTitle(`${experiment.title} — Quiz Results`)

  const { assessments } = useStudentAssessmentCatalog()
  const { catalog } = useStudentExperimentCatalog()
  const knownExperimentIds = catalog.experiments.map((exp) => exp.id)

  // Check router location state first, then fallback to in-memory session store
  const stateResult = (location.state as { result?: AssessmentResultRecord } | null)?.result
  const result: AssessmentResultRecord | null =
    stateResult && stateResult.experimentId === experiment.id
      ? stateResult
      : getLatestAssessmentResult(experiment.id)

  const assessment = getAssessmentForExperiment(
    experiment.id,
    assessments,
    knownExperimentIds,
  )
  const quizTitle = assessment?.title ?? 'Multiple-Choice Review'

  const handleRetake = () => {
    clearLatestAssessmentResult(experiment.id)
    navigate(paths.quiz)
  }

  const handleScrollToReview = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('answer-review')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        el.focus({ preventScroll: true })
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Experiments', to: '/experiments' },
          { label: experiment.title, to: paths.details },
          { label: 'Quiz Results' },
        ]}
      />

      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
          Experiments / Quiz results
        </p>
        <h1 className="text-3xl font-semibold text-navy">Quiz Results</h1>
        <p className="text-base font-medium text-slate">
          {experiment.title} {result ? `· ${quizTitle}` : ''}
        </p>
      </header>

      {!result ? (
        /* Empty / Missing Results State */
        <section
          aria-labelledby="no-results-title"
          className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <HelpCircle size={24} aria-hidden="true" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
                Assessment Status
              </span>
              <h2
                id="no-results-title"
                className="text-xl font-semibold text-navy sm:text-2xl"
              >
                No quiz results yet
              </h2>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate">
            There is no score to show because you have not submitted a quiz attempt for{' '}
            <strong className="text-navy">{experiment.title}</strong> yet. Practice quizzes help
            you review the chemistry concepts and laboratory procedures you performed in the virtual lab.
          </p>

          <aside
            aria-label="Upcoming assessment features disclaimer"
            className="rounded-xl border border-teal/20 bg-teal-soft/40 p-4 text-xs leading-relaxed text-ink/80"
          >
            <strong className="font-semibold text-teal-dark">Practice Assessment Notice:</strong>{' '}
            Practice quiz questions are graded immediately in your browser during your active session.
            Durable grade tracking, teacher dashboards, and official completion certificates are coming soon
            in future curriculum updates.
          </aside>

          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <ButtonLink to={paths.quiz} variant="primary">
              Back to Quiz
            </ButtonLink>
            <ButtonLink to={routePaths.experiments} variant="secondary">
              Explore Experiments
            </ButtonLink>
          </div>
        </section>
      ) : (
        /* Populated Results View */
        <div className="space-y-6">
          {/* Main Score & Encouragement Hero Card */}
          <section
            aria-labelledby="hero-results-title"
            className="relative space-y-6 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card sm:p-7 motion-safe:transition-all motion-safe:duration-300"
          >
            {/* Subtle celebration effect for high scores (disabled in prefers-reduced-motion) */}
            <CelebrationEffect active={result.percentage >= 80} />

            {(() => {
              const feedback = getPerformanceFeedback(result.percentage)

              return (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <AchievementIllustration tier={feedback.tier} />

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal">
                        Practice Assessment Completed
                      </span>
                      <h2
                        id="hero-results-title"
                        className="text-2xl font-bold tracking-tight text-navy sm:text-3xl"
                      >
                        {feedback.title}
                      </h2>
                      <p className="text-sm font-semibold text-teal-dark">
                        {feedback.headline}
                      </p>
                      <p className="max-w-xl text-sm leading-relaxed text-slate">
                        {feedback.message}
                      </p>

                      {/* Optional Pass/Fail status ONLY when an approved threshold is explicitly configured */}
                      {result.passStatus !== 'unconfigured' && (
                        <div
                          className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ${
                            result.passStatus === 'passed'
                              ? 'bg-teal-soft text-teal-dark'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          <span>
                            Threshold Status:{' '}
                            {result.passStatus === 'passed' ? 'Passed' : 'Needs Review'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Circular Score Meter */}
                  <div className="flex justify-center sm:justify-end">
                    <ScoreRingMeter
                      score={result.score}
                      maxScore={result.maxScore}
                      percentage={result.percentage}
                    />
                  </div>
                </div>
              )
            })()}

            {/* Score Breakdown Counters Grid */}
            <QuizBreakdownGrid result={result} />

            {/* Educational Practice Notice */}
            <aside
              aria-label="Practice assessment educational notice"
              className="rounded-xl border border-line bg-canvas/70 p-4 text-xs leading-relaxed text-slate transition-all duration-200 hover:border-slate/40"
            >
              <strong className="font-semibold text-navy">Practice Assessment Notice:</strong>{' '}
              This score was calculated in your browser to help you review and practice chemistry
              concepts. It is a formative self-study tool and does not represent an official school
              examination grade.
            </aside>

            {/* Action Navigation Bar */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={handleScrollToReview}
                className="group/btn inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-dark hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
              >
                <ArrowDown size={16} aria-hidden="true" className="transition-transform duration-200 group-hover/btn:translate-y-0.5" />
                <span>Review Answers</span>
              </button>

              <button
                type="button"
                onClick={handleRetake}
                className="group/btn inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-canvas hover:border-slate/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
              >
                <RotateCcw size={16} aria-hidden="true" className="transition-transform duration-300 group-hover/btn:-rotate-90" />
                <span>Try Again</span>
              </button>

              <Link
                to={paths.details}
                className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-canvas hover:border-slate/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
              >
                Back to Experiment
              </Link>

              <Link
                to={routePaths.experiments}
                className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-teal-dark hover:underline hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline-teal"
              >
                Explore Experiments
              </Link>
            </div>
          </section>

          {/* Detailed Question-by-Question Answer Review Section */}
          <QuizResultsAnswerReview feedbackItems={result.questionFeedback} />
        </div>
      )}
    </div>
  )
}

function QuizBreakdownGrid({ result }: { result: AssessmentResultRecord }) {
  const animatedTotal = useAnimatedCounter(result.totalQuestions, 500)
  const animatedCorrect = useAnimatedCounter(result.correctCount, 700)
  const animatedIncorrect = useAnimatedCounter(result.incorrectCount, 700)
  const animatedUnanswered = useAnimatedCounter(result.unansweredCount, 700)

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-4">
      <div className="group rounded-xl border border-line bg-canvas/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-slate/40 hover:bg-white hover:shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">
          Total Questions
        </span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-navy transition-transform duration-200 group-hover:scale-105">
          {animatedTotal}
        </p>
      </div>

      <div className="group rounded-xl border border-teal/30 bg-teal-soft/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-teal/50 hover:bg-teal-soft/60 hover:shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-dark">
          Correct Answers
        </span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-teal-dark transition-transform duration-200 group-hover:scale-105">
          {animatedCorrect}
        </p>
      </div>

      <div className="group rounded-xl border border-rose-200 bg-rose-50/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">
          Incorrect Answers
        </span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-rose-900 transition-transform duration-200 group-hover:scale-105">
          {animatedIncorrect}
        </p>
      </div>

      <div className="group rounded-xl border border-amber-300 bg-amber-50/70 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-amber-400 hover:bg-amber-100/70 hover:shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
          Unanswered
        </span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-amber-900 transition-transform duration-200 group-hover:scale-105">
          {animatedUnanswered}
        </p>
      </div>
    </div>
  )
}

