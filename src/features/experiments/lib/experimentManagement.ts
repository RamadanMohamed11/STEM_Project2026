import type {
  Experiment,
  ExperimentCategory,
  ExperimentDifficulty,
  ExperimentIllustrationKey,
  ExperimentStatus,
  SafetyMetadata,
} from '../../../types/experiment.ts'
import type { CurriculumData } from '../../../types/curriculum.ts'
import type { AuthSnapshot } from '../../auth/authService.ts'
import { hasPermission } from '../../auth/permissions.ts'
import { sampleCurriculum } from '../../curriculum/data/sampleCurriculum.ts'
import { saltExperimentDefinition } from '../../simulations/data/saltExperimentDefinition.ts'
import { resolveSimulation } from '../../simulations/lib/simulationRegistry.ts'
import { saltDissolutionToolsAndMaterials } from '../data/experimentToolsAndMaterials.ts'
import { mockCategories, mockExperiments } from '../data/mockExperiments.ts'
import type { CatalogData } from './catalogSelectors.ts'

export type ExperimentPublicationStatus = 'draft' | 'published' | 'archived'
export type ExperimentReviewStatus = 'draft' | 'reviewed'
export type ExperimentAuthCheck = Pick<
  AuthSnapshot,
  'status' | 'role' | 'roleStatus' | 'permissions'
>

export interface RegisteredSimulationDescriptor {
  readonly simulationId: string
  readonly experimentId: string
  readonly chemistryEngine: string
  readonly label: string
}

