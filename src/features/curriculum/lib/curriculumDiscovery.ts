import type { CurriculumData } from '../../../types/curriculum.ts'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
  getExperimentsForLesson,
} from './curriculumSelectors.ts'

export interface AcademicFilters {
  gradeId: string
  termId: string
  unitId: string
  lessonId: string
}

export const emptyAcademicFilters: AcademicFilters = {
  gradeId: 'all',
  termId: 'all',
  unitId: 'all',
  lessonId: 'all',
}

/** Require a complete valid parent chain; never widen a malformed filter to all records. */
export function resolveAcademicFilters(data: CurriculumData | undefined, filters: AcademicFilters) {
  const grade = getAvailableGrades(data).find((item) => item.id === filters.gradeId)
  const term = getTermsForGrade(data, grade?.id).find((item) => item.id === filters.termId)
  const unit = getUnitsForTerm(data, term?.id).find((item) => item.id === filters.unitId)
  const lesson = getLessonsForUnit(data, unit?.id).find((item) => item.id === filters.lessonId)
  const invalid = Boolean(
    (filters.gradeId !== 'all' && !grade) ||
    (filters.termId !== 'all' && !term) ||
    (filters.unitId !== 'all' && !unit) ||
    (filters.lessonId !== 'all' && !lesson),
  )
  return { grade, term, unit, lesson, invalid }
}

/** null means no academic restriction; an empty set means no valid assigned matches. */
export function getAcademicExperimentIds(
  data: CurriculumData | undefined,
  filters: AcademicFilters,
): Set<string> | null {
  if (
    (Object.keys(emptyAcademicFilters) as (keyof AcademicFilters)[]).every(
      (key) => filters[key] === 'all',
    )
  )
    return null
  const context = resolveAcademicFilters(data, filters)
  if (!data || context.invalid) return new Set()
  const terms = context.term ? [context.term] : getTermsForGrade(data, context.grade?.id)
  const units = context.unit
    ? [context.unit]
    : terms.flatMap((term) => getUnitsForTerm(data, term.id))
  const lessons = context.lesson
    ? [context.lesson]
    : units.flatMap((unit) => getLessonsForUnit(data, unit.id))
  return new Set(
    lessons.flatMap((lesson) =>
      getExperimentsForLesson(data, lesson.id).map((experiment) => experiment.id),
    ),
  )
}
