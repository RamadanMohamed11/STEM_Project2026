import type {
  CurriculumData,
  Grade,
  LessonExperiment,
  Term,
} from '../../../types/curriculum.ts'
import { sampleCurriculum } from '../data/sampleCurriculum.ts'
import {
  assertCurriculumAdminAccess,
  createCurriculumLesson,
  createCurriculumUnit,
  createInitialAdminCurriculumState,
  deleteCurriculumLesson,
  deleteCurriculumUnit,
  moveCurriculumLessonOrder,
  moveCurriculumUnitOrder,
  reorderCurriculumLessons,
  reorderCurriculumUnits,
  resolveStudentCurriculumDataset,
  setCurriculumLessonPublicationStatus,
  setCurriculumUnitPublicationStatus,
  sortManagedLessons,
  sortManagedUnits,
  updateCurriculumLesson,
  updateCurriculumUnit,
  type AdminCurriculumState,
  type CreateAdminCurriculumSeed,
  type CreateLessonInput,
  type CreateUnitInput,
  type CurriculumAuthCheck,
  type CurriculumMutationResult,
  type CurriculumPublicationStatus,
  type ManagedCurriculumLesson,
  type ManagedCurriculumUnit,
  type UpdateLessonInput,
  type UpdateUnitInput,
} from './curriculumManagement.ts'

export interface CurriculumGradeRow {
  id: string
  slug: string
  stage: 'secondary'
  level: 1 | 2 | 3
  title: string
  description: string
  sort_order: number
}

export interface CurriculumTermRow {
  id: string
  grade_id: string
  slug: string
  term_number: 1 | 2
  title: string
  description: string
  sort_order: number
}

export interface CurriculumUnitRow {
  id: string
  term_id: string
  slug: string
  title: string
  description: string
  sort_order: number
  publication_status: CurriculumPublicationStatus
  created_at?: string
  updated_at?: string
}

export interface CurriculumLessonRow {
  id: string
  unit_id: string
  slug: string
  title: string
  description: string
  sort_order: number
  publication_status: CurriculumPublicationStatus
  created_at?: string
  updated_at?: string
}

export interface CurriculumLessonExperimentRow {
  lesson_id: string
  experiment_id: string
  sort_order: number
  is_primary: boolean
}

export interface SupabaseLikeQueryResult<T> {
  data: T | null
  error: { code?: string; message?: string } | null
}

export interface SupabaseLikeTableClient {
  select: (columns?: string) => PromiseLike<SupabaseLikeQueryResult<unknown[]>> & {
    order?: (
      column: string,
      options?: { ascending?: boolean },
    ) => PromiseLike<SupabaseLikeQueryResult<unknown[]>>
  }
  insert: (values: unknown) => PromiseLike<SupabaseLikeQueryResult<unknown>> & {
    select?: (columns?: string) => {
      single: () => PromiseLike<SupabaseLikeQueryResult<unknown>>
    }
  }
  update: (values: unknown) => {
    eq: (
      column: string,
      value: string,
    ) => PromiseLike<SupabaseLikeQueryResult<unknown>> & {
      select?: (columns?: string) => {
        single: () => PromiseLike<SupabaseLikeQueryResult<unknown>>
      }
    }
  }
  delete: () => {
    eq: (column: string, value: string) => PromiseLike<SupabaseLikeQueryResult<unknown>>
  }
}

export interface SupabaseLikeClient {
  from: (table: string) => SupabaseLikeTableClient
}

