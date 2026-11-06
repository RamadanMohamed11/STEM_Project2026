import { sampleGrades } from '../curriculum/data/sampleCurriculum.ts'
import type { AuthSnapshot } from '../auth/authService.ts'

export interface ProfileValues {
  fullName: string
  grade: string
}
export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>

export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.'
  else if (values.fullName.trim().length < 2 || values.fullName.trim().length > 100)
    errors.fullName = 'Use 2 to 100 characters for your name.'
  if (!sampleGrades.some((grade) => grade.id === values.grade)) errors.grade = 'Choose your grade.'
  return errors
}

/** UI defense in depth; the database RLS policies remain the authority. */
export function getOwnStudentProfile(state: AuthSnapshot) {
  return state.status === 'authenticated' && state.user?.id === state.profile?.user_id
    ? state.profile
    : null
}
