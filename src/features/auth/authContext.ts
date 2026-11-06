import { createContext, useContext } from 'react'
import {
  createAuthService,
  unavailableAuth,
  type AuthSnapshot,
  type StudentAuthService,
} from './authService'

const unavailableService = createAuthService(null, '')
export const AuthContext = createContext<{ auth: StudentAuthService; state: AuthSnapshot }>({
  auth: unavailableService,
  state: unavailableAuth,
})
export function useAuth() {
  return useContext(AuthContext)
}
