import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { validateProfile, getOwnStudentProfile } from '../src/features/profile/profile.ts'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'
import { unavailableAuth } from '../src/features/auth/authService.ts'

test('profile validation accepts shared grades and rejects empty, long or unsupported values', () => {
  for (const grade of sampleGrades)
    assert.deepEqual(validateProfile({ fullName: ' Student Name ', grade: grade.id }), {})
  for (const fullName of ['', ' ', 'A', 'A'.repeat(101)])
    assert.ok(validateProfile({ fullName, grade: sampleGrades[0].id }).fullName)
  assert.ok(validateProfile({ fullName: 'Student', grade: 'unsupported' }).grade)
  assert.deepEqual(validateProfile({ fullName: 'A'.repeat(100), grade: sampleGrades[0].id }), {})
})

test('profile selector never returns another account or unauthenticated cached data', () => {
  const profile = { user_id: 'owner', full_name: 'Private Student', grade: sampleGrades[0].id }
  for (const status of ['anonymous', 'unavailable', 'loading', 'error'])
    assert.equal(
      getOwnStudentProfile({ ...unavailableAuth, status, user: { id: 'owner' }, profile }),
      null,
    )
  assert.equal(
    getOwnStudentProfile({
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'other' },
      profile,
    }),
    null,
  )
  assert.equal(
    getOwnStudentProfile({
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'owner' },
      profile,
    }),
    profile,
  )
})

test('both profile URLs remain protected and real profile fields are accessible and scoped', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const { StudentProfilePage } = await vite.ssrLoadModule('/src/pages/StudentProfilePage.tsx')
    const state = {
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'owner', email: 'unit@example.invalid' },
      profile: { user_id: 'owner', full_name: 'Profile Test Student', grade: sampleGrades[1].id },
    }
    const render = async (path, snapshot, page = React.createElement(AppRoutes)) =>
      await renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { state: snapshot, auth: {} } },
          React.createElement(MemoryRouter, { initialEntries: [path] }, page),
        ),
      )
    for (const path of ['/profile', '/account']) {
      const html = await render(path, state)
      assert.match(html, /Profile Test Student/)
      assert.match(html, /unit@example.invalid/)
      assert.match(html, /Account Information/)
      assert.match(html, /name="grade"/)
      assert.match(html, /Save Changes/)
      assert.doesNotMatch(html, /name="email"|name="user_id"|type="password"/)
      for (const status of ['anonymous', 'unavailable', 'error', 'loading']) {
        const restricted = await render(path, { ...state, status })
        assert.doesNotMatch(restricted, /Profile Test Student|unit@example.invalid/)
      }
    }
    const mismatch = await render(
      '/profile',
      { ...state, user: { id: 'other' } },
      React.createElement(StudentProfilePage),
    )
    assert.doesNotMatch(mismatch, /Profile Test Student|Save Changes/)
    assert.match(mismatch, /not available/)
  } finally {
    await vite.close()
  }
})
