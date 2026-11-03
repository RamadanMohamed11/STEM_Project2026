/** Stable identifiers are independent of display names, slugs, and curriculum placement. */
export type EntityId = string

export interface Semester {
  id: EntityId
  slug: string
  title: string
  order: number
}

export interface Unit {
  id: EntityId
  semesterId: Semester['id']
  slug: string
  title: string
  order: number
}

export interface Lesson {
  id: EntityId
  unitId: Unit['id']
  slug: string
  title: string
  order: number
}

export interface ExperimentCategory {
  id: EntityId
  label: string
  description?: string
}

/** `demo` currently offers a 3D workbench, not calibrated chemistry execution. */
export type ExperimentStatus = 'demo' | 'planned'
export type ExperimentDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface SafetyMetadata {
  level: 'low' | 'moderate' | 'high'
  requiresSupervision: boolean
  note?: string
  recommendedPpe?: readonly string[]
}

/** Associations are optional until the approved curriculum becomes available. */
export interface CurriculumAssociation {
  semesterId?: Semester['id']
  unitId?: Unit['id']
  lessonId?: Lesson['id']
}

export type ExperimentIllustrationKey = 'salt-dissolution' | 'liquid-volume' | 'ph-indicators'

export interface Experiment {
  id: EntityId
  slug: string
  title: string
  shortDescription: string
  categoryId: ExperimentCategory['id']
  difficulty: ExperimentDifficulty
  /** Illustrative estimate in minutes, not an approved laboratory allocation. */
  estimatedDurationMinutes: number
  status: ExperimentStatus
  illustration: ExperimentIllustrationKey
  safety?: SafetyMetadata
  curriculum?: CurriculumAssociation
}
