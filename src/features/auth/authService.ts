import type { SupabaseClient, Session } from '@supabase/supabase-js'
import { sampleGrades } from '../curriculum/data/sampleCurriculum.ts'
import { validateRegistration, type RegistrationValues } from '../registration/validation.ts'
import { validateLogin } from './validation.ts'
import { validateRecovery } from './recovery.ts'

export interface StudentProfile {
  user_id: string
  full_name: string
  grade: string
  created_at: string
  updated_at: string
}
export interface AuthSnapshot {
  status: 'unavailable' | 'loading' | 'anonymous' | 'authenticated' | 'error'
  user: { id: string; email: string | undefined } | null
  profile: StudentProfile | null
  profileError: string | null
  recoveryReady: boolean
  error: string | null
}
export const unavailableAuth: AuthSnapshot = {
  status: 'unavailable',
  user: null,
  profile: null,
  profileError: null,
  recoveryReady: false,
  error: null,
}
const unavailableMessage = 'Account services are not configured yet. Please try again later.'

/** Single authority over SDK state. No custom credentials, session tokens or password storage. */
export function createAuthService(client: SupabaseClient | null, origin: string) {
  let state: AuthSnapshot = client ? { ...unavailableAuth, status: 'loading' } : unavailableAuth
  const listeners = new Set<() => void>()
  let revision = 0
  let stopped = true
  let recovery = false
  let recoveryUserId: string | null = null
  let subscription: { unsubscribe(): void } | undefined
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const publish = (next: AuthSnapshot) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  const requireClient = () => {
    if (!client) throw new Error(unavailableMessage)
    return client
  }
  const fail = (message: string): never => {
    throw new Error(message)
  }

  async function verifySession(session: Session | null, version: number) {
    if (stopped || version !== revision || !client) return
    if (!session) {
      recovery = false
      publish({ ...unavailableAuth, status: 'anonymous' })
      return
    }
    try {
      // getSession restores the SDK session; getUser verifies it with the provider.
      const { data, error } = await client.auth.getUser()
      if (stopped || version !== revision) return
      if (
        error ||
        !data.user ||
        data.user.id !== session.user.id ||
        !data.user.email_confirmed_at
      ) {
        recovery = false
        publish({
          ...unavailableAuth,
          status: 'error',
          error: 'Your session could not be verified. Please log in again.',
        })
        return
      }
      const user = { id: data.user.id, email: data.user.email }
      publish({ ...unavailableAuth, status: 'authenticated', user, recoveryReady: recovery })
      const profileResult = await client
        .from('student_profiles')
        .select('user_id,full_name,grade,created_at,updated_at')
        .eq('user_id', user.id)
        .single()
      if (stopped || version !== revision) return
      const profile = profileResult.data as StudentProfile | null
      const valid =
        !profileResult.error &&
        profile?.user_id === user.id &&
        sampleGrades.some((grade) => grade.id === profile.grade)
      publish({
        ...state,
        profile: valid ? profile : null,
        profileError: valid ? null : 'Your profile could not be loaded. Please try again later.',
      })
    } catch {
      if (!stopped && version === revision)
        publish({
          ...unavailableAuth,
          status: 'error',
          error: 'Account services could not be reached. Please try again.',
        })
    }
  }
  function queueSession(session: Session | null, isRecovery = false) {
    const version = ++revision
    if (!session) {
      recovery = false
      publish({ ...unavailableAuth, status: 'anonymous' })
      return
    }
    if (recoveryUserId !== session.user.id) recovery = false
    if (isRecovery) {
      recovery = true
      recoveryUserId = session.user.id
    }
    publish({ ...unavailableAuth, status: 'loading' })
    // Never await another Supabase request inside onAuthStateChange's SDK lock.
    const timer = setTimeout(() => {
      timers.delete(timer)
      void verifySession(session, version)
    }, 0)
    timers.add(timer)
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    start() {
      if (!client || !stopped) return () => {}
      stopped = false
      const initialRevision = revision
      subscription = client.auth.onAuthStateChange((event, session) => {
        if (stopped) return
        if (event === 'SIGNED_OUT') recovery = false
        queueSession(session, event === 'PASSWORD_RECOVERY')
      }).data.subscription
      void client.auth
        .getSession()
        .then(({ data, error }) => {
          if (stopped || revision !== initialRevision) return
          if (error)
            publish({
              ...unavailableAuth,
              status: 'error',
              error: 'Your session could not be restored. Please log in again.',
            })
          else queueSession(data.session)
        })
        .catch(() => {
          if (!stopped && revision === initialRevision)
            publish({
              ...unavailableAuth,
              status: 'error',
              error: 'Account services could not be reached. Please try again.',
            })
        })
      return () => {
        stopped = true
        ++revision
        recovery = false
        subscription?.unsubscribe()
        timers.forEach(clearTimeout)
        timers.clear()
      }
    },
    async register(values: RegistrationValues) {
      const api = requireClient()
      if (Object.keys(validateRegistration(values, sampleGrades)).length)
        return fail('Check your details and try again.')
      const { data, error } = await api.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: { full_name: values.fullName.trim(), grade: values.grade },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      })
      if (error)
        return fail('We could not create your account. Check your details or try again later.')
      // Duplicate/obfuscated signups and verification-pending responses never imply login.
      return data.session && data.user?.email_confirmed_at
        ? ('authenticated' as const)
        : ('verification-required' as const)
    },
    async signIn(values: { email: string; password: string }) {
      const api = requireClient()
      if (Object.keys(validateLogin(values)).length) return fail('Check your email and password.')
      recovery = false
      const { data, error } = await api.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      })
      if (error || !data.session || !data.user?.email_confirmed_at)
        return fail('Incorrect email or password. Please try again.')
    },
    async signOut() {
      const { error } = await requireClient().auth.signOut({ scope: 'local' })
      if (error) return fail('We could not log you out. Please try again.')
      ++revision
      recovery = false
      publish({ ...unavailableAuth, status: 'anonymous' })
    },
    async requestPasswordReset(email: string) {
      const api = requireClient()
      if (validateRecovery('forgot', { email, newPassword: '', confirmPassword: '' }).email)
        return fail('Enter a valid email address.')
      const { error } = await api.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/reset-password`,
      })
      if (error) return fail('The recovery request could not be completed. Please try again later.')
    },
    async changePassword(newPassword: string, confirmPassword: string) {
      const api = requireClient()
      if (state.status !== 'authenticated' || !state.recoveryReady)
        return fail('Open a new password recovery link from your email.')
      if (
        Object.keys(validateRecovery('reset', { email: '', newPassword, confirmPassword })).length
      )
        return fail('Check your new password and confirmation.')
      const verified = await api.auth.getUser()
      if (verified.error || verified.data.user?.id !== state.user?.id)
        return fail('Your recovery link could not be verified. Request a new link.')
      const { error } = await api.auth.updateUser({ password: newPassword })
      if (error)
        return fail(
          'Your password could not be changed. Request a new recovery link and try again.',
        )
      recovery = false
      publish({ ...state, recoveryReady: false })
      const result = await api.auth.signOut({ scope: 'local' })
      if (!result.error) {
        ++revision
        publish({ ...unavailableAuth, status: 'anonymous' })
      }
      return { signedOut: !result.error }
    },
    async updateProfile(fullName: string, grade: string) {
      const api = requireClient()
      const user = state.user
      if (
        state.status !== 'authenticated' ||
        !user ||
        fullName.trim().length < 2 ||
        fullName.trim().length > 100 ||
        !sampleGrades.some((item) => item.id === grade)
      )
        return fail('Check your name and grade.')
      const version = revision
      const result = await api
        .from('student_profiles')
        .update({ full_name: fullName.trim(), grade })
        .eq('user_id', user.id)
        .select('user_id,full_name,grade,created_at,updated_at')
        .single()
      if (result.error || result.data?.user_id !== user.id)
        return fail('Your profile could not be saved. Please try again.')
      if (version === revision && state.user?.id === user.id)
        publish({ ...state, profile: result.data as StudentProfile, profileError: null })
    },
  }
}
export type StudentAuthService = ReturnType<typeof createAuthService>
