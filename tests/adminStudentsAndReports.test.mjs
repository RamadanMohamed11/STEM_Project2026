import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  filterReports,
  filterStudentsDirectory,
  getActiveAdminReportsState,
  getActiveAdminStudentsState,
} from '../src/features/admin/lib/adminStudentsAndReportsRepository.ts'
import {
  sampleAdminReports,
  sampleAdminStudents,
} from '../src/features/admin/data/sampleStudentsAndReports.ts'
import { routePaths } from '../src/app/paths.ts'
import { getPermissionsForRole } from '../src/features/auth/permissions.ts'

const ssrPermissions = (role) =>
  Object.fromEntries(getPermissionsForRole(role).map((p) => [p, true]))

const unavailableAuth = {
  isConfigured: true,
  isLoaded: true,
  configuredProvider: 'supabase',
  hasRecoverySession: false,
}

const adminState = {
  ...unavailableAuth,
  status: 'authenticated',
  user: { id: 'admin-001', email: 'admin@school.example' },
  role: 'admin',
  roleStatus: 'verified',
  permissions: ssrPermissions('admin'),
}

const studentState = {
  ...unavailableAuth,
  status: 'authenticated',
  user: { id: 'student-001', email: 'student@school.example' },
  role: 'student',
  roleStatus: 'verified',
  permissions: ssrPermissions('student'),
}

const anonState = {
  ...unavailableAuth,
  status: 'unauthenticated',
  user: null,
  role: 'student',
  roleStatus: 'unverified',
  permissions: {},
}

test('students directory filters by search query, academic grade, and completion progress', () => {
  assert.equal(sampleAdminStudents.length >= 5, true, 'At least 5 sample students')

  // Search by name
  const searchedOmar = filterStudentsDirectory(sampleAdminStudents, {
    searchQuery: 'Omar',
  })
  assert.equal(searchedOmar.length, 1)
  assert.equal(searchedOmar[0].fullName, 'Omar Hassan')

  // Search by email
  const searchedEmail = filterStudentsDirectory(sampleAdminStudents, {
    searchQuery: 'mariam.ahmed@student.edu.eg',
  })
  assert.equal(searchedEmail.length, 1)
  assert.equal(searchedEmail[0].fullName, 'Mariam Ahmed')

  // Filter by grade
  const grade1 = filterStudentsDirectory(sampleAdminStudents, {
    gradeFilter: 'grade-secondary-1',
  })
  assert.ok(grade1.length >= 2)
  for (const s of grade1) {
    assert.equal(s.grade, 'grade-secondary-1')
  }

  // Filter by completed progress
  const completedOnly = filterStudentsDirectory(sampleAdminStudents, {
    progressFilter: 'completed',
  })
  assert.ok(completedOnly.length >= 3)
  for (const s of completedOnly) {
    assert.ok(s.experimentsCompletedCount > 0)
  }

  // No matches
  const empty = filterStudentsDirectory(sampleAdminStudents, {
    searchQuery: 'nonexistent-student-xyz',
  })
  assert.equal(empty.length, 0)
})

test('reports filter by experiment title, secondary grade, and term', () => {
  assert.equal(sampleAdminReports.length >= 5, true, 'At least 5 sample experiment reports')

  // Search by title
  const searchedSalt = filterReports(sampleAdminReports, {
    searchQuery: 'Salt',
  })
  assert.equal(searchedSalt.length, 1)
  assert.equal(searchedSalt[0].experimentId, 'exp-salt-water-001')

  // Filter by grade
  const grade2Reports = filterReports(sampleAdminReports, {
    gradeFilter: 'Grade 2',
  })
  assert.ok(grade2Reports.length >= 2)
  for (const r of grade2Reports) {
    assert.ok(r.grade.includes('Grade 2'))
  }

  // Filter by term
  const term2Reports = filterReports(sampleAdminReports, {
    termFilter: 'Second Term',
  })
  assert.ok(term2Reports.length >= 1)
  for (const r of term2Reports) {
    assert.ok(r.term.includes('Second Term'))
  }

  // Most-missed question metadata exists
  const saltReport = sampleAdminReports.find((r) => r.experimentId === 'exp-salt-water-001')
  assert.ok(saltReport?.mostMissedQuestion)
  assert.equal(saltReport.mostMissedQuestion.questionId, 'q-salt-water-2')
  assert.equal(saltReport.mostMissedQuestion.missedPercentage, 50)
})

