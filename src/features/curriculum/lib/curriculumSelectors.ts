import { findExperimentById as findCatalogExperimentById } from '../../experiments/lib/catalogSelectors.ts'
import type {
  CurriculumData,
  Experiment,
  Grade,
  Lesson,
  Term,
  Unit,
} from '../../../types/curriculum.ts'

type Dataset = CurriculumData | null | undefined
type LookupId = string | null | undefined

/** Copy before sorting; stable IDs break order ties without depending on array/input order. */
function ordered<T extends { order: number }>(items: readonly T[], key: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) => a.order - b.order || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0),
  )
}

function findTerm(data: Dataset, termId: LookupId) {
  const term = data?.terms.find((item) => item.id === termId)
  return term && data?.grades.some((grade) => grade.id === term.gradeId) ? term : undefined
}

function findUnit(data: Dataset, unitId: LookupId) {
  const unit = data?.units.find((item) => item.id === unitId)
  return unit && findTerm(data, unit.termId) ? unit : undefined
}

function findLesson(data: Dataset, lessonId: LookupId) {
  const lesson = data?.lessons.find((item) => item.id === lessonId)
  return lesson && findUnit(data, lesson.unitId) ? lesson : undefined
}

/** Available means listed in this dataset, including grades with no lessons yet. */
export function getAvailableGrades(data: Dataset): Grade[] {
  return ordered(data?.grades ?? [], (item) => item.id)
}

export function getTermsForGrade(data: Dataset, gradeId: LookupId): Term[] {
  if (!gradeId || !data?.grades.some((grade) => grade.id === gradeId)) return []
  return ordered(
    data.terms.filter((term) => term.gradeId === gradeId),
    (item) => item.id,
  )
}

export function getUnitsForTerm(data: Dataset, termId: LookupId): Unit[] {
  if (!termId || !data || !findTerm(data, termId)) return []
  return ordered(
    data.units.filter((unit) => unit.termId === termId),
    (item) => item.id,
  )
}

export function getLessonsForUnit(data: Dataset, unitId: LookupId): Lesson[] {
  if (!unitId || !data || !findUnit(data, unitId)) return []
  return ordered(
    data.lessons.filter((lesson) => lesson.unitId === unitId),
    (item) => item.id,
  )
}

/** Canonical catalog lookup: independent of whether any lesson links to the experiment. */
export function findExperimentById(data: Dataset, experimentId: LookupId): Experiment | undefined {
  return data && experimentId
    ? findCatalogExperimentById(data.experiments, experimentId)
    : undefined
}

export function getExperimentsForLesson(data: Dataset, lessonId: LookupId): Experiment[] {
  if (!lessonId || !data || !findLesson(data, lessonId)) return []
  const links = ordered(
    data.lessonExperiments.filter((link) => link.lessonId === lessonId),
    (link) => link.experimentId,
  )
  const seen = new Set<string>()
  const experiments: Experiment[] = []
  for (const link of links) {
    const experiment = findExperimentById(data, link.experimentId)
    // Defensive reads ignore dangling/duplicate links; integrity validation reports them.
    if (experiment && !seen.has(experiment.id)) {
      seen.add(experiment.id)
      experiments.push(experiment)
    }
  }
  return experiments
}

/** Keep standalone demos discoverable, even with no confirmed curriculum placement. */
export function getUnassignedExperiments(data: Dataset): Experiment[] {
  if (!data) return []
  const assignedIds = new Set(
    data.lessonExperiments
      .filter((link) => findLesson(data, link.lessonId))
      .map((link) => link.experimentId),
  )
  return data.experiments.filter((experiment) => !assignedIds.has(experiment.id))
}
