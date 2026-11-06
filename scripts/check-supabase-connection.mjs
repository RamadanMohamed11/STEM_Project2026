import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

// Read-only / negative live probes. Never registers users or sends recovery emails.
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key?.startsWith('sb_publishable_'))
  throw new Error('Configure the approved URL and publishable key first.')
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
try {
  const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
  assert.equal(response.status, 200)
  const settings = await response.json()
  console.log(
    `PASS: Auth settings reachable; email confirmation required=${settings.mailer_autoconfirm === false}`,
  )
  const profile = await client.from('student_profiles').select('user_id').limit(1)
  assert.equal(profile.error?.code, '42501')
  console.log('PASS: anonymous profile reads denied by PostgreSQL permissions')
  const rejected = await client.auth.signInWithPassword({
    email: 'nonexistent-auth-check@example.invalid',
    password: 'invalid-credentials-probe-not-an-account',
  })
  assert.ok(rejected.error)
  assert.equal(rejected.data.session, null)
  assert.equal(rejected.data.user, null)
  assert.ok(['invalid_credentials', 'invalid_login_credentials'].includes(rejected.error.code))
  console.log('PASS: invalid credentials rejected; no authenticated session created')
  console.log(
    'This probe only checks connectivity and denied access. Use the opt-in live student test for registration, login, restoration, recovery requests and two-student RLS checks.',
  )
} catch {
  console.error(
    'Live connection probe failed. Check configuration and project settings; no credentials are printed.',
  )
  process.exitCode = 1
} finally {
  client.auth.stopAutoRefresh()
}
