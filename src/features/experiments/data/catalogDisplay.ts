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

export const safetyLevelLabels: Record<'none' | 'low' | 'moderate' | 'medium' | 'high', string> = {
  none: 'No hazard precautions',
  low: 'Low-risk precautions',
  moderate: 'Additional precautions',
  medium: 'Moderate precautions',
  high: 'Special precautions',
}
