import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'

let vite
let AppRoutes
let useSaltSimulationStore
let useLabSceneStore
let restartExperimentSession
let acknowledgeLabSafety
let handlePhysicalInteraction
let saltExperimentDefinition
let initialSaltExperimentState
let initialWorkflowState
let getContextualSafetyState
let SAFETY_WARNING_LEVEL_META
let getExperimentResultsSummary
let SafetyNotice
let ContextualSafetyAlert
let ExperimentGuide
let ContextualInstruction
let mockExperiments
let transferCounter = 0

test.before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx'))
  ;({ useSaltSimulationStore } = await vite.ssrLoadModule(
    '/src/features/simulations/state/useSaltSimulationStore.ts',
  ))
  ;({ useLabSceneStore } = await vite.ssrLoadModule(
    '/src/features/simulations/state/useLabSceneStore.ts',
  ))
  ;({ restartExperimentSession } = await vite.ssrLoadModule(
    '/src/features/simulations/state/sessionActions.ts',
  ))
  ;({ acknowledgeLabSafety, handlePhysicalInteraction } = await vite.ssrLoadModule(
    '/src/features/simulations/state/directInteractions.ts',
  ))
  ;({ saltExperimentDefinition } = await vite.ssrLoadModule(
    '/src/features/simulations/data/saltExperimentDefinition.ts',
  ))
  ;({ initialSaltExperimentState } = await vite.ssrLoadModule(
    '/src/features/simulations/engine/saltExperiment.ts',
  ))
  ;({ initialWorkflowState } = await vite.ssrLoadModule(
    '/src/features/simulations/engine/workflow.ts',
  ))
  ;({ getContextualSafetyState, SAFETY_WARNING_LEVEL_META } = await vite.ssrLoadModule(
    '/src/features/simulations/lib/contextualSafety.ts',
  ))
  ;({ getExperimentResultsSummary } = await vite.ssrLoadModule(
    '/src/features/simulations/lib/resultsSummary.ts',
  ))
  ;({ SafetyNotice, ContextualSafetyAlert } = await vite.ssrLoadModule(
    '/src/features/simulations/components/SafetyNotice.tsx',
  ))
  ;({ ExperimentGuide } = await vite.ssrLoadModule(
    '/src/features/simulations/components/ExperimentGuide.tsx',
  ))
  ;({ ContextualInstruction } = await vite.ssrLoadModule(
    '/src/features/simulations/components/ContextualInstruction.tsx',
  ))
  ;({ mockExperiments } = await vite.ssrLoadModule(
    '/src/features/experiments/data/mockExperiments.ts',
  ))
})

test.after(async () => {
  await vite?.close()
})

function syncStoreSnapshots() {
  Object.assign(useLabSceneStore.getInitialState(), useLabSceneStore.getState())
  Object.assign(useSaltSimulationStore.getInitialState(), useSaltSimulationStore.getState())
}

async function renderRoute(initialEntry) {
  syncStoreSnapshots()
  return await renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      React.createElement(AppRoutes),
    ),
  )
}

function runTransfer(sourceId, targetId, materialId, amount, unit) {
  const sim = useSaltSimulationStore.getState()
  const res = sim.beginTransfer({
    requestId: `results-safety-test-${++transferCounter}-${sourceId}-${targetId}`,
    sourceId,
    targetId,
    materialId,
    amount,
    unit,
  })
  assert.equal(res.ok, true, res.message)
  for (let i = 0; useSaltSimulationStore.getState().transfer && i < 1000; i++) {
    useSaltSimulationStore.getState().advanceTransfer(250)
  }
  assert.equal(useSaltSimulationStore.getState().transfer, null)
}

