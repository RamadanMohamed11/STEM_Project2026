import type { ExperimentAssessmentDefinition } from '../../../types/assessment.ts'
import { saltDissolutionAssessment } from './saltDissolutionAssessment.ts'

export const liquidVolumeAssessment: ExperimentAssessmentDefinition = {
  id: 'assessment-volume-002',
  experimentId: 'exp-volume-002',
  version: '0.1.0',
  title: 'Measuring Liquid Volume — Planned Concept Check',
  description:
    'Planned post-experiment review covering graduated glassware scales and eye-level meniscus readings.',
  scopeDisclaimer:
    'Planned assessment placeholder. Questions will be added after the 3D laboratory activity is finalized.',
  availabilityStatus: 'coming-soon',
  reviewStatus: 'draft',
  questionOrdering: 'ordered-by-field',
  passingScore: {
    status: 'unconfigured-draft',
    note: 'Passing score configuration is pending curriculum review.',
  },
  allowMultipleAttempts: true,
  questions: [],
}

export const phIndicatorsAssessment: ExperimentAssessmentDefinition = {
  id: 'assessment-ph-003',
  experimentId: 'exp-ph-003',
  version: '0.1.0',
  title: 'Exploring pH Indicators — Planned Concept Check',
  description:
    'Planned post-experiment review covering acidic, neutral, and basic solutions using indicator colors.',
  scopeDisclaimer:
    'Planned assessment placeholder. Questions will be added after the 3D laboratory activity is finalized.',
  availabilityStatus: 'coming-soon',
  reviewStatus: 'draft',
  questionOrdering: 'ordered-by-field',
  passingScore: {
    status: 'unconfigured-draft',
    note: 'Passing score configuration is pending curriculum review.',
  },
  allowMultipleAttempts: true,
  questions: [],
}

/**
 * Demonstration assessment catalog indexed by assessment definitions.
 * Interactive quiz presentation belongs to T26 and automatic scoring belongs to T27.
 */
export const assessmentCatalog: readonly ExperimentAssessmentDefinition[] = [
  saltDissolutionAssessment,
  liquidVolumeAssessment,
  phIndicatorsAssessment,
]
