import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'

test('profile migration uses owner RLS and column privileges, with grade IDs matching the shared model', () => {
  // Static migration contract only. Live PostgreSQL/RLS execution is a separate check.
  const sql = readFileSync(
    new URL('../supabase/migrations/202611060001_student_profiles.sql', import.meta.url),
    'utf8',
  )
  assert.match(sql, /enable row level security/)
  assert.match(sql, /grant update \(full_name, grade\)/)
  assert.match(sql, /using \(\(select auth.uid\(\)\) = user_id\)/)
  assert.match(sql, /with check \(\(select auth.uid\(\)\) = user_id\)/)
  for (const grade of sampleGrades) assert.ok(sql.includes(`'${grade.id}'`))
  assert.match(sql, /after insert on auth.users/)
  assert.match(sql, /security definer set search_path = ''/)
  assert.doesNotMatch(sql, /grant insert|grant delete|grant all|service_role/)
})
test('only account route is guarded; existing laboratory stays public; configured forms keep their design', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const { createAuthService, unavailableAuth } = await vite.ssrLoadModule(
      '/src/features/auth/authService.ts',
    )
    const auth = createAuthService(null, '')
    const render = async (path, state) =>
      await renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { auth, state } },
          React.createElement(
            MemoryRouter,
            { initialEntries: [path] },
            React.createElement(AppRoutes),
          ),
        ),
      )
    const anonymous = { ...unavailableAuth, status: 'anonymous' }
    assert.doesNotMatch(await render('/account', anonymous), /<h1[^>]*>Your Profile/)
    assert.match(await render('/account', unavailableAuth), /not configured/)
    const authenticated = {
      ...anonymous,
      status: 'authenticated',
      user: { id: 'unit-user' },
      profile: { user_id: 'unit-user', full_name: 'Unit Student', grade: sampleGrades[2].id },
    }
    assert.match(await render('/account', authenticated), /Third Secondary Grade/)
    for (const path of ['/experiments/preview/lab', '/experiments/exp-salt-water-001/lab'])
      assert.match(await render(path, anonymous), /Immersive laboratory workspace/)
    assert.match(await render('/signup', anonymous), /Create your student account/)
    assert.doesNotMatch(await render('/signup', anonymous), /cannot create an account yet/)
    assert.match(await render('/login', anonymous), /Log in with your email and password/)
    assert.match(
      await render('/auth/callback', { ...anonymous, status: 'loading' }),
      /Checking your email confirmation/,
    )
  } finally {
    await vite.close()
  }
})
