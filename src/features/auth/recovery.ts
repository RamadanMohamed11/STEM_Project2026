export type RecoveryMode = 'forgot' | 'reset'
export type RecoveryAvailability = 'unavailable' | 'checking' | 'error'
export interface RecoveryValues {
  email: string
  newPassword: string
  confirmPassword: string
}
export type RecoveryErrors = Partial<Record<keyof RecoveryValues, string>>

/** Future adapter owns provider verification/session credentials; no custom tokens or URL passwords. */
export interface RecoveryProvider {
  requestPasswordReset(email: string): Promise<void>
  changePasswordInVerifiedRecoverySession(newPassword: string): Promise<void>
}

/** Only display after a real provider accepts a recovery request. */
export const recoveryRequestAcceptedMessage =
  'If an account uses this email, you will receive password reset instructions.'

export function validateRecovery(mode: RecoveryMode, values: RecoveryValues): RecoveryErrors {
  const errors: RecoveryErrors = {}
  if (mode === 'forgot') {
    if (!values.email.trim()) errors.email = 'Enter your email.'
    else if (
      values.email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    )
      errors.email = 'Enter a valid email address.'
  } else {
    if (!values.newPassword) errors.newPassword = 'Enter a new password.'
    else if (
      values.newPassword.length < 8 ||
      values.newPassword.length > 128 ||
      !values.newPassword.trim()
    )
      errors.newPassword = 'Use 8 to 128 characters for your password.'
    if (!values.confirmPassword) errors.confirmPassword = 'Confirm your new password.'
    else if (values.newPassword !== values.confirmPassword)
      errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}
