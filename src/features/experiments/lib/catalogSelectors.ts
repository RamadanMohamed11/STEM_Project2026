import type {
  CurriculumAssociation,
  Experiment,
  ExperimentCategory,
  ExperimentStatus,
  Lesson,
  Semester,
  Unit,
} from '@/types/experiment'

export type CatalogStatusFilter = 'all' | ExperimentStatus

export interface CatalogFilters {
  search: string
  categoryId: string
  semesterId: string
  status: CatalogStatusFilter
}

export const initialCatalogFilters: CatalogFilters = {
  search: '',
  categoryId: 'all',
  semesterId: 'all',
  status: 'all',
}

export interface CatalogData {
  experiments: readonly Experiment[]
  categories: readonly ExperimentCategory[]
  semesters: readonly Semester[]
  units: readonly Unit[]
  lessons: readonly Lesson[]
}

export function findExperimentById(experiments: readonly Experiment[], id: string) {
  return experiments.find((experiment) => experiment.id === id)
}

export function getLabPath(experiment: Experiment) {
  return `/experiments/${encodeURIComponent(experiment.id)}/lab`
}

/** Supports direct associations now and derives semester/unit from lesson when present later. */
export function getExperimentCurriculum(
  experiment: Experiment,
  units: readonly Unit[],
  lessons: readonly Lesson[],
): CurriculumAssociation {
  const association = experiment.curriculum
  const lesson = lessons.find((item) => item.id === association?.lessonId)
  const unit = units.find((item) => item.id === (association?.unitId ?? lesson?.unitId))

  return {
    semesterId: association?.semesterId ?? unit?.semesterId,
    unitId: association?.unitId ?? lesson?.unitId,
    lessonId: association?.lessonId,
  }
}

export function getExperimentsForCurriculum(
  experiments: readonly Experiment[],
  units: readonly Unit[],
  lessons: readonly Lesson[],
  target: CurriculumAssociation,
) {
  return experiments.filter((experiment) => {
    const assignment = getExperimentCurriculum(experiment, units, lessons)
    return (
      (target.semesterId === undefined || assignment.semesterId === target.semesterId) &&
      (target.unitId === undefined || assignment.unitId === target.unitId) &&
      (target.lessonId === undefined || assignment.lessonId === target.lessonId)
    )
  })
}

export function groupExperimentsBySemester(data: CatalogData) {
  const groups = new Map<string | null, Experiment[]>()

  for (const experiment of data.experiments) {
    const semesterId = getExperimentCurriculum(experiment, data.units, data.lessons).semesterId
    const key = data.semesters.some((semester) => semester.id === semesterId)
      ? (semesterId ?? null)
      : null
    const group = groups.get(key) ?? []
    group.push(experiment)
    groups.set(key, group)
  }

  return groups
}

export function filterExperiments(data: CatalogData, filters: CatalogFilters): Experiment[] {
  const search = filters.search.trim().toLocaleLowerCase()
  const categoryLabels = new Map(
    data.categories.map((category) => [category.id, category.label.toLocaleLowerCase()]),
  )

  return data.experiments.filter((experiment) => {
    if (filters.categoryId !== 'all' && experiment.categoryId !== filters.categoryId) return false
    if (filters.status !== 'all' && experiment.status !== filters.status) return false
    if (
      filters.semesterId !== 'all' &&
      getExperimentCurriculum(experiment, data.units, data.lessons).semesterId !==
        filters.semesterId
    ) {
      return false
    }

    if (!search) return true

    return [
      experiment.title,
      experiment.shortDescription,
      experiment.slug.replaceAll('-', ' '),
      categoryLabels.get(experiment.categoryId) ?? '',
    ].some((value) => value.toLocaleLowerCase().includes(search))
  })
}
