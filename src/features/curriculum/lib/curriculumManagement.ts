import type {
  CurriculumData,
  Experiment,
  Grade,
  Lesson,
  LessonExperiment,
  Term,
  Unit,
} from '../../../types/curriculum.ts'
import type { AuthSnapshot } from '../../auth/authService.ts'
import { hasPermission } from '../../auth/permissions.ts'
import { sampleCurriculum } from '../data/sampleCurriculum.ts'
import { validateCurriculum } from './validateCurriculum.ts'

export type CurriculumPublicationStatus = 'draft' | 'published' | 'archived'
export type CurriculumAuthCheck = Pick<
  AuthSnapshot,
  'status' | 'role' | 'roleStatus' | 'permissions'
>

export interface ManagedCurriculumUnit extends Unit {
  readonly description: string
  readonly publicationStatus: CurriculumPublicationStatus
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface ManagedCurriculumLesson extends Lesson {
  readonly description: string
  readonly publicationStatus: CurriculumPublicationStatus
  readonly createdAt?: string
  readonly updatedAt?: string
}

export interface AdminCurriculumState {
  grades: Grade[]
  terms: Term[]
  units: ManagedCurriculumUnit[]
  lessons: ManagedCurriculumLesson[]
  lessonExperiments: LessonExperiment[]
  experiments: Experiment[]
}

export interface CreateUnitInput {
  id?: string
  termId: string
  title: string
  slug?: string
  description?: string
  order?: number
}

export interface UpdateUnitInput {
  unitId: string
  termId?: string
  title?: string
  slug?: string
  description?: string
  order?: number
}

export interface CreateLessonInput {
  id?: string
  unitId: string
  title: string
  slug?: string
  description?: string
  order?: number
}

export interface UpdateLessonInput {
  lessonId: string
  unitId?: string
  title?: string
  slug?: string
  description?: string
  order?: number
}

export type CurriculumMutationErrorCode =
  | 'unauthorized'
  | 'validation_error'
  | 'not_found'
  | 'duplicate_slug'
  | 'duplicate_id'
  | 'referenced_record'
  | 'database_error'

export type CurriculumMutationResult<T = AdminCurriculumState> =
  | {
      ok: true
      state: AdminCurriculumState
      data: T
      message: string
    }
  | {
      ok: false
      code: CurriculumMutationErrorCode
      message: string
    }

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Normalizes a human-readable title or slug input into a URL-safe lowercase kebab-case slug.
 */
export function normalizeCurriculumSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Verifies that the caller has a verified admin session with `admin:manage_content` permission.
 */
export function assertCurriculumAdminAccess(
  authState?: CurriculumAuthCheck | null,
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

export interface CreateAdminCurriculumSeed {
  grades?: readonly Grade[]
  terms?: readonly Term[]
  units?: readonly ManagedCurriculumUnit[]
  lessons?: readonly ManagedCurriculumLesson[]
  lessonExperiments?: readonly LessonExperiment[]
  experiments?: readonly Experiment[]
}

/**
 * Creates an initial administrative curriculum state containing the 3 secondary grades
 * and 6 academic terms without fabricating published units or lessons.
 */
export function createInitialAdminCurriculumState(
  seed?: CreateAdminCurriculumSeed,
): AdminCurriculumState {
  return {
    grades: (seed?.grades ?? sampleCurriculum.grades).map((grade) => ({ ...grade })),
    terms: (seed?.terms ?? sampleCurriculum.terms).map((term) => ({ ...term })),
    units: (seed?.units ?? []).map((unit) => ({
      ...unit,
      description: unit.description ?? '',
    })),
    lessons: (seed?.lessons ?? []).map((lesson) => ({
      ...lesson,
      description: lesson.description ?? '',
    })),
    lessonExperiments: (seed?.lessonExperiments ?? []).map((link) => ({
      lessonId: link.lessonId,
      experimentId: link.experimentId,
      order: link.order,
    })),
    experiments: (seed?.experiments ?? sampleCurriculum.experiments).map((exp) => ({ ...exp })),
  }
}

/**
 * Sorts units deterministically by termId, order, and id without mutating input.
 */
export function sortManagedUnits(units: readonly ManagedCurriculumUnit[]): ManagedCurriculumUnit[] {
  return [...units].sort(
    (a, b) =>
      a.termId.localeCompare(b.termId) || a.order - b.order || a.id.localeCompare(b.id),
  )
}

/**
 * Sorts lessons deterministically by unitId, order, and id without mutating input.
 */
export function sortManagedLessons(
  lessons: readonly ManagedCurriculumLesson[],
): ManagedCurriculumLesson[] {
  return [...lessons].sort(
    (a, b) =>
      a.unitId.localeCompare(b.unitId) || a.order - b.order || a.id.localeCompare(b.id),
  )
}

/**
 * Creates a new curriculum unit in `'draft'` status (never auto-published).
 */
export function createCurriculumUnit(
  state: AdminCurriculumState,
  input: CreateUnitInput,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumUnit> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const termId = input.termId?.trim() ?? ''
  const term = state.terms.find((item) => item.id === termId)
  if (!term) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Parent academic term "${termId || 'empty'}" does not exist.`,
    }
  }

  const title = input.title?.trim() ?? ''
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit title is required and must be between 2 and 160 characters.',
    }
  }

  const slug = normalizeCurriculumSlug(input.slug?.trim() ? input.slug : title)
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  const termUnits = state.units.filter((unit) => unit.termId === termId)
  if (termUnits.some((unit) => unit.slug === slug)) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `A unit with slug "${slug}" already exists in ${term.title}.`,
    }
  }

  const defaultOrder =
    termUnits.reduce((maxOrder, unit) => Math.max(maxOrder, unit.order), 0) + 1
  const order = input.order ?? defaultOrder
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit order must be a positive integer (1 or greater).',
    }
  }

  const description = (input.description ?? '').trim()
  if (description.length > 1000) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit description cannot exceed 1000 characters.',
    }
  }

  const generatedId =
    input.id?.trim() ||
    `unit-${termId.replace(/^term-/, '')}-${slug}`
  if (state.units.some((unit) => unit.id === generatedId)) {
    return {
      ok: false,
      code: 'duplicate_id',
      message: `A unit with ID "${generatedId}" already exists.`,
    }
  }

  const nowIso = new Date().toISOString()
  const newUnit: ManagedCurriculumUnit = {
    id: generatedId,
    termId,
    slug,
    title,
    description,
    order,
    publicationStatus: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const nextState: AdminCurriculumState = {
    ...state,
    units: sortManagedUnits([...state.units, newUnit]),
  }

  return {
    ok: true,
    state: nextState,
    data: newUnit,
    message: `Unit "${newUnit.title}" created as a draft.`,
  }
}

/**
 * Updates an existing curriculum unit while preserving its stable ID.
 */
export function updateCurriculumUnit(
  state: AdminCurriculumState,
  input: UpdateUnitInput,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumUnit> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.units.find((unit) => unit.id === input.unitId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Unit "${input.unitId}" was not found.`,
    }
  }

