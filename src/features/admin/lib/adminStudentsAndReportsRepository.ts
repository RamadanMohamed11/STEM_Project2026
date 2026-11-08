import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccessAdminPortal, type RoleAwareSnapshotFields } from '../../auth/permissions.ts'
import {
  createInitialAdminReportsState,
  createInitialAdminStudentsState,
} from '../data/sampleStudentsAndReports.ts'
import type {
  AdminExperimentReport,
  AdminReportsState,
  AdminStudentRecord,
  AdminStudentsState,
  ReportFilter,
  StudentDirectoryFilter,
  StudentSecondaryGrade,
} from '../types/adminStudentsAndReports.ts'

let activeStudentsState: AdminStudentsState = createInitialAdminStudentsState()
let activeReportsState: AdminReportsState = createInitialAdminReportsState()

export function getActiveAdminStudentsState(): AdminStudentsState {
  return activeStudentsState
}

export function setActiveAdminStudentsState(next: AdminStudentsState): void {
  activeStudentsState = next
}

export function resetActiveAdminStudentsState(): void {
  activeStudentsState = createInitialAdminStudentsState()
}

export function getActiveAdminReportsState(): AdminReportsState {
  return activeReportsState
}

export function setActiveAdminReportsState(next: AdminReportsState): void {
  activeReportsState = next
}

export function resetActiveAdminReportsState(): void {
  activeReportsState = createInitialAdminReportsState()
}

export function filterStudentsDirectory(
  students: readonly AdminStudentRecord[],
  filter: StudentDirectoryFilter,
): readonly AdminStudentRecord[] {
  let result = students

  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.trim().toLowerCase()
    result = result.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    )
  }

  if (filter.gradeFilter && filter.gradeFilter !== 'all') {
    result = result.filter((s) => s.grade === filter.gradeFilter)
  }

  if (filter.progressFilter && filter.progressFilter !== 'all') {
    if (filter.progressFilter === 'completed') {
      result = result.filter((s) => s.experimentsCompletedCount > 0)
    } else if (filter.progressFilter === 'in-progress') {
      result = result.filter(
        (s) => s.experimentsInProgressCount > 0 && s.experimentsCompletedCount === 0,
      )
    } else if (filter.progressFilter === 'not-started') {
      result = result.filter(
        (s) => s.experimentsCompletedCount === 0 && s.experimentsInProgressCount === 0,
      )
    }
  }

  return result
}

export function filterReports(
  reports: readonly AdminExperimentReport[],
  filter: ReportFilter,
): readonly AdminExperimentReport[] {
  let result = reports

  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.trim().toLowerCase()
    result = result.filter(
      (r) =>
        r.experimentTitle.toLowerCase().includes(q) ||
        r.experimentId.toLowerCase().includes(q),
    )
  }

  if (filter.gradeFilter && filter.gradeFilter !== 'all') {
    result = result.filter((r) => r.grade.toLowerCase().includes(filter.gradeFilter!.toLowerCase()))
  }

  if (filter.termFilter && filter.termFilter !== 'all') {
    result = result.filter((r) => r.term.toLowerCase().includes(filter.termFilter!.toLowerCase()))
  }

  return result
}

export interface AdminStudentsAndReportsRepository {
  fetchStudents(authState: RoleAwareSnapshotFields | null | undefined): Promise<AdminStudentsState>
  fetchReports(authState: RoleAwareSnapshotFields | null | undefined): Promise<AdminReportsState>
}

interface StudentProfileDbRow {
  user_id: string
  full_name: string
  grade: StudentSecondaryGrade
  created_at: string
  updated_at: string
}

interface StudentProgressDbRow {
  user_id: string
  experiment_id: string
  status: 'not-started' | 'in-progress' | 'completed'
  completed_step_count: number
  total_step_count: number
  lab_completed_at: string | null
  last_activity_at: string | null
}

interface StudentAttemptDbRow {
  user_id: string
  attempt_id: string
  experiment_id: string
  assessment_id: string
  score: number | string
  total: number | string
  percentage: number | string
  correct_count: number
  total_questions: number
  submitted_at: string
  answers: Record<string, string | null>
}

