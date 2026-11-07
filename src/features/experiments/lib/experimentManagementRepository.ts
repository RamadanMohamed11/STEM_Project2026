import type {
  ExperimentCategory,
  ExperimentDifficulty,
  ExperimentIllustrationKey,
  ExperimentStatus,
  SafetyMetadata,
} from '../../../types/experiment.ts'
import type { SupabaseLikeClient, SupabaseLikeQueryResult } from '../../curriculum/lib/curriculumManagementRepository.ts'
import { mockCategories } from '../data/mockExperiments.ts'
import {
  assertExperimentAdminAccess,
  createInitialAdminExperimentState,
  createManagedExperiment,
  isRegisteredSimulationForExperiment,
  setExperimentPublicationStatus,
  sortManagedExperiments,
  updateManagedExperiment,
  type AdminExperimentState,
  type CreateAdminExperimentSeed,
  type CreateExperimentInput,
  type ExperimentAuthCheck,
  type ExperimentMutationResult,
  type ExperimentPublicationStatus,
  type ExperimentReviewStatus,
  type ManagedExperiment,
  type UpdateExperimentInput,
} from './experimentManagement.ts'

export interface ExperimentCategoryRow {
  id: string
  label: string
  description: string
  sort_order: number
}

export interface ExperimentRow {
  id: string
  slug: string
  title: string
  short_description: string
  category_id: string
  difficulty: ExperimentDifficulty
  estimated_duration_minutes: number
  simulation_status: ExperimentStatus
  simulation_id: string | null
  illustration: ExperimentIllustrationKey
  content_review_status: ExperimentReviewStatus
  publication_status: ExperimentPublicationStatus
  about_paragraphs: string[] | null
  learning_objectives: { id: string; text: string }[] | null
  model_note: string | null
  required_tools: string[] | null
  required_materials: string[] | null
  safety_metadata: SafetyMetadata | null
  safety_review_status: ExperimentReviewStatus
  media_references: string[] | null
  lesson_id: string | null
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface ExperimentManagementRepository {
  loadAdminState: (
    authState?: ExperimentAuthCheck | null,
  ) => Promise<ExperimentMutationResult<AdminExperimentState>>
  loadPublishedStudentState: () => Promise<AdminExperimentState | null>
  createExperiment: (
    state: AdminExperimentState,
    input: CreateExperimentInput,
    authState?: ExperimentAuthCheck | null,
  ) => Promise<ExperimentMutationResult<ManagedExperiment>>
  updateExperiment: (
    state: AdminExperimentState,
    input: UpdateExperimentInput,
    authState?: ExperimentAuthCheck | null,
  ) => Promise<ExperimentMutationResult<ManagedExperiment>>
  setPublicationStatus: (
    state: AdminExperimentState,
    experimentId: string,
    publicationStatus: ExperimentPublicationStatus,
    authState?: ExperimentAuthCheck | null,
  ) => Promise<ExperimentMutationResult<ManagedExperiment>>
}

export function mapExperimentCategoryRow(row: ExperimentCategoryRow): ExperimentCategory {
  return {
    id: row.id,
    label: row.label,
    description: row.description ?? '',
  }
}

export function mapExperimentRow(row: ExperimentRow): ManagedExperiment {
  const hasCompatible3D =
    row.simulation_status === 'demo' &&
    isRegisteredSimulationForExperiment(row.id, row.simulation_id ?? row.id)

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    categoryId: row.category_id,
    difficulty: row.difficulty,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    status: hasCompatible3D ? 'demo' : 'planned',
    simulationId: hasCompatible3D ? row.id : null,
    illustration: row.illustration,
    contentReviewStatus: row.content_review_status,
    publicationStatus: row.publication_status,
    about: Array.isArray(row.about_paragraphs) ? [...row.about_paragraphs] : [],
    objectives: Array.isArray(row.learning_objectives)
      ? row.learning_objectives.map((obj) => ({ id: obj.id, text: obj.text }))
      : [],
    modelNote: row.model_note ?? undefined,
    requiredTools: Array.isArray(row.required_tools) ? [...row.required_tools] : [],
    requiredMaterials: Array.isArray(row.required_materials)
      ? [...row.required_materials]
      : [],
    safety: row.safety_metadata ?? undefined,
    safetyReviewStatus: row.safety_review_status ?? 'draft',
    mediaReferences: Array.isArray(row.media_references)
      ? [...row.media_references]
      : [row.illustration],
    lessonId: row.lesson_id ?? null,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

let activeManagedExperimentState: AdminExperimentState | null = null
const listeners = new Set<() => void>()

export function getActiveManagedExperimentState(): AdminExperimentState | null {
  return activeManagedExperimentState
}

export function setActiveManagedExperimentState(
  nextState: AdminExperimentState | null,
): void {
  activeManagedExperimentState = nextState
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeManagedExperimentState(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function createInMemoryExperimentRepository(
  initialSeed?: CreateAdminExperimentSeed,
): ExperimentManagementRepository {
  let internalState = createInitialAdminExperimentState(initialSeed)

  const syncStore = (nextState: AdminExperimentState) => {
    internalState = nextState
    setActiveManagedExperimentState(nextState)
  }

  return {
    async loadAdminState(authState) {
      const access = assertExperimentAdminAccess(authState)
      if (!access.ok) return access
      return {
        ok: true,
        state: internalState,
        data: internalState,
        message: 'Experiment management state loaded.',
      }
    },

    async loadPublishedStudentState() {
      return internalState
    },

    async createExperiment(state, input, authState) {
      const result = createManagedExperiment(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async updateExperiment(state, input, authState) {
      const result = updateManagedExperiment(state, input, authState)
      if (result.ok) syncStore(result.state)
      return result
    },

    async setPublicationStatus(state, experimentId, publicationStatus, authState) {
      const result = setExperimentPublicationStatus(
        state,
        experimentId,
        publicationStatus,
        authState,
      )
      if (result.ok) syncStore(result.state)
      return result
    },
  }
}

async function selectRows<T>(
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

function toDatabaseRow(exp: ManagedExperiment) {
  return {
    id: exp.id,
    slug: exp.slug,
    title: exp.title,
    short_description: exp.shortDescription,
    category_id: exp.categoryId,
    difficulty: exp.difficulty,
    estimated_duration_minutes: exp.estimatedDurationMinutes,
    simulation_status: exp.status,
    simulation_id: exp.simulationId,
    illustration: exp.illustration,
    content_review_status: exp.contentReviewStatus,
    publication_status: exp.publicationStatus,
    about_paragraphs: exp.about,
    learning_objectives: exp.objectives,
    model_note: exp.modelNote ?? null,
    required_tools: exp.requiredTools,
    required_materials: exp.requiredMaterials,
    safety_metadata: exp.safety ?? null,
    safety_review_status: exp.safetyReviewStatus,
    media_references: exp.mediaReferences,
    lesson_id: exp.lessonId ?? null,
    sort_order: exp.order,
  }
}

export function createSupabaseExperimentRepository(
  client: SupabaseLikeClient | null,
): ExperimentManagementRepository {
  const fallbackRepo = createInMemoryExperimentRepository()
  if (!client) return fallbackRepo

  return {
    async loadAdminState(authState) {
      const access = assertExperimentAdminAccess(authState)
      if (!access.ok) return access

      try {
        const [catRes, expRes] = await Promise.all([
          selectRows<ExperimentCategoryRow>(client, 'experiment_categories', 'sort_order'),
          selectRows<ExperimentRow>(client, 'experiments', 'sort_order'),
        ])

        const firstError = catRes.error || expRes.error
        if (firstError) {
          return {
            ok: false,
            code: 'database_error',
            message: firstError.message || 'Unable to load experiments from database.',
          }
        }

        const loadedState = createInitialAdminExperimentState({
          categories:
            catRes.data && catRes.data.length > 0
              ? catRes.data.map(mapExperimentCategoryRow)
              : mockCategories,
          experiments: sortManagedExperiments((expRes.data ?? []).map(mapExperimentRow)),
        })

        setActiveManagedExperimentState(loadedState)
        return {
          ok: true,
          state: loadedState,
          data: loadedState,
          message: 'Experiment records loaded from database.',
        }
      } catch (err) {
        return {
          ok: false,
          code: 'database_error',
          message:
            err instanceof Error
              ? err.message
              : 'Unexpected error while loading experiments from database.',
        }
      }
    },

    async loadPublishedStudentState() {
      try {
        const [catRes, expRes] = await Promise.all([
          selectRows<ExperimentCategoryRow>(client, 'experiment_categories', 'sort_order'),
          selectRows<ExperimentRow>(client, 'experiments', 'sort_order'),
        ])

        if (catRes.error || expRes.error || !expRes.data || expRes.data.length === 0) {
          return null
        }

        const publishedState = createInitialAdminExperimentState({
          categories:
            catRes.data && catRes.data.length > 0
              ? catRes.data.map(mapExperimentCategoryRow)
              : mockCategories,
          experiments: sortManagedExperiments(expRes.data.map(mapExperimentRow)).filter(
            (exp) => exp.publicationStatus === 'published',
          ),
        })

        setActiveManagedExperimentState(publishedState)
        return publishedState
      } catch {
        return null
      }
    },

    async createExperiment(state, input, authState) {
      const validated = createManagedExperiment(state, input, authState)
      if (!validated.ok) return validated

      const { error } = await client
        .from('experiments')
        .insert(toDatabaseRow(validated.data))

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to save new experiment in database.',
        }
      }

      setActiveManagedExperimentState(validated.state)
      return validated
    },

    async updateExperiment(state, input, authState) {
      const validated = updateManagedExperiment(state, input, authState)
      if (!validated.ok) return validated

      const row = toDatabaseRow(validated.data)
      const { error } = await client
        .from('experiments')
        .update(row)
        .eq('id', validated.data.id)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update experiment in database.',
        }
      }

      setActiveManagedExperimentState(validated.state)
      return validated
    },

    async setPublicationStatus(state, experimentId, publicationStatus, authState) {
      const validated = setExperimentPublicationStatus(
        state,
        experimentId,
        publicationStatus,
        authState,
      )
      if (!validated.ok) return validated

      const { error } = await client
        .from('experiments')
        .update({ publication_status: publicationStatus })
        .eq('id', experimentId)

      if (error) {
        return {
          ok: false,
          code: 'database_error',
          message: error.message || 'Failed to update experiment publication status.',
        }
      }

      setActiveManagedExperimentState(validated.state)
      return validated
    },
  }
}