export interface ManagedExperiment {
  id: string
  slug: string
  title: string
  shortDescription: string
  categoryId: string
  difficulty: ExperimentDifficulty
  estimatedDurationMinutes: number
  status: ExperimentStatus
  simulationId: string | null
  illustration: ExperimentIllustrationKey
  contentReviewStatus: ExperimentReviewStatus
  publicationStatus: ExperimentPublicationStatus
  about: string[]
  objectives: { id: string; text: string }[]
  modelNote?: string
  requiredTools: string[]
  requiredMaterials: string[]
  safety?: SafetyMetadata
  safetyReviewStatus: ExperimentReviewStatus
  mediaReferences: string[]
  lessonId?: string | null
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface AdminExperimentState {
  categories: ExperimentCategory[]
  experiments: ManagedExperiment[]
}

export interface CreateExperimentInput {
  id?: string
  slug?: string
  title: string
  shortDescription: string
  categoryId: string
  difficulty?: ExperimentDifficulty
  estimatedDurationMinutes?: number
  status?: ExperimentStatus
  simulationId?: string | null
  illustration?: ExperimentIllustrationKey
  contentReviewStatus?: ExperimentReviewStatus
  publicationStatus?: ExperimentPublicationStatus
  about?: readonly string[]
  objectives?: readonly { id?: string; text: string }[]
  modelNote?: string
  requiredTools?: readonly string[]
  requiredMaterials?: readonly string[]
  safety?: SafetyMetadata
  safetyReviewStatus?: ExperimentReviewStatus
  mediaReferences?: readonly string[]
  lessonId?: string | null
  order?: number
}

export interface UpdateExperimentInput {
  experimentId: string
  slug?: string
  title?: string
  shortDescription?: string
  categoryId?: string
  difficulty?: ExperimentDifficulty
  estimatedDurationMinutes?: number
  status?: ExperimentStatus
  simulationId?: string | null
  illustration?: ExperimentIllustrationKey
  contentReviewStatus?: ExperimentReviewStatus
  about?: readonly string[]
  objectives?: readonly { id?: string; text: string }[]
  modelNote?: string | null
  requiredTools?: readonly string[]
  requiredMaterials?: readonly string[]
  safety?: SafetyMetadata | null
  safetyReviewStatus?: ExperimentReviewStatus
  mediaReferences?: readonly string[]
  lessonId?: string | null
  order?: number
}

export type ExperimentMutationErrorCode =
  | 'unauthorized'
  | 'validation_error'
  | 'not_found'
  | 'duplicate_slug'
  | 'duplicate_id'
  | 'unregistered_simulation'
  | 'incomplete_content'
  | 'database_error'

export type ExperimentMutationResult<T = AdminExperimentState> =
  | {
      ok: true
      state: AdminExperimentState
      data: T
      message: string
    }
  | {
      ok: false
      code: ExperimentMutationErrorCode
      message: string
    }

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_DIFFICULTIES: readonly ExperimentDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
]
const ALLOWED_ILLUSTRATIONS: readonly ExperimentIllustrationKey[] = [
  'salt-dissolution',
  'liquid-volume',
  'ph-indicators',
]
const UNSAFE_MEDIA_OR_CODE_PATTERN = /(<script|javascript:|data:text\/html|on\w+\s*=|eval\s*\()/i

/**
 * Validated registry of supported 3D laboratory simulations.
 * Arbitrary JavaScript or untrusted Three.js uploads are strictly prohibited.
 */
const REGISTERED_SIMULATIONS: readonly RegisteredSimulationDescriptor[] = [
  {
    simulationId: saltExperimentDefinition.experimentId,
    experimentId: saltExperimentDefinition.experimentId,
    chemistryEngine: saltExperimentDefinition.chemistryEngine,
    label: 'Salt Dissolution 3D Workbench (exp-salt-water-001)',
  },
]

export function getRegisteredSimulationCatalog(): readonly RegisteredSimulationDescriptor[] {
  return REGISTERED_SIMULATIONS
}

export function normalizeExperimentSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Checks whether an experiment ID and optional simulation ID correspond to a real,
 * registered 3D simulation definition in `simulationRegistry`.
 */
export function isRegisteredSimulationForExperiment(
  experimentId: string,
  simulationId?: string | null,
): boolean {
  const candidateId = simulationId ?? experimentId
  if (!candidateId || candidateId !== experimentId) return false
  if (!REGISTERED_SIMULATIONS.some((entry) => entry.simulationId === candidateId)) {
    return false
  }
  const probe: Experiment = {
    id: experimentId,
    slug: 'probe',
    title: 'Probe',
    shortDescription: 'Probe',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 10,
    status: 'demo',
    illustration: 'salt-dissolution',
  }
  return Boolean(resolveSimulation(probe))
}

export function assertExperimentAdminAccess(
  authState?: ExperimentAuthCheck | null,
): { ok: true } | { ok: false; code: 'unauthorized'; message: string } {
  if (
    !authState ||
    authState.status !== 'authenticated' ||
    authState.role !== 'admin' ||
    authState.roleStatus !== 'verified' ||
    !hasPermission(authState, 'admin:manage_content')
  ) {
    return {
      ok: false,
      code: 'unauthorized',
      message:
        'Access denied: Verified administrator role with admin:manage_content permission is required.',
    }
  }
  return { ok: true }
}

export function sortManagedExperiments(
  experiments: readonly ManagedExperiment[],
): ManagedExperiment[] {
  return [...experiments].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  )
}

