import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { getPermissionsForRole } from '../src/features/auth/permissions.ts'
import {
  buildPublishedExperimentCatalog,
  createInitialAdminExperimentState,
  createManagedExperiment,
  getRegisteredSimulationCatalog,
  isRegisteredSimulationForExperiment,
  setExperimentPublicationStatus,
  toPublicExperiment,
  updateManagedExperiment,
} from '../src/features/experiments/lib/experimentManagement.ts'
import {
  createInMemoryExperimentRepository,
  createSupabaseExperimentRepository,
  getActiveManagedExperimentState,
  setActiveManagedExperimentState,
} from '../src/features/experiments/lib/experimentManagementRepository.ts'

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

test('creating and editing experiment metadata, objectives, tools, safety, and curriculum assignments preserve stable IDs', () => {
  const initial = createInitialAdminExperimentState()
  assert.equal(initial.categories.length, 2)
  assert.deepEqual(
    initial.experiments.map((e) => e.id),
    ['exp-salt-water-001', 'exp-volume-002', 'exp-ph-003'],
  )

  // 1. Create a new experiment (defaults to draft publication, draft review, planned simulation)
  const createdRes = createManagedExperiment(
    initial,
    {
      id: 'exp-filtration-004',
      title: 'Separating Mixtures by Filtration',
      shortDescription:
        'Observe how filter paper retains insoluble sand grains while allowing water to pass through.',
      categoryId: 'chemistry',
      difficulty: 'beginner',
      estimatedDurationMinutes: 20,
      illustration: 'liquid-volume',
      about: [
        'Filtration is a physical separation technique used to separate an insoluble solid from a liquid.',
        'The solid remaining on the filter paper is the residue, and the liquid passing through is the filtrate.',
      ],
      objectives: [
        { id: 'filt-1', text: 'Distinguish between residue and filtrate.' },
        { id: 'filt-2', text: 'Identify the tools used in gravity filtration.' },
      ],
      requiredTools: ['Beaker', 'Filter Funnel', 'Conical Flask'],
      requiredMaterials: ['Water (H₂O)', 'Insoluble Sand'],
      safety: {
        level: 'low',
        requiresSupervision: true,
        note: 'Support the funnel carefully to prevent glassware tipping.',
      },
      lessonId: 'sample-lesson-1-1',
    },
    verifiedAdminAuth,
  )

  assert.equal(createdRes.ok, true)
  assert.equal(createdRes.data.id, 'exp-filtration-004')
  assert.equal(createdRes.data.slug, 'separating-mixtures-by-filtration')
  assert.equal(createdRes.data.publicationStatus, 'draft')
  assert.equal(createdRes.data.contentReviewStatus, 'draft')
  assert.equal(createdRes.data.safetyReviewStatus, 'draft')
  assert.equal(createdRes.data.status, 'planned')
  assert.equal(createdRes.data.simulationId, null)
  assert.equal(createdRes.data.lessonId, 'sample-lesson-1-1')
  assert.equal(createdRes.data.objectives.length, 2)

  // 2. Edit descriptions, objectives, curriculum assignment, and review status without changing ID
  const updatedRes = updateManagedExperiment(
    createdRes.state,
    {
      experimentId: 'exp-filtration-004',
      title: 'Gravity Filtration of Heterogeneous Mixtures',
      shortDescription:
        'Updated description: Separate suspended solid particles from water using a funnel and filter paper.',
      objectives: [
        { id: 'filt-1', text: 'Distinguish between residue and filtrate.' },
        { id: 'filt-2', text: 'Identify the tools used in gravity filtration.' },
        { id: 'filt-3', text: 'Explain why dissolved salt cannot be separated by filtration.' },
      ],
      contentReviewStatus: 'reviewed',
      safetyReviewStatus: 'reviewed',
      lessonId: 'sample-lesson-1-2',
    },
    verifiedAdminAuth,
  )

  assert.equal(updatedRes.ok, true)
  assert.equal(updatedRes.data.id, 'exp-filtration-004')
  assert.equal(updatedRes.data.title, 'Gravity Filtration of Heterogeneous Mixtures')
  assert.equal(updatedRes.data.objectives.length, 3)
  assert.equal(updatedRes.data.contentReviewStatus, 'reviewed')
  assert.equal(updatedRes.data.safetyReviewStatus, 'reviewed')
  assert.equal(updatedRes.data.lessonId, 'sample-lesson-1-2')
})

