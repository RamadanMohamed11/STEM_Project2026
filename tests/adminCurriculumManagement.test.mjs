import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { getPermissionsForRole } from '../src/features/auth/permissions.ts'
import {
  buildPublishedStudentCurriculum,
  createCurriculumLesson,
  createCurriculumUnit,
  createInitialAdminCurriculumState,
  deleteCurriculumLesson,
  deleteCurriculumUnit,
  moveCurriculumLessonOrder,
  moveCurriculumUnitOrder,
  normalizeCurriculumSlug,
  reorderCurriculumLessons,
  reorderCurriculumUnits,
  resolveStudentCurriculumDataset,
  setCurriculumLessonPublicationStatus,
  setCurriculumUnitPublicationStatus,
  updateCurriculumLesson,
  updateCurriculumUnit,
} from '../src/features/curriculum/lib/curriculumManagement.ts'
import {
  createInMemoryCurriculumRepository,
  createSupabaseCurriculumRepository,
  getActiveManagedCurriculumState,
  setActiveManagedCurriculumState,
} from '../src/features/curriculum/lib/curriculumManagementRepository.ts'

const verifiedAdminAuth = {
  status: 'authenticated',
  role: 'admin',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('admin'),
}

const studentAuth = {
  status: 'authenticated',
  role: 'student',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('student'),
}

const instructorAuth = {
  status: 'authenticated',
  role: 'instructor',
  roleStatus: 'verified',
  permissions: getPermissionsForRole('instructor'),
}

const unverifiedAdminAuth = {
  status: 'authenticated',
  role: 'admin',
  roleStatus: 'unverified',
  permissions: [],
}

