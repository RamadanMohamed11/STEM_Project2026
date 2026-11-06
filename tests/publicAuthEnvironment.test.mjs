import assert from 'node:assert/strict'
import test from 'node:test'
import { validatePublicAuthEnvironment } from '../scripts/validate-public-auth-env.ts'
test('build rejects secrets before they can be embedded into a public bundle', () => {
  for (const env of [
    { VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not_a_real_key' },
    { VITE_SERVICE_ROLE_KEY: 'not-a-real-key' },
    { VITE_DATABASE_URL: 'not-a-real-url' },
    { VITE_SUPABASE_URL: 'https://user:password@example.com' },
  ])
    assert.throws(() => validatePublicAuthEnvironment(env))
  assert.doesNotThrow(() => validatePublicAuthEnvironment({}))
  assert.doesNotThrow(() =>
    validatePublicAuthEnvironment({
      VITE_SUPABASE_URL: 'https://project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_unit',
    }),
  )
})
