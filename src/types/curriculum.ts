import type { EntityId, Experiment, Lesson } from './experiment.ts'

// Reuse catalog metadata; scientific definitions remain in the simulation feature.
export type { Experiment, Lesson } from './experiment.ts'

interface OrderedCurriculumEntity {
  readonly id: EntityId
  readonly slug: string
  readonly title: string
  readonly order: number
  readonly description?: string
}

export type Grade = OrderedCurriculumEntity

/** A term belongs to one grade; First Term in different grades has different IDs. */
export interface Term extends OrderedCurriculumEntity {
  readonly gradeId: Grade['id']
}

/** Student curriculum unit. The older catalog Unit uses semesterId instead. */
export interface Unit extends OrderedCurriculumEntity {
  readonly termId: Term['id']
}

/** Composite identity: (lessonId, experimentId). One experiment may serve many lessons. */
export interface LessonExperiment {
  readonly lessonId: Lesson['id']
  readonly experimentId: Experiment['id']
  readonly order: number
}

/** Other parent relationships live on Term.gradeId, Unit.termId and Lesson.unitId. */
export interface CurriculumRelationships {
  readonly lessonExperiments: readonly LessonExperiment[]
}

/**
 * Plain, normalized records suitable for a future repository/API snapshot.
 * Empty arrays are valid. Missing datasets are handled by the lookup utilities.
 * Content review is separate from an experiment's demo/planned availability.
 */
export interface CurriculumData extends CurriculumRelationships {
  readonly id: EntityId
  readonly title: string
  readonly description: string
  readonly contentStatus: 'sample' | 'reviewed'
  readonly grades: readonly Grade[]
  readonly terms: readonly Term[]
  readonly units: readonly Unit[]
  readonly lessons: readonly Lesson[]
  readonly experiments: readonly Experiment[]
}