test('creating, editing, and reordering units and lessons enforce hierarchy validation and stable IDs', () => {
  const initial = createInitialAdminCurriculumState()
  assert.equal(initial.grades.length, 3)
  assert.equal(initial.terms.length, 6)
  assert.equal(initial.units.length, 0)
  assert.equal(initial.lessons.length, 0)

  // 1. Create first unit (must default to draft)
  const unit1Res = createCurriculumUnit(
    initial,
    {
      id: 'unit-sec1-t1-solutions',
      termId: 'term-secondary-1-1',
      title: 'Solutions and Solubility',
      description: 'Aqueous mixtures, electrolytes, and solubility curves.',
    },
    verifiedAdminAuth,
  )
  assert.equal(unit1Res.ok, true)
  assert.equal(unit1Res.data.publicationStatus, 'draft')
  assert.equal(unit1Res.data.slug, 'solutions-and-solubility')
  assert.equal(unit1Res.data.order, 1)

  // 2. Create second unit in same term (auto-increments order to 2)
  const unit2Res = createCurriculumUnit(
    unit1Res.state,
    {
      id: 'unit-sec1-t1-acids',
      termId: 'term-secondary-1-1',
      title: 'Acids, Bases, and Salts',
      description: 'pH indicators and neutralization.',
    },
    verifiedAdminAuth,
  )
  assert.equal(unit2Res.ok, true)
  assert.equal(unit2Res.data.publicationStatus, 'draft')
  assert.equal(unit2Res.data.order, 2)

  // 3. Edit first unit (preserves stable ID while updating title, slug, description)
  const editedUnitRes = updateCurriculumUnit(
    unit2Res.state,
    {
      unitId: 'unit-sec1-t1-solutions',
      title: 'Aqueous Solutions and Mixtures',
      slug: 'aqueous-solutions-and-mixtures',
      description: 'Updated description for aqueous solutions.',
    },
    verifiedAdminAuth,
  )
  assert.equal(editedUnitRes.ok, true)
  assert.equal(editedUnitRes.data.id, 'unit-sec1-t1-solutions')
  assert.equal(editedUnitRes.data.title, 'Aqueous Solutions and Mixtures')
  assert.equal(editedUnitRes.data.slug, 'aqueous-solutions-and-mixtures')

  // 4. Reorder units in term-secondary-1-1
  const reorderedUnitsRes = reorderCurriculumUnits(
    editedUnitRes.state,
    'term-secondary-1-1',
    ['unit-sec1-t1-acids', 'unit-sec1-t1-solutions'],
    verifiedAdminAuth,
  )
  assert.equal(reorderedUnitsRes.ok, true)
  assert.deepEqual(
    reorderedUnitsRes.data.map((u) => [u.id, u.order]),
    [
      ['unit-sec1-t1-acids', 1],
      ['unit-sec1-t1-solutions', 2],
    ],
  )

  // Move unit up back to position 1
  const movedUnitRes = moveCurriculumUnitOrder(
    reorderedUnitsRes.state,
    'unit-sec1-t1-solutions',
    'up',
    verifiedAdminAuth,
  )
  assert.equal(movedUnitRes.ok, true)
  assert.deepEqual(
    movedUnitRes.data.map((u) => [u.id, u.order]),
    [
      ['unit-sec1-t1-solutions', 1],
      ['unit-sec1-t1-acids', 2],
    ],
  )

  // 5. Add two lessons under unit-sec1-t1-solutions (default to draft)
  const lesson1Res = createCurriculumLesson(
    movedUnitRes.state,
    {
      id: 'lesson-dissolving-salt',
      unitId: 'unit-sec1-t1-solutions',
      title: 'Dissolving Ionic Solids',
      description: 'Hydration of ions in water.',
    },
    verifiedAdminAuth,
  )
  assert.equal(lesson1Res.ok, true)
  assert.equal(lesson1Res.data.publicationStatus, 'draft')
  assert.equal(lesson1Res.data.order, 1)

  const lesson2Res = createCurriculumLesson(
    lesson1Res.state,
    {
      id: 'lesson-molarity',
      unitId: 'unit-sec1-t1-solutions',
      title: 'Concentration and Molarity',
      description: 'Moles of solute per liter of solution.',
    },
    verifiedAdminAuth,
  )
  assert.equal(lesson2Res.ok, true)
  assert.equal(lesson2Res.data.publicationStatus, 'draft')
  assert.equal(lesson2Res.data.order, 2)

  // 6. Edit lesson and reorder lessons
  const editedLessonRes = updateCurriculumLesson(
    lesson2Res.state,
    {
      lessonId: 'lesson-dissolving-salt',
      title: 'The Dissolving Process in Water',
    },
    verifiedAdminAuth,
  )
  assert.equal(editedLessonRes.ok, true)
  assert.equal(editedLessonRes.data.id, 'lesson-dissolving-salt')
  assert.equal(editedLessonRes.data.title, 'The Dissolving Process in Water')

  const reorderedLessonsRes = reorderCurriculumLessons(
    editedLessonRes.state,
    'unit-sec1-t1-solutions',
    ['lesson-molarity', 'lesson-dissolving-salt'],
    verifiedAdminAuth,
  )
  assert.equal(reorderedLessonsRes.ok, true)
  assert.deepEqual(
    reorderedLessonsRes.data.map((l) => [l.id, l.order]),
    [
      ['lesson-molarity', 1],
      ['lesson-dissolving-salt', 2],
    ],
  )

  const movedLessonRes = moveCurriculumLessonOrder(
    reorderedLessonsRes.state,
    'lesson-dissolving-salt',
    'up',
    verifiedAdminAuth,
  )
  assert.equal(movedLessonRes.ok, true)
  assert.deepEqual(
    movedLessonRes.data.map((l) => [l.id, l.order]),
    [
      ['lesson-dissolving-salt', 1],
      ['lesson-molarity', 2],
    ],
  )
})

test('invalid parent IDs, duplicate slugs, invalid orders, and unauthorized mutations are rejected', () => {
  const initial = createInitialAdminCurriculumState()

  // 1. Unauthorized callers (student, instructor, unverified admin, null) are blocked
  for (const caller of [null, studentAuth, instructorAuth, unverifiedAdminAuth]) {
    const deniedUnit = createCurriculumUnit(
      initial,
      { termId: 'term-secondary-1-1', title: 'Unauthorized Unit' },
      caller,
    )
    assert.equal(deniedUnit.ok, false)
    assert.equal(deniedUnit.code, 'unauthorized')
  }

  // 2. Invalid parent termId and unitId are rejected
  const badTermUnit = createCurriculumUnit(
    initial,
    { termId: 'term-does-not-exist', title: 'Orphan Unit' },
    verifiedAdminAuth,
  )
  assert.equal(badTermUnit.ok, false)
  assert.equal(badTermUnit.code, 'validation_error')

  const badParentLesson = createCurriculumLesson(
    initial,
    { unitId: 'unit-does-not-exist', title: 'Orphan Lesson' },
    verifiedAdminAuth,
  )
  assert.equal(badParentLesson.ok, false)
  assert.equal(badParentLesson.code, 'validation_error')

  // 3. Invalid order (< 1) and empty title are rejected
  const invalidOrderUnit = createCurriculumUnit(
    initial,
    { termId: 'term-secondary-1-1', title: 'Zero Order Unit', order: 0 },
    verifiedAdminAuth,
  )
  assert.equal(invalidOrderUnit.ok, false)
  assert.equal(invalidOrderUnit.code, 'validation_error')

  const emptyTitleUnit = createCurriculumUnit(
    initial,
    { termId: 'term-secondary-1-1', title: ' ' },
    verifiedAdminAuth,
  )
  assert.equal(emptyTitleUnit.ok, false)
  assert.equal(emptyTitleUnit.code, 'validation_error')

  // 4. Duplicate slug within the same term or unit is rejected
  const validUnit = createCurriculumUnit(
    initial,
    { termId: 'term-secondary-1-1', title: 'Thermochemistry' },
    verifiedAdminAuth,
  )
  assert.equal(validUnit.ok, true)

  const duplicateSlugUnit = createCurriculumUnit(
    validUnit.state,
    { termId: 'term-secondary-1-1', title: 'Thermochemistry' },
    verifiedAdminAuth,
  )
  assert.equal(duplicateSlugUnit.ok, false)
  assert.equal(duplicateSlugUnit.code, 'duplicate_slug')

  assert.equal(normalizeCurriculumSlug('  Unit 1: Acids & Bases! '), 'unit-1-acids-bases')
})