export interface CurriculumManagementRepository {
  loadAdminState: (
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<AdminCurriculumState>>
  loadPublishedStudentState: () => Promise<AdminCurriculumState | null>
  createUnit: (
    state: AdminCurriculumState,
    input: CreateUnitInput,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumUnit>>
  updateUnit: (
    state: AdminCurriculumState,
    input: UpdateUnitInput,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumUnit>>
  reorderUnits: (
    state: AdminCurriculumState,
    termId: string,
    orderedUnitIds: readonly string[],
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumUnit[]>>
  moveUnitOrder: (
    state: AdminCurriculumState,
    unitId: string,
    direction: 'up' | 'down',
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumUnit[]>>
  setUnitPublicationStatus: (
    state: AdminCurriculumState,
    unitId: string,
    publicationStatus: CurriculumPublicationStatus,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumUnit>>
  deleteUnit: (
    state: AdminCurriculumState,
    unitId: string,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<{ deletedUnitId: string }>>
  createLesson: (
    state: AdminCurriculumState,
    input: CreateLessonInput,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumLesson>>
  updateLesson: (
    state: AdminCurriculumState,
    input: UpdateLessonInput,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumLesson>>
  reorderLessons: (
    state: AdminCurriculumState,
    unitId: string,
    orderedLessonIds: readonly string[],
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumLesson[]>>
  moveLessonOrder: (
    state: AdminCurriculumState,
    lessonId: string,
    direction: 'up' | 'down',
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumLesson[]>>
  setLessonPublicationStatus: (
    state: AdminCurriculumState,
    lessonId: string,
    publicationStatus: CurriculumPublicationStatus,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<ManagedCurriculumLesson>>
  deleteLesson: (
    state: AdminCurriculumState,
    lessonId: string,
    authState?: CurriculumAuthCheck | null,
  ) => Promise<CurriculumMutationResult<{ deletedLessonId: string }>>
}

export function mapGradeRow(row: CurriculumGradeRow): Grade {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    order: row.sort_order,
  }
}

export function mapTermRow(row: CurriculumTermRow): Term {
  return {
    id: row.id,
    gradeId: row.grade_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    order: row.sort_order,
  }
}

export function mapUnitRow(row: CurriculumUnitRow): ManagedCurriculumUnit {
  return {
    id: row.id,
    termId: row.term_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    order: row.sort_order,
    publicationStatus: row.publication_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLessonRow(row: CurriculumLessonRow): ManagedCurriculumLesson {
  return {
    id: row.id,
    unitId: row.unit_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    order: row.sort_order,
    publicationStatus: row.publication_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLessonExperimentRow(
  row: CurriculumLessonExperimentRow,
): LessonExperiment {
  return {
    lessonId: row.lesson_id,
    experimentId: row.experiment_id,
    order: row.sort_order,
  }
}

/**
 * Shared reactive store for managed curriculum state so AdminCurriculumPage
 * and student pages (`CurriculumPage`, `CurriculumLessonPage`) read from a unified source.
 */
let activeManagedCurriculumState: AdminCurriculumState | null = null
const listeners = new Set<() => void>()

export function getActiveManagedCurriculumState(): AdminCurriculumState | null {
  return activeManagedCurriculumState
}

export function setActiveManagedCurriculumState(
  nextState: AdminCurriculumState | null,
): void {
  activeManagedCurriculumState = nextState
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeManagedCurriculumState(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getActiveStudentCurriculumDataset(
  fallbackSample: CurriculumData = sampleCurriculum,
): { data: CurriculumData; source: 'published' | 'sample' } {
  return resolveStudentCurriculumDataset(activeManagedCurriculumState, fallbackSample)
}

/**
 * Creates a deterministic in-memory curriculum management repository suitable for
 * offline admin workflow, local previews, and automated test suites.
 */
export function createInMemoryCurriculumRepository(
  initialSeed?: CreateAdminCurriculumSeed,
): CurriculumManagementRepository {
  let internalState = createInitialAdminCurriculumState(initialSeed)

  const syncStore = (nextState: AdminCurriculumState) => {
    internalState = nextState
    setActiveManagedCurriculumState(nextState)
  }

  return {
    async loadAdminState(authState) {
      const access = assertCurriculumAdminAccess(authState)
      if (!access.ok) return access
      return {
        ok: true,
        state: internalState,
        data: internalState,
        message: 'Curriculum management state loaded.',
      }
    },

    async loadPublishedStudentState() {
      return internalState
    },

    async createUnit(state, input, authState) {
      const result = createCurriculumUnit(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async updateUnit(state, input, authState) {
      const result = updateCurriculumUnit(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async reorderUnits(state, termId, orderedUnitIds, authState) {
      const result = reorderCurriculumUnits(state, termId, orderedUnitIds, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async moveUnitOrder(state, unitId, direction, authState) {
      const result = moveCurriculumUnitOrder(state, unitId, direction, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async setUnitPublicationStatus(state, unitId, publicationStatus, authState) {
      const result = setCurriculumUnitPublicationStatus(
        state,
        unitId,
        publicationStatus,
        authState,
      )
      if (result.ok) syncStore(result.state)
      return result
    },

    async deleteUnit(state, unitId, authState) {
      const result = deleteCurriculumUnit(state, unitId, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async createLesson(state, input, authState) {
      const result = createCurriculumLesson(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async updateLesson(state, input, authState) {
      const result = updateCurriculumLesson(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async reorderLessons(state, unitId, orderedLessonIds, authState) {
      const result = reorderCurriculumLessons(state, unitId, orderedLessonIds, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async moveLessonOrder(state, lessonId, direction, authState) {
      const result = moveCurriculumLessonOrder(state, lessonId, direction, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async setLessonPublicationStatus(state, lessonId, publicationStatus, authState) {
      const result = setCurriculumLessonPublicationStatus(
        state,
        lessonId,
        publicationStatus,
        authState,
      )
      if (result.ok) syncStore(result.state)
      return result
    },

    async deleteLesson(state, lessonId, authState) {
      const result = deleteCurriculumLesson(state, lessonId, authState)
      if (result.ok) syncStore(result.state)
      return result
    },
  }
}

async function selectTableRows<T>(
  client: SupabaseLikeClient,
  table: string,
  orderColumn: string,
): Promise<SupabaseLikeQueryResult<T[]>> {
  const query = client.from(table).select('*')
  if (typeof query.order === 'function') {
    const ordered = await query.order(orderColumn, { ascending: true })
    return {
      data: (ordered.data as T[] | null) ?? null,
      error: ordered.error,
    }
  }
  const direct = await query
  return {
    data: (direct.data as T[] | null) ?? null,
    error: direct.error,
  }
}

/**
 * Creates a Supabase-backed curriculum management repository that persists all
 * administrative curriculum changes to PostgreSQL while enforcing validation and RLS.
 */
export function createSupabaseCurriculumRepository(
  client: SupabaseLikeClient | null,
): CurriculumManagementRepository {
  const fallbackRepo = createInMemoryCurriculumRepository()
  if (!client) {
    return fallbackRepo
  }

  const syncIfPublishedOrActive = (nextState: AdminCurriculumState) => {
    if (
      activeManagedCurriculumState !== null ||
      nextState.units.some((unit) => unit.publicationStatus === 'published')
    ) {
      setActiveManagedCurriculumState(nextState)
    }
  }

  return {
    async loadAdminState(authState) {
      const access = assertCurriculumAdminAccess(authState)
      if (!access.ok) return access

      try {
        const [gradesRes, termsRes, unitsRes, lessonsRes, linksRes] = await Promise.all([
          selectTableRows<CurriculumGradeRow>(client, 'curriculum_grades', 'sort_order'),
          selectTableRows<CurriculumTermRow>(client, 'curriculum_terms', 'sort_order'),
          selectTableRows<CurriculumUnitRow>(client, 'curriculum_units', 'sort_order'),
          selectTableRows<CurriculumLessonRow>(client, 'curriculum_lessons', 'sort_order'),
          selectTableRows<CurriculumLessonExperimentRow>(
            client,
            'curriculum_lesson_experiments',
            'sort_order',
          ),
        ])

        const firstError =
          gradesRes.error ||
          termsRes.error ||
          unitsRes.error ||
          lessonsRes.error ||
          linksRes.error

        if (firstError) {
          return {
            ok: false,
            code: 'database_error',
            message: firstError.message || 'Unable to load curriculum records from database.',
          }
        }

        const loadedState = createInitialAdminCurriculumState({
          grades:
            gradesRes.data && gradesRes.data.length > 0
              ? gradesRes.data.map(mapGradeRow)
              : sampleCurriculum.grades,
          terms:
            termsRes.data && termsRes.data.length > 0
              ? termsRes.data.map(mapTermRow)
              : sampleCurriculum.terms,
          units: sortManagedUnits((unitsRes.data ?? []).map(mapUnitRow)),
          lessons: sortManagedLessons((lessonsRes.data ?? []).map(mapLessonRow)),
          lessonExperiments: (linksRes.data ?? []).map(mapLessonExperimentRow),
          experiments: sampleCurriculum.experiments,
        })

        syncIfPublishedOrActive(loadedState)

        return {
          ok: true,
          state: loadedState,
          data: loadedState,
          message: 'Curriculum loaded from database.',
        }
      } catch (err) {
        return {
          ok: false,
          code: 'database_error',
          message:
            err instanceof Error
              ? err.message
              : 'Unexpected error while loading curriculum from database.',
        }
      }
    },

    async loadPublishedStudentState() {
      try {
        const [gradesRes, termsRes, unitsRes, lessonsRes, linksRes] = await Promise.all([
          selectTableRows<CurriculumGradeRow>(client, 'curriculum_grades', 'sort_order'),
          selectTableRows<CurriculumTermRow>(client, 'curriculum_terms', 'sort_order'),
          selectTableRows<CurriculumUnitRow>(client, 'curriculum_units', 'sort_order'),
          selectTableRows<CurriculumLessonRow>(client, 'curriculum_lessons', 'sort_order'),
          selectTableRows<CurriculumLessonExperimentRow>(
            client,
            'curriculum_lesson_experiments',
            'sort_order',
          ),
        ])

        if (
          gradesRes.error ||
          termsRes.error ||
          unitsRes.error ||
          lessonsRes.error ||
          linksRes.error
        ) {
          return null
        }

        const units = sortManagedUnits((unitsRes.data ?? []).map(mapUnitRow)).filter(
          (unit) => unit.publicationStatus === 'published',
        )
        if (units.length === 0) {
          return null
        }

        const publishedState = createInitialAdminCurriculumState({
          grades:
            gradesRes.data && gradesRes.data.length > 0
              ? gradesRes.data.map(mapGradeRow)
              : sampleCurriculum.grades,
          terms:
            termsRes.data && termsRes.data.length > 0
              ? termsRes.data.map(mapTermRow)
              : sampleCurriculum.terms,
          units,
          lessons: sortManagedLessons((lessonsRes.data ?? []).map(mapLessonRow)).filter(
            (lesson) => lesson.publicationStatus === 'published',
          ),
          lessonExperiments: (linksRes.data ?? []).map(mapLessonExperimentRow),
          experiments: sampleCurriculum.experiments,
        })

        setActiveManagedCurriculumState(publishedState)
        return publishedState
      } catch {
        return null
      }
    },

    async createUnit(state, input, authState) {
      const validated = createCurriculumUnit(state, input, authState)
      if (!validated.ok) return validated

      const row = {
        id: validated.data.id,
        term_id: validated.data.termId,
        slug: validated.data.slug,
        title: validated.data.title,
        description: validated.data.description,
        sort_order: validated.data.order,
        publication_status: validated.data.publicationStatus,
      }

      const { error } = await client.from('curriculum_units').insert(row)
      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to save new unit in database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async updateUnit(state, input, authState) {
      const validated = updateCurriculumUnit(state, input, authState)
      if (!validated.ok) return validated

      const { error } = await client
        .from('curriculum_units')
        .update({
          term_id: validated.data.termId,
          slug: validated.data.slug,
          title: validated.data.title,
          description: validated.data.description,
          sort_order: validated.data.order,
        })
        .eq('id', validated.data.id)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update unit in database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async reorderUnits(state, termId, orderedUnitIds, authState) {
      const validated = reorderCurriculumUnits(state, termId, orderedUnitIds, authState)
      if (!validated.ok) return validated

      for (const unit of validated.data) {
        const { error } = await client
          .from('curriculum_units')
          .update({ sort_order: unit.order })
          .eq('id', unit.id)
        if (error) {
          return {
            ok: false,
            code: 'database_error',
            message: error.message || 'Failed to persist unit order in database.',
          }
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async moveUnitOrder(state, unitId, direction, authState) {
      const validated = moveCurriculumUnitOrder(state, unitId, direction, authState)
      if (!validated.ok) return validated

      for (const unit of validated.data) {
        const { error } = await client
          .from('curriculum_units')
          .update({ sort_order: unit.order })
          .eq('id', unit.id)
        if (error) {
          return {
            ok: false,
            code: 'database_error',
            message: error.message || 'Failed to persist unit order in database.',
          }
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async setUnitPublicationStatus(state, unitId, publicationStatus, authState) {
      const validated = setCurriculumUnitPublicationStatus(
        state,
        unitId,
        publicationStatus,
        authState,
      )
      if (!validated.ok) return validated

      const { error } = await client
        .from('curriculum_units')
        .update({ publication_status: publicationStatus })
        .eq('id', unitId)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update unit publication status.',
        }
      }

      setActiveManagedCurriculumState(validated.state)
      return validated
    },

    async deleteUnit(state, unitId, authState) {
      const validated = deleteCurriculumUnit(state, unitId, authState)
      if (!validated.ok) return validated

      const { error } = await client.from('curriculum_units').delete().eq('id', unitId)
      if (error) {
        return {
          ok: false,
          code: error.code === '23503' ? 'referenced_record' : 'database_error',
          message:
            error.code === '23503'
              ? 'Cannot delete this unit because lessons still reference it.'
              : error.message || 'Failed to delete unit from database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async createLesson(state, input, authState) {
      const validated = createCurriculumLesson(state, input, authState)
      if (!validated.ok) return validated

      const row = {
        id: validated.data.id,
        unit_id: validated.data.unitId,
        slug: validated.data.slug,
        title: validated.data.title,
        description: validated.data.description,
        sort_order: validated.data.order,
        publication_status: validated.data.publicationStatus,
      }

      const { error } = await client.from('curriculum_lessons').insert(row)
      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to save new lesson in database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async updateLesson(state, input, authState) {
      const validated = updateCurriculumLesson(state, input, authState)
      if (!validated.ok) return validated

      const { error } = await client
        .from('curriculum_lessons')
        .update({
          unit_id: validated.data.unitId,
          slug: validated.data.slug,
          title: validated.data.title,
          description: validated.data.description,
          sort_order: validated.data.order,
        })
        .eq('id', validated.data.id)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update lesson in database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async reorderLessons(state, unitId, orderedLessonIds, authState) {
      const validated = reorderCurriculumLessons(state, unitId, orderedLessonIds, authState)
      if (!validated.ok) return validated

      for (const lesson of validated.data) {
        const { error } = await client
          .from('curriculum_lessons')
          .update({ sort_order: lesson.order })
          .eq('id', lesson.id)
        if (error) {
          return {
            ok: false,
            code: 'database_error',
            message: error.message || 'Failed to persist lesson order in database.',
          }
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async moveLessonOrder(state, lessonId, direction, authState) {
      const validated = moveCurriculumLessonOrder(state, lessonId, direction, authState)
      if (!validated.ok) return validated

      for (const lesson of validated.data) {
        const { error } = await client
          .from('curriculum_lessons')
          .update({ sort_order: lesson.order })
          .eq('id', lesson.id)
        if (error) {
          return {
            ok: false,
            code: 'database_error',
            message: error.message || 'Failed to persist lesson order in database.',
          }
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },

    async setLessonPublicationStatus(state, lessonId, publicationStatus, authState) {
      const validated = setCurriculumLessonPublicationStatus(
        state,
        lessonId,
        publicationStatus,
        authState,
      )
      if (!validated.ok) return validated

      const { error } = await client
        .from('curriculum_lessons')
        .update({ publication_status: publicationStatus })
        .eq('id', lessonId)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update lesson publication status.',
        }
      }

      setActiveManagedCurriculumState(validated.state)
      return validated
    },

    async deleteLesson(state, lessonId, authState) {
      const validated = deleteCurriculumLesson(state, lessonId, authState)
      if (!validated.ok) return validated

      const { error } = await client.from('curriculum_lessons').delete().eq('id', lessonId)
      if (error) {
        return {
          ok: false,
          code: error.code === '23503' ? 'referenced_record' : 'database_error',
          message:
            error.code === '23503'
              ? 'Cannot delete this lesson because experiments still reference it.'
              : error.message || 'Failed to delete lesson from database.',
        }
      }

      syncIfPublishedOrActive(validated.state)
      return validated
    },
  }
}