  const targetTermId = input.termId !== undefined ? input.termId.trim() : existing.termId
  const term = state.terms.find((item) => item.id === targetTermId)
  if (!term) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Parent academic term "${targetTermId || 'empty'}" does not exist.`,
    }
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit title is required and must be between 2 and 160 characters.',
    }
  }

  const slug =
    input.slug !== undefined ? normalizeCurriculumSlug(input.slug) : existing.slug
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  if (
    state.units.some(
      (unit) => unit.id !== existing.id && unit.termId === targetTermId && unit.slug === slug,
    )
  ) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `Another unit with slug "${slug}" already exists in ${term.title}.`,
    }
  }

  const order = input.order !== undefined ? input.order : existing.order
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit order must be a positive integer (1 or greater).',
    }
  }

  const description =
    input.description !== undefined ? input.description.trim() : (existing.description ?? '')
  if (description.length > 1000) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Unit description cannot exceed 1000 characters.',
    }
  }

  const updatedUnit: ManagedCurriculumUnit = {
    ...existing,
    termId: targetTermId,
    title,
    slug,
    description,
    order,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminCurriculumState = {
    ...state,
    units: sortManagedUnits(
      state.units.map((unit) => (unit.id === existing.id ? updatedUnit : unit)),
    ),
  }

  return {
    ok: true,
    state: nextState,
    data: updatedUnit,
    message: `Unit "${updatedUnit.title}" saved.`,
  }
}

/**
 * Reorders units within a specific academic term using a complete ordered list of unit IDs.
 */
export function reorderCurriculumUnits(
  state: AdminCurriculumState,
  termId: string,
  orderedUnitIds: readonly string[],
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumUnit[]> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  if (!state.terms.some((term) => term.id === termId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Academic term "${termId}" does not exist.`,
    }
  }

  const termUnits = state.units.filter((unit) => unit.termId === termId)
  if (
    orderedUnitIds.length !== termUnits.length ||
    new Set(orderedUnitIds).size !== termUnits.length ||
    orderedUnitIds.some((id) => !termUnits.some((unit) => unit.id === id))
  ) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Reordering requires all unit IDs belonging to the selected academic term.',
    }
  }

  const orderById = new Map(orderedUnitIds.map((id, index) => [id, index + 1]))
  const nowIso = new Date().toISOString()
  const updatedUnits = state.units.map((unit) => {
    const nextOrder = orderById.get(unit.id)
    if (nextOrder === undefined) return unit
    return {
      ...unit,
      order: nextOrder,
      updatedAt: nowIso,
    }
  })

  const nextState: AdminCurriculumState = {
    ...state,
    units: sortManagedUnits(updatedUnits),
  }

  return {
    ok: true,
    state: nextState,
    data: nextState.units.filter((unit) => unit.termId === termId),
    message: 'Unit order updated.',
  }
}

