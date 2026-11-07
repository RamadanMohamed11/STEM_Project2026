import type {
  AssessmentAvailabilityStatus,
  AssessmentContentReviewStatus,
  AssessmentOrderingMode,
  ExperimentAssessmentDefinition,
  MultipleChoiceQuestion,
  PassingScoreConfiguration,
  QuestionOption,
} from '../../../types/assessment.ts'
import type { ExperimentDifficulty } from '../../../types/experiment.ts'
import type { SupabaseLikeClient } from '../../curriculum/lib/curriculumManagementRepository.ts'
import { assessmentCatalog } from '../data/assessmentCatalog.ts'
import {
  addQuestionToAssessmentInBank,
  assertQuestionBankAdminAccess,
  createAssessmentInBank,
  createInitialAdminQuestionBankState,
  reorderQuestionInAssessmentInBank,
  setAssessmentPublicationStatusInBank,
  toStudentAssessmentCatalog,
  updateAssessmentMetadataInBank,
  updateQuestionInAssessmentInBank,
  type AdminQuestionBankState,
  type AssessmentPublicationStatus,
  type AssessmentVersionSnapshot,
  type CreateAssessmentInput,
  type ManagedAssessmentRecord,
  type QuestionBankAuthCheck,
  type QuestionBankMutationResult,
  type QuestionEditorInput,
  type UpdateAssessmentInput,
} from './questionBankManagement.ts'

