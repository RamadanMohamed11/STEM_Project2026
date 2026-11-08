export type StudentSecondaryGrade =
  | 'grade-secondary-1'
  | 'grade-secondary-2'
  | 'grade-secondary-3'

export interface AdminStudentExperimentProgress {
  readonly experimentId: string
  readonly experimentTitle: string
  readonly status: 'not-started' | 'in-progress' | 'completed'
  readonly completedStepCount: number
  readonly totalStepCount: number
  readonly labCompletedAt: string | null
  readonly lastActivityAt: string | null
}

export interface AdminStudentQuizAttempt {
  readonly attemptId: string
  readonly experimentId: string
  readonly experimentTitle: string
  readonly assessmentId: string
  readonly score: number
  readonly total: number
  readonly percentage: number
  readonly correctCount: number
  readonly totalQuestions: number
  readonly submittedAt: string
  readonly answers: Record<string, string | null>
}

export interface AdminStudentRecord {
  readonly id: string
  readonly fullName: string
  readonly email: string
  readonly grade: StudentSecondaryGrade
  readonly gradeLabel: string
  readonly registeredAt: string
  readonly experimentsCompletedCount: number
  readonly experimentsInProgressCount: number
  readonly averageQuizScorePercent: number | null
  readonly totalQuizAttemptsCount: number
  readonly lastActivityAt: string | null
  readonly experimentProgress: readonly AdminStudentExperimentProgress[]
  readonly quizAttempts: readonly AdminStudentQuizAttempt[]
}

export interface AdminQuestionPerformance {
  readonly questionId: string
  readonly prompt: string
  readonly totalAnswersCount: number
  readonly incorrectAnswersCount: number
  readonly incorrectPercentage: number
}

export interface AdminExperimentReport {
  readonly experimentId: string
  readonly experimentTitle: string
  readonly grade: string
  readonly term: string
  readonly totalStudentsStarted: number
  readonly totalStudentsCompleted: number
  readonly totalQuizAttempts: number
  readonly averageQuizScorePercent: number | null
  readonly passingRatePercent: number | null
  readonly mostMissedQuestion: {
    readonly questionId: string
    readonly prompt: string
    readonly missedCount: number
    readonly totalAnswersCount: number
    readonly missedPercentage: number
  } | null
  readonly questionsBreakdown: readonly AdminQuestionPerformance[]
}

export interface AdminStudentsState {
  readonly students: readonly AdminStudentRecord[]
  readonly totalCount: number
  readonly lastRefreshedAt: string
}

export interface AdminReportsState {
  readonly reports: readonly AdminExperimentReport[]
  readonly overallAverageScorePercent: number | null
  readonly totalCompletedLabs: number
  readonly totalQuizAttempts: number
  readonly lastRefreshedAt: string
}

export interface StudentDirectoryFilter {
  readonly searchQuery?: string
  readonly gradeFilter?: 'all' | StudentSecondaryGrade
  readonly progressFilter?: 'all' | 'completed' | 'in-progress' | 'not-started'
}

export interface ReportFilter {
  readonly searchQuery?: string
  readonly gradeFilter?: string
  readonly termFilter?: string
}