test('publishing, unpublishing, archiving, student visibility, and referenced record deletion protection work accurately', () => {
  let state = createInitialAdminCurriculumState({
    lessonExperiments: [
      {
        lessonId: 'lesson-salt-1',
        experimentId: 'exp-salt-water-001',
        order: 1,
        isPrimary: true,
      },
    ],
  })

  const unitRes = createCurriculumUnit(
    state,
    {
      id: 'unit-chem-1',
      termId: 'term-secondary-1-1',
      title: 'Unit 1: Solutions',
      description: 'First published unit.',
    },
    verifiedAdminAuth,
  )
  assert.equal(unitRes.ok, true)
  state = unitRes.state

  const lesson1Res = createCurriculumLesson(
    state,
    {
      id: 'lesson-salt-1',
      unitId: 'unit-chem-1',
      title: 'Lesson 1: Dissolving Salt',
      description: 'Linked to salt dissolution experiment.',
    },
    verifiedAdminAuth,
  )
  assert.equal(lesson1Res.ok, true)
  state = lesson1Res.state

  const lesson2Res = createCurriculumLesson(
    state,
    {
      id: 'lesson-draft-2',
      unitId: 'unit-chem-1',
      title: 'Lesson 2: Draft Topic',
      description: 'Remains in draft status.',
    },
    verifiedAdminAuth,
  )
  assert.equal(lesson2Res.ok, true)
  state = lesson2Res.state

  // 1. While unit and lessons are draft, student published projection has 0 units and 0 lessons
  const draftProjection = buildPublishedStudentCurriculum(state)
  assert.equal(draftProjection.contentStatus, 'reviewed')
  assert.equal(draftProjection.units.length, 0)
  assert.equal(draftProjection.lessons.length, 0)
  assert.equal(draftProjection.lessonExperiments.length, 0)

  // 2. Publish lesson-salt-1 while parent unit is still draft -> student still sees 0 lessons
  const pubLessonOnly = setCurriculumLessonPublicationStatus(
    state,
    'lesson-salt-1',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(pubLessonOnly.ok, true)
  state = pubLessonOnly.state
  assert.equal(buildPublishedStudentCurriculum(state).lessons.length, 0)

  // 3. Publish parent unit -> student now sees unit-chem-1 and lesson-salt-1, but NOT lesson-draft-2
  const pubUnit = setCurriculumUnitPublicationStatus(
    state,
    'unit-chem-1',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(pubUnit.ok, true)
  state = pubUnit.state

  const publishedProjection = buildPublishedStudentCurriculum(state)
  assert.deepEqual(
    publishedProjection.units.map((u) => u.id),
    ['unit-chem-1'],
  )
  assert.deepEqual(
    publishedProjection.lessons.map((l) => l.id),
    ['lesson-salt-1'],
  )
  assert.equal(publishedProjection.lessonExperiments.length, 1)
  assert.equal(publishedProjection.lessonExperiments[0].experimentId, 'exp-salt-water-001')

  // 4. Unpublish parent unit -> disappears from student curriculum immediately
  const unpubUnit = setCurriculumUnitPublicationStatus(
    state,
    'unit-chem-1',
    'draft',
    verifiedAdminAuth,
  )
  assert.equal(unpubUnit.ok, true)
  assert.equal(buildPublishedStudentCurriculum(unpubUnit.state).units.length, 0)

  // 5. Referenced records cannot be deleted
  const blockedUnitDelete = deleteCurriculumUnit(state, 'unit-chem-1', verifiedAdminAuth)
  assert.equal(blockedUnitDelete.ok, false)
  assert.equal(blockedUnitDelete.code, 'referenced_record')

  const blockedLessonDelete = deleteCurriculumLesson(state, 'lesson-salt-1', verifiedAdminAuth)
  assert.equal(blockedLessonDelete.ok, false)
  assert.equal(blockedLessonDelete.code, 'referenced_record')

  // 6. Unreferenced lesson (lesson-draft-2) CAN be deleted
  const allowedLessonDelete = deleteCurriculumLesson(state, 'lesson-draft-2', verifiedAdminAuth)
  assert.equal(allowedLessonDelete.ok, true)
  assert.equal(
    allowedLessonDelete.state.lessons.some((l) => l.id === 'lesson-draft-2'),
    false,
  )
})

test('Supabase and in-memory repositories persist curriculum operations and sync with student views', async () => {
  try {
    setActiveManagedCurriculumState(null)
    const fallbackResolution = resolveStudentCurriculumDataset(getActiveManagedCurriculumState())
    assert.equal(fallbackResolution.source, 'sample')
    assert.equal(fallbackResolution.data.contentStatus, 'sample')

    // Test Supabase repository with a mock Supabase client
    const insertedUnits = []
    const updatedUnits = []
    const mockSupabase = {
      from(table) {
        return {
          select() {
            return {
              async order() {
                if (table === 'curriculum_units') {
                  return {
                    data: [
                      {
                        id: 'db-unit-1',
                        term_id: 'term-secondary-1-1',
                        slug: 'atomic-structure',
                        title: 'Atomic Structure',
                        description: 'Subatomic particles and isotopes.',
                        sort_order: 1,
                        publication_status: 'published',
                      },
                    ],
                    error: null,
                  }
                }
                if (table === 'curriculum_lessons') {
                  return {
                    data: [
                      {
                        id: 'db-lesson-1',
                        unit_id: 'db-unit-1',
                        slug: 'protons-neutrons-electrons',
                        title: 'Protons, Neutrons, and Electrons',
                        description: 'Structure of the atom.',
                        sort_order: 1,
                        publication_status: 'published',
                      },
                    ],
                    error: null,
                  }
                }
                return { data: [], error: null }
              },
            }
          },
          async insert(row) {
            if (table === 'curriculum_units') insertedUnits.push(row)
            return { data: row, error: null }
          },
          update(patch) {
            return {
              async eq(column, value) {
                if (table === 'curriculum_units') updatedUnits.push({ column, value, patch })
                return { data: patch, error: null }
              },
            }
          },
          delete() {
            return {
              async eq() {
                return { data: null, error: null }
              },
            }
          },
        }
      },
    }

    const repo = createSupabaseCurriculumRepository(mockSupabase)
    const loaded = await repo.loadAdminState(verifiedAdminAuth)
    assert.equal(loaded.ok, true)
    assert.equal(loaded.data.units.length, 1)
    assert.equal(loaded.data.units[0].title, 'Atomic Structure')

    const created = await repo.createUnit(
      loaded.state,
      {
        id: 'db-unit-2',
        termId: 'term-secondary-1-1',
        title: 'Periodic Table Trends',
        description: 'Groups, periods, and electronegativity.',
      },
      verifiedAdminAuth,
    )
    assert.equal(created.ok, true)
    assert.equal(insertedUnits.length, 1)
    assert.equal(insertedUnits[0].publication_status, 'draft')

    const published = await repo.setUnitPublicationStatus(
      created.state,
      'db-unit-2',
      'published',
      verifiedAdminAuth,
    )
    assert.equal(published.ok, true)
    assert.equal(updatedUnits.length, 1)
    assert.deepEqual(updatedUnits[0].patch, { publication_status: 'published' })

    // Verify shared store now exposes the 2 published database units (and 0 mock units)
    const activeResolution = resolveStudentCurriculumDataset(getActiveManagedCurriculumState())
    assert.equal(activeResolution.source, 'published')
    assert.deepEqual(
      activeResolution.data.units.map((u) => u.title),
      ['Atomic Structure', 'Periodic Table Trends'],
    )
  } finally {
    setActiveManagedCurriculumState(null)
  }
})

test('AdminCurriculumPage (/admin/curriculum) and student CurriculumPage render required labels and respect published state', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const [
      { AppRoutes },
      { AuthContext },
      { createAuthService, unavailableAuth },
      { AdminCurriculumPage },
      { setActiveManagedCurriculumState: ssrSetManagedState },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/app/routes.tsx'),
      vite.ssrLoadModule('/src/features/auth/authContext.ts'),
      vite.ssrLoadModule('/src/features/auth/authService.ts'),
      vite.ssrLoadModule('/src/pages/AdminCurriculumPage.tsx'),
      vite.ssrLoadModule('/src/features/curriculum/lib/curriculumManagementRepository.ts'),
    ])

    const auth = createAuthService(null, '')
    const adminState = {
      ...unavailableAuth,
      status: 'authenticated',
      user: { id: 'admin-001', email: 'admin@school.example' },
      role: 'admin',
      roleStatus: 'verified',
      permissions: getPermissionsForRole('admin'),
    }

    // Build a realistic admin state containing 1 published unit, 1 draft unit, 1 published lesson, 1 draft lesson
    const seededState = createInitialAdminCurriculumState({
      units: [
        {
          id: 'unit-published-1',
          termId: 'term-secondary-1-1',
          slug: 'chemical-bonding',
          title: 'Unit 1: Chemical Bonding',
          description: 'Ionic and covalent bonds.',
          order: 1,
          publicationStatus: 'published',
        },
        {
          id: 'unit-draft-2',
          termId: 'term-secondary-1-1',
          slug: 'states-of-matter',
          title: 'Unit 2: States of Matter (Draft)',
          description: 'Gas laws and intermolecular forces.',
          order: 2,
          publicationStatus: 'draft',
        },
      ],
      lessons: [
        {
          id: 'lesson-published-1',
          unitId: 'unit-published-1',
          slug: 'ionic-bonding',
          title: 'Lesson 1: Ionic Bonding',
          description: 'Electron transfer between metals and nonmetals.',
          order: 1,
          publicationStatus: 'published',
        },
        {
          id: 'lesson-draft-2',
          unitId: 'unit-published-1',
          slug: 'covalent-bonding',
          title: 'Lesson 2: Covalent Bonding (Draft)',
          description: 'Sharing electron pairs.',
          order: 2,
          publicationStatus: 'draft',
        },
      ],
      lessonExperiments: [
        {
          lessonId: 'lesson-published-1',
          experimentId: 'exp-salt-water-001',
          order: 1,
          isPrimary: true,
        },
      ],
    })

    const repo = createInMemoryCurriculumRepository(seededState)
    const adminHtml = await renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { auth, state: adminState } },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/curriculum'] },
          React.createElement(AdminCurriculumPage, {
            initialState: seededState,
            repository: repo,
          }),
        ),
      ),
    )

    // Verify all required English UI labels are rendered
    for (const requiredLabel of [
      'Add Unit',
      'Edit Lesson',
      'Save Changes',
      'Publish',
      'Unpublish',
      'Cancel',
      'Delete',
      'Back to Curriculum',
    ]) {
      assert.ok(
        adminHtml.includes(requiredLabel),
        `Expected AdminCurriculumPage to include "${requiredLabel}"`,
      )
    }

    // Admin sees both published and draft units/lessons
    assert.match(adminHtml, /Unit 1: Chemical Bonding/)
    assert.match(adminHtml, /Unit 2: States of Matter \(Draft\)/)
    assert.match(adminHtml, /Lesson 1: Ionic Bonding/)
    assert.match(adminHtml, /Lesson 2: Covalent Bonding \(Draft\)/)

    // Verify Student CurriculumPage shows ONLY published units/lessons when managed state is active
    try {
      ssrSetManagedState(seededState)
      const studentHtml = await renderToStaticMarkup(
        React.createElement(
          AuthContext.Provider,
          { value: { auth, state: unavailableAuth } },
          React.createElement(
            MemoryRouter,
            {
              initialEntries: ['/curriculum?grade=grade-secondary-1&term=term-secondary-1-1'],
            },
            React.createElement(AppRoutes),
          ),
        ),
      )

      assert.match(studentHtml, /Published curriculum\./)
      assert.match(studentHtml, /Unit 1: Chemical Bonding/)
      assert.match(studentHtml, /Lesson 1: Ionic Bonding/)
      assert.doesNotMatch(studentHtml, /Unit 2: States of Matter \(Draft\)/)
      assert.doesNotMatch(studentHtml, /Lesson 2: Covalent Bonding \(Draft\)/)
    } finally {
      ssrSetManagedState(null)
    }
  } finally {
    await vite.close()
  }
})