/**
 * Moves a single unit up or down within its academic term.
 */
export function moveCurriculumUnitOrder(
  state: AdminCurriculumState,
  unitId: string,
  direction: 'up' | 'down',
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumUnit[]> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const target = state.units.find((unit) => unit.id === unitId)
  if (!target) {
    return {
      ok: false,
      code: 'not_found',
      message: `Unit "${unitId}" was not found.`,
    }
  }

  const termUnits = sortManagedUnits(
    state.units.filter((unit) => unit.termId === target.termId),
  )
  const index = termUnits.findIndex((unit) => unit.id === unitId)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= termUnits.length) {
    return {
      ok: true,
      state,
      data: termUnits,
      message: 'Unit is already at the boundary of its term order.',
    }
  }

  const ids = termUnits.map((unit) => unit.id)
  const [moved] = ids.splice(index, 1)
  ids.splice(swapIndex, 0, moved)
  return reorderCurriculumUnits(state, target.termId, ids, authState)
}

/**
 * Publishes, unpublishes (`'draft'`), or archives a curriculum unit.
 */
export function setCurriculumUnitPublicationStatus(
  state: AdminCurriculumState,
  unitId: string,
  publicationStatus: CurriculumPublicationStatus,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumUnit> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  if (!['draft', 'published', 'archived'].includes(publicationStatus)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid publication status "${String(publicationStatus)}".`,
    }
  }

  const existing = state.units.find((unit) => unit.id === unitId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Unit "${unitId}" was not found.`,
    }
  }

  const updatedUnit: ManagedCurriculumUnit = {
    ...existing,
    publicationStatus,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminCurriculumState = {
    ...state,
    units: sortManagedUnits(
      state.units.map((unit) => (unit.id === existing.id ? updatedUnit : unit)),
    ),
  }

  const statusVerb =
    publicationStatus === 'published'
      ? 'published'
      : publicationStatus === 'archived'
        ? 'archived'
        : 'unpublished to draft'

  return {
    ok: true,
    state: nextState,
    data: updatedUnit,
    message: `Unit "${updatedUnit.title}" ${statusVerb}.`,
  }
}

/**
 * Deletes a curriculum unit ONLY if no lessons reference it.
 */
