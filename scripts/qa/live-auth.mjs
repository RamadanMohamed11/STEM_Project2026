import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Explicitly opted-in production QA. No emails are sent by this script; it requires
// the previously approved auto-confirm configuration. No passwords or tokens are logged.
assert.equal(
  process.env.T35_RUN_LIVE_AUTH,
  '1',
  'Live fixture creation requires an explicit opt-in.',
)
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
assert.equal(url, 'https://pnwauxgwfvmsxemsbvfw.supabase.co')
const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
assert.equal(settingsResponse.status, 200)
assert.equal(
  (await settingsResponse.json()).mailer_autoconfirm,
  true,
  'Email confirmation enabled: use controlled mailboxes instead.',
)
const marker = `T35-QA-${randomUUID()}`
const ids = []
const checks = []
const storage = [new Map(), new Map()]
const makeClient = (i) =>
  createClient(url, key, {
    auth: {
      storage: {
        getItem: (k) => storage[i].get(k) ?? null,
        setItem: (k, v) => storage[i].set(k, v),
        removeItem: (k) => storage[i].delete(k),
      },
      storageKey: `t35-${i}`,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
const clients = [makeClient(0), makeClient(1)]
const passwords = [randomBytes(32).toString('base64url'), randomBytes(32).toString('base64url')]
const emails = [0, 1].map((i) => `stem-qa-${marker.slice(7)}-${i}@example.com`)
mkdirSync('artifacts', { recursive: true })
function save() {
  writeFileSync(
    'artifacts/t35-live-auth.json',
    JSON.stringify({ marker, fixtureIds: ids, checks }, null, 2),
  )
}
async function check(name, action) {
  await action()
  checks.push({ name, passed: true })
  save()
  console.log(`PASS: ${name}`)
}
try {
  for (let i = 0; i < 2; i++)
    await check(
      `Student ${i + 1}: signup, profile, grade, verified least-privilege role`,
      async () => {
        const signup = await clients[i].auth.signUp({
          email: emails[i],
          password: passwords[i],
          options: {
            data: {
              full_name: `STEM QA Student ${i + 1}`,
              grade: `grade-secondary-${i + 1}`,
              test_fixture: marker,
              role: 'admin',
            },
          },
        })
        assert.equal(signup.error, null)
        assert.ok(signup.data.session)
        ids.push(signup.data.user.id)
        save()
        const profile = await clients[i].from('student_profiles').select('*').single()
        assert.equal(profile.error, null)
        assert.equal(profile.data.user_id, ids[i])
        assert.equal(profile.data.grade, `grade-secondary-${i + 1}`)
        const role = await clients[i].rpc('get_current_user_role')
        assert.equal(role.error, null)
        assert.equal(role.data, 'student', 'Metadata must never grant admin authority')
      },
    )
  await check('Separate students cannot read or update each other', async () => {
    for (let i = 0; i < 2; i++) {
      const other = ids[1 - i]
      const read = await clients[i].from('student_profiles').select('*').eq('user_id', other)
      assert.equal(read.error, null)
      assert.deepEqual(read.data, [])
      const update = await clients[i]
        .from('student_profiles')
        .update({ full_name: 'FORBIDDEN' })
        .eq('user_id', other)
        .select('user_id')
      assert.equal(update.error, null)
      assert.deepEqual(update.data, [])
    }
  })
  await check(
    'Own name and grade persist; invalid grade and protected fields are rejected',
    async () => {
      const update = await clients[0]
        .from('student_profiles')
        .update({ full_name: 'STEM QA Updated', grade: 'grade-secondary-3' })
        .eq('user_id', ids[0])
        .select('*')
        .single()
      assert.equal(update.error, null)
      assert.equal(update.data.grade, 'grade-secondary-3')
      const invalid = await clients[0]
        .from('student_profiles')
        .update({ grade: 'unknown-grade' })
        .eq('user_id', ids[0])
      assert.equal(invalid.error?.code, '23514')
      const forbidden = await clients[0]
        .from('student_profiles')
        .update({ created_at: new Date().toISOString() })
        .eq('user_id', ids[0])
      assert.equal(forbidden.error?.code, '42501')
    },
  )
  await check('Student cannot mutate published experiments or assign admin roles', async () => {
    const edit = await clients[0]
      .from('experiments')
      .update({ title: 'FORBIDDEN' })
      .eq('id', 'exp-salt-water-001')
      .select('id')
    assert.ok(edit.error?.code === '42501' || (!edit.error && edit.data?.length === 0))
    const grant = await clients[0].rpc('admin_assign_user_role', {
      target_user: ids[0],
      new_role: 'admin',
      reason: 'QA denied escalation check',
    })
    assert.equal(grant.error?.code, '42501')
    assert.equal((await clients[0].rpc('get_current_user_role')).data, 'student')
  })
  await check(
    'Logout, real password login, SDK restoration and server user verification',
    async () => {
      for (let i = 0; i < 2; i++) {
        assert.equal((await clients[i].auth.signOut({ scope: 'local' })).error, null)
        assert.equal((await clients[i].auth.getSession()).data.session, null)
        const login = await clients[i].auth.signInWithPassword({
          email: emails[i],
          password: passwords[i],
        })
        assert.equal(login.error, null)
        assert.equal(login.data.user.id, ids[i])
        const restored = makeClient(i)
        assert.equal((await restored.auth.getSession()).data.session?.user.id, ids[i])
        assert.equal((await restored.auth.getUser()).data.user?.id, ids[i])
        restored.auth.stopAutoRefresh()
      }
    },
  )
  await check('Invalid credentials return no session', async () => {
    const result = await clients[0].auth.signInWithPassword({
      email: emails[0],
      password: randomBytes(32).toString('base64url'),
    })
    assert.ok(result.error)
    assert.equal(result.data.session, null)
  })
} finally {
  for (const client of clients) {
    await client.auth.signOut({ scope: 'local' }).catch(() => {})
    client.auth.stopAutoRefresh()
  }
  for (const map of storage) map.clear()
  save()
}
