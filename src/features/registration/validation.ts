import type { Grade } from '../../types/curriculum.ts'

export interface RegistrationValues {
  fullName: string
  email: string
  password: string
  grade: string
}
export type RegistrationErrors = Partial<Record<keyof RegistrationValues, string>>

export function validateRegistration(
  values: RegistrationValues,
  grades: readonly Grade[],
): RegistrationErrors {
  const errors: RegistrationErrors = {}
  if (!values.fullName.trim()) errors.fullName = 'Enter your full name.'
  else if (values.fullName.trim().length < 2 || values.fullName.trim().length > 100)
    errors.fullName = 'Use 2 to 100 characters for your name.'
  if (!values.email.trim()) errors.email = 'Enter your email.'
  else if (
    values.email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  )
    errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Enter a password.'
  else if (values.password.length < 8 || values.password.length > 128 || !values.password.trim())
    errors.password = 'Use 8 to 128 characters for your password.'
  if (!grades.some((grade) => grade.id === values.grade)) errors.grade = 'Choose your grade.'
  return errors
}