export interface ExperimentAssessmentRow {
  id: string
  experiment_id: string
  title: string
  description: string
  version: string
  publication_status: AssessmentPublicationStatus
  availability_status: AssessmentAvailabilityStatus
  review_status: AssessmentContentReviewStatus
  question_ordering: AssessmentOrderingMode
  passing_score: PassingScoreConfiguration | null
  is_practice_assessment: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface AssessmentQuestionRow {
  id: string
  assessment_id: string
  experiment_id: string
  sort_order: number
  prompt: string
  options: QuestionOption[] | null
  correct_option_id: string
  explanation: string
  difficulty: ExperimentDifficulty
  learning_objective_id: string | null
  created_at?: string
  updated_at?: string
}

export interface AssessmentVersionSnapshotRow {
  id: string
  assessment_id: string
  version: string
  snapshot: ExperimentAssessmentDefinition
  created_at: string
}

let activeManagedQuestionBankState: AdminQuestionBankState | null = null
const listeners = new Set<() => void>()

export function getActiveManagedQuestionBankState(): AdminQuestionBankState | null {
  return activeManagedQuestionBankState
}

export function setActiveManagedQuestionBankState(
  state: AdminQuestionBankState | null,
): void {
  activeManagedQuestionBankState = state
  for (const listener of listeners) {
    listener()
  }
}

export function resetManagedQuestionBankStateForTests(): void {
  setActiveManagedQuestionBankState(null)
}

export function subscribeManagedQuestionBankState(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Returns the student-visible assessment catalog.
 * - When a managed question bank state has been loaded, returns only published assessments
 *   from that state (hiding draft, reviewed, and archived assessments).
 * - Otherwise falls back to the static repository `assessmentCatalog`.
 */
export function getActiveStudentAssessmentCatalog(): readonly ExperimentAssessmentDefinition[] {
  if (!activeManagedQuestionBankState) {
    return assessmentCatalog
  }
  return toStudentAssessmentCatalog(activeManagedQuestionBankState)
}

export function mapQuestionRow(row: AssessmentQuestionRow): MultipleChoiceQuestion {
  const options: QuestionOption[] = Array.isArray(row.options)
    ? row.options.map((opt, idx) => ({
        id: opt.id,
        text: opt.text,
        order:
          typeof opt.order === 'number' && Number.isSafeInteger(opt.order)
            ? opt.order
            : idx + 1,
      }))
    : []

  return {
    id: row.id,
    experimentId: row.experiment_id,
    version: '1.0.0',
    order: row.sort_order,
    prompt: row.prompt,
    options,
    correctOptionId: row.correct_option_id,
    explanation: row.explanation,
    difficulty: row.difficulty ?? 'beginner',
    reviewStatus: 'draft',
    ...(row.learning_objective_id
      ? { learningObjectiveId: row.learning_objective_id }
      : {}),
  }
}

export function mapAssessmentRecordFromRows(
  row: ExperimentAssessmentRow,
  questionRows: readonly AssessmentQuestionRow[],
  snapshotRows: readonly AssessmentVersionSnapshotRow[] = [],
): ManagedAssessmentRecord {
  const questions = [...questionRows]
    .filter((q) => q.assessment_id === row.id)
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map(mapQuestionRow)

  const versionHistory: AssessmentVersionSnapshot[] = [...snapshotRows]
    .filter((snap) => snap.assessment_id === row.id && snap.snapshot)
    .map((snap) => ({
      version: snap.version,
      savedAt: snap.created_at,
      assessment: snap.snapshot,
    }))

  const definition: ExperimentAssessmentDefinition = {
    id: row.id,
    experimentId: row.experiment_id,
    title: row.title,
    description: row.description,
    scopeDisclaimer:
      'Formative post-experiment practice quiz for student concept review. Not an official high-stakes examination.',
    version: row.version,
    availabilityStatus: row.availability_status,
    reviewStatus: row.review_status,
    questionOrdering: row.question_ordering ?? 'ordered-by-field',
    passingScore: row.passing_score ?? {
      status: 'unconfigured-draft',
      note: 'Passing score thresholds are not enforced for practice review content.',
    },
    allowMultipleAttempts: true,
    questions,
  }

  return {
    id: row.id,
    experimentId: row.experiment_id,
    publicationStatus: row.publication_status,
    isPracticeAssessment: row.is_practice_assessment ?? true,
    sortOrder: row.sort_order ?? 1,
    assessment: definition,
    versionHistory,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toAssessmentDatabaseRow(
  record: ManagedAssessmentRecord,
): Omit<ExperimentAssessmentRow, 'created_at' | 'updated_at'> {
  return {
    id: record.id,
    experiment_id: record.experimentId,
    title: record.assessment.title,
    description: record.assessment.description,
    version: record.assessment.version,
    publication_status: record.publicationStatus,
    availability_status: record.assessment.availabilityStatus,
    review_status: record.assessment.reviewStatus,
    question_ordering: record.assessment.questionOrdering,
    passing_score: record.assessment.passingScore,
    is_practice_assessment: record.isPracticeAssessment,
    sort_order: record.sortOrder,
  }
}

export function toQuestionDatabaseRow(
  assessmentId: string,
  question: MultipleChoiceQuestion,
): Omit<AssessmentQuestionRow, 'created_at' | 'updated_at'> {
  return {
    id: question.id,
    assessment_id: assessmentId,
    experiment_id: question.experimentId,
    sort_order: question.order,
    prompt: question.prompt,
    options: question.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      order: opt.order,
    })),
    correct_option_id: question.correctOptionId,
    explanation: question.explanation,
    difficulty: question.difficulty ?? 'beginner',
    learning_objective_id: question.learningObjectiveId ?? null,
  }
}

async function selectOrderedRows<TRow>(
  client: SupabaseLikeClient,
  table: string,
  orderColumn: string,
): Promise<{ data: TRow[] | null; error: { message: string } | null }> {
  const query = client.from(table).select('*')
  if (typeof query.order === 'function') {
    return (await query.order(orderColumn, { ascending: true })) as {
      data: TRow[] | null
      error: { message: string } | null
    }
  }
  return (await query) as {
    data: TRow[] | null
    error: { message: string } | null
  }
}

export interface QuestionBankRepository {
  loadAdminState: (
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<QuestionBankMutationResult<AdminQuestionBankState>>
  loadPublishedStudentCatalog: () => Promise<
    readonly ExperimentAssessmentDefinition[] | null
  >
  createAssessment: (
    state: AdminQuestionBankState,
    input: CreateAssessmentInput,
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<QuestionBankMutationResult<ManagedAssessmentRecord>>
  updateAssessmentMetadata: (
    state: AdminQuestionBankState,
    input: UpdateAssessmentInput,
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<QuestionBankMutationResult<ManagedAssessmentRecord>>
  addQuestion: (
    state: AdminQuestionBankState,
    assessmentId: string,
    questionInput: QuestionEditorInput,
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<
    QuestionBankMutationResult<{
      record: ManagedAssessmentRecord
      question: MultipleChoiceQuestion
    }>
  >
  updateQuestion: (
    state: AdminQuestionBankState,
    assessmentId: string,
    questionId: string,
    questionInput: QuestionEditorInput,
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<
    QuestionBankMutationResult<{
      record: ManagedAssessmentRecord
      question: MultipleChoiceQuestion
    }>
  >
  reorderQuestion: (
    state: AdminQuestionBankState,
    assessmentId: string,
    questionId: string,
    direction: 'up' | 'down',
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<QuestionBankMutationResult<ManagedAssessmentRecord>>
  setPublicationStatus: (
    state: AdminQuestionBankState,
    assessmentId: string,
    nextStatus: AssessmentPublicationStatus,
    authState?: QuestionBankAuthCheck | null,
  ) => Promise<QuestionBankMutationResult<ManagedAssessmentRecord>>
}

export function createQuestionBankRepository(
  client: SupabaseLikeClient | null,
): QuestionBankRepository {
  async function persistVersionSnapshotsIfNeeded(
    record: ManagedAssessmentRecord,
  ): Promise<void> {
    if (!client || record.versionHistory.length === 0) return
    const latest = record.versionHistory[record.versionHistory.length - 1]
    if (!latest) return
    try {
      await client.from('assessment_version_snapshots').insert({
        assessment_id: record.id,
        version: latest.version,
        snapshot: latest.assessment,
      })
    } catch {
      // Ignore duplicate snapshot insert if already recorded
    }
  }

  return {
    async loadAdminState(authState) {
      const access = assertQuestionBankAdminAccess(authState)
      if (!access.ok) return access

      if (!client) {
        const fallback =
          getActiveManagedQuestionBankState() ?? createInitialAdminQuestionBankState()
        setActiveManagedQuestionBankState(fallback)
        return {
          ok: true,
          data: fallback,
          state: fallback,
        }
      }

      try {
        const [assessRes, questRes, snapRes] = await Promise.all([
          selectOrderedRows<ExperimentAssessmentRow>(
            client,
            'experiment_assessments',
            'sort_order',
          ),
          selectOrderedRows<AssessmentQuestionRow>(
            client,
            'assessment_questions',
            'sort_order',
          ),
          selectOrderedRows<AssessmentVersionSnapshotRow>(
            client,
            'assessment_version_snapshots',
            'created_at',
          ),
        ])

        if (
          assessRes.error ||
          questRes.error ||
          !assessRes.data ||
          assessRes.data.length === 0
        ) {
          const fallback =
            getActiveManagedQuestionBankState() ?? createInitialAdminQuestionBankState()
          setActiveManagedQuestionBankState(fallback)
          return {
            ok: true,
            data: fallback,
            state: fallback,
          }
        }

        const records = assessRes.data.map((row) =>
          mapAssessmentRecordFromRows(row, questRes.data ?? [], snapRes.data ?? []),
        )

        const loadedState: AdminQuestionBankState = {
          assessments: records,
        }
        setActiveManagedQuestionBankState(loadedState)
        return {
          ok: true,
          data: loadedState,
          state: loadedState,
        }
      } catch {
        const fallback =
          getActiveManagedQuestionBankState() ?? createInitialAdminQuestionBankState()
        setActiveManagedQuestionBankState(fallback)
        return {
          ok: true,
          data: fallback,
          state: fallback,
        }
      }
    },

    async loadPublishedStudentCatalog() {
      if (!client) {
        return getActiveStudentAssessmentCatalog()
      }

      try {
        const [assessRes, questRes] = await Promise.all([
          selectOrderedRows<ExperimentAssessmentRow>(
            client,
            'experiment_assessments',
            'sort_order',
          ),
          selectOrderedRows<AssessmentQuestionRow>(
            client,
            'assessment_questions',
            'sort_order',
          ),
        ])

        if (
          assessRes.error ||
          questRes.error ||
          !assessRes.data ||
          assessRes.data.length === 0
        ) {
          return null
        }

        const records = assessRes.data
          .filter((row) => row.publication_status === 'published')
          .map((row) => mapAssessmentRecordFromRows(row, questRes.data ?? []))

        const publishedState: AdminQuestionBankState = {
          assessments: records,
        }
        setActiveManagedQuestionBankState(publishedState)
        return toStudentAssessmentCatalog(publishedState)
      } catch {
        return null
      }
    },

    async createAssessment(state, input, authState) {
      const result = createAssessmentInBank(state, input, authState)
      if (!result.ok) return result

      if (client) {
        const { error } = await client
          .from('experiment_assessments')
          .insert(toAssessmentDatabaseRow(result.data))
        if (error) {
          return {
            ok: false,
            code: 'validation_error',
            message: error.message || 'Failed to save new assessment in database.',
          }
        }

        for (const question of result.data.assessment.questions) {
          await client
            .from('assessment_questions')
            .insert(toQuestionDatabaseRow(result.data.id, question))
        }
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },

    async updateAssessmentMetadata(state, input, authState) {
      const result = updateAssessmentMetadataInBank(state, input, authState)
      if (!result.ok) return result

      if (client) {
        await client
          .from('experiment_assessments')
          .update(toAssessmentDatabaseRow(result.data))
          .eq('id', result.data.id)
        await persistVersionSnapshotsIfNeeded(result.data)
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },

    async addQuestion(state, assessmentId, questionInput, authState) {
      const result = addQuestionToAssessmentInBank(
        state,
        assessmentId,
        questionInput,
        authState,
      )
      if (!result.ok) return result

      if (client) {
        await client
          .from('assessment_questions')
          .insert(toQuestionDatabaseRow(assessmentId, result.data.question))
        await client
          .from('experiment_assessments')
          .update(toAssessmentDatabaseRow(result.data.record))
          .eq('id', assessmentId)
        await persistVersionSnapshotsIfNeeded(result.data.record)
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },

    async updateQuestion(state, assessmentId, questionId, questionInput, authState) {
      const result = updateQuestionInAssessmentInBank(
        state,
        assessmentId,
        questionId,
        questionInput,
        authState,
      )
      if (!result.ok) return result

      if (client) {
        await client
          .from('assessment_questions')
          .update(toQuestionDatabaseRow(assessmentId, result.data.question))
          .eq('id', questionId)
        await client
          .from('experiment_assessments')
          .update(toAssessmentDatabaseRow(result.data.record))
          .eq('id', assessmentId)
        await persistVersionSnapshotsIfNeeded(result.data.record)
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },

    async reorderQuestion(state, assessmentId, questionId, direction, authState) {
      const result = reorderQuestionInAssessmentInBank(
        state,
        assessmentId,
        questionId,
        direction,
        authState,
      )
      if (!result.ok) return result

      if (client) {
        for (const q of result.data.assessment.questions) {
          await client
            .from('assessment_questions')
            .update({ sort_order: q.order })
            .eq('id', q.id)
        }
        await client
          .from('experiment_assessments')
          .update(toAssessmentDatabaseRow(result.data))
          .eq('id', assessmentId)
        await persistVersionSnapshotsIfNeeded(result.data)
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },

    async setPublicationStatus(state, assessmentId, nextStatus, authState) {
      const result = setAssessmentPublicationStatusInBank(
        state,
        assessmentId,
        nextStatus,
        authState,
      )
      if (!result.ok) return result

      if (client) {
        await client
          .from('experiment_assessments')
          .update(toAssessmentDatabaseRow(result.data))
          .eq('id', assessmentId)
        await persistVersionSnapshotsIfNeeded(result.data)
      }

      setActiveManagedQuestionBankState(result.state)
      return result
    },
  }
}
