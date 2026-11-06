import assert from 'node:assert/strict'
import test from 'node:test'
import { readSupabaseConfig } from '../src/lib/supabase/config.ts'
import { createAuthService } from '../src/features/auth/authService.ts'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'

// SDK contract doubles only. No accounts, network requests or database rows are created.
const user = (id = 'unit-user-a', confirmed = true) => ({
  id,
  email: 'unit@example.com',
  email_confirmed_at: confirmed ? '2026-01-01' : undefined,
})
const session = (id = 'unit-user-a', confirmed = true) => ({ user: user(id, confirmed) })
const profile = (id) => ({
  user_id: id,
  full_name: 'Unit Test Student',
  grade: sampleGrades[0].id,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
})
const credentials = { email: ' unit@example.com ', password: 'unit-test-only-password' }
const registration = { ...credentials, fullName: ' Unit Test Student ', grade: sampleGrades[0].id }
function fixture(initial = null) {
  let callback
  let current = initial
  const calls = []
  const api = {
    auth: {
      onAuthStateChange(fn) {
        callback = fn
        return {
          data: {
            subscription: {
              unsubscribe() {
                callback = undefined
              },
            },
          },
        }
      },
      async getSession() {
        return { data: { session: initial }, error: null }
      },
      async getUser() {
        return { data: { user: current?.user ?? null }, error: null }
      },
      async signUp(input) {
        calls.push(['signup', input])
        return { data: { user: user(), session: null }, error: null }
      },
      async signInWithPassword(input) {
        calls.push(['login', input])
        return { data: { user: user(), session: session() }, error: null }
      },
      async signOut(input) {
        calls.push(['logout', input])
        current = null
        callback?.('SIGNED_OUT', null)
        return { error: null }
      },
      async resetPasswordForEmail(email, options) {
        calls.push(['recovery', email, options])
        return { error: null }
      },
      async updateUser(input) {
        calls.push(['password', input])
        return { error: null }
      },
    },
    from(table) {
      let id, update
      return {
        select(columns) {
          calls.push(['select', table, columns])
          return this
        },
        eq(column, value) {
          assert.equal(column, 'user_id')
          id = value
          return this
        },
        update(value) {
          update = value
          calls.push(['profile-update', value])
          return this
        },
        async single() {
          return { data: { ...profile(id), ...update }, error: null }
        },
      }
    },
  }
  return {
    api,
    calls,
    emit(event, value) {
      current = value
      callback?.(event, value)
    },
  }
}
async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  assert.fail('Auth state did not settle')
}

