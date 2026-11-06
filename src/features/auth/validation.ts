import type { LoginErrors, LoginValues } from './types'

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {}

  const trimmedEmail = values.email.trim()
  if (!trimmedEmail) {
    errors.email = 'Enter your email.'
  } else if (trimmedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Enter your password.'
  } else if (
    values.password.length < 8 ||
    values.password.length > 128 ||
    !values.password.trim()
  ) {
    errors.password = 'Use 8 to 128 characters for your password.'
  }

  return errors
}
