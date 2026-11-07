import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { getActiveNavigationId, getPageContext } from '../src/app/navigation.ts'
import { routePaths } from '../src/app/paths.ts'
import { createAuthService, unavailableAuth } from '../src/features/auth/authService.ts'
import {
  APP_ROLES,
  canAccessAdminPortal,
  DEFAULT_APP_ROLE,
  getPermissionsForRole,
  hasPermission,
  hasRole,
  isValidAppRole,
  ROLE_PERMISSIONS_MATRIX,
} from '../src/features/auth/permissions.ts'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'

function createRbacFixture({
  initialSession = null,
  rolesByUserId = {},
  profilesByUserId = {},
  rpcHandler = null,
} = {}) {
  let authCallback
  let activeSession = initialSession
  const calls = []

  const makeUser = (id, confirmed = true, extraMeta = {}) => ({
    id,
    email: `${id}@school.example`,
    email_confirmed_at: confirmed ? '2026-01-01T00:00:00.000Z' : undefined,
    user_metadata: { full_name: `User ${id}`, grade: sampleGrades[0].id, ...extraMeta },
    app_metadata: { ...extraMeta },
  })

  const api = {
    auth: {
      onAuthStateChange(fn) {
        authCallback = fn
        return {
          data: {
            subscription: {
              unsubscribe() {
                authCallback = undefined
              },
            },
          },
        }
      },
      async getSession() {
        return { data: { session: activeSession }, error: null }
      },
      async getUser() {
        return { data: { user: activeSession?.user ?? null }, error: null }
      },
      async signUp(input) {
        calls.push(['signup', input])
        return { data: { user: makeUser('new-student'), session: null }, error: null }
      },
      async signInWithPassword(input) {
        calls.push(['login', input])
        return { data: { user: activeSession?.user ?? null, session: activeSession }, error: null }
      },
      async signOut(input) {
        calls.push(['logout', input])
        activeSession = null
        authCallback?.('SIGNED_OUT', null)
        return { error: null }
      },
    },
    from(table) {
      let targetUserId = null
      return {
        select(columns) {
          calls.push(['select', table, columns])
          return this
        },
        eq(column, value) {
          assert.equal(column, 'user_id')
          targetUserId = value
          return this
        },
        async single() {
          if (table === 'student_profiles') {
            const p = profilesByUserId[targetUserId] ?? {
              user_id: targetUserId,
              full_name: `Student ${targetUserId}`,
              grade: sampleGrades[0].id,
              created_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-01T00:00:00.000Z',
            }
            return { data: p, error: null }
          }
          if (table === 'user_role_assignments') {
            const roleRecord = rolesByUserId[targetUserId]
            if (roleRecord instanceof Error) {
              return { data: null, error: { message: roleRecord.message } }
            }
            if (roleRecord === null) {
              return { data: null, error: { message: 'Row not found' } }
            }
            const roleValue =
              typeof roleRecord === 'string' ? roleRecord : (roleRecord?.role ?? 'student')
            return {
              data: {
                user_id: targetUserId,
                role: roleValue,
                assigned_by: null,
                assignment_reason: 'Test role assignment',
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
              },
              error: null,
            }
          }
          return { data: null, error: { message: `Unexpected table ${table}` } }
        },
      }
    },
    async rpc(fnName, params) {
      calls.push(['rpc', fnName, params])
      if (rpcHandler) {
        return rpcHandler(fnName, params, activeSession)
      }
      const callerId = activeSession?.user?.id
      const callerRole = rolesByUserId[callerId] ?? 'student'
      if (fnName === 'admin_assign_user_role') {
        if (callerRole !== 'admin') {
          return {
            data: null,
            error: {
              code: '42501',
              message: 'Access denied: admin:assign_roles permission is required.',
            },
          }
        }
        rolesByUserId[params.target_user] = params.new_role
        return {
          data: {
            user_id: params.target_user,
            role: params.new_role,
            assigned_by: callerId,
            assignment_reason: params.reason,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          error: null,
        }
      }
      return { data: null, error: { message: `Unknown RPC ${fnName}` } }
    },
  }

  return {
    api,
    calls,
    makeUser,
    makeSession(id, confirmed = true, extraMeta = {}) {
      return { user: makeUser(id, confirmed, extraMeta) }
    },
    setRole(userId, role) {
      rolesByUserId[userId] = role
    },
    emit(event, session) {
      activeSession = session
      authCallback?.(event, session)
    },
  }
}

async function waitUntil(predicate) {
  for (let i = 0; i < 120; i += 1) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  assert.fail('Condition did not settle in time')
}

test('T30 database migration enforces RLS, least-privilege grants, default student trigger, and audited RPCs', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/202611070002_user_roles_and_permissions.sql', import.meta.url),
    'utf8',
  )

  assert.match(sql, /create table if not exists public\.user_role_assignments/)
  assert.match(sql, /check \(role in \('student', 'instructor', 'admin'\)\)/)
  assert.match(sql, /create table if not exists public\.role_permissions/)
  assert.match(sql, /create table if not exists public\.admin_role_audit_log/)
  assert.match(sql, /alter table public\.user_role_assignments enable row level security/)
  assert.match(sql, /alter table public\.user_role_assignments force row level security/)
  assert.match(sql, /alter table public\.role_permissions enable row level security/)
  assert.match(sql, /alter table public\.admin_role_audit_log enable row level security/)
  assert.match(sql, /revoke all on public\.user_role_assignments from public, anon, authenticated/)
  assert.match(sql, /grant select on public\.user_role_assignments to authenticated/)
  assert.match(sql, /create or replace function private\.assign_default_student_role\(\)/)
  assert.match(sql, /create or replace function private\.bootstrap_assign_user_role\(/)
  assert.match(sql, /create or replace function public\.admin_assign_user_role\(/)
  assert.match(sql, /security definer\s+set search_path = ''/)
  assert.doesNotMatch(
    sql,
    /grant insert|grant update|grant delete|grant all|service_role/i,
  )
})

test('role and permission matrix enforces least privilege and fails closed on unverified state', () => {
  assert.deepEqual(APP_ROLES, ['student', 'instructor', 'admin'])
  assert.equal(DEFAULT_APP_ROLE, 'student')

  for (const r of ['student', 'instructor', 'admin']) {
    assert.equal(isValidAppRole(r), true)
  }
  for (const invalid of [null, undefined, '', 'superuser', 'root', 'teacher', 123, {}]) {
    assert.equal(isValidAppRole(invalid), false)
    assert.deepEqual(getPermissionsForRole(invalid), [])
  }

  // Student permissions
  assert.deepEqual(ROLE_PERMISSIONS_MATRIX.student, [
    'content:view',
    'account:manage_own',
    'experiments:execute',
    'progress:manage_own',
  ])
  assert.equal(ROLE_PERMISSIONS_MATRIX.student.includes('admin:access_portal'), false)

  // Instructor permissions (scoped; no admin permissions)
  assert.equal(
    ROLE_PERMISSIONS_MATRIX.instructor.includes('instructor:view_assigned_resources'),
    true,
  )
  assert.equal(ROLE_PERMISSIONS_MATRIX.instructor.includes('admin:access_portal'), false)
  assert.equal(ROLE_PERMISSIONS_MATRIX.instructor.includes('admin:assign_roles'), false)

  // Admin permissions
  assert.equal(ROLE_PERMISSIONS_MATRIX.admin.includes('admin:access_portal'), true)
  assert.equal(ROLE_PERMISSIONS_MATRIX.admin.includes('admin:manage_content'), true)
  assert.equal(ROLE_PERMISSIONS_MATRIX.admin.includes('admin:view_audit_logs'), true)
  assert.equal(ROLE_PERMISSIONS_MATRIX.admin.includes('admin:assign_roles'), true)

  // Helpers fail closed unless status === 'authenticated' and roleStatus === 'verified'
  for (const badState of [
    null,
    undefined,
    { status: 'anonymous', role: 'admin', roleStatus: 'verified' },
    { status: 'loading', role: 'admin', roleStatus: 'verified' },
    { status: 'error', role: 'admin', roleStatus: 'verified' },
    { status: 'authenticated', role: 'admin', roleStatus: 'loading' },
    { status: 'authenticated', role: 'admin', roleStatus: 'error' },
    { status: 'authenticated', role: null, roleStatus: 'verified' },
  ]) {
    assert.equal(hasRole(badState, 'admin'), false)
    assert.equal(hasPermission(badState, 'admin:access_portal'), false)
    assert.equal(canAccessAdminPortal(badState), false)
  }

  const verifiedAdmin = {
    status: 'authenticated',
    role: 'admin',
    roleStatus: 'verified',
    permissions: getPermissionsForRole('admin'),
  }
  assert.equal(hasRole(verifiedAdmin, 'admin'), true)
  assert.equal(hasPermission(verifiedAdmin, 'admin:access_portal'), true)
  assert.equal(canAccessAdminPortal(verifiedAdmin), true)
})

test('separate identities (student, instructor, admin) enforce role boundaries, ignore forged metadata, and reflect role changes on refresh', async () => {
  const f = createRbacFixture({
    rolesByUserId: {
      'user-student': 'student',
      'user-instructor': 'instructor',
      'user-admin': 'admin',
    },
  })

  // 1. Registration strips any attempted role injection
  const auth = createAuthService(f.api, 'https://school.example')
  await auth.register({
    fullName: 'New Student',
    email: 'new@school.example',
    password: 'valid-password-123',
    grade: sampleGrades[0].id,
    role: 'admin',
    is_admin: true,
  })
  const signupCall = f.calls.find((c) => c[0] === 'signup')
  assert.deepEqual(signupCall[1].options.data, {
    full_name: 'New Student',
    grade: sampleGrades[0].id,
  })

  // 2. Student with forged user_metadata.role='admin' still resolves strictly as 'student' from DB
  const stop = auth.start()
  f.emit(
    'SIGNED_IN',
    f.makeSession('user-student', true, { role: 'admin', is_admin: true }),
  )
  await waitUntil(() => auth.getSnapshot().roleStatus === 'verified')

  assert.equal(auth.getSnapshot().role, 'student')
  assert.equal(canAccessAdminPortal(auth.getSnapshot()), false)
  await assert.rejects(
    () => auth.assignUserRole('user-student', 'admin', 'Self promotion attempt'),
    /do not have permission/i,
  )

  // Even if someone calls the underlying Supabase RPC directly as a student, DB policy rejects it
  const directRpcAttempt = await f.api.rpc('admin_assign_user_role', {
    target_user: 'user-student',
    new_role: 'admin',
    reason: 'Direct API bypass attempt',
  })
  assert.ok(directRpcAttempt.error)
  assert.equal(directRpcAttempt.error.code, '42501')

  // 3. Switch to Instructor identity -> verified as 'instructor', cannot access admin portal or assign roles
  f.emit('SIGNED_IN', f.makeSession('user-instructor'))
  await waitUntil(
    () =>
      auth.getSnapshot().user?.id === 'user-instructor' &&
      auth.getSnapshot().roleStatus === 'verified',
  )
  assert.equal(auth.getSnapshot().role, 'instructor')
  assert.equal(hasPermission(auth.getSnapshot(), 'instructor:view_assigned_resources'), true)
  assert.equal(canAccessAdminPortal(auth.getSnapshot()), false)
  await assert.rejects(
    () => auth.assignUserRole('user-student', 'instructor', 'Instructor trying to assign role'),
    /do not have permission/i,
  )

  // 4. Switch to Administrator identity -> verified as 'admin', can perform permitted role assignment
  f.emit('SIGNED_IN', f.makeSession('user-admin'))
  await waitUntil(
    () =>
      auth.getSnapshot().user?.id === 'user-admin' &&
      auth.getSnapshot().roleStatus === 'verified',
  )
  assert.equal(auth.getSnapshot().role, 'admin')
  assert.equal(canAccessAdminPortal(auth.getSnapshot()), true)

  const updatedAssignment = await auth.assignUserRole(
    'user-student',
    'instructor',
    'Authorized promotion to laboratory instructor',
  )
  assert.equal(updatedAssignment.role, 'instructor')
  assert.equal(updatedAssignment.assigned_by, 'user-admin')

  // Admin cannot remove their own admin role
  await assert.rejects(
    () => auth.assignUserRole('user-admin', 'student', 'Self demotion'),
    /cannot remove their own admin role/i,
  )

  // 5. Role changes are reflected when user-student refreshes session/token
  f.emit('SIGNED_IN', f.makeSession('user-student'))
  await waitUntil(
    () =>
      auth.getSnapshot().user?.id === 'user-student' &&
      auth.getSnapshot().roleStatus === 'verified',
  )
  assert.equal(auth.getSnapshot().role, 'instructor')

  // Admin promotes user-student to admin in DB, and token refresh updates snapshot
  f.setRole('user-student', 'admin')
  await auth.refreshAuthorization()
  assert.equal(auth.getSnapshot().role, 'admin')
  assert.equal(canAccessAdminPortal(auth.getSnapshot()), true)

  // 6. Corrupt or failing role lookup fails closed
  f.setRole('user-student', 'invalid-corrupt-role')
  await auth.refreshAuthorization()
  assert.equal(auth.getSnapshot().roleStatus, 'error')
  assert.equal(auth.getSnapshot().role, null)
  assert.equal(canAccessAdminPortal(auth.getSnapshot()), false)

  stop()
})

test('frontend /admin route boundary and navigation enforce roles and required English labels', async () => {
  assert.equal(getActiveNavigationId(routePaths.admin), 'admin')
  assert.equal(getPageContext(routePaths.admin), 'Admin')

  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const { createAuthService: createSsrAuthService, unavailableAuth: ssrUnavailable } =
      await vite.ssrLoadModule('/src/features/auth/authService.ts')
    const { getPermissionsForRole: ssrGetPermissions } = await vite.ssrLoadModule(
      '/src/features/auth/permissions.ts',
    )

    const auth = createSsrAuthService(null, '')
    const renderAt = (path, state) =>
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

    // 1. Anonymous user changing browser URL to /admin -> Access Denied + Sign In + Back to Home
    const anonMarkup = renderAt('/admin', { ...ssrUnavailable, status: 'anonymous' })
    assert.match(anonMarkup, /Access Denied/)
    assert.match(anonMarkup, /You Do Not Have Permission/)
    assert.match(anonMarkup, />Sign In</)
    assert.match(anonMarkup, />Back to Home</)
    assert.doesNotMatch(anonMarkup, /Verified Administrator Session/)

    // 2. Loading state on /admin -> Checking your permissions
    const loadingMarkup = renderAt('/admin', {
      ...ssrUnavailable,
      status: 'authenticated',
      user: { id: 'u1', email: 'u1@school.example' },
      roleStatus: 'loading',
    })
    assert.match(loadingMarkup, /Checking your permissions/)
    assert.doesNotMatch(loadingMarkup, /Verified Administrator Session/)

    // 3. Authenticated Student visiting /admin -> Access Denied + You Do Not Have Permission + Back to Home
    const studentState = {
      ...ssrUnavailable,
      status: 'authenticated',
      user: { id: 'u-student', email: 'student@school.example' },
      role: 'student',
      roleStatus: 'verified',
      permissions: ssrGetPermissions('student'),
    }
    const studentMarkup = renderAt('/admin', studentState)
    assert.match(studentMarkup, /Access Denied/)
    assert.match(studentMarkup, /You Do Not Have Permission/)
    assert.match(studentMarkup, />Back to Home</)
    assert.doesNotMatch(studentMarkup, /Verified Administrator Session/)
    assert.doesNotMatch(studentMarkup, /href="\/admin"/)

    // 4. Authenticated Instructor visiting /admin -> Access Denied
    const instructorState = {
      ...ssrUnavailable,
      status: 'authenticated',
      user: { id: 'u-instructor', email: 'instructor@school.example' },
      role: 'instructor',
      roleStatus: 'verified',
      permissions: ssrGetPermissions('instructor'),
    }
    const instructorMarkup = renderAt('/admin', instructorState)
    assert.match(instructorMarkup, /Access Denied/)
    assert.match(instructorMarkup, /You Do Not Have Permission/)
    assert.doesNotMatch(instructorMarkup, /Verified Administrator Session/)
    assert.doesNotMatch(instructorMarkup, /href="\/admin"/)

    // 5. Verified Administrator visiting /admin -> Renders Admin foundation page & Admin nav link
    const adminState = {
      ...ssrUnavailable,
      status: 'authenticated',
      user: { id: 'u-admin', email: 'admin@school.example' },
      role: 'admin',
      roleStatus: 'verified',
      permissions: ssrGetPermissions('admin'),
    }
    const adminMarkup = renderAt('/admin', adminState)
    assert.match(adminMarkup, /<h1[^>]*>Admin<\/h1>/)
    assert.match(adminMarkup, /Verified Administrator Session/)
    assert.match(adminMarkup, /admin:access_portal/)
    assert.match(adminMarkup, /admin:assign_roles/)
    assert.match(adminMarkup, /href="\/admin"/)
    assert.match(adminMarkup, />Back to Home</)
  } finally {
    await vite.close()
  }
})