test('browser configuration only accepts publishable keys and safe URL schemes', () => {
  for (const key of [undefined, '', 'sb_secret_hidden', 'service_role', 'eyJlegacy.jwt', 'random'])
    assert.equal(readSupabaseConfig('https://project.supabase.co', key), null)
  assert.equal(readSupabaseConfig('http://example.com', 'sb_publishable_unit'), null)
  for (const url of [
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://example.com/path',
    'https://example.com?secret=value',
  ])
    assert.equal(readSupabaseConfig(url, 'sb_publishable_unit'), null)
  assert.deepEqual(readSupabaseConfig('https://project.supabase.co/', 'sb_publishable_unit'), {
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_unit',
  })
  assert.ok(readSupabaseConfig('http://127.0.0.1:54321', 'sb_publishable_unit'))
})
test('missing configuration fails closed with no invented authentication or recovery', async () => {
  const auth = createAuthService(null, 'https://school.example')
  auth.start()
  assert.equal(auth.getSnapshot().status, 'unavailable')
  for (const operation of [
    () => auth.register(registration),
    () => auth.signIn(credentials),
    () => auth.signOut(),
    () => auth.requestPasswordReset(credentials.email),
    () => auth.changePassword('unit-password', 'unit-password'),
  ])
    await assert.rejects(operation, /not configured/)
  assert.equal(auth.getSnapshot().user, null)
})
test('registration supplies allowed profile metadata and does not log in pending email verification', async () => {
  const f = fixture(),
    auth = createAuthService(f.api, 'https://school.example')
  assert.equal(await auth.register(registration), 'verification-required')
  const payload = f.calls[0][1]
  assert.equal(payload.email, 'unit@example.com')
  assert.equal(payload.password, credentials.password)
  assert.deepEqual(payload.options.data, {
    full_name: 'Unit Test Student',
    grade: sampleGrades[0].id,
  })
  assert.equal(payload.options.emailRedirectTo, 'https://school.example/auth/callback')
  assert.equal(auth.getSnapshot().user, null)
  const count = f.calls.length
  await assert.rejects(
    () => auth.register({ ...registration, grade: 'forged-grade' }),
    /Check your details/,
  )
  assert.equal(f.calls.length, count)
  f.api.auth.signUp = async () => ({ data: { user: user(), session: session() }, error: null })
  assert.equal(await auth.register(registration), 'authenticated')
  f.api.auth.signUp = async () => ({
    data: { user: user('unit-user-a', false), session: session('unit-user-a', false) },
    error: null,
  })
  assert.equal(await auth.register(registration), 'verification-required')
})
test('login delegates to SDK and safely rejects invalid credentials and unverified responses', async () => {
  const f = fixture(),
    auth = createAuthService(f.api, 'https://school.example')
  await auth.signIn(credentials)
  assert.deepEqual(f.calls[0], [
    'login',
    { email: 'unit@example.com', password: credentials.password },
  ])
  f.api.auth.signInWithPassword = async () => ({
    data: { user: null, session: null },
    error: { message: 'private provider error' },
  })
  await assert.rejects(
    () => auth.signIn(credentials),
    (error) => /Incorrect email/.test(error.message) && !error.message.includes('private provider'),
  )
  f.api.auth.signInWithPassword = async () => ({
    data: { user: user('unit-user-a', false), session: session('unit-user-a', false) },
    error: null,
  })
  await assert.rejects(() => auth.signIn(credentials), /Incorrect email or password/)
})
test('restoration verifies user with provider, loads scoped profile, and logout clears it', async () => {
  const f = fixture(session()),
    auth = createAuthService(f.api, 'https://school.example'),
    stop = auth.start()
  await until(() => auth.getSnapshot().profile)
  assert.equal(auth.getSnapshot().status, 'authenticated')
  assert.equal(auth.getSnapshot().user.id, 'unit-user-a')
  assert.equal(auth.getSnapshot().profile.grade, sampleGrades[0].id)
  await auth.updateProfile('Updated Unit Student', sampleGrades[1].id)
  assert.equal(auth.getSnapshot().profile.grade, sampleGrades[1].id)
  assert.deepEqual(f.calls.find((call) => call[0] === 'profile-update')[1], {
    full_name: 'Updated Unit Student',
    grade: sampleGrades[1].id,
  })
  await assert.rejects(() => auth.updateProfile('Student', 'forged'), /Check/)
  await auth.signOut()
  assert.equal(auth.getSnapshot().status, 'anonymous')
  assert.equal(auth.getSnapshot().profile, null)
  assert.equal(auth.getSnapshot().recoveryReady, false)
  stop()
})
test('an unconfirmed restored session is not treated as a logged-in student', async () => {
  const f = fixture(session('unit-user-a', false)),
    auth = createAuthService(f.api, ''),
    stop = auth.start()
  await until(() => auth.getSnapshot().status === 'error')
  assert.equal(auth.getSnapshot().user, null)
  stop()
})
test('late restoration cannot undo a newer signout event', async () => {
  const f = fixture(),
    auth = createAuthService(f.api, '')
  let restore
  f.api.auth.getSession = () =>
    new Promise((resolve) => {
      restore = resolve
    })
  const stop = auth.start()
  f.emit('SIGNED_OUT', null)
  restore({ data: { session: session() }, error: null })
  await new Promise((resolve) => setTimeout(resolve, 15))
  assert.equal(auth.getSnapshot().status, 'anonymous')
  stop()
})
test('late user/profile responses cannot restore an old account after account switch or logout', async () => {
  const f = fixture(),
    auth = createAuthService(f.api, '')
  let resolveOld
  f.api.auth.getUser = () =>
    new Promise((resolve) => {
      resolveOld = resolve
    })
  const stop = auth.start()
  f.emit('SIGNED_IN', session())
  await until(() => resolveOld)
  f.api.auth.getUser = async () => ({ data: { user: user('unit-user-b') }, error: null })
  f.emit('SIGNED_IN', session('unit-user-b'))
  await until(() => auth.getSnapshot().profile?.user_id === 'unit-user-b')
  resolveOld({ data: { user: user() }, error: null })
  await new Promise((resolve) => setTimeout(resolve, 15))
  assert.equal(auth.getSnapshot().user.id, 'unit-user-b')
  stop()
})
test('password changes require a verified PASSWORD_RECOVERY event, and logout follows real success', async () => {
  const f = fixture(session()),
    auth = createAuthService(f.api, 'https://school.example'),
    stop = auth.start()
  await until(() => auth.getSnapshot().profile)
  await assert.rejects(() => auth.changePassword('unit-password', 'unit-password'), /recovery link/)
  assert.ok(!f.calls.some((call) => call[0] === 'password'))
  await auth.requestPasswordReset('unit@example.com')
  assert.deepEqual(
    f.calls.find((call) => call[0] === 'recovery'),
    ['recovery', 'unit@example.com', { redirectTo: 'https://school.example/reset-password' }],
  )
  f.emit('PASSWORD_RECOVERY', session())
  await until(() => auth.getSnapshot().recoveryReady)
  await assert.rejects(() => auth.changePassword('short', 'short'), /Check/)
  assert.deepEqual(await auth.changePassword('unit-password', 'unit-password'), { signedOut: true })
  assert.deepEqual(f.calls.find((call) => call[0] === 'password')[1], { password: 'unit-password' })
  assert.equal(auth.getSnapshot().status, 'anonymous')
  stop()
})
test('recovery permission never transfers to a different authenticated account', async () => {
  const f = fixture(),
    auth = createAuthService(f.api, ''),
    stop = auth.start()
  f.emit('PASSWORD_RECOVERY', session())
  await until(() => auth.getSnapshot().recoveryReady)
  f.emit('SIGNED_IN', session('unit-user-b'))
  await until(() => auth.getSnapshot().user?.id === 'unit-user-b')
  assert.equal(auth.getSnapshot().recoveryReady, false)
  await assert.rejects(() => auth.changePassword('unit-password', 'unit-password'), /recovery link/)
  stop()
})
