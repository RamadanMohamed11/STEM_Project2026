import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  FlaskConical,
  HelpCircle,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { routePaths } from '@/app/paths'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { useAuth } from '@/features/auth/authContext'
import {
  createAdminStudentsAndReportsRepository,
  filterReports,
  getActiveAdminReportsState,
  type AdminStudentsAndReportsRepository,
} from '@/features/admin/lib/adminStudentsAndReportsRepository'
import type {
  AdminExperimentReport,
  AdminReportsState,
} from '@/features/admin/types/adminStudentsAndReports'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminReportsPageProps {
  initialState?: AdminReportsState
  repository?: AdminStudentsAndReportsRepository
}

export function AdminReportsPage({
  initialState,
  repository,
}: AdminReportsPageProps) {
  usePageTitle('Reports & Educational Insights · Admin Workspace')
  const { state: authState } = useAuth()

  const activeRepo = useMemo(() => {
    if (repository) return repository
    const client = getSupabaseClient()
    return createAdminStudentsAndReportsRepository(client)
  }, [repository])

  const [state, setState] = useState<AdminReportsState>(
    () => initialState ?? getActiveAdminReportsState(),
  )
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [termFilter, setTermFilter] = useState('all')
  const [selectedReport, setSelectedReport] = useState<AdminExperimentReport | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadData() {
      if (initialState) return
      setLoading(true)
      try {
        const loaded = await activeRepo.fetchReports(authState)
        if (mounted) setState(loaded)
      } catch {
        // Fall back to active state on unauthenticated or offline
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void loadData()
    return () => {
      mounted = false
    }
  }, [activeRepo, authState, initialState])

  // Close modal on Escape
  useEffect(() => {
    if (!selectedReport) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedReport(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedReport])

  const filteredReports = useMemo(() => {
    return filterReports(state.reports, {
      searchQuery,
      gradeFilter,
      termFilter,
    })
  }, [state.reports, searchQuery, gradeFilter, termFilter])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalReports = state.reports.length
    const totalCompleted = state.totalCompletedLabs
    const totalAttempts = state.totalQuizAttempts
    const avgScore = state.overallAverageScorePercent

    return {
      totalReports,
      totalCompleted,
      totalAttempts,
      avgScore,
    }
  }, [state])

  return (
    <div className="space-y-6 py-6 sm:py-8">
      <PageHeader
        eyebrow="Educational Insights"
        title="Reports Management Workspace"
        description="Inspect aggregated experiment completion trends, assessment performance scores, and question difficulty rates across the secondary chemistry curriculum."
        action={
          <div className="flex items-center gap-2.5">
            <ButtonLink to={routePaths.admin} variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </ButtonLink>
          </div>
        }
      />

      {/* Aggregate Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <FlaskConical className="h-4 w-4 text-teal-dark" aria-hidden="true" />
            <span>Completed Labs</span>
          </div>
          <p className="text-2xl font-bold text-navy">{summaryMetrics.totalCompleted}</p>
          <span className="text-[11px] text-slate">Verified student completions</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <FileText className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <span>Quiz Attempts</span>
          </div>
          <p className="text-2xl font-bold text-navy">{summaryMetrics.totalAttempts}</p>
          <span className="text-[11px] text-slate">Practice submissions</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Average Score</span>
          </div>
          <p className="text-2xl font-bold text-navy">
            {summaryMetrics.avgScore !== null ? `${summaryMetrics.avgScore}%` : '—'}
          </p>
          <span className="text-[11px] text-slate">Across evaluated assessments</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <BookOpen className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>Tracked Experiments</span>
          </div>
          <p className="text-2xl font-bold text-navy">{summaryMetrics.totalReports}</p>
          <span className="text-[11px] text-slate">With recorded student data</span>
        </Card>
      </div>

      {/* Main Reports Table Card */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-soft text-teal-dark">
              <BarChart3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-navy">Experiment Performance Reports</h2>
              <p className="text-xs text-slate">
                Showing {filteredReports.length} of {state.reports.length} experiment reports {loading ? '(refreshing...)' : '· Read-only educational analytics'}
              </p>
            </div>
          </div>

          <StatusPill tone="ready" dot>
            <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
            Aggregated Analytics
          </StatusPill>
        </div>

        {/* Filters Bar */}
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6 lg:col-span-6">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by experiment title or ID..."
              aria-label="Search reports by experiment title"
              className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-xs text-navy placeholder:text-slate focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            />
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              aria-label="Filter reports by secondary grade"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-navy focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="all">All Grades</option>
              <option value="Grade 1">Grade 1 Secondary</option>
              <option value="Grade 2">Grade 2 Secondary</option>
              <option value="Grade 3">Grade 3 Secondary</option>
            </select>
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              aria-label="Filter reports by academic term"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-navy focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="all">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        {filteredReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-8 text-center">
            <BarChart3 className="mx-auto size-8 text-slate" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-bold text-navy">No experiment reports found</h3>
            <p className="mt-1 text-xs text-slate">
              Try adjusting your search criteria or clearing filters.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setGradeFilter('all')
                  setTermFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-canvas/80 font-semibold text-slate">
                <tr>
                  <th scope="col" className="px-4 py-3">Experiment</th>
                  <th scope="col" className="px-4 py-3">Academic Context</th>
                  <th scope="col" className="px-4 py-3 text-center">Attempts</th>
                  <th scope="col" className="px-4 py-3 text-center">Avg Score</th>
                  <th scope="col" className="px-4 py-3">Most-Missed Question</th>
                  <th scope="col" className="px-4 py-3 text-right">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredReports.map((report) => {
                  return (
                    <tr
                      key={report.experimentId}
                      className="transition-colors hover:bg-canvas/50"
                    >
                      <td className="px-4 py-3.5">
                        <span className="block font-semibold text-navy">
                          {report.experimentTitle}
                        </span>
                        <span className="block text-[10px] font-mono text-slate">
                          {report.experimentId}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block w-fit rounded bg-canvas px-2 py-0.5 text-[10px] font-semibold text-navy border border-line">
                            {report.grade}
                          </span>
                          <span className="text-[10px] text-slate">
                            {report.term}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="font-semibold text-navy">
                          {report.totalQuizAttempts}
                        </span>
                        <span className="block text-[10px] text-slate">
                          ({report.totalStudentsCompleted} completed)
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {report.averageQuizScorePercent !== null ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                report.averageQuizScorePercent >= 80
                                  ? 'bg-teal-soft text-teal-dark'
                                  : report.averageQuizScorePercent >= 60
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-red-50 text-red-800'
                              }`}
                            >
                              {report.averageQuizScorePercent}%
                            </span>
                            {/* CSS Progress Bar */}
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
                              <div
                                className="h-full bg-teal"
                                style={{ width: `${Math.min(report.averageQuizScorePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        {report.mostMissedQuestion ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-700">
                              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                              <span className="font-bold text-[11px]">
                                {report.mostMissedQuestion.missedPercentage}% missed
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-slate" title={report.mostMissedQuestion.prompt}>
                              {report.mostMissedQuestion.prompt}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            No difficult questions
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          aria-label={`View question breakdown for ${report.experimentTitle}`}
                          className="text-xs"
                        >
                          <HelpCircle className="mr-1 inline size-3.5" aria-hidden="true" />
                          Questions
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Question Breakdown Modal */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-dark">
                  Assessment Question Analysis
                </span>
                <h3 id="report-modal-title" className="text-lg font-bold text-navy">
                  {selectedReport.experimentTitle}
                </h3>
                <p className="text-xs text-slate">
                  {selectedReport.grade} · {selectedReport.term} · {selectedReport.totalQuizAttempts} total attempts
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="Close question analysis"
                className="rounded-lg p-1.5 text-slate hover:bg-canvas hover:text-navy focus:outline-teal"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Questions List */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">
                Question Difficulty & Error Rates
              </h4>

              {selectedReport.questionsBreakdown.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate">
                  No individual question telemetry recorded for this assessment.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedReport.questionsBreakdown.map((q, idx) => {
                    const isHighError = q.incorrectPercentage >= 40
                    return (
                      <div
                        key={q.questionId}
                        className={`rounded-xl border p-3.5 text-xs transition-colors ${
                          isHighError
                            ? 'border-amber-200 bg-amber-50/40'
                            : 'border-line bg-canvas/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="font-bold text-navy">
                              Question {idx + 1}
                            </span>
                            <p className="text-slate leading-relaxed">
                              {q.prompt}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isHighError
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {q.incorrectPercentage}% Missed
                            </span>
                            <span className="block text-[10px] text-slate mt-0.5">
                              {q.incorrectAnswersCount} of {q.totalAnswersCount} incorrect
                            </span>
                          </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line/80">
                          <div
                            className={`h-full ${isHighError ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(q.incorrectPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end border-t border-line pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
