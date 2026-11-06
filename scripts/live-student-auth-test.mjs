import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline'
import assert from 'node:assert/strict'

// Opt-in live test, authorized synthetic accounts only. Passwords/tokens stay in memory.
const stamp = Date.now().toString(36)
const base = process.env.T10_TEST_EMAIL_BASE
if (!base || !base.includes('@'))
  throw new Error('Set T10_TEST_EMAIL_BASE to a mailbox you control and authorize for testing.')
const [local, domain] = base.split('@')
const fixtures = ['a', 'b'].map((label, i) => ({
  label,
  email: `${local}+stem-t10-${label}-${stamp}@${domain}`,
  password: randomBytes(30).toString('base64url'),
  grade: `grade-secondary-${i + 1}`,
  id: null,
}))
const storage = new Map()
const client = (_, index = 0) =>
  createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      flowType: 'pkce',
      storageKey: `t10-live-student-${index}`,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
const clients = fixtures.map(client)
const report = (value) => console.log(JSON.stringify(value))
for (let i = 0; i < 2; i++) {
  const f = fixtures[i]
  const result = await clients[i].auth.signUp({
    email: f.email,
    password: f.password,
    options: {
      data: {
        full_name: `STEM T10 Test Student ${f.label.toUpperCase()}`,
        grade: f.grade,
        test_fixture: 'T10-production-test',
      },
      emailRedirectTo: 'https://stem-project2026.vercel.app/auth/callback',
    },
  })
  f.id = result.data.user?.id ?? null
  report({
    check: 'signup',
    fixture: f.label,
    email: f.email,
    userId: f.id,
    sessionIssued: Boolean(result.data.session),
    error: result.error?.code ?? result.error?.name ?? null,
    status: result.error?.status ?? 200,
  })
  if (result.error || !result.data.user || !result.data.session)
    throw new Error('Live signup failed or email confirmation is required. No success is assumed.')
}
async function command(line) {
  if (line === 'exit') {
    clients.forEach((c) => c.auth.stopAutoRefresh())
    process.exit(0)
  }
  if (line === 'login') {
    for (let i = 0; i < 2; i++) {
      const result = await clients[i].auth.signInWithPassword({
        email: fixtures[i].email,
        password: fixtures[i].password,
      })
      if (result.error) {
        report({
          check: 'login',
          fixture: fixtures[i].label,
          error: result.error.code ?? result.error.name,
        })
        throw new Error('Live sign-in failed. No success is assumed.')
      }
      fixtures[i].id = result.data.user.id
      assert.ok(result.data.user.email_confirmed_at)
      report({ check: 'login', fixture: fixtures[i].label, passed: true, userId: fixtures[i].id })
      const p = await clients[i].from('student_profiles').select('*').single()
      assert.equal(p.error, null)
      assert.equal(p.data.user_id, fixtures[i].id)
      assert.equal(p.data.grade, fixtures[i].grade)
      report({ check: 'trigger-profile-and-grade', fixture: fixtures[i].label, passed: true })
    }
    const other = await clients[0]
      .from('student_profiles')
      .select('*')
      .eq('user_id', fixtures[1].id)
    assert.equal(other.error, null)
    assert.deepEqual(other.data, [])
    const crossUpdate = await clients[0]
      .from('student_profiles')
      .update({ full_name: 'FORBIDDEN' })
      .eq('user_id', fixtures[1].id)
      .select('*')
    assert.equal(crossUpdate.error, null)
    assert.deepEqual(crossUpdate.data, [])
    const reverse = await clients[1]
      .from('student_profiles')
      .select('*')
      .eq('user_id', fixtures[0].id)
    assert.equal(reverse.error, null)
    assert.deepEqual(reverse.data, [])
    report({ check: 'two-student-read-update-isolation', passed: true })
    const changed = await clients[0]
      .from('student_profiles')
      .update({ grade: 'grade-secondary-3' })
      .eq('user_id', fixtures[0].id)
      .select('*')
      .single()
    assert.equal(changed.error, null)
    assert.equal(changed.data.grade, 'grade-secondary-3')
    const restored = await clients[0]
      .from('student_profiles')
      .update({ grade: fixtures[0].grade })
      .eq('user_id', fixtures[0].id)
    assert.equal(restored.error, null)
    report({ check: 'own-grade-update-and-persistence', passed: true })
    const forged = await clients[0]
      .from('student_profiles')
      .update({ user_id: fixtures[1].id })
      .eq('user_id', fixtures[0].id)
    assert.equal(forged.error?.code, '42501')
    const timestamp = await clients[0]
      .from('student_profiles')
      .update({ created_at: new Date().toISOString() })
      .eq('user_id', fixtures[0].id)
    assert.equal(timestamp.error?.code, '42501')
    report({ check: 'protected-identity-and-timestamps', passed: true })
    const restarted = client(null, 0)
    const restoredSession = await restarted.auth.getSession()
    assert.equal(restoredSession.error, null)
    assert.equal(restoredSession.data.session?.user.id, fixtures[0].id)
    const restoredUser = await restarted.auth.getUser()
    assert.equal(restoredUser.error, null)
    assert.equal(restoredUser.data.user.id, fixtures[0].id)
    report({ check: 'sdk-session-restoration-and-server-verification', passed: true })
    const invalid = client(null, 2)
    const rejected = await invalid.auth.signInWithPassword({
      email: fixtures[0].email,
      password: randomBytes(30).toString('base64url'),
    })
    assert.ok(rejected.error)
    assert.equal(rejected.data.session, null)
    report({ check: 'invalid-credentials-rejected', passed: true })
  }
  if (line === 'recovery') {
    const result = await clients[0].auth.resetPasswordForEmail(fixtures[0].email, {
      redirectTo: 'https://stem-project2026.vercel.app/reset-password',
    })
    report({
      check: 'recovery-request',
      error: result.error?.code ?? result.error?.name ?? null,
      status: result.error?.status ?? 200,
    })
  }
  if (line === 'logout') {
    for (let i = 0; i < 2; i++) {
      const r = await clients[i].auth.signOut({ scope: 'local' })
      assert.equal(r.error, null)
      assert.equal((await clients[i].auth.getSession()).data.session, null)
    }
    report({ check: 'logout', passed: true })
  }
}
let busy = false
if (process.env.T10_TEST_AUTO === '1') {
  await command('login')
  await command('recovery')
  await command('logout')
  storage.clear()
  process.exit(0)
}
createInterface({ input: process.stdin }).on('line', async (line) => {
  if (busy) return
  busy = true
  try {
    await command(line.trim())
  } catch {
    report({ check: line.trim(), passed: false })
  } finally {
    busy = false
    report({ ready: true })
  }
})
report({ ready: true })
