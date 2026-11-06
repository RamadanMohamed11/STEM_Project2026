import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { createAuthService, unavailableAuth } from './authService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth] = useState(() =>
    createAuthService(
      getSupabaseClient(),
      typeof window === 'undefined' ? '' : window.location.origin,
    ),
  )
  const state = useSyncExternalStore(auth.subscribe, auth.getSnapshot, () => unavailableAuth)
  useEffect(() => auth.start(), [auth])
  return <AuthContext.Provider value={{ auth, state }}>{children}</AuthContext.Provider>
}