test('simulation registry prevents unregistered simulations from being marked playable and blocks unsafe code payloads', () => {
  const initial = createInitialAdminExperimentState()
  const registry = getRegisteredSimulationCatalog()
  assert.equal(registry.length, 1)
  assert.equal(registry[0].simulationId, 'exp-salt-water-001')

  assert.equal(isRegisteredSimulationForExperiment('exp-salt-water-001', 'exp-salt-water-001'), true)
  assert.equal(isRegisteredSimulationForExperiment('exp-volume-002', 'exp-volume-002'), false)
  assert.equal(isRegisteredSimulationForExperiment('exp-volume-002', 'exp-salt-water-001'), false)

  // 1. Attempting to create a new experiment with status = 'demo' fails with 'unregistered_simulation'
  const fakePlayableCreate = createManagedExperiment(
    initial,
    {
      id: 'exp-unregistered-3d',
      title: 'Unregistered 3D Experiment',
      shortDescription: 'Attempts to claim a 3D lab without a registered simulation.',
      categoryId: 'chemistry',
      status: 'demo',
    },
    verifiedAdminAuth,
  )
  assert.equal(fakePlayableCreate.ok, false)
  assert.equal(fakePlayableCreate.code, 'unregistered_simulation')

  // 2. Attempting to update exp-volume-002 to status = 'demo' fails with 'unregistered_simulation'
  const fakePlayableUpdate = updateManagedExperiment(
    initial,
    {
      experimentId: 'exp-volume-002',
      status: 'demo',
    },
    verifiedAdminAuth,
  )
  assert.equal(fakePlayableUpdate.ok, false)
  assert.equal(fakePlayableUpdate.code, 'unregistered_simulation')

  // 3. Even if a raw object has status: 'demo' on an unregistered ID, toPublicExperiment downgrades it to 'planned'
  const forgedPublic = toPublicExperiment({
    ...initial.experiments[1],
    status: 'demo',
    simulationId: 'exp-salt-water-001',
  })
  assert.equal(forgedPublic.status, 'planned')

  // 4. Attempting to inject executable JavaScript/HTML in about or mediaReferences is rejected
  const scriptInjection = createManagedExperiment(
    initial,
    {
      title: 'Unsafe Script Experiment',
      shortDescription: 'Valid short description for test.',
      categoryId: 'chemistry',
      about: ['<script>alert(1)</script>'],
    },
    verifiedAdminAuth,
  )
  assert.equal(scriptInjection.ok, false)
  assert.equal(scriptInjection.code, 'validation_error')
})