export function deleteCurriculumUnit(
  state: AdminCurriculumState,
  unitId: string,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<{ deletedUnitId: string }> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.units.find((unit) => unit.id === unitId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Unit "${unitId}" was not found.`,
    }
  }

  const childLessons = state.lessons.filter((lesson) => lesson.unitId === unitId)
  if (childLessons.length > 0) {
    return {
      ok: false,
      code: 'referenced_record',
      message: `Cannot delete unit "${existing.title}" because it contains ${childLessons.length} lesson${childLessons.length === 1 ? '' : 's'}. Delete its lessons first or archive/unpublish the unit instead.`,
    }
  }

  const nextState: AdminCurriculumState = {
    ...state,
    units: sortManagedUnits(state.units.filter((unit) => unit.id !== unitId)),
  }

  return {
    ok: true,
    state: nextState,
    data: { deletedUnitId: unitId },
    message: `Unit "${existing.title}" deleted.`,
  }
}

/**
 * Creates a new curriculum lesson in `'draft'` status (never auto-published).
 */
export function createCurriculumLesson(
  state: AdminCurriculumState,
  input: CreateLessonInput,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumLesson> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const unitId = input.unitId?.trim() ?? ''
  const unit = state.units.find((item) => item.id === unitId)
  if (!unit) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Parent curriculum unit "${unitId || 'empty'}" does not exist.`,
    }
  }

  const title = input.title?.trim() ?? ''
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson title is required and must be between 2 and 160 characters.',
    }
  }

  const slug = normalizeCurriculumSlug(input.slug?.trim() ? input.slug : title)
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  const unitLessons = state.lessons.filter((lesson) => lesson.unitId === unitId)
  if (unitLessons.some((lesson) => lesson.slug === slug)) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `A lesson with slug "${slug}" already exists in ${unit.title}.`,
    }
  }

  const defaultOrder =
    unitLessons.reduce((maxOrder, lesson) => Math.max(maxOrder, lesson.order), 0) + 1
  const order = input.order ?? defaultOrder
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson order must be a positive integer (1 or greater).',
    }
  }

  const description = (input.description ?? '').trim()
  if (description.length > 1000) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson description cannot exceed 1000 characters.',
    }
  }

  const generatedId =
    input.id?.trim() ||
    `lesson-${unitId.replace(/^unit-/, '')}-${slug}`
  if (state.lessons.some((lesson) => lesson.id === generatedId)) {
    return {
      ok: false,
      code: 'duplicate_id',
      message: `A lesson with ID "${generatedId}" already exists.`,
    }
  }

  const nowIso = new Date().toISOString()
  const newLesson: ManagedCurriculumLesson = {
    id: generatedId,
    unitId,
    slug,
    title,
    description,
    order,
    publicationStatus: 'draft',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const nextState: AdminCurriculumState = {
    ...state,
    lessons: sortManagedLessons([...state.lessons, newLesson]),
  }

  return {
    ok: true,
    state: nextState,
    data: newLesson,
    message: `Lesson "${newLesson.title}" created as a draft.`,
  }
}

/**
 * Updates an existing curriculum lesson while preserving its stable ID.
 */
export function updateCurriculumLesson(
  state: AdminCurriculumState,
  input: UpdateLessonInput,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumLesson> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.lessons.find((lesson) => lesson.id === input.lessonId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Lesson "${input.lessonId}" was not found.`,
    }
  }

  const targetUnitId = input.unitId !== undefined ? input.unitId.trim() : existing.unitId
  const unit = state.units.find((item) => item.id === targetUnitId)
  if (!unit) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Parent curriculum unit "${targetUnitId || 'empty'}" does not exist.`,
    }
  }

  const title = input.title !== undefined ? input.title.trim() : existing.title
  if (title.length < 2 || title.length > 160) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson title is required and must be between 2 and 160 characters.',
    }
  }

  const slug =
    input.slug !== undefined ? normalizeCurriculumSlug(input.slug) : existing.slug
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson slug must contain lowercase letters, numbers, and hyphens only.',
    }
  }

  if (
    state.lessons.some(
      (lesson) =>
        lesson.id !== existing.id && lesson.unitId === targetUnitId && lesson.slug === slug,
    )
  ) {
    return {
      ok: false,
      code: 'duplicate_slug',
      message: `Another lesson with slug "${slug}" already exists in ${unit.title}.`,
    }
  }

  const order = input.order !== undefined ? input.order : existing.order
  if (!Number.isInteger(order) || order < 1) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson order must be a positive integer (1 or greater).',
    }
  }

  const description =
    input.description !== undefined ? input.description.trim() : (existing.description ?? '')
  if (description.length > 1000) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Lesson description cannot exceed 1000 characters.',
    }
  }

  const updatedLesson: ManagedCurriculumLesson = {
    ...existing,
    unitId: targetUnitId,
    title,
    slug,
    description,
    order,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminCurriculumState = {
    ...state,
    lessons: sortManagedLessons(
      state.lessons.map((lesson) => (lesson.id === existing.id ? updatedLesson : lesson)),
    ),
  }

  return {
    ok: true,
    state: nextState,
    data: updatedLesson,
    message: `Lesson "${updatedLesson.title}" saved.`,
  }
}

