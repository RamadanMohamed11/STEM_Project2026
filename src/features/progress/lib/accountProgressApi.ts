import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProgressRow, QuizAttemptRow } from './accountProgress.ts'

/** Network boundary for account progress; injectable so the store can be tested without Supabase. */
export interface AccountProgressApi {
  fetchAll(userId: string): Promise<{ progress: ProgressRow[]; attempts: QuizAttemptRow[] }>
  upsertProgress(rows: readonly ProgressRow[]): Promise<void>
  insertAttempts(rows: readonly QuizAttemptRow[]): Promise<void>
}

const PROGRESS_COLUMNS =
  'user_id, experiment_id, definition_version, status, current_step_id, current_step_index, completed_step_count, total_step_count, lab_completed_at, last_activity_at'
const ATTEMPT_COLUMNS =
  'user_id, attempt_id, experiment_id, assessment_id, assessment_version, score, total, percentage, correct_count, total_questions, answers, submitted_at'

/** Errors are reduced to a generic message; database details never reach the UI. */
export function createSupabaseAccountProgressApi(client: SupabaseClient): AccountProgressApi {
  return {
    async fetchAll(userId) {
      // Filter explicitly by user: admins can read everyone's rows through RLS.
      const [progress, attempts] = await Promise.all([
        client.from('student_experiment_progress').select(PROGRESS_COLUMNS).eq('user_id', userId),
        client
          .from('student_quiz_attempts')
          .select(ATTEMPT_COLUMNS)
          .eq('user_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(200),
      ])
      if (progress.error || attempts.error) throw new Error('account progress load failed')
      return {
        progress: (progress.data ?? []) as ProgressRow[],
        attempts: (attempts.data ?? []) as QuizAttemptRow[],
      }
    },
    async upsertProgress(rows) {
      if (rows.length === 0) return
      const { error } = await client
        .from('student_experiment_progress')
        .upsert([...rows], { onConflict: 'user_id,experiment_id' })
      if (error) throw new Error('account progress save failed')
    },
    async insertAttempts(rows) {
      if (rows.length === 0) return
      // Students have no UPDATE permission on attempts, so duplicates must be ignored, not merged.
      const { error } = await client
        .from('student_quiz_attempts')
        .upsert([...rows], { onConflict: 'user_id,attempt_id', ignoreDuplicates: true })
      if (error) throw new Error('quiz attempt save failed')
    },
  }
}
