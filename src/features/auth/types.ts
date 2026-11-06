export interface LoginValues {
  email: string
  password: string
}

export type LoginErrors = Partial<Record<keyof LoginValues, string>>

/**
 * Future authentication service interface.
 * When real authentication is integrated, an implementation of this interface
 * will be called. Currently kept decoupled from UI and validation.
 */
export interface AuthService {
  login(credentials: LoginValues): Promise<void>
}