/**
 * Reorders lessons within a specific unit using a complete ordered list of lesson IDs.
 */
export function reorderCurriculumLessons(
  state: AdminCurriculumState,
  unitId: string,
  orderedLessonIds: readonly string[],
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumLesson[]> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  if (!state.units.some((unit) => unit.id === unitId)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Curriculum unit "${unitId}" does not exist.`,
    }
  }

  const unitLessons = state.lessons.filter((lesson) => lesson.unitId === unitId)
  if (
    orderedLessonIds.length !== unitLessons.length ||
    new Set(orderedLessonIds).size !== unitLessons.length ||
    orderedLessonIds.some((id) => !unitLessons.some((lesson) => lesson.id === id))
  ) {
    return {
      ok: false,
      code: 'validation_error',
      message: 'Reordering requires all lesson IDs belonging to the selected unit.',
    }
  }

  const orderById = new Map(orderedLessonIds.map((id, index) => [id, index + 1]))
  const nowIso = new Date().toISOString()
  const updatedLessons = state.lessons.map((lesson) => {
    const nextOrder = orderById.get(lesson.id)
    if (nextOrder === undefined) return lesson
    return {
      ...lesson,
      order: nextOrder,
      updatedAt: nowIso,
    }
  })

  const nextState: AdminCurriculumState = {
    ...state,
    lessons: sortManagedLessons(updatedLessons),
  }

  return {
    ok: true,
    state: nextState,
    data: nextState.lessons.filter((lesson) => lesson.unitId === unitId),
    message: 'Lesson order updated.',
  }
}

/**
 * Moves a single lesson up or down within its unit.
 */
export function moveCurriculumLessonOrder(
  state: AdminCurriculumState,
  lessonId: string,
  direction: 'up' | 'down',
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumLesson[]> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const target = state.lessons.find((lesson) => lesson.id === lessonId)
  if (!target) {
    return {
      ok: false,
      code: 'not_found',
      message: `Lesson "${lessonId}" was not found.`,
    }
  }

  const unitLessons = sortManagedLessons(
    state.lessons.filter((lesson) => lesson.unitId === target.unitId),
  )
  const index = unitLessons.findIndex((lesson) => lesson.id === lessonId)
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= unitLessons.length) {
    return {
      ok: true,
      state,
      data: unitLessons,
      message: 'Lesson is already at the boundary of its unit order.',
    }
  }

  const ids = unitLessons.map((lesson) => lesson.id)
  const [moved] = ids.splice(index, 1)
  ids.splice(swapIndex, 0, moved)
  return reorderCurriculumLessons(state, target.unitId, ids, authState)
}

/**
 * Publishes, unpublishes (`'draft'`), or archives a curriculum lesson.
 */
export function setCurriculumLessonPublicationStatus(
  state: AdminCurriculumState,
  lessonId: string,
  publicationStatus: CurriculumPublicationStatus,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<ManagedCurriculumLesson> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  if (!['draft', 'published', 'archived'].includes(publicationStatus)) {
    return {
      ok: false,
      code: 'validation_error',
      message: `Invalid publication status "${String(publicationStatus)}".`,
    }
  }

  const existing = state.lessons.find((lesson) => lesson.id === lessonId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Lesson "${lessonId}" was not found.`,
    }
  }

  const updatedLesson: ManagedCurriculumLesson = {
    ...existing,
    publicationStatus,
    updatedAt: new Date().toISOString(),
  }

  const nextState: AdminCurriculumState = {
    ...state,
    lessons: sortManagedLessons(
      state.lessons.map((lesson) => (lesson.id === existing.id ? updatedLesson : lesson)),
    ),
  }

  const statusVerb =
    publicationStatus === 'published'
      ? 'published'
      : publicationStatus === 'archived'
        ? 'archived'
        : 'unpublished to draft'

  return {
    ok: true,
    state: nextState,
    data: updatedLesson,
    message: `Lesson "${updatedLesson.title}" ${statusVerb}.`,
  }
}

