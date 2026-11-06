import { generatePath } from 'react-router'

/** Stable public URLs. Keep existing catalog and laboratory links compatible. */
export const routePaths = {
  home: '/',
  signUp: '/signup',
  login: '/login',
  safety: '/safety',
  grades: '/grades',
  terms: '/terms',
  experiments: '/experiments',
  experimentDetails: '/experiments/:experimentId',
  laboratory: '/experiments/:experimentId/lab',
  experimentQuiz: '/experiments/:experimentId/quiz',
  quizResults: '/experiments/:experimentId/quiz/results',
  laboratoryPreview: '/experiments/preview/lab',
} as const

export function getExperimentPaths(experimentId: string) {
  const params = { experimentId: encodeURIComponent(experimentId) }
  return {
    details: generatePath(routePaths.experimentDetails, params),
    laboratory: generatePath(routePaths.laboratory, params),
    quiz: generatePath(routePaths.experimentQuiz, params),
    results: generatePath(routePaths.quizResults, params),
  }
}
