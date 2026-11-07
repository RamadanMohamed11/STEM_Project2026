import type { Experiment, ExperimentCategory, Lesson, Semester, Unit } from '@/types/experiment'
import type { CatalogData } from '@/features/experiments/lib/catalogSelectors'
import {
  saltDissolutionLearning,
  liquidVolumeLearning,
  phIndicatorsLearning,
} from './experimentLearningContent.ts'

/** Demonstration-only data. Nothing in this file is an official university course listing. */
export const mockCategories: readonly ExperimentCategory[] = [
  { id: 'chemistry', label: 'Chemistry', description: 'Substances and their properties' },
  { id: 'measurement', label: 'Measurement', description: 'Practical measuring techniques' },
]

// Intentionally unassigned. Add approved academic groupings here later.
export const mockSemesters: readonly Semester[] = []
export const mockUnits: readonly Unit[] = []
export const mockLessons: readonly Lesson[] = []

export const mockExperiments: readonly Experiment[] = [
  {
    id: 'exp-salt-water-001',
    learning: saltDissolutionLearning,
    slug: 'dissolving-salt-in-water',
    title: 'Dissolving Salt in Water',
    shortDescription:
      'Observe how sodium chloride disperses in water and distinguish a homogeneous solution from undissolved solid.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 10,
    status: 'demo',
    illustration: 'salt-dissolution',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Wear suitable eye protection as instructed, handle glassware carefully, never taste substances, and clean up water spills.',
      recommendedPpe: ['Eye protection as directed by the instructor'],
    },
  },
  {
    id: 'exp-volume-002',
    learning: liquidVolumeLearning,
    slug: 'measuring-liquid-volume',
    title: 'Measuring Liquid Volume',
    shortDescription:
      'Introduce the use of graduated glassware and reading the liquid meniscus at eye level.',
    categoryId: 'measurement',
    difficulty: 'beginner',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Handle laboratory glassware carefully and report damaged equipment.',
    },
  },
  {
    id: 'exp-ph-003',
    learning: phIndicatorsLearning,
    slug: 'exploring-ph-indicators',
    title: 'Exploring pH Indicators',
    shortDescription:
      'Explore how indicator colors can help classify aqueous samples as acidic, neutral, or basic.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    // Exact reagents and protective equipment have not been specified or approved.
  },
]

export const demoCatalog: CatalogData = {
  experiments: mockExperiments,
  categories: mockCategories,
  semesters: mockSemesters,
  units: mockUnits,
  lessons: mockLessons,
}