function defaultSeedExperiments(): ManagedExperiment[] {
  return mockExperiments.map((exp, index) => {
    const isSalt = exp.id === 'exp-salt-water-001'
    const isVolume = exp.id === 'exp-volume-002'
    const has3D = isRegisteredSimulationForExperiment(exp.id, exp.id) && exp.status === 'demo'
    return {
      id: exp.id,
      slug: exp.slug,
      title: exp.title,
      shortDescription: exp.shortDescription,
      categoryId: exp.categoryId,
      difficulty: exp.difficulty,
      estimatedDurationMinutes: exp.estimatedDurationMinutes,
      status: has3D ? 'demo' : 'planned',
      simulationId: has3D ? exp.id : null,
      illustration: exp.illustration,
      contentReviewStatus: exp.learning?.reviewStatus ?? 'draft',
      publicationStatus: 'published',
      about: [...(exp.learning?.about ?? [])],
      objectives: (exp.learning?.objectives ?? []).map((obj) => ({ ...obj })),
      modelNote: exp.learning?.modelNote,
      requiredTools: isSalt
        ? saltDissolutionToolsAndMaterials.tools.map((tool) => tool.name)
        : isVolume
          ? ['Graduated Cylinder']
          : [],
      requiredMaterials: isSalt
        ? saltDissolutionToolsAndMaterials.materials.map(
            (mat) => `${mat.name}${mat.formula ? ` (${mat.formula})` : ''}`,
          )
        : isVolume
          ? ['Water (H₂O)']
          : [],
      safety: exp.safety
        ? {
            ...exp.safety,
            recommendedPpe: exp.safety.recommendedPpe
              ? [...exp.safety.recommendedPpe]
              : undefined,
          }
        : undefined,
      safetyReviewStatus: 'draft',
      mediaReferences: [exp.illustration],
      lessonId: exp.curriculum?.lessonId ?? null,
      order: index + 1,
    }
  })
}

export interface CreateAdminExperimentSeed {
  categories?: readonly ExperimentCategory[]
  experiments?: readonly ManagedExperiment[]
}

export function createInitialAdminExperimentState(
  seed?: CreateAdminExperimentSeed,
): AdminExperimentState {
  return {
    categories: (seed?.categories ?? mockCategories).map((cat) => ({ ...cat })),
    experiments: sortManagedExperiments(
      (seed?.experiments ?? defaultSeedExperiments()).map((exp) => ({
        ...exp,
        about: [...exp.about],
        objectives: exp.objectives.map((obj) => ({ ...obj })),
        requiredTools: [...exp.requiredTools],
        requiredMaterials: [...exp.requiredMaterials],
        mediaReferences: [...exp.mediaReferences],
        safety: exp.safety
          ? {
              ...exp.safety,
              recommendedPpe: exp.safety.recommendedPpe
                ? [...exp.safety.recommendedPpe]
                : undefined,
            }
          : undefined,
      })),
    ),
  }
}

function sanitizeStringList(items: readonly string[] | undefined): {
  ok: true
  values: string[]
} | {
  ok: false
  message: string
} {
  if (!items) return { ok: true, values: [] }
  const cleaned: string[] = []
  for (const raw of items) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (UNSAFE_MEDIA_OR_CODE_PATTERN.test(trimmed)) {
      return {
        ok: false,
        message: 'Executable code or untrusted script content is not permitted in experiment metadata.',
      }
    }
    cleaned.push(trimmed)
  }
  return { ok: true, values: cleaned }
}

function sanitizeObjectives(
  experimentSlug: string,
  objectives: readonly { id?: string; text: string }[] | undefined,
): { ok: true; values: { id: string; text: string }[] } | { ok: false; message: string } {
  if (!objectives) return { ok: true, values: [] }
  const result: { id: string; text: string }[] = []
  const seenIds = new Set<string>()
  for (let i = 0; i < objectives.length; i += 1) {
    const raw = objectives[i]
    const text = raw?.text?.trim() ?? ''
    if (!text) continue
    if (UNSAFE_MEDIA_OR_CODE_PATTERN.test(text)) {
      return {
        ok: false,
        message: 'Executable code is not permitted in learning objectives.',
      }
    }
    const baseId =
      raw.id?.trim() ||
      `${experimentSlug}-obj-${i + 1}`
    const uniqueId = seenIds.has(baseId) ? `${baseId}-${i + 1}` : baseId
    seenIds.add(uniqueId)
    result.push({ id: uniqueId, text })
  }
  return { ok: true, values: result }
}

/**
 * Creates a new experiment metadata record.
 * Defaults to `'draft'` publication status and `'planned'` simulation status (`3D Lab Not Available`)
 * unless explicitly linked to a compatible registered simulation.
 */
