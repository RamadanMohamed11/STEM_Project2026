import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FlaskConical,
  HardDrive,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { getExperimentPaths, routePaths } from '@/app/paths'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import {
  clearStudentProgress,
  useStudentProgressOverview,
} from '@/features/progress/state/studentProgressStore'
import { restartExperimentSession } from '@/features/simulations/state/sessionActions'
import type { ExperimentProgressOverviewItem } from '@/types/progress'
import { usePageTitle } from '@/hooks/usePageTitle'

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'No activity recorded yet'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Recent session'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StepProgressBar({
  completedSteps,
  totalSteps,
  experimentTitle,
}: {
  completedSteps: number
  totalSteps: number
  experimentTitle: string
}) {
  const safeTotal = Math.max(1, totalSteps)
  const percent = Math.min(100, Math.max(0, Math.round((completedSteps / safeTotal) * 100)))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
        <span>
          Validated steps: {completedSteps} / {totalSteps}
        </span>
        <span className="font-mono font-semibold text-ink">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${experimentTitle} validated step progress`}
        aria-valuenow={completedSteps}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-teal transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function ExperimentProgressCard({ item }: { item: ExperimentProgressOverviewItem }) {
  const { experiment, isExecutable, progress, resumeMode } = item
  const paths = getExperimentPaths(experiment.id)

  const statusBadge = () => {
    if (!isExecutable) {
      return (
        <StatusPill tone="neutral" dot>
          Planned (Not Counted)
        </StatusPill>
      )
    }
    if (progress.experimentStatus === 'completed') {
      return (
        <StatusPill tone="ready" dot>
          Completed
        </StatusPill>
      )
    }
    if (progress.experimentStatus === 'in-progress') {
      return (
        <StatusPill tone="info" dot>
          In Progress
        </StatusPill>
      )
    }
    return <StatusPill tone="neutral">Not Started</StatusPill>
  }

  return (
    <Card padding="md" className="flex flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-ink">{experiment.title}</h3>
            <p className="mt-1 text-sm text-ink-secondary">{experiment.shortDescription}</p>
          </div>
          {statusBadge()}
        </div>

        {isExecutable ? (
          <StepProgressBar
            completedSteps={progress.completedStepCount}
            totalSteps={progress.totalStepCount}
            experimentTitle={experiment.title}
          />
        ) : (
          <p className="rounded-lg border border-line bg-surface-muted/70 px-3 py-2 text-xs text-ink-secondary">
            This curriculum experiment is planned for a future release and is never counted as a
            completed activity.
          </p>
        )}

        {isExecutable && progress.latestQuizResult && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal/25 bg-teal-soft/40 px-3 py-2 text-xs text-ink">
            <span className="font-semibold">
              Latest Quiz Score: {progress.latestQuizResult.correctCount} /{' '}
              {progress.latestQuizResult.totalQuestions} ({progress.latestQuizResult.percentage}%)
            </span>
            <span className="text-ink-secondary">
              {formatTimestamp(progress.latestQuizResult.submittedAt)}
            </span>
          </div>
        )}

        {isExecutable &&
          progress.experimentStatus === 'in-progress' &&
          resumeMode === 'restart-required' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
              Saved step progress was loaded from local browser storage, but 3D apparatus positions
              are held in active tab memory only. Use{' '}
              <span className="font-semibold">Restart Experiment</span> to begin a clean 3D session
              from Step 1.
            </p>
          )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-xs text-ink-muted">
          {progress.lastActivityAt
            ? `Last activity: ${formatTimestamp(progress.lastActivityAt)}`
            : 'No activity recorded yet'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink to={paths.details} variant="secondary" size="sm">
            Experiment Details
          </ButtonLink>

          {isExecutable && progress.experimentStatus === 'in-progress' && (
            <>
              {resumeMode === 'continue-live-session' ? (
                <ButtonLink to={paths.laboratory} variant="primary" size="sm">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Continue
                </ButtonLink>
              ) : (
                <ButtonLink
                  to={paths.laboratory}
                  variant="primary"
                  size="sm"
                  onClick={() => restartExperimentSession()}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Restart Experiment
                </ButtonLink>
              )}
            </>
          )}

          {isExecutable && progress.experimentStatus === 'completed' && (
            <>
              <ButtonLink to={paths.experimentResults} variant="secondary" size="sm">
                View Results
              </ButtonLink>
              <ButtonLink
                to={paths.laboratory}
                variant="primary"
                size="sm"
                onClick={() => restartExperimentSession()}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </ButtonLink>
            </>
          )}

          {isExecutable && progress.experimentStatus === 'not-started' && (
            <ButtonLink to={paths.laboratory} variant="primary" size="sm">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Start Experiment
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  )
}

export function StudentProgressPage() {
  usePageTitle('My Progress')
  const overview = useStudentProgressOverview()
  const hasAnyRecordedProgress =
    overview.startedCount > 0 ||
    overview.completedCount > 0 ||
    overview.quizCompletedCount > 0 ||
    overview.recentActivities.length > 0

  return (
    <PageContainer>
      <div className="space-y-8 py-6 sm:py-8">
        <PageHeader
          eyebrow="Learning Tracker"
          title="My Progress"
          description="Review your validated 3D chemistry laboratory steps, completed experiments, and latest practice quiz scores on this device."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              <ButtonLink to={routePaths.experiments} variant="secondary" size="sm">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Browse Experiments
              </ButtonLink>
              {hasAnyRecordedProgress && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => clearStudentProgress()}
                  aria-label="Clear Local Progress"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Clear Local Progress
                </Button>
              )}
            </div>
          }
        />

      {!overview.storageHealthy && (
        <Card
          padding="md"
          className="border-amber-300 bg-amber-50/90 text-amber-950"
          role="status"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Browser storage is currently unavailable</p>
              <p className="text-amber-900">
                Your progress is being tracked in temporary tab memory for this session, but it will
                not persist after closing or refreshing the browser tab.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Metrics */}
      <section aria-label="Progress summary metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="space-y-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Available Experiments</span>
            <FlaskConical className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{overview.executableCount}</p>
          <p className="text-xs text-ink-secondary">
            {overview.executableCount} interactive 3D lab ready ({overview.plannedCount} planned in
            catalog)
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Started Experiments</span>
            <Clock className="h-4 w-4 text-cyan" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{overview.startedCount}</p>
          <p className="text-xs text-ink-secondary">
            Experiments currently in progress with validated steps
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Completed Experiments</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{overview.completedCount}</p>
          <p className="text-xs text-ink-secondary">
            Verified by completing all scientific simulation steps
          </p>
        </Card>

        <Card padding="md" className="space-y-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-ink-muted uppercase">
            <span>Quiz Results</span>
            <Award className="h-4 w-4 text-teal" aria-hidden="true" />
          </div>
          <p className="text-2xl font-extrabold text-ink">{overview.quizCompletedCount}</p>
          <p className="text-xs text-ink-secondary">
            Submitted post-experiment practice assessments
          </p>
        </Card>
      </section>

      {/* Continue Learning Section */}
      <section aria-labelledby="continue-learning-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="continue-learning-heading" className="text-lg font-bold text-ink">
              Continue Learning
            </h2>
            <p className="text-sm text-ink-secondary">
              Pick up an active laboratory session or start a fresh 3D chemistry run.
            </p>
          </div>
        </div>

        {overview.continueLearningItems.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {overview.continueLearningItems.map((item) => {
              const paths = getExperimentPaths(item.experiment.id)
              const isLive = item.resumeMode === 'continue-live-session'
              return (
                <Card
                  key={item.experiment.id}
                  padding="md"
                  className="border-teal/35 bg-gradient-to-br from-white to-teal-soft/30"
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold tracking-wider text-teal uppercase">
                          Active Experiment
                        </span>
                        <h3 className="mt-0.5 text-base font-bold text-ink">
                          {item.experiment.title}
                        </h3>
                      </div>
                      <StatusPill tone="info" dot>
                        {isLive ? 'Live 3D Session Active' : 'Saved Step Progress'}
                      </StatusPill>
                    </div>

                    <StepProgressBar
                      completedSteps={item.progress.completedStepCount}
                      totalSteps={item.progress.totalStepCount}
                      experimentTitle={item.experiment.title}
                    />

                    {isLive ? (
                      <p className="text-xs text-ink-secondary">
                        Your 3D laboratory workbench is still active in this browser tab. You can
                        continue right where you left off.
                      </p>
                    ) : (
                      <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                        You completed {item.progress.completedStepCount} of{' '}
                        {item.progress.totalStepCount} steps earlier, but refreshing the page clears
                        in-memory 3D equipment positions. Use{' '}
                        <span className="font-semibold">Restart Experiment</span> to begin a fresh
                        3D laboratory session honestly.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ButtonLink to={paths.details} variant="secondary" size="sm">
                        Experiment Details
                      </ButtonLink>
                      {isLive ? (
                        <ButtonLink to={paths.laboratory} variant="primary" size="sm">
                          <Play className="h-4 w-4" aria-hidden="true" />
                          Continue
                        </ButtonLink>
                      ) : (
                        <ButtonLink
                          to={paths.laboratory}
                          variant="primary"
                          size="sm"
                          onClick={() => restartExperimentSession()}
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Restart Experiment
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card padding="md" className="bg-surface-muted/40">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">
                  No experiments are currently in progress
                </p>
                <p className="text-xs text-ink-secondary">
                  Start an interactive 3D chemistry experiment and acknowledge safety to begin
                  tracking validated steps.
                </p>
              </div>
              <ButtonLink
                to={getExperimentPaths('exp-salt-water-001').laboratory}
                variant="primary"
                size="sm"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Start Dissolving Salt Lab
              </ButtonLink>
            </div>
          </Card>
        )}
      </section>

      {/* Completed Experiments & Quiz Results Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completed Experiments */}
        <section aria-labelledby="completed-experiments-heading" className="space-y-3">
          <div>
            <h2 id="completed-experiments-heading" className="text-lg font-bold text-ink">
              Completed Experiments
            </h2>
            <p className="text-sm text-ink-secondary">
              Experiments where all scientific steps were validated in the 3D laboratory.
            </p>
          </div>

          {overview.completedExperimentItems.length > 0 ? (
            <div className="space-y-3">
              {overview.completedExperimentItems.map((item) => {
                const paths = getExperimentPaths(item.experiment.id)
                return (
                  <Card key={item.experiment.id} padding="md" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-ink">{item.experiment.title}</h3>
                        <p className="text-xs text-ink-secondary">
                          Completed {item.progress.completedStepCount} /{' '}
                          {item.progress.totalStepCount} validated steps ·{' '}
                          {formatTimestamp(item.progress.experimentCompletedAt)}
                        </p>
                      </div>
                      <StatusPill tone="ready" dot>
                        Completed
                      </StatusPill>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ButtonLink to={paths.experimentResults} variant="secondary" size="sm">
                        Experiment Results
                      </ButtonLink>
                      <ButtonLink to={paths.quiz} variant="secondary" size="sm">
                        Take Quiz
                      </ButtonLink>
                      <ButtonLink
                        to={paths.laboratory}
                        variant="primary"
                        size="sm"
                        onClick={() => restartExperimentSession()}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Try Again
                      </ButtonLink>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card padding="md" className="bg-surface-muted/40">
              <p className="text-sm font-medium text-ink">No completed experiments yet</p>
              <p className="mt-1 text-xs text-ink-secondary">
                Complete all validated steps in the 3D laboratory to earn a completed experiment
                record. Planned experiments are never counted as completed.
              </p>
            </Card>
          )}
        </section>

        {/* Quiz Results */}
        <section aria-labelledby="quiz-results-heading" className="space-y-3">
          <div>
            <h2 id="quiz-results-heading" className="text-lg font-bold text-ink">
              Quiz Results
            </h2>
            <p className="text-sm text-ink-secondary">
              Latest practice quiz scores recorded from your submitted assessments.
            </p>
          </div>

          {overview.quizResultItems.length > 0 ? (
            <div className="space-y-3">
              {overview.quizResultItems.map((item) => {
                const quiz = item.progress.latestQuizResult!
                const paths = getExperimentPaths(item.experiment.id)
                return (
                  <Card key={item.experiment.id} padding="md" className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-ink">{item.experiment.title}</h3>
                        <p className="text-xs text-ink-secondary">
                          Submitted {formatTimestamp(quiz.submittedAt)} · Assessment v
                          {quiz.assessmentVersion}
                        </p>
                      </div>
                      <StatusPill tone="ready">
                        {quiz.percentage}% ({quiz.correctCount} / {quiz.totalQuestions} Correct)
                      </StatusPill>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface-muted/50 p-2.5 text-center text-xs">
                      <div>
                        <span className="block text-ink-muted">Score</span>
                        <span className="font-bold text-ink">
                          {quiz.score} / {quiz.maxScore}
                        </span>
                      </div>
                      <div>
                        <span className="block text-ink-muted">Correct Answers</span>
                        <span className="font-bold text-ink">
                          {quiz.correctCount} of {quiz.totalQuestions}
                        </span>
                      </div>
                      <div>
                        <span className="block text-ink-muted">Percentage</span>
                        <span className="font-bold text-teal">{quiz.percentage}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ButtonLink to={paths.results} variant="secondary" size="sm">
                        View Detailed Feedback
                      </ButtonLink>
                      <ButtonLink to={paths.quiz} variant="primary" size="sm">
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Try Again
                      </ButtonLink>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card padding="md" className="bg-surface-muted/40">
              <p className="text-sm font-medium text-ink">No quiz attempts submitted yet</p>
              <p className="mt-1 text-xs text-ink-secondary">
                Submit a post-experiment multiple-choice quiz to see your real score, percentage,
                and correct answer count here.
              </p>
            </Card>
          )}
        </section>
      </div>

      {/* All Catalog Experiments Breakdown */}
      <section aria-labelledby="all-experiments-progress-heading" className="space-y-4">
        <div>
          <h2 id="all-experiments-progress-heading" className="text-lg font-bold text-ink">
            All Experiments Status
          </h2>
          <p className="text-sm text-ink-secondary">
            Step-by-step progress across available and planned chemistry experiments.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {overview.items.map((item) => (
            <ExperimentProgressCard key={item.experiment.id} item={item} />
          ))}
        </div>
      </section>

      {/* Recent Activity Timeline */}
      <section aria-labelledby="recent-activity-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-teal" aria-hidden="true" />
          <h2 id="recent-activity-heading" className="text-lg font-bold text-ink">
            Recent Activity
          </h2>
        </div>

        {overview.recentActivities.length > 0 ? (
          <Card padding="md">
            <ul className="divide-y divide-line">
              {overview.recentActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex flex-col justify-between gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {activity.label} ·{' '}
                      <span className="font-normal text-ink-secondary">
                        {activity.experimentTitle}
                      </span>
                    </p>
                    <p className="text-xs text-ink-secondary">{activity.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-ink-muted">
                    {formatTimestamp(activity.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card padding="md" className="bg-surface-muted/40">
            <p className="text-sm text-ink-secondary">
              No recent activity recorded on this device yet. Your validated laboratory milestones
              and submitted quiz results will appear here automatically.
            </p>
          </Card>
        )}
      </section>

        {/* Local Device Scope & Shared Computer Privacy Notice */}
        <Card padding="md" className="border-line bg-surface-muted/50">
          <div className="flex items-start gap-3">
            <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
            <div className="space-y-1 text-xs text-ink-secondary">
              <p className="font-semibold text-ink">
                Local Device Progress Storage (Scope: {overview.scope})
              </p>
              <p>
                Progress shown on this page is stored locally in this web browser so you can track
                your chemistry practice without requiring a backend database. On a shared school or
                library computer, use <span className="font-semibold">Clear Local Progress</span>{' '}
                when you finish your session.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