function completeSaltExperimentInStore() {
  const lab = useLabSceneStore.getState()
  restartExperimentSession()
  assert.equal(acknowledgeLabSafety(), true)
  for (const id of [
    'water',
    'graduated-cylinder',
    'sodium-chloride',
    'spatula',
    'weighing-boat',
    'stirring-rod',
  ]) {
    lab.beginPlacement(id)
    assert.equal(lab.confirmPlacement(), true)
  }
  runTransfer('water', 'graduated-cylinder', 'water', 100, 'mL')
  runTransfer('graduated-cylinder', 'beaker', 'water', 100, 'mL')
  runTransfer('sodium-chloride', 'spatula', 'NaCl', 5, 'g')
  runTransfer('spatula', 'weighing-boat', 'NaCl', 5, 'g')
  assert.equal(
    handlePhysicalInteraction({
      actorId: 'weighing-boat',
      targetId: 'digital-balance',
      gesture: 'release',
    }),
    true,
  )
  runTransfer('weighing-boat', 'beaker', 'NaCl', 5, 'g')
  for (let i = 0; i < 2; i++) {
    assert.equal(
      useSaltSimulationStore
        .getState()
        .execute({ kind: 'stir', tool: 'stirring-rod', target: 'beaker' }),
      true,
    )
    const effect = useSaltSimulationStore.getState().effect
    if (effect) useSaltSimulationStore.getState().stopEffect(effect.id)
  }
  assert.equal(useSaltSimulationStore.getState().emit({ type: 'REVIEW_INSPECTED' }), true)
  assert.equal(useSaltSimulationStore.getState().workflow.completed, true)
}

test('results before starting show Not Started state, no fake measurements, and safety rules', async () => {
  restartExperimentSession()
  const saltExp = mockExperiments.find((item) => item.id === 'exp-salt-water-001')
  const summary = getExperimentResultsSummary({
    experiment: saltExp,
    definition: saltExperimentDefinition,
    workflow: useSaltSimulationStore.getState().workflow,
    chemistry: useSaltSimulationStore.getState().experiment,
    placedIds: useLabSceneStore.getState().placedIds,
    sessionPhase: 'ready',
  })

  assert.equal(summary.availability, 'not-started')
  assert.equal(summary.statusLabel, 'Not Started')
  assert.equal(summary.validatedSteps, 0)
  assert.equal(summary.totalSteps, 9)
  assert.equal(summary.quantities.waterUsedMl, null)
  assert.equal(summary.quantities.saltAddedG, null)
  assert.deepEqual(summary.finalConclusions, [])

  const html = await renderRoute('/experiments/exp-salt-water-001/results')
  assert.match(html, /Not Started/)
  assert.match(html, /No Experiment Results Yet/)
  assert.match(html, /0 of 9 steps validated/)
  assert.match(html, /Water Used/)
  assert.match(html, /Salt Added/)
  assert.match(html, /Not recorded yet/)
  assert.match(html, /Open Laboratory/)
  assert.doesNotMatch(html, /Experiment completed — Results/)
  assert.doesNotMatch(html, /Final Educational Conclusions/)
  assert.doesNotMatch(html, /[\u0600-\u06FF]/)
})

test('results during execution show In Progress state, partial measurements, and completed vs pending student actions without claiming completion', async () => {
  restartExperimentSession()
  const lab = useLabSceneStore.getState()

  assert.equal(acknowledgeLabSafety(), true)
  for (const id of ['water', 'graduated-cylinder']) {
    lab.beginPlacement(id)
    assert.equal(lab.confirmPlacement(), true)
  }
  runTransfer('water', 'graduated-cylinder', 'water', 100, 'mL')

  const saltExp = mockExperiments.find((item) => item.id === 'exp-salt-water-001')
  const summary = getExperimentResultsSummary({
    experiment: saltExp,
    definition: saltExperimentDefinition,
    workflow: useSaltSimulationStore.getState().workflow,
    chemistry: useSaltSimulationStore.getState().experiment,
    placedIds: useLabSceneStore.getState().placedIds,
    sessionPhase: 'in-progress',
  })

  assert.equal(summary.availability, 'in-progress')
  assert.equal(summary.statusLabel, 'In Progress')
  assert.equal(summary.validatedSteps, 3)
  assert.equal(summary.quantities.waterUsedMl, 100)
  assert.equal(summary.quantities.saltAddedG, null)
  assert.deepEqual(summary.finalConclusions, [])

  const html = await renderRoute('/experiments/exp-salt-water-001/results')
  assert.match(html, /In Progress/)
  assert.match(html, /No Experiment Results Yet/)
  assert.match(html, /3 of 9 steps validated/)
  assert.match(html, /Available Measurements So Far/)
  assert.match(html, /100 mL/)
  assert.match(html, /Not recorded yet/)
  assert.match(html, /Procedural Progress &amp; Student Actions/)
  assert.match(html, /Continue Experiment/)
  assert.doesNotMatch(html, /Experiment completed — Results/)
  assert.doesNotMatch(html, /Final Educational Conclusions/)
  assert.doesNotMatch(html, /[\u0600-\u06FF]/)
})

