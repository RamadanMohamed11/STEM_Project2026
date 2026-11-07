import type { CurriculumData } from '../../../types/curriculum.ts'
import { getCurriculumLessonContext } from '../../curriculum/lib/curriculumBrowser.ts'
import { findExperimentById } from '../../curriculum/lib/curriculumSelectors.ts'

/** Sample mappings must never be presented as approved curriculum placement. */
export function getReviewedExperimentLessons(
  data: CurriculumData | undefined,
  experimentId: string,
) {
  if (data?.contentStatus !== 'reviewed' || !findExperimentById(data, experimentId)) return []
  const ids = new Set(
    data.lessonExperiments
      .filter((link) => link.experimentId === experimentId)
      .map((link) => link.lessonId),
  )
  return [...ids]
    .map((id) => getCurriculumLessonContext(data, id))
    .filter((context) => context !== null)
    .sort(
      (a, b) =>
        a.grade.order - b.grade.order ||
        a.term.order - b.term.order ||
        a.unit.order - b.unit.order ||
        a.lesson.order - b.lesson.order ||
        a.lesson.id.localeCompare(b.lesson.id),
    )
}
