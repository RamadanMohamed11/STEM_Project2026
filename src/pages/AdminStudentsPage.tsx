import { FocusDialog } from '@/components/ui/FocusDialog'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Award,
  BookOpen,
  Eye,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
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
  filterStudentsDirectory,
  getActiveAdminStudentsState,
  type AdminStudentsAndReportsRepository,
} from '@/features/admin/lib/adminStudentsAndReportsRepository'
import type {
  AdminStudentRecord,
  AdminStudentsState,
  StudentSecondaryGrade,
} from '@/features/admin/types/adminStudentsAndReports'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface AdminStudentsPageProps {
  initialState?: AdminStudentsState
  repository?: AdminStudentsAndReportsRepository
}

export function AdminStudentsPage({
  initialState,
  repository,
}: AdminStudentsPageProps) {
  usePageTitle('Students Directory · Admin Workspace')
  const { state: authState } = useAuth()

  const activeRepo = useMemo(() => {
    if (repository) return repository
    const client = getSupabaseClient()
    return createAdminStudentsAndReportsRepository(client)
  }, [repository])

  const [state, setState] = useState<AdminStudentsState>(
    () => initialState ?? getActiveAdminStudentsState(),
  )
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState<'all' | StudentSecondaryGrade>('all')
  const [progressFilter, setProgressFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all')
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentRecord | null>(null)
  const [detailTab, setDetailTab] = useState<'labs' | 'quizzes'>('labs')

  useEffect(() => {
    let mounted = true
    async function loadData() {
      if (initialState) return
      setLoading(true)
      try {
        const loaded = await activeRepo.fetchStudents(authState)
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

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedStudent) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedStudent(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStudent])

  const filteredStudents = useMemo(() => {
    return filterStudentsDirectory(state.students, {
      searchQuery,
      gradeFilter,
      progressFilter,
    })
  }, [state.students, searchQuery, gradeFilter, progressFilter])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = state.students.length
    const activeLearners = state.students.filter((s) => s.experimentsCompletedCount > 0).length
    const validScores = state.students
      .map((s) => s.averageQuizScorePercent)
      .filter((score): score is number => typeof score === 'number')
    const overallAvgScore =
      validScores.length > 0
        ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
        : null
    const totalAttempts = state.students.reduce((acc, s) => acc + s.totalQuizAttemptsCount, 0)

    return {
      total,
      activeLearners,
      overallAvgScore,
      totalAttempts,
    }
  }, [state.students])

  return (
    <div className="space-y-6 py-6 sm:py-8">
      <PageHeader
        eyebrow="Directory & Roles"
        title="Students Management Workspace"
        description="Inspect registered student accounts, track completed 3D experiments, and review practice assessment performance under strict Row Level Security."
        action={
          <div className="flex items-center gap-2.5">
            <ButtonLink to={routePaths.admin} variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </ButtonLink>
          </div>
        }
      />

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <Users className="h-4 w-4 text-teal-dark" aria-hidden="true" />
            <span>Total Students</span>
          </div>
          <p className="text-2xl font-bold text-navy">{metrics.total}</p>
          <span className="text-[11px] text-slate">Registered directory accounts</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <GraduationCap className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Active Learners</span>
          </div>
          <p className="text-2xl font-bold text-navy">{metrics.activeLearners}</p>
          <span className="text-[11px] text-slate">Completed ≥ 1 laboratory</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>Average Quiz Score</span>
          </div>
          <p className="text-2xl font-bold text-navy">
            {metrics.overallAvgScore !== null ? `${metrics.overallAvgScore}%` : '—'}
          </p>
          <span className="text-[11px] text-slate">Across practice attempts</span>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate">
            <BookOpen className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <span>Total Attempts</span>
          </div>
          <p className="text-2xl font-bold text-navy">{metrics.totalAttempts}</p>
          <span className="text-[11px] text-slate">Submitted quiz evaluations</span>
        </Card>
      </div>

      {/* Main Student Directory Workspace */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-teal-soft text-teal-dark">
              <Users className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-bold text-navy">Student Accounts Directory</h2>
              <p className="text-xs text-slate">
                Showing {filteredStudents.length} of {state.students.length} students {loading ? '(refreshing...)' : '· Read-only audit access'}
              </p>
            </div>
          </div>

          <StatusPill tone="ready" dot>
            <ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />
            RLS Protected Read-Only
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
              placeholder="Search by student name, email, or account ID..."
              aria-label="Search students by name or email"
              className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-xs text-navy placeholder:text-slate focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            />
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as 'all' | StudentSecondaryGrade)}
              aria-label="Filter students by secondary grade"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-navy focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="all">All Secondary Grades</option>
              <option value="grade-secondary-1">First Secondary Grade</option>
              <option value="grade-secondary-2">Second Secondary Grade</option>
              <option value="grade-secondary-3">Third Secondary Grade</option>
            </select>
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              value={progressFilter}
              onChange={(e) =>
                setProgressFilter(
                  e.target.value as 'all' | 'completed' | 'in-progress' | 'not-started',
                )
              }
              aria-label="Filter students by laboratory progress"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-navy focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
            >
              <option value="all">All Progress Levels</option>
              <option value="completed">Completed ≥ 1 Experiment</option>
              <option value="in-progress">In-Progress Only</option>
              <option value="not-started">Not Started Yet</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        {filteredStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-8 text-center">
            <Users className="mx-auto size-8 text-slate" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-bold text-navy">No students match your criteria</h3>
            <p className="mt-1 text-xs text-slate">
              Try modifying your search query or clearing the selected grade and progress filters.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setGradeFilter('all')
                  setProgressFilter('all')
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
                  <th scope="col" className="px-4 py-3">Student Name</th>
                  <th scope="col" className="px-4 py-3">Email Address</th>
                  <th scope="col" className="px-4 py-3">Academic Grade</th>
                  <th scope="col" className="px-4 py-3 text-center">Labs Completed</th>
                  <th scope="col" className="px-4 py-3 text-center">Average Score</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredStudents.map((student) => {
                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-canvas/50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-soft text-xs font-bold text-teal-dark">
                            {student.fullName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <span className="block font-semibold text-navy">
                              {student.fullName}
                            </span>
                            <span className="block text-[10px] text-slate font-mono">
                              {student.id.slice(0, 15)}…
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate">
                        {student.email}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-md bg-canvas px-2.5 py-0.5 text-[11px] font-semibold text-navy border border-line">
                          {student.gradeLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            student.experimentsCompletedCount > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-canvas text-slate border border-line'
                          }`}
                        >
                          {student.experimentsCompletedCount} Completed
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {student.averageQuizScorePercent !== null ? (
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              student.averageQuizScorePercent >= 80
                                ? 'bg-teal-soft text-teal-dark'
                                : student.averageQuizScorePercent >= 60
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {student.averageQuizScorePercent}%
                          </span>
                        ) : (
                          <span className="text-slate">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            setDetailTab('labs')
                          }}
                          aria-label={`View academic record for ${student.fullName}`}
                          className="text-xs"
                        >
                          <Eye className="mr-1 inline size-3.5" aria-hidden="true" />
                          View Details
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

      {/* Student Detail Modal / Drawer */}
      {selectedStudent && (
        <FocusDialog onClose={() => setSelectedStudent(null)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-soft text-lg font-bold text-teal-dark">
                  {selectedStudent.fullName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h2 id="student-detail-title" className="text-lg font-bold text-navy">
                    {selectedStudent.fullName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate">
                    <span>{selectedStudent.email}</span>
                    <span>·</span>
                    <span className="font-semibold text-teal-dark">{selectedStudent.gradeLabel}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
                className="rounded-lg p-1.5 text-slate hover:bg-canvas hover:text-navy focus:outline-teal"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex items-center gap-2 border-b border-line pb-2">
              <button
                type="button"
                onClick={() => setDetailTab('labs')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  detailTab === 'labs'
                    ? 'bg-teal-soft text-teal-dark'
                    : 'text-slate hover:bg-canvas hover:text-navy'
                }`}
              >
                Laboratory Progress ({selectedStudent.experimentProgress.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('quizzes')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  detailTab === 'quizzes'
                    ? 'bg-teal-soft text-teal-dark'
                    : 'text-slate hover:bg-canvas hover:text-navy'
                }`}
              >
                Quiz Practice History ({selectedStudent.quizAttempts.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {detailTab === 'labs' ? (
                selectedStudent.experimentProgress.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate">
                    This student has not started any virtual laboratory experiments yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-line bg-canvas/70 font-semibold text-slate">
                        <tr>
                          <th className="px-3 py-2.5">Experiment</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5 text-center">Steps Progress</th>
                          <th className="px-3 py-2.5 text-right">Completion Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {selectedStudent.experimentProgress.map((exp) => (
                          <tr key={exp.experimentId} className="hover:bg-canvas/40">
                            <td className="px-3 py-2.5 font-medium text-navy">
                              {exp.experimentTitle}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {exp.status === 'completed' ? (
                                <StatusPill tone="ready" dot>Completed</StatusPill>
                              ) : exp.status === 'in-progress' ? (
                                <StatusPill tone="warning" dot>In Progress</StatusPill>
                              ) : (
                                <StatusPill tone="neutral" dot>Not Started</StatusPill>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-medium text-slate">
                              {exp.completedStepCount} / {exp.totalStepCount} steps
                            </td>
                            <td className="px-3 py-2.5 text-right text-slate">
                              {exp.labCompletedAt
                                ? new Date(exp.labCompletedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                selectedStudent.quizAttempts.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate">
                    This student has not submitted any quiz assessments yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-line bg-canvas/70 font-semibold text-slate">
                        <tr>
                          <th className="px-3 py-2.5">Experiment Assessment</th>
                          <th className="px-3 py-2.5 text-center">Score</th>
                          <th className="px-3 py-2.5 text-center">Percentage</th>
                          <th className="px-3 py-2.5 text-right">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {selectedStudent.quizAttempts.map((att) => (
                          <tr key={att.attemptId} className="hover:bg-canvas/40">
                            <td className="px-3 py-2.5 font-medium text-navy">
                              {att.experimentTitle}
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-navy">
                              {att.score} / {att.total}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  att.percentage >= 80
                                    ? 'bg-teal-soft text-teal-dark'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {att.percentage}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-slate">
                              {new Date(att.submittedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end border-t border-line pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
        </FocusDialog>
      )}
    </div>
  )
}
