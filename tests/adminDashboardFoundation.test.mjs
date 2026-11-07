import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { getActiveNavigationId, getPageContext } from '../src/app/navigation.ts'
import { routePaths } from '../src/app/paths.ts'
import {
  adminNavigationItems,
  getActiveAdminNavItem,
  getAdminBreadcrumbs,
} from '../src/features/admin/config/adminNavigation.ts'
import {
  computeAdminCatalogMetrics,
  fetchAuthorizedStudentCount,
} from '../src/features/admin/lib/adminMetrics.ts'
import { getPermissionsForRole } from '../src/features/auth/permissions.ts'

test('admin navigation config, route paths, and breadcrumb selectors resolve all 6 admin sections', () => {
  assert.deepEqual(
    adminNavigationItems.map((item) => [item.label, item.to]),
    [
      ['Dashboard', '/admin'],
      ['Curriculum', '/admin/curriculum'],
      ['Experiments', '/admin/experiments'],
      ['Questions', '/admin/questions'],
      ['Students', '/admin/students'],
      ['Reports', '/admin/reports'],
    ],
  )

  for (const [path, expectedId, expectedContext] of [
    [routePaths.admin, 'dashboard', 'Admin'],
    [routePaths.adminCurriculum, 'curriculum', 'Curriculum'],
    [routePaths.adminExperiments, 'experiments', 'Experiments'],
    [routePaths.adminQuestions, 'questions', 'Questions'],
    [routePaths.adminStudents, 'students', 'Students'],
    [routePaths.adminReports, 'reports', 'Reports'],
  ]) {
    assert.equal(getActiveAdminNavItem(path).id, expectedId, path)
    assert.equal(getActiveNavigationId(path), 'admin', path)
    assert.equal(getPageContext(path), expectedContext, path)
  }

  assert.deepEqual(getAdminBreadcrumbs('/admin'), [
    { label: 'Admin', to: '/admin' },
    { label: 'Dashboard' },
  ])
  assert.deepEqual(getAdminBreadcrumbs('/admin/experiments'), [
    { label: 'Admin', to: '/admin' },
    { label: 'Dashboard', to: '/admin' },
    { label: 'Experiments' },
  ])
})

test('dashboard metrics compute real catalog counts and never fabricate unavailable or unauthorized student counts', async () => {
  // 1. Default repository catalog metrics
  const defaultMetrics = computeAdminCatalogMetrics()
  assert.equal(defaultMetrics.status, 'available')
  assert.equal(defaultMetrics.totalExperiments, 3)
  assert.equal(defaultMetrics.publishedExperiments, 1)
  assert.equal(defaultMetrics.draftExperiments, 2)
  assert.equal(defaultMetrics.availableAssessments, 1)
  assert.equal(defaultMetrics.totalAssessmentDefinitions, 3)
  assert.equal(defaultMetrics.totalValidatedQuestions, 6)

  // 2. Empty catalog and assessment lists
  const emptyMetrics = computeAdminCatalogMetrics([], [])
  assert.equal(emptyMetrics.status, 'empty')
  assert.equal(emptyMetrics.totalExperiments, 0)
  assert.equal(emptyMetrics.publishedExperiments, 0)
  assert.equal(emptyMetrics.draftExperiments, 0)
  assert.equal(emptyMetrics.availableAssessments, 0)

  // 3. Unavailable catalog sources
  const unavailableMetrics = computeAdminCatalogMetrics(null, null)
  assert.equal(unavailableMetrics.status, 'unavailable')
  assert.equal(unavailableMetrics.totalExperiments, null)
  assert.equal(unavailableMetrics.publishedExperiments, null)
  assert.equal(unavailableMetrics.draftExperiments, null)
  assert.equal(unavailableMetrics.availableAssessments, null)

  // 4. Student count helper rejects non-admins and handles missing/failing Supabase client honestly
  const studentAuthState = {
    status: 'authenticated',
    role: 'student',
    roleStatus: 'verified',
    permissions: getPermissionsForRole('student'),
  }
  const adminAuthState = {
    status: 'authenticated',
    role: 'admin',
    roleStatus: 'verified',
    permissions: getPermissionsForRole('admin'),
  }

  const unauthorizedCount = await fetchAuthorizedStudentCount({}, studentAuthState)
  assert.equal(unauthorizedCount.status, 'unavailable')
  assert.equal(unauthorizedCount.count, null)

  const unconfiguredCount = await fetchAuthorizedStudentCount(null, adminAuthState)
  assert.equal(unconfiguredCount.status, 'unavailable')
  assert.equal(unconfiguredCount.count, null)

  const mockClient = {
    from(table) {
      assert.equal(table, 'user_role_assignments')
      return {
        select(column, opts) {
          assert.equal(column, 'user_id')
          assert.deepEqual(opts, { count: 'exact', head: true })
          return {
            async eq(col, val) {
              assert.equal(col, 'role')
              assert.equal(val, 'student')
              return { count: 18, error: null }
            },
          }
        },
      }
    },
  }
  const authorizedCount = await fetchAuthorizedStudentCount(mockClient, adminAuthState)
  assert.equal(authorizedCount.status, 'available')
  assert.equal(authorizedCount.count, 18)
})