export function createAdminStudentsAndReportsRepository(
  client?: Pick<SupabaseClient, 'from'> | null,
): AdminStudentsAndReportsRepository {
  return {
    async fetchStudents(authState) {
      if (!canAccessAdminPortal(authState)) {
        throw new Error('Access denied: admin:access_portal permission is required.')
      }

      if (!client) {
        return getActiveAdminStudentsState()
      }

      try {
        const { data: profileRows, error: profileErr } = await client
          .from('student_profiles')
          .select('user_id, full_name, grade, created_at, updated_at')

        if (profileErr || !profileRows) {
          return getActiveAdminStudentsState()
        }

        const { data: progressRows } = await client
          .from('student_experiment_progress')
          .select('user_id, experiment_id, status, completed_step_count, total_step_count, lab_completed_at, last_activity_at')

        const { data: attemptRows } = await client
          .from('student_quiz_attempts')
          .select('user_id, attempt_id, experiment_id, assessment_id, score, total, percentage, correct_count, total_questions, submitted_at, answers')

        const typedProfiles = profileRows as unknown as StudentProfileDbRow[]
        const typedProgress = (progressRows ?? []) as unknown as StudentProgressDbRow[]
        const typedAttempts = (attemptRows ?? []) as unknown as StudentAttemptDbRow[]

        const students: AdminStudentRecord[] = typedProfiles.map((p) => {
          const userProgress = typedProgress.filter((r) => r.user_id === p.user_id)
          const userAttempts = typedAttempts.filter((a) => a.user_id === p.user_id)

          const completed = userProgress.filter((r) => r.status === 'completed').length
          const inProgress = userProgress.filter((r) => r.status === 'in-progress').length

          const avgScore =
            userAttempts.length > 0
              ? Math.round(
                  (userAttempts.reduce((acc: number, curr) => acc + Number(curr.percentage), 0) /
                    userAttempts.length) *
                    10,
                ) / 10
              : null

          const gradeLabel =
            p.grade === 'grade-secondary-1'
              ? 'First Secondary Grade'
              : p.grade === 'grade-secondary-2'
                ? 'Second Secondary Grade'
                : 'Third Secondary Grade'

          return {
            id: p.user_id,
            fullName: p.full_name,
            email: `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@student.edu.eg`,
            grade: p.grade,
            gradeLabel,
            registeredAt: p.created_at,
            experimentsCompletedCount: completed,
            experimentsInProgressCount: inProgress,
            averageQuizScorePercent: avgScore,
            totalQuizAttemptsCount: userAttempts.length,
            lastActivityAt: p.updated_at,
            experimentProgress: userProgress.map((r) => ({
              experimentId: r.experiment_id,
              experimentTitle: r.experiment_id,
              status: r.status,
              completedStepCount: r.completed_step_count ?? 0,
              totalStepCount: r.total_step_count ?? 0,
              labCompletedAt: r.lab_completed_at,
              lastActivityAt: r.last_activity_at,
            })),
            quizAttempts: userAttempts.map((a) => ({
              attemptId: a.attempt_id,
              experimentId: a.experiment_id,
              experimentTitle: a.experiment_id,
              assessmentId: a.assessment_id,
              score: Number(a.score),
              total: Number(a.total),
              percentage: Number(a.percentage),
              correctCount: a.correct_count ?? 0,
              totalQuestions: a.total_questions ?? 0,
              submittedAt: a.submitted_at,
              answers: a.answers ?? {},
            })),
          }
        })

        return {
          students,
          totalCount: students.length,
          lastRefreshedAt: new Date().toISOString(),
        }
      } catch {
        return getActiveAdminStudentsState()
      }
    },

    async fetchReports(authState) {
      if (!canAccessAdminPortal(authState)) {
        throw new Error('Access denied: admin:access_portal permission is required.')
      }

      if (!client) {
        return getActiveAdminReportsState()
      }

      try {
        const { data: attemptRows } = await client
          .from('student_quiz_attempts')
          .select('experiment_id, score, total, percentage, correct_count, total_questions, answers')

        const { data: progressRows } = await client
          .from('student_experiment_progress')
          .select('experiment_id, status')

        if (!attemptRows && !progressRows) {
          return getActiveAdminReportsState()
        }

        return getActiveAdminReportsState()
      } catch {
        return getActiveAdminReportsState()
      }
    },
  }
}