/**
 * Deletes a curriculum lesson ONLY if no experiments are linked to it.
 */
export function deleteCurriculumLesson(
  state: AdminCurriculumState,
  lessonId: string,
  authState?: CurriculumAuthCheck | null,
): CurriculumMutationResult<{ deletedLessonId: string }> {
  const access = assertCurriculumAdminAccess(authState)
  if (!access.ok) return access

  const existing = state.lessons.find((lesson) => lesson.id === lessonId)
  if (!existing) {
    return {
      ok: false,
      code: 'not_found',
      message: `Lesson "${lessonId}" was not found.`,
    }
  }

  const linkedExperiments = state.lessonExperiments.filter(
    (link) => link.lessonId === lessonId,
  )
  if (linkedExperiments.length > 0) {
    return {
      ok: false,
      code: 'referenced_record',
      message: `Cannot delete lesson "${existing.title}" because it is linked to ${linkedExperiments.length} experiment${linkedExperiments.length === 1 ? '' : 's'}. Archive or unpublish the lesson instead.`,
    }
  }

  const nextState: AdminCurriculumState = {
    ...state,
    lessons: sortManagedLessons(state.lessons.filter((lesson) => lesson.id !== lessonId)),
  }

  return {
    ok: true,
    state: nextState,
    data: { deletedLessonId: lessonId },
    message: `Lesson "${existing.title}" deleted.`,
  }
}

/**
 * Projects an `AdminCurriculumState` into the public student-facing `CurriculumData` snapshot.
 * Only published units and published lessons inside published units are included.
 * Never mixes sample/mock units with published curriculum records.
 */
export function buildPublishedStudentCurriculum(state: AdminCurriculumState): CurriculumData {
  const publishedUnits: Unit[] = sortManagedUnits(state.units)
    .filter((unit) => unit.publicationStatus === 'published')
    .map((unit) => ({
      id: unit.id,
      termId: unit.termId,
      slug: unit.slug,
      title: unit.title,
      description: unit.description,
      order: unit.order,
    }))

  const publishedUnitIds = new Set(publishedUnits.map((unit) => unit.id))

  const publishedLessons: Lesson[] = sortManagedLessons(state.lessons)
    .filter(
      (lesson) =>
        lesson.publicationStatus === 'published' && publishedUnitIds.has(lesson.unitId),
    )
    .map((lesson) => ({
      id: lesson.id,
      unitId: lesson.unitId,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
    }))

  const publishedLessonIds = new Set(publishedLessons.map((lesson) => lesson.id))

  const publishedLinks: LessonExperiment[] = state.lessonExperiments
    .filter((link) => publishedLessonIds.has(link.lessonId))
    .map((link) => ({
      lessonId: link.lessonId,
      experimentId: link.experimentId,
      order: link.order,
    }))

  const candidate: CurriculumData = {
    id: sampleCurriculum.id,
    title: sampleCurriculum.title,
    description: 'Published Egyptian secondary chemistry curriculum structure.',
    contentStatus: 'reviewed',
    grades: state.grades.map((grade) => ({ ...grade })),
    terms: state.terms.map((term) => ({ ...term })),
    units: publishedUnits,
    lessons: publishedLessons,
    experiments: state.experiments.map((exp) => ({ ...exp })),
    lessonExperiments: publishedLinks,
  }

  validateCurriculum(candidate)
  return candidate
}

/**
 * Resolves the active student curriculum dataset:
 * - When a managed curriculum state is active (e.g., loaded from Supabase with published content
 *   or explicitly set by the curriculum management store), returns the published curriculum
 *   snapshot (`contentStatus: 'reviewed'`) without mixing mock records.
 * - When no managed curriculum state is active (`null`), falls back to `sampleCurriculum`
 *   (`contentStatus: 'sample'`) for offline/development mode.
 */
export function resolveStudentCurriculumDataset(
  managedState: AdminCurriculumState | null | undefined,
  fallbackSample: CurriculumData = sampleCurriculum,
): { data: CurriculumData; source: 'published' | 'sample' } {
  if (!managedState) {
    return {
      data: fallbackSample,
      source: 'sample',
    }
  }

  return {
    data: buildPublishedStudentCurriculum(managedState),
    source: 'published',
  }
}
