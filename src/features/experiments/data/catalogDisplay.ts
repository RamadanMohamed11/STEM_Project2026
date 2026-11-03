import type { ExperimentDifficulty, ExperimentStatus } from '@/types/experiment'

export const experimentStatusLabels: Record<ExperimentStatus, string> = {
  demo: 'Available demo',
  planned: 'Coming later',
}

export const experimentDifficultyLabels: Record<ExperimentDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const safetyLevelLabels = {
  low: 'Low-risk precautions',
  moderate: 'Additional precautions',
  high: 'Special precautions',
} as const