test('unauthorized callers are blocked and incomplete experiments cannot be published', () => {
  const initial = createInitialAdminExperimentState()

  for (const caller of [null, studentAuth, instructorAuth, unverifiedAdminAuth]) {
    const denied = createManagedExperiment(
      initial,
      {
        title: 'Unauthorized Experiment',
        shortDescription: 'Should be rejected by authorization guard.',
        categoryId: 'chemistry',
      },
      caller,
    )
    assert.equal(denied.ok, false)
    assert.equal(denied.code, 'unauthorized')
  }

  // Create a draft experiment without about paragraphs or objectives
  const draftRes = createManagedExperiment(
    initial,
    {
      id: 'exp-empty-draft',
      title: 'Empty Draft Experiment',
      shortDescription: 'Draft without educational explanation or objectives yet.',
      categoryId: 'chemistry',
      about: [],
      objectives: [],
    },
    verifiedAdminAuth,
  )
  assert.equal(draftRes.ok, true)
  assert.equal(draftRes.data.publicationStatus, 'draft')

  // Publishing incomplete draft is rejected
  const prematurePublish = setExperimentPublicationStatus(
    draftRes.state,
    'exp-empty-draft',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(prematurePublish.ok, false)
  assert.equal(prematurePublish.code, 'incomplete_content')

  // Adding explanation and objectives allows publication even without a 3D simulation ('planned')
  const completedRes = updateManagedExperiment(
    draftRes.state,
    {
      experimentId: 'exp-empty-draft',
      about: ['Clear scientific explanation of the experiment.'],
      objectives: [{ id: 'obj-1', text: 'Understand the core scientific concept.' }],
    },
    verifiedAdminAuth,
  )
  assert.equal(completedRes.ok, true)

  const publishedRes = setExperimentPublicationStatus(
    completedRes.state,
    'exp-empty-draft',
    'published',
    verifiedAdminAuth,
  )
  assert.equal(publishedRes.ok, true)
  assert.equal(publishedRes.data.publicationStatus, 'published')
  assert.equal(publishedRes.data.status, 'planned')
})

test('Supabase and in-memory repositories persist changes and control public catalog visibility', async () => {
  try {
    setActiveManagedExperimentState(null)

    const insertedRows = []
    const updatedRows = []
    const mockClient = {
      from(table) {
        return {
          select() {
            return {
              async order() {
                if (table === 'experiment_categories') {
                  return {
                    data: [
                      {
                        id: 'chemistry',
                        label: 'Chemistry',
                        description: 'Substances and their properties',
                        sort_order: 1,
                      },
                    ],
                    error: null,
                  }
                }
                if (table === 'experiments') {
                  return {
                    data: [
                      {
                        id: 'exp-salt-water-001',
                        slug: 'dissolving-salt-in-water',
                        title: 'Dissolving Salt in Water',
                        short_description:
                          'Observe how sodium chloride disperses in water and distinguish a homogeneous solution from undissolved solid.',
                        category_id: 'chemistry',
                        difficulty: 'beginner',
                        estimated_duration_minutes: 10,
                        simulation_status: 'demo',
                        simulation_id: 'exp-salt-water-001',
                        illustration: 'salt-dissolution',
                        content_review_status: 'reviewed',
                        publication_status: 'published',
                        about_paragraphs: ['Paragraph 1'],
                        learning_objectives: [{ id: 'o1', text: 'Objective 1' }],
                        model_note: null,
                        required_tools: ['Beaker'],
                        required_materials: ['Water'],
                        safety_metadata: null,
                        safety_review_status: 'reviewed',
                        media_references: ['salt-dissolution'],
                        lesson_id: null,
                        sort_order: 1,
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
            insertedRows.push(row)
            return { data: row, error: null }
          },
          update(patch) {
            return {
              async eq(col, val) {
                updatedRows.push({ col, val, patch })
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

    const repo = createSupabaseExperimentRepository(mockClient)
    const loaded = await repo.loadAdminState(verifiedAdminAuth)
    assert.equal(loaded.ok, true)
    assert.equal(loaded.data.experiments.length, 1)

    // Create a draft experiment via repository
    const created = await repo.createExperiment(
      loaded.state,
      {
        id: 'exp-draft-test',
        title: 'Draft Titration Overview',
        shortDescription: 'Educational overview of acid-base titration.',
        categoryId: 'chemistry',
        about: ['Titration measures unknown concentration.'],
        objectives: [{ id: 't1', text: 'Identify the equivalence point.' }],
      },
      verifiedAdminAuth,
    )
    assert.equal(created.ok, true)
    assert.equal(insertedRows.length, 1)
    assert.equal(insertedRows[0].publication_status, 'draft')

    // Public catalog should only include the 1 published experiment, hiding exp-draft-test
    const catalogBeforePublish = buildPublishedExperimentCatalog(created.state)
    assert.deepEqual(
      catalogBeforePublish.experiments.map((e) => e.id),
      ['exp-salt-water-001'],
    )

    // Publish exp-draft-test -> now appears in public catalog
    const published = await repo.setPublicationStatus(
      created.state,
      'exp-draft-test',
      'published',
      verifiedAdminAuth,
    )
    assert.equal(published.ok, true)
    const catalogAfterPublish = buildPublishedExperimentCatalog(published.state)
    assert.deepEqual(
      catalogAfterPublish.experiments.map((e) => e.id),
      ['exp-salt-water-001', 'exp-draft-test'],
    )

    // Archive exp-draft-test -> hidden again from public catalog
    const archived = await repo.setPublicationStatus(
      published.state,
      'exp-draft-test',
      'archived',
      verifiedAdminAuth,
    )
    assert.equal(archived.ok, true)
    const catalogAfterArchive = buildPublishedExperimentCatalog(archived.state)
    assert.deepEqual(
      catalogAfterArchive.experiments.map((e) => e.id),
      ['exp-salt-water-001'],
    )
    assert.ok(getActiveManagedExperimentState() !== null)
  } finally {
    setActiveManagedExperimentState(null)
  }
})

test('AdminExperimentsPage (/admin/experiments), ExperimentCatalog, and ExperimentDetailsPage render required labels and enforce publication visibility', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const [
      { AppRoutes },
      { AuthContext },
      { createAuthService, unavailableAuth },
      { AdminExperimentsPage },
      { setActiveManagedExperimentState: ssrSetExperimentState },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/app/routes.tsx'),
      vite.ssrLoadModule('/src/features/auth/authContext.ts'),
      vite.ssrLoadModule('/src/features/auth/authService.ts'),
      vite.ssrLoadModule('/src/pages/AdminExperimentsPage.tsx'),
      vite.ssrLoadModule('/src/features/experiments/lib/experimentManagementRepository.ts'),
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

    const baseState = createInitialAdminExperimentState()
    const withCustomRes = createManagedExperiment(
      baseState,
      {
        id: 'exp-custom-draft-004',
        title: 'Secret Draft Electrolysis Experiment',
        shortDescription: 'Draft electrolysis notes under review.',
        categoryId: 'chemistry',
        about: ['Draft explanation paragraph.'],
        objectives: [{ id: 'el-1', text: 'Draft electrolysis objective.' }],
      },
      verifiedAdminAuth,
    )
    assert.equal(withCustomRes.ok, true)

    const withPublishedCustomRes = createManagedExperiment(
      withCustomRes.state,
      {
        id: 'exp-custom-published-005',
        title: 'Published Thermal Changes Overview',
        shortDescription: 'Published educational guide without 3D simulation.',
        categoryId: 'chemistry',
        publicationStatus: 'published',
        contentReviewStatus: 'reviewed',
        about: ['Exothermic reactions release thermal energy to the surroundings.'],
        objectives: [{ id: 'th-1', text: 'Distinguish exothermic and endothermic processes.' }],
      },
      verifiedAdminAuth,
    )
    assert.equal(withPublishedCustomRes.ok, true)

    const managedState = withPublishedCustomRes.state
    const repo = createInMemoryExperimentRepository(managedState)

    // 1. Render AdminExperimentsPage and verify all required English labels
    const adminHtml = await renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { auth, state: adminState } },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/admin/experiments'] },
          React.createElement(AdminExperimentsPage, {
            initialState: managedState,
            repository: repo,
          }),
        ),
      ),
    )

    for (const requiredLabel of [
      'Add Experiment',
      'Edit Experiment',
      'Save Draft',
      'Publish Experiment',
      'Archive',
      '3D Lab Available',
      '3D Lab Not Available',
    ]) {
      assert.ok(
        adminHtml.includes(requiredLabel),
        `Expected AdminExperimentsPage to include "${requiredLabel}"`,
      )
    }
    assert.match(adminHtml, /Secret Draft Electrolysis Experiment/)
    assert.match(adminHtml, /Published Thermal Changes Overview/)

    // 2. Verify public student routes when managedState is active:
    //    - Published experiments (including exp-custom-published-005) are visible
    //    - Draft experiments (exp-custom-draft-004) are hidden from both /experiments and /experiments/:id
    //    - Existing 3D experiment (/experiments/exp-salt-water-001 and /experiments/exp-salt-water-001/lab) remains functional
    //    - Published experiment without 3D simulation does NOT offer "Start 3D Experiment"
    try {
      ssrSetExperimentState(managedState)

      const renderPublic = async (path) =>
        await renderToStaticMarkup(
          React.createElement(
            AuthContext.Provider,
            { value: { auth, state: unavailableAuth } },
            React.createElement(
              MemoryRouter,
              { initialEntries: [path] },
              React.createElement(AppRoutes),
            ),
          ),
        )

      const catalogHtml = await renderPublic('/experiments')
      assert.match(catalogHtml, /Dissolving Salt in Water/)
      assert.match(catalogHtml, /Published Thermal Changes Overview/)
      assert.doesNotMatch(catalogHtml, /Secret Draft Electrolysis Experiment/)

      const draftDetailsHtml = await renderPublic('/experiments/exp-custom-draft-004')
      assert.match(draftDetailsHtml, /Experiment Not Found/)
      assert.doesNotMatch(draftDetailsHtml, /Secret Draft Electrolysis Experiment/)

      const publishedPlannedDetailsHtml = await renderPublic('/experiments/exp-custom-published-005')
      assert.match(publishedPlannedDetailsHtml, /Published Thermal Changes Overview/)
      assert.match(
        publishedPlannedDetailsHtml,
        /Exothermic reactions release thermal energy to the surroundings/,
      )
      assert.doesNotMatch(publishedPlannedDetailsHtml, />Start 3D Experiment</)

      const saltDetailsHtml = await renderPublic('/experiments/exp-salt-water-001')
      assert.match(saltDetailsHtml, /Dissolving Salt in Water/)
      assert.match(saltDetailsHtml, />Start 3D Experiment</)
      assert.ok(saltDetailsHtml.includes('href="/experiments/exp-salt-water-001/lab"'))

      const saltLabHtml = await renderPublic('/experiments/exp-salt-water-001/lab')
      assert.match(saltLabHtml, /Immersive laboratory workspace/)
    } finally {
      ssrSetExperimentState(null)
    }
  } finally {
    await vite.close()
  }
})
