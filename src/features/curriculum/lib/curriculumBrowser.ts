import type { CurriculumData } from '../../../types/curriculum.ts'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
  getExperimentsForLesson,
} from './curriculumSelectors.ts'

export function resolveCurriculumContext(
  data: CurriculumData | null | undefined,
  gradeId: string | null,
  termId: string | null,
) {
  const grade = getAvailableGrades(data).find((item) => item.id === gradeId) ?? null
  const term = getTermsForGrade(data, grade?.id).find((item) => item.id === termId) ?? null
  return { grade, term, invalid: Boolean((gradeId && !grade) || (termId && !term)) }
}

export function getCurriculumUnits(data: CurriculumData | null | undefined, termId: string | null) {
  return getUnitsForTerm(data, termId).map((unit) => ({
    unit,
    lessons: getLessonsForUnit(data, unit.id).map((lesson) => {
      const experiments = getExperimentsForLesson(data, lesson.id)
      return {
        lesson,
        availableCount: experiments.filter((item) => item.status === 'demo').length,
        plannedCount: experiments.filter((item) => item.status === 'planned').length,
      }
    }),
  }))
}

/** Resolve every parent so a direct lesson link cannot drift into a different grade/term. */
export function getCurriculumLessonContext(data: CurriculumData, lessonId: string | undefined) {
  for (const grade of getAvailableGrades(data))
    for (const term of getTermsForGrade(data, grade.id))
      for (const entry of getCurriculumUnits(data, term.id)) {
        const lesson = entry.lessons.find((item) => item.lesson.id === lessonId)
        if (lesson) return { grade, term, unit: entry.unit, ...lesson }
      }
  return null
}