test('admin students page renders directory, details, and enforces read-only access control', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const auth = {
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    }

    const render = async (state) =>
      await renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { auth, state } },
          React.createElement(
            MemoryRouter,
            { initialEntries: [routePaths.adminStudents] },
            React.createElement(AppRoutes),
          ),
        ),
      )

    // 1. Unauthorized student access fails closed
    const studentMarkup = await render(studentState)
    assert.match(studentMarkup, /Access Denied/)
    assert.match(studentMarkup, /You Do Not Have Permission/)
    assert.doesNotMatch(studentMarkup, /Student Accounts Directory/)

    // 2. Anonymous access fails closed
    const anonMarkup = await render(anonState)
    assert.match(anonMarkup, /Sign In/)

    // 3. Authorized admin access renders complete students directory
    const adminMarkup = await render(adminState)
    assert.ok(adminMarkup.includes('Students Management Workspace'))
    assert.ok(adminMarkup.includes('Student Accounts Directory'))
    assert.ok(adminMarkup.includes('Total Students'))
    assert.ok(adminMarkup.includes('Active Learners'))
    assert.ok(adminMarkup.includes('Average Quiz Score'))
    assert.ok(adminMarkup.includes('Total Attempts'))
    assert.ok(adminMarkup.includes('RLS Protected Read-Only'))

    // Student entries rendered
    assert.ok(adminMarkup.includes('Omar Hassan'))
    assert.ok(adminMarkup.includes('omar.hassan@student.edu.eg'))
    assert.ok(adminMarkup.includes('Mariam Ahmed'))
    assert.ok(adminMarkup.includes('mariam.ahmed@student.edu.eg'))
    assert.ok(adminMarkup.includes('First Secondary Grade'))
    assert.ok(adminMarkup.includes('Third Secondary Grade'))

    // Action buttons rendered
    assert.ok(adminMarkup.includes('View Details'))

    // Strictly read-only: no edit or delete controls
    assert.doesNotMatch(adminMarkup, /Edit Student/)
    assert.doesNotMatch(adminMarkup, /Delete Student/)
    assert.doesNotMatch(adminMarkup, /Remove Account/)

    // English-only check: zero Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(adminMarkup),
      false,
      'Admin students page must contain strictly English text',
    )
  } finally {
    await vite.close()
  }
})

test('admin reports page renders analytics, attempts, most-missed questions, and blocks unauthorized users', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const auth = {
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    }

    const render = async (state) =>
      await renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { auth, state } },
          React.createElement(
            MemoryRouter,
            { initialEntries: [routePaths.adminReports] },
            React.createElement(AppRoutes),
          ),
        ),
      )

    // 1. Unauthorized student access fails closed
    const studentMarkup = await render(studentState)
    assert.match(studentMarkup, /Access Denied/)
    assert.match(studentMarkup, /You Do Not Have Permission/)
    assert.doesNotMatch(studentMarkup, /Experiment Performance Reports/)

    // 2. Authorized admin access renders reports workspace
    const adminMarkup = await render(adminState)
    assert.ok(adminMarkup.includes('Reports Management Workspace'))
    assert.ok(adminMarkup.includes('Experiment Performance Reports'))
    assert.ok(adminMarkup.includes('Completed Labs'))
    assert.ok(adminMarkup.includes('Quiz Attempts'))
    assert.ok(adminMarkup.includes('Tracked Experiments'))
    assert.ok(adminMarkup.includes('Aggregated Analytics'))

    // Experiments listed
    assert.ok(adminMarkup.includes('Dissolving Salt in Water'))
    assert.ok(adminMarkup.includes('exp-salt-water-001'))
    assert.ok(adminMarkup.includes('Measuring Liquid Volume'))
    assert.ok(adminMarkup.includes('Electrical Conductivity of Solutions'))

    // Most-missed questions flagged
    assert.ok(adminMarkup.includes('50% missed'))
    assert.ok(adminMarkup.includes('100% missed'))
    assert.ok(adminMarkup.includes('No difficult questions'))

    // Question breakdown action
    assert.ok(adminMarkup.includes('Questions'))

    // English-only check
    assert.equal(
      /[\u0600-\u06FF]/.test(adminMarkup),
      false,
      'Admin reports page must contain strictly English text',
    )
  } finally {
    await vite.close()
  }
})

test('admin students and reports pages handle empty state gracefully', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AdminStudentsPage } = await vite.ssrLoadModule('/src/pages/AdminStudentsPage.tsx')
    const { AdminReportsPage } = await vite.ssrLoadModule('/src/pages/AdminReportsPage.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')

    const auth = {
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      refreshSession: async () => {},
    }

    const emptyStudentsMarkup = await renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { auth, state: adminState } },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminStudentsPage, {
            initialState: { students: [], totalCount: 0, lastRefreshedAt: new Date().toISOString() },
          }),
        ),
      ),
    )
    assert.ok(emptyStudentsMarkup.includes('No students match your criteria'))

    const emptyReportsMarkup = await renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { auth, state: adminState } },
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(AdminReportsPage, {
            initialState: {
              reports: [],
              overallAverageScorePercent: null,
              totalCompletedLabs: 0,
              totalQuizAttempts: 0,
              lastRefreshedAt: new Date().toISOString(),
            },
          }),
        ),
      ),
    )
    assert.ok(emptyReportsMarkup.includes('No experiment reports found'))
  } finally {
    await vite.close()
  }
})