test('results after completion display verified measurements, student actions, observations, physical dissolution explanation, model assumptions, and conclusions', async () => {
  completeSaltExperimentInStore()

  const saltExp = mockExperiments.find((item) => item.id === 'exp-salt-water-001')
  const summary = getExperimentResultsSummary({
    experiment: saltExp,
    definition: saltExperimentDefinition,
    workflow: useSaltSimulationStore.getState().workflow,
    chemistry: useSaltSimulationStore.getState().experiment,
    placedIds: useLabSceneStore.getState().placedIds,
    sessionPhase: 'completed',
  })

  assert.equal(summary.availability, 'completed')
  assert.equal(summary.statusLabel, 'Completed')
  assert.equal(summary.validatedSteps, 9)
  assert.equal(summary.quantities.waterUsedMl, 100)
  assert.equal(summary.quantities.saltAddedG, 5)
  assert.equal(summary.quantities.beakerWaterMl, 100)
  assert.equal(summary.quantities.dissolvedSaltG, 5)
  assert.equal(summary.quantities.undissolvedSaltG, 0)
  assert.equal(summary.simulatedObservations.recorded, true)
  assert.equal(summary.studentActions.every((item) => item.completed), true)
  assert.ok(summary.finalConclusions.length >= 3)
  assert.ok(summary.modelAssumptions.length >= 3)

  const html = await renderRoute('/experiments/exp-salt-water-001/results')
  for (const expected of [
    'Experiment completed — Results',
    'Completed',
    'All 9 steps validated',
    'Water Used',
    'Recorded water volume',
    '100 mL',
    'Salt Added',
    'Modelled weighed sodium chloride mass',
    '5 g',
    '5.00 g',
    'Simulated observation',
    'homogeneous solution',
    'Scientific principle &amp; explanation',
    'Physical Dissolution',
    'no new compound is formed',
    'No new chemical substance is formed',
    'Verified Student Actions',
    'Final Educational Conclusions',
    'Model Assumptions &amp; Scientific Scope',
    '35.9 g',
    'Quiz Preview',
    'Quiz results are separate',
  ]) {
    assert.ok(
      html.toLowerCase().includes(expected.toLowerCase()),
      `Expected completed results markup to include "${expected}"`,
    )
  }
  assert.doesNotMatch(html, /[\u0600-\u06FF]/)
})

test('experiment reset clears completed results and returns the results page to Not Started', async () => {
  completeSaltExperimentInStore()
  assert.match(
    await renderRoute('/experiments/exp-salt-water-001/results'),
    /Experiment completed — Results/,
  )

  restartExperimentSession()
  const resetHtml = await renderRoute('/experiments/exp-salt-water-001/results')
  assert.match(resetHtml, /No Experiment Results Yet/)
  assert.match(resetHtml, /Not Started/)
  assert.doesNotMatch(resetHtml, /Experiment completed — Results/)
  assert.equal(useSaltSimulationStore.getState().workflow.completed, false)
  assert.deepEqual(useSaltSimulationStore.getState().workflow.measurements, {
    waterMl: null,
    saltG: null,
  })
})

