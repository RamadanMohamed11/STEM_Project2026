import { useEffect } from 'react'
import { useAuth } from '@/features/auth/authContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { createSupabaseAccountProgressApi } from '../lib/accountProgressApi'
import {
  connectStudentProgressAccount,
  disconnectStudentProgressAccount,
} from '../state/studentProgressStore'

/** T48: keeps the progress store in account mode while a verified student is signed in. */
export function ProgressAccountSync() {
  const { state } = useAuth()
  const userId = state.status === 'authenticated' ? (state.user?.id ?? null) : null
  const settled = state.status !== 'loading'

  useEffect(() => {
    if (!settled) return
    const client = getSupabaseClient()
    if (userId && client) {
      void connectStudentProgressAccount(userId, createSupabaseAccountProgressApi(client))
    } else {
      disconnectStudentProgressAccount()
    }
  }, [userId, settled])

  return null
}