export function createManagedExperiment(
  state: AdminExperimentState,
  input: CreateExperimentInput,
  authState?: ExperimentAuthCheck | null,
): ExperimentMutationResult<ManagedExperiment> {
  const access = assertExperimentAdminAccess(authState)
  if (!access.ok) return access

  const title = input.title?.trim() ?? ''
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment title is required and must be between 2 and 160 characters.',
    }
  }

  const shortDescription = input.shortDescription?.trim() ?? ''
  if (shortDescription.length < 5 || shortDescription.length > 600) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Short description is required and must be between 5 and 600 characters.',
    }
  }

  const categoryId = input.categoryId?.trim() ?? ''
  if (!state.categories.some((cat) => cat.id === categoryId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Category "${categoryId || 'empty'}" does not exist.`,
    }
  }

  const difficulty: ExperimentDifficulty = input.difficulty ?? 'beginner'
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid difficulty "${String(difficulty)}".`,
    }
  }

  const estimatedDurationMinutes = input.estimatedDurationMinutes ?? 15
  if (
    !Number.isInteger(estimatedDurationMinutes) ||
    estimatedDurationMinutes < 1 ||
    estimatedDurationMinutes > 240
  ) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Estimated duration must be a whole number between 1 and 240 minutes.',
    }
  }

  const illustration: ExperimentIllustrationKey = input.illustration ?? 'salt-dissolution'
  if (!ALLOWED_ILLUSTRATIONS.includes(illustration)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid illustration key "${String(illustration)}".`,
    }
  }

  const slug = normalizeExperimentSlug(input.slug?.trim() ? input.slug : title)
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  if (state.experiments.some((exp) => exp.slug === slug)) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `An experiment with slug "${slug}" already exists.`,
    }
  }

  const id = input.id?.trim() || `exp-${slug}`
  if (state.experiments.some((exp) => exp.id === id)) {
    return {
      ok: false,
      code: 'duplicate_id',
      message: `An experiment with ID "${id}" already exists.`,
    }
  }

  const requestedStatus: ExperimentStatus = input.status ?? 'planned'
  const requestedSimulationId =
    input.simulationId !== undefined
      ? input.simulationId
      : requestedStatus === 'demo'
        ? id
        : null

  if (requestedStatus === 'demo' || requestedSimulationId !== null) {
    if (!isRegisteredSimulationForExperiment(id, requestedSimulationId)) {
      return {
        ok: false,
        code: 'unregistered_simulation',
        message:
          'Cannot mark 3D Lab Available because no registered 3D simulation definition exists for this experiment ID.',
      }
    }
  }

  const aboutCheck = sanitizeStringList(input.about)
  if (!aboutCheck.ok) {
    return { ok: false, code: 'validation_error', message: aboutCheck.message }
  }

  const objectivesCheck = sanitizeObjectives(slug, input.objectives)
  if (!objectivesCheck.ok) {
    return { ok: false, code: 'validation_error', message: objectivesCheck.message }
  }

  const toolsCheck = sanitizeStringList(input.requiredTools)
  if (!toolsCheck.ok) {
    return { ok: false, code: 'validation_error', message: toolsCheck.message }
  }

  const materialsCheck = sanitizeStringList(input.requiredMaterials)
  if (!materialsCheck.ok) {
    return { ok: false, code: 'validation_error', message: materialsCheck.message }
  }

  const mediaCheck = sanitizeStringList(input.mediaReferences ?? [illustration])
  if (!mediaCheck.ok) {
    return { ok: false, code: 'validation_error', message: mediaCheck.message }
  }

  const publicationStatus: ExperimentPublicationStatus = input.publicationStatus ?? 'draft'
  if (
    publicationStatus === 'published' &&
    (aboutCheck.values.length === 0 || objectivesCheck.values.length === 0)
  ) {
    return {
      ok: false,
      code: 'incomplete_content',
      message:
        'Cannot publish an experiment without educational explanation paragraphs and learning objectives.',
    }
  }

  const defaultOrder =
    state.experiments.reduce((maxOrder, exp) => Math.max(maxOrder, exp.order), 0) + 1
  const order = input.order ?? defaultOrder
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment order must be a positive integer (1 or greater).',
    }
  }

  const nowIso = new Date().toISOString()
  const created: ManagedExperiment = {
    id,
    slug,
    title,
    shortDescription,
    categoryId,
    difficulty,
    estimatedDurationMinutes,
    status: requestedStatus,
    simulationId: requestedStatus === 'demo' ? id : null,
    illustration,
    contentReviewStatus: input.contentReviewStatus ?? 'draft',
    publicationStatus,
    about: aboutCheck.values,
    objectives: objectivesCheck.values,
    modelNote: input.modelNote?.trim() || undefined,
    requiredTools: toolsCheck.values,
    requiredMaterials: materialsCheck.values,
    safety: input.safety
      ? {
          level: input.safety.level,
          requiresSupervision: Boolean(input.safety.requiresSupervision),
          note: input.safety.note?.trim() || undefined,
          recommendedPpe: input.safety.recommendedPpe
            ? [...input.safety.recommendedPpe]
            : undefined,
        }
      : undefined,
    safetyReviewStatus: input.safetyReviewStatus ?? 'draft',
    mediaReferences: mediaCheck.values,
    lessonId: input.lessonId?.trim() || null,
    order,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const nextState: AdminExperimentState = {
    ...state,
    experiments: sortManagedExperiments([...state.experiments, created]),
  }

  return {
    ok: true,
    state: nextState,
    data: created,
    message: `Experiment "${created.title}" saved as ${created.publicationStatus}.`,
  }
}

/**
 * Updates an existing experiment's metadata, objectives, tools, materials, safety, or curriculum link
 * while preserving its stable experiment ID and enforcing simulation registry integrity.
 */
export function updateManagedExperiment(
  state: AdminExperimentState,
  input: UpdateExperimentInput,
  authState?: ExperimentAuthCheck | null,
): ExperimentMutationResult<ManagedExperiment> {
  const access = assertExperimentAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.experiments.find((exp) => exp.id === input.experimentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Experiment "${input.experimentId}" was not found.`,
    }
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment title is required and must be between 2 and 160 characters.',
    }
  }

  const shortDescription =
    input.shortDescription !== undefined
      ? input.shortDescription.trim()
      : existing.shortDescription
  if (shortDescription.length < 5 || shortDescription.length > 600) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Short description is required and must be between 5 and 600 characters.',
    }
  }

  const categoryId =
    input.categoryId !== undefined ? input.categoryId.trim() : existing.categoryId
  if (!state.categories.some((cat) => cat.id === categoryId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Category "${categoryId || 'empty'}" does not exist.`,
    }
  }

  const difficulty = input.difficulty ?? existing.difficulty
  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid difficulty "${String(difficulty)}".`,
    }
  }

  const estimatedDurationMinutes =
    input.estimatedDurationMinutes ?? existing.estimatedDurationMinutes
  if (
    !Number.isInteger(estimatedDurationMinutes) ||
    estimatedDurationMinutes < 1 ||
    estimatedDurationMinutes > 240
  ) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Estimated duration must be a whole number between 1 and 240 minutes.',
    }
  }

  const illustration = input.illustration ?? existing.illustration
  if (!ALLOWED_ILLUSTRATIONS.includes(illustration)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid illustration key "${String(illustration)}".`,
    }
  }

  const slug =
    input.slug !== undefined ? normalizeExperimentSlug(input.slug) : existing.slug
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  if (state.experiments.some((exp) => exp.id !== existing.id && exp.slug === slug)) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `Another experiment with slug "${slug}" already exists.`,
    }
  }

  const nextStatus: ExperimentStatus = input.status ?? existing.status
  const nextSimulationId =
    input.simulationId !== undefined
      ? input.simulationId
      : nextStatus === 'demo'
        ? existing.id
        : null

  if (nextStatus === 'demo' || nextSimulationId !== null) {
    if (!isRegisteredSimulationForExperiment(existing.id, nextSimulationId)) {
      return {
        ok: false,
        code: 'unregistered_simulation',
        message:
          'Cannot mark 3D Lab Available because no registered 3D simulation definition exists for this experiment ID.',
      }
    }
  }

  const aboutCheck =
    input.about !== undefined
      ? sanitizeStringList(input.about)
      : { ok: true as const, values: existing.about }
  if (!aboutCheck.ok) {
    return { ok: false, code: 'validation_error', message: aboutCheck.message }
  }

  const objectivesCheck =
    input.objectives !== undefined
      ? sanitizeObjectives(slug, input.objectives)
      : { ok: true as const, values: existing.objectives }
  if (!objectivesCheck.ok) {
    return { ok: false, code: 'validation_error', message: objectivesCheck.message }
  }

  if (
    existing.publicationStatus === 'published' &&
    (aboutCheck.values.length === 0 || objectivesCheck.values.length === 0)
  ) {
    return {
      ok: false,
      code: 'incomplete_content',
      message:
        'Published experiments must retain at least one educational explanation paragraph and one learning objective.',
    }
  }

  const toolsCheck =
    input.requiredTools !== undefined
      ? sanitizeStringList(input.requiredTools)
      : { ok: true as const, values: existing.requiredTools }
  if (!toolsCheck.ok) {
    return { ok: false, code: 'validation_error', message: toolsCheck.message }
  }

  const materialsCheck =
    input.requiredMaterials !== undefined
      ? sanitizeStringList(input.requiredMaterials)
      : { ok: true as const, values: existing.requiredMaterials }
  if (!materialsCheck.ok) {
    return { ok: false, code: 'validation_error', message: materialsCheck.message }
  }

  const mediaCheck =
    input.mediaReferences !== undefined
      ? sanitizeStringList(input.mediaReferences)
      : { ok: true as const, values: existing.mediaReferences }
  if (!mediaCheck.ok) {
    return { ok: false, code: 'validation_error', message: mediaCheck.message }
  }

  const order = input.order ?? existing.order
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Experiment order must be a positive integer (1 or greater).',
    }
  }

  const nextSafety =
    input.safety === null
      ? undefined
      : input.safety !== undefined
        ? {
            level: input.safety.level,
            requiresSupervision: Boolean(input.safety.requiresSupervision),
            note: input.safety.note?.trim() || undefined,
            recommendedPpe: input.safety.recommendedPpe
              ? [...input.safety.recommendedPpe]
              : undefined,
          }
        : existing.safety

  const updated: ManagedExperiment = {
    ...existing,
    slug,
    title,
    shortDescription,
    categoryId,
    difficulty,
    estimatedDurationMinutes,
    status: nextStatus,
    simulationId: nextStatus === 'demo' ? existing.id : null,
    illustration,
    contentReviewStatus: input.contentReviewStatus ?? existing.contentReviewStatus,
    about: aboutCheck.values,
    objectives: objectivesCheck.values,
    modelNote:
      input.modelNote === null
        ? undefined
        : input.modelNote !== undefined
          ? input.modelNote.trim() || undefined
          : existing.modelNote,
    requiredTools: toolsCheck.values,
    requiredMaterials: materialsCheck.values,
    safety: nextSafety,
    safetyReviewStatus: input.safetyReviewStatus ?? existing.safetyReviewStatus,
    mediaReferences: mediaCheck.values,
    lessonId:
      input.lessonId !== undefined
        ? input.lessonId?.trim() || null
        : existing.lessonId,
    order,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminExperimentState = {
    ...state,
    experiments: sortManagedExperiments(
      state.experiments.map((exp) => (exp.id === existing.id ? updated : exp)),
    ),
  }

  return {
    ok: true,
    state: nextState,
    data: updated,
    message: `Experiment "${updated.title}" updated.`,
  }
}

/**
 * Transitions an experiment's publication status (`'draft' | 'published' | 'archived'`).
 * Requires valid educational explanation paragraphs and learning objectives before publishing.
 */
export function setExperimentPublicationStatus(
  state: AdminExperimentState,
  experimentId: string,
  publicationStatus: ExperimentPublicationStatus,
  authState?: ExperimentAuthCheck | null,
): ExperimentMutationResult<ManagedExperiment> {
  const access = assertExperimentAdminAccess(authState)
  if (!access.ok) return access

  if (!['draft', 'published', 'archived'].includes(publicationStatus)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid publication status "${String(publicationStatus)}".`,
    }
  }

  const existing = state.experiments.find((exp) => exp.id === experimentId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Experiment "${experimentId}" was not found.`,
    }
  }

  if (
    publicationStatus === 'published' &&
    (existing.about.length === 0 ||
      existing.objectives.length === 0 ||
      existing.shortDescription.trim().length < 5)
  ) {
    return {
      ok: false,
      code: 'incomplete_content',
      message:
        'Cannot publish an experiment without a short description, educational explanation, and at least one learning objective.',
    }
  }

  const updated: ManagedExperiment = {
    ...existing,
    publicationStatus,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminExperimentState = {
    ...state,
    experiments: sortManagedExperiments(
      state.experiments.map((exp) => (exp.id === existing.id ? updated : exp)),
    ),
  }

  const statusVerb =
    publicationStatus === 'published'
      ? 'published'
      : publicationStatus === 'archived'
        ? 'archived'
        : 'saved as draft'

  return {
    ok: true,
    state: nextState,
    data: updated,
    message: `Experiment "${updated.title}" ${statusVerb}.`,
  }
}

/**
 * Converts a `ManagedExperiment` into the canonical student-facing `Experiment` object.
 * Guarantees that `status` is `'demo'` ONLY when a compatible registered simulation exists.
 */
export function toPublicExperiment(managed: ManagedExperiment): Experiment {
  const hasCompatibleSimulation =
    managed.status === 'demo' &&
    isRegisteredSimulationForExperiment(managed.id, managed.simulationId ?? managed.id)

  return {
    id: managed.id,
    slug: managed.slug,
    title: managed.title,
    shortDescription: managed.shortDescription,
    categoryId: managed.categoryId,
    difficulty: managed.difficulty,
    estimatedDurationMinutes: managed.estimatedDurationMinutes,
    status: hasCompatibleSimulation ? 'demo' : 'planned',
    illustration: managed.illustration,
    safety: managed.safety
      ? {
          level: managed.safety.level,
          requiresSupervision: managed.safety.requiresSupervision,
          note: managed.safety.note,
          recommendedPpe: managed.safety.recommendedPpe
            ? [...managed.safety.recommendedPpe]
            : undefined,
        }
      : undefined,
    curriculum: managed.lessonId ? { lessonId: managed.lessonId } : undefined,
    learning: {
      reviewStatus: managed.contentReviewStatus,
      about: [...managed.about],
      objectives: managed.objectives.map((obj) => ({ ...obj })),
      modelNote: managed.modelNote,
    },
  }
}

/**
 * Builds the student-facing `CatalogData` from `AdminExperimentState`.
 * Includes ONLY `'published'` experiments; `'draft'` and `'archived'` experiments remain hidden.
 */
export function buildPublishedExperimentCatalog(
  state: AdminExperimentState,
  curriculum: CurriculumData = sampleCurriculum,
): CatalogData {
  const publishedExperiments = sortManagedExperiments(state.experiments)
    .filter((exp) => exp.publicationStatus === 'published')
    .map(toPublicExperiment)

  return {
    curriculum,
    experiments: publishedExperiments,
    categories: state.categories.map((cat) => ({ ...cat })),
    semesters: [],
    units: [],
    lessons: [],
  }
}