test('missing or unsupported result data (planned experiments and incompatible session versions) render safe fallbacks', async () => {
  restartExperimentSession()
  const plannedHtml = await renderRoute('/experiments/exp-volume-002/results')
  assert.match(plannedHtml, /Results Unavailable/)
  assert.match(plannedHtml, /does not have an available 3D lab/)
  assert.doesNotMatch(plannedHtml, /Experiment completed — Results/)

  useSaltSimulationStore.setState({ definitionVersion: '9.9.9-incompatible' })
  const incompatibleHtml = await renderRoute('/experiments/exp-salt-water-001/results')
  assert.match(incompatibleHtml, /No Experiment Results Yet/)
  assert.match(incompatibleHtml, /Session Out of Sync/)
  assert.match(incompatibleHtml, /different experiment or version/)
  assert.doesNotMatch(incompatibleHtml, /Experiment completed — Results/)

  restartExperimentSession()
})

test('contextual safety system supports all 4 warning levels (info, caution, warning, blocked) without mutating scientific state', () => {
  assert.deepEqual(Object.keys(SAFETY_WARNING_LEVEL_META), [
    'info',
    'caution',
    'warning',
    'blocked',
  ])
  assert.equal(SAFETY_WARNING_LEVEL_META.info.badgeLabel, 'General Information')
  assert.equal(SAFETY_WARNING_LEVEL_META.caution.badgeLabel, 'Be Careful')
  assert.equal(SAFETY_WARNING_LEVEL_META.warning.badgeLabel, 'Important Safety Warning')
  assert.equal(SAFETY_WARNING_LEVEL_META.blocked.badgeLabel, 'This Action Is Not Allowed')

  const baseChemistry = initialSaltExperimentState()
  const chemistrySnapshot = structuredClone(baseChemistry)
  const baseWorkflow = initialWorkflowState(saltExperimentDefinition)

  // 1. WARNING level: unacknowledged safety at step 0 ('prepare')
  const warningState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: baseWorkflow,
  })
  assert.equal(warningState.primaryNotice?.level, 'warning')
  assert.equal(warningState.primaryNotice?.badgeLabel, 'Important Safety Warning')
  assert.match(warningState.primaryNotice?.message ?? '', /protective eyewear|never taste/i)

  // 2. CAUTION level: step-specific handling reminder during 'measure-water'
  const measureWaterIndex = saltExperimentDefinition.steps.findIndex(
    (step) => step.id === 'measure-water',
  )
  const cautionState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: {
      ...baseWorkflow,
      safetyAcknowledged: true,
      stepIndex: measureWaterIndex,
    },
  })
  assert.equal(cautionState.primaryNotice?.level, 'caution')
  assert.equal(cautionState.primaryNotice?.badgeLabel, 'Be Careful')
  assert.match(cautionState.primaryNotice?.message ?? '', /100 mL|meniscus/i)

  // 3. INFO level: when experiment is completed
  const infoState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: {
      ...baseWorkflow,
      safetyAcknowledged: true,
      completed: true,
    },
  })
  assert.equal(infoState.primaryNotice?.level, 'info')
  assert.equal(infoState.primaryNotice?.badgeLabel, 'General Information')

  // 4. BLOCKED level: when validation fails (e.g., BOAT_NOT_ON_BALANCE)
  const blockedState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: {
      ...baseWorkflow,
      safetyAcknowledged: true,
      stepIndex: saltExperimentDefinition.steps.findIndex((step) => step.id === 'measure-salt'),
    },
    validation: {
      valid: false,
      code: 'BOAT_NOT_ON_BALANCE',
      severity: 'warning',
      stepId: 'measure-salt',
      message: 'Place the loaded weighing boat on the balance before measuring.',
    },
  })
  assert.equal(blockedState.primaryNotice?.level, 'blocked')
  assert.equal(blockedState.primaryNotice?.badgeLabel, 'This Action Is Not Allowed')
  assert.match(blockedState.primaryNotice?.title ?? '', /This Action Is Not Allowed/)
  assert.match(blockedState.primaryNotice?.message ?? '', /weighing boat on the balance/i)

  // Also test incompatible hover target produces 'blocked' notice
  const hoverBlockedState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: {
      ...baseWorkflow,
      safetyAcknowledged: true,
      stepIndex: measureWaterIndex,
    },
    actorId: 'water',
    targetId: 'graduated-cylinder',
    hoveredId: 'sodium-chloride',
    placedIds: ['water', 'graduated-cylinder', 'sodium-chloride'],
  })
  assert.equal(hoverBlockedState.blockedNotice?.level, 'blocked')
  assert.equal(hoverBlockedState.blockedNotice?.badgeLabel, 'This Action Is Not Allowed')
  assert.match(hoverBlockedState.blockedNotice?.message ?? '', /not the correct receiver/i)

  // Verify no mutation occurred
  assert.deepEqual(baseChemistry, chemistrySnapshot)
})

