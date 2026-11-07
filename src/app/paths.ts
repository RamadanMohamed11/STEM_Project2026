import { generatePath } from 'react-router'

/** Stable public URLs. Keep existing catalog and laboratory links compatible. */
export const routePaths = {
  home: '/',
  signUp: '/signup',
  login: '/login',
  account: '/account',
  profile: '/profile',
  authCallback: '/auth/callback',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  safety: '/safety',
  grades: '/grades',
  terms: '/terms',
  curriculum: '/curriculum',
  curriculumLesson: '/curriculum/lessons/:lessonId',
  experiments: '/experiments',
  progress: '/progress',
  experimentDetails: '/experiments/:experimentId',
  laboratory: '/experiments/:experimentId/lab',
  experimentQuiz: '/experiments/:experimentId/quiz',
  experimentResults: '/experiments/:experimentId/results',
  quizResults: '/experiments/:experimentId/quiz/results',
  laboratoryPreview: '/experiments/preview/lab',
} as const

export function getCurriculumPath(gradeId: string, termId: string) {
  return `${routePaths.curriculum}?${new URLSearchParams({ grade: gradeId, term: termId })}`
}

export function getCurriculumLessonPath(lessonId: string) {
  return generatePath(routePaths.curriculumLesson, { lessonId })
}

export function getExperimentPaths(experimentId: string) {
  // React Router encodes path parameters; pass the raw ID to avoid double encoding.
  const params = { experimentId }
  return {
    details: generatePath(routePaths.experimentDetails, params),
    laboratory: generatePath(routePaths.laboratory, params),
    quiz: generatePath(routePaths.experimentQuiz, params),
    experimentResults: generatePath(routePaths.experimentResults, params),
    results: generatePath(routePaths.quizResults, params),
  }
}