test('AdminLayout, Dashboard Overview, and all 6 admin routes enforce authorization and render required labels', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const [
      { AppRoutes },
      { AuthContext },
      { createAuthService, unavailableAuth },
      { getPermissionsForRole: ssrPermissions },
      { AdminFoundationPage },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/app/routes.tsx'),
      vite.ssrLoadModule('/src/features/auth/authContext.ts'),
      vite.ssrLoadModule('/src/features/auth/authService.ts'),
      vite.ssrLoadModule('/src/features/auth/permissions.ts'),
      vite.ssrLoadModule('/src/pages/AdminFoundationPage.tsx'),
    ])

    const auth = createAuthService(null, '')
    const renderRoute = (path, state) =>
      renderToStaticMarkup(
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

    // 1. Verify /admin dashboard overview for authorized admin
    const dashboardHtml = renderRoute('/admin', adminState)
    for (const requiredLabel of [
      'Dashboard',
      'Curriculum',
      'Experiments',
      'Questions',
      'Students',
      'Reports',
      'Sign Out',
      'Total Students',
      'Total Experiments',
      'Published Experiments',
      'Draft Experiments',
      'Available Assessments',
      'Unavailable',
    ]) {
      assert.ok(
        dashboardHtml.includes(requiredLabel),
        `Expected /admin markup to include "${requiredLabel}"`,
      )
    }
    assert.match(dashboardHtml, /aria-label="Admin sidebar"/)
    assert.match(dashboardHtml, /aria-label="Admin header"/)
    assert.match(dashboardHtml, /id="admin-mobile-navigation"/)
    assert.match(dashboardHtml, /aria-label="Breadcrumb"/)

    // 2. Verify populated Total Students when authorized count is available
    const populatedOverviewHtml = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { auth, state: adminState } },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin'] },
          React.createElement(AdminFoundationPage, {
            studentCountOverride: {
              status: 'available',
              count: 24,
              message: 'Verified student role assignments in Supabase.',
            },
          }),
        ),
      ),
    )
    assert.match(populatedOverviewHtml, />24</)
    assert.match(populatedOverviewHtml, /Verified student role assignments in Supabase/)

    // 3. Verify all 5 admin subroutes render for authorized admin and block unauthorized users
    for (const [subPath, sectionHeading, isPlaceholder] of [
      [routePaths.adminCurriculum, 'Curriculum Management Workspace', false],
      [routePaths.adminExperiments, 'Experiments Management Workspace', false],
      [routePaths.adminQuestions, 'Questions Management Workspace', true],
      [routePaths.adminStudents, 'Students Management Workspace', true],
      [routePaths.adminReports, 'Reports Management Workspace', true],
    ]) {
      const adminSubMarkup = renderRoute(subPath, adminState)
      assert.ok(adminSubMarkup.includes(sectionHeading), `Admin should see ${sectionHeading}`)
      if (isPlaceholder) {
        assert.match(adminSubMarkup, /Scheduled Module/)
      }
      assert.match(adminSubMarkup, /aria-label="Admin sidebar"/)

      // Student cannot access any admin subroute
      const deniedStudentMarkup = renderRoute(subPath, studentState)
      assert.match(deniedStudentMarkup, /Access Denied/)
      assert.match(deniedStudentMarkup, /You Do Not Have Permission/)
      assert.doesNotMatch(deniedStudentMarkup, new RegExp(sectionHeading))
      assert.doesNotMatch(deniedStudentMarkup, /aria-label="Admin sidebar"/)
    }
  } finally {
    await vite.close()
  }
})