test('ContextualSafetyAlert, SafetyNotice, ExperimentGuide, and ContextualInstruction render accessible safety warnings', async () => {
  restartExperimentSession()
  const sim = useSaltSimulationStore.getState()
  // Trigger a blocked action (attempting to validate step 0 before acknowledging safety)
  assert.equal(sim.dispatch({ kind: 'validate-step' }), false)
  assert.equal(useSaltSimulationStore.getState().validation?.code, 'SAFETY_REQUIRED')

  syncStoreSnapshots()

  const safetyState = getContextualSafetyState({
    definition: saltExperimentDefinition,
    workflow: useSaltSimulationStore.getState().workflow,
    validation: useSaltSimulationStore.getState().validation,
  })
  assert.equal(safetyState.primaryNotice?.level, 'blocked')

  const alertHtml = await renderToStaticMarkup(
    React.createElement(ContextualSafetyAlert, { notice: safetyState.primaryNotice }),
  )
  assert.match(alertHtml, /role="alert"/)
  assert.match(alertHtml, /data-safety-level="blocked"/)
  assert.match(alertHtml, /This Action Is Not Allowed/)
  assert.match(alertHtml, /Acknowledge the safety rules first/)

  const noticeHtml = await renderToStaticMarkup(
    React.createElement(SafetyNotice, {
      safety: mockExperiments[0].safety,
      contextualNotice: safetyState.primaryNotice,
      safetyRules: safetyState.safetyRules,
    }),
  )
  assert.match(noticeHtml, /Low-Risk Educational Activity/)
  assert.match(noticeHtml, /This Action Is Not Allowed/)
  assert.match(noticeHtml, /Experiment Safety Rules/)

  const guideHtml = await renderToStaticMarkup(
    React.createElement(ExperimentGuide, {
      definition: saltExperimentDefinition,
      workflow: useSaltSimulationStore.getState().workflow,
      experiment: useSaltSimulationStore.getState().experiment,
      placedIds: useLabSceneStore.getState().placedIds,
      items: [],
      referenceStages: [],
      validation: useSaltSimulationStore.getState().validation,
    }),
  )
  assert.match(guideHtml, /This Action Is Not Allowed/)
  assert.match(guideHtml, /Laboratory safety rules/)

  const hudHtml = await renderToStaticMarkup(
    React.createElement(ContextualInstruction, {
      inventoryOpen: false,
      presentation: { inventory: [], stages: [] },
    }),
  )
  assert.match(hudHtml, /This Action Is Not Allowed/)
  assert.match(hudHtml, /Acknowledge the safety rules first/)
  assert.doesNotMatch(hudHtml, /TILT|tilt/i)
  assert.doesNotMatch(hudHtml, /[\u0600-\u06FF]/)

  restartExperimentSession()
})
