import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import {
  resolveSimulation,
  previewExperimentId,
} from '../src/features/simulations/lib/simulationRegistry.ts'
import { getSimulationSessionStatus } from '../src/features/simulations/state/simulationSession.ts'
import { useSaltSimulationStore as store } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSceneStore as scene } from '../src/features/simulations/state/useLabSceneStore.ts'
import {
  restartExperimentSession,
  suspendLaboratoryInteractions,
} from '../src/features/simulations/state/sessionActions.ts'
import { getExperimentSessionSnapshot } from '../src/features/simulations/state/sessionSelectors.ts'
import { getActiveNavigationId, getPageContext } from '../src/app/navigation.ts'

test('only registered matching definitions are playable and session identity includes ID and version', () => {
  restartExperimentSession()
  const simulation = resolveSimulation(demoCatalog.experiments[0])
  assert.equal(simulation.definition.experimentId, demoCatalog.experiments[0].id)
  assert.equal(simulation.presentation.experimentId, simulation.definition.experimentId)
  assert.equal(previewExperimentId, simulation.definition.experimentId)
  for (const experiment of [
    undefined,
    ...demoCatalog.experiments.slice(1),
    { ...demoCatalog.experiments[0], id: 'different-demo' },
  ])
    assert.equal(resolveSimulation(experiment), undefined)
  const summary = (state = store.getState()) =>
    getSimulationSessionStatus(simulation, state, scene.getState())
  assert.equal(summary().phase, 'ready')
  for (const patch of [
    { activeExperimentId: 'other' },
    { definitionId: 'other' },
    { definitionVersion: 'old' },
  ]) {
    const status = summary({ ...store.getState(), ...patch })
    assert.equal(status.phase, 'incompatible')
    assert.equal(status.completed, false)
    assert.equal(status.validatedSteps, 0)
  }
  const snapshot = getExperimentSessionSnapshot()
  assert.equal(snapshot.definitionVersion, simulation.definition.version)
  assert.equal(snapshot.definitionId, simulation.definition.id)
  assert.equal(getActiveNavigationId(`/experiments/${previewExperimentId}/results`), 'experiments')
  assert.equal(getPageContext(`/experiments/${previewExperimentId}/results`), 'Experiment Results')
  assert.equal(getPageContext(`/experiments/${previewExperimentId}/quiz/results`), 'Quiz Results')
})

test('leaving stops transient presentation work without resetting chemistry, placements or workflow', () => {
  restartExperimentSession()
  assert.equal(store.getState().emit({ type: 'SAFETY_ACKNOWLEDGED' }), true)
  assert.equal(
    store.getState().emit({ type: 'EQUIPMENT_PLACEMENT_VALIDATED', equipmentId: 'beaker' }),
    true,
  )
  for (const id of ['water', 'graduated-cylinder']) {
    scene.getState().beginPlacement(id)
    assert.equal(scene.getState().confirmPlacement(), true)
  }
  assert.equal(store.getState().streamTick('water', 'graduated-cylinder', 0.75, 100), true)
  const before = getExperimentSessionSnapshot()
  const revision = store.getState().resetRevision
  suspendLaboratoryInteractions()
  const after = getExperimentSessionSnapshot()
  assert.deepEqual(after.containers, before.containers)
  assert.deepEqual(after.substances, before.substances)
  assert.deepEqual(after.measurements, before.measurements)
  assert.deepEqual(after.equipmentInstances, before.equipmentInstances)
  assert.equal(after.currentStepIndex, before.currentStepIndex)
  assert.equal(store.getState().resetRevision, revision)
  assert.equal(store.getState().livePour, null)
  assert.equal(store.getState().effect, null)
  assert.equal(after.experimentCompleted, false)
  restartExperimentSession()
})

test('routes share authoritative state across details/lab/results, with completion only after the real workflow', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { useSaltSimulationStore: simulation } = await vite.ssrLoadModule(
      '/src/features/simulations/state/useSaltSimulationStore.ts',
    )
    const { useLabSceneStore: lab } = await vite.ssrLoadModule(
      '/src/features/simulations/state/useLabSceneStore.ts',
    )
    const actions = await vite.ssrLoadModule('/src/features/simulations/state/sessionActions.ts')
    const { acknowledgeLabSafety, handlePhysicalInteraction } = await vite.ssrLoadModule(
      '/src/features/simulations/state/directInteractions.ts',
    )
    actions.restartExperimentSession()
    const base = `/experiments/${previewExperimentId}`
    const render = async (path) =>
      await renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )
    const initialWorkflow = simulation.getState().workflow
    assert.match(await render(base), /Start 3D Experiment/)
    assert.match(await render(`${base}/results`), /No Experiment Results Yet/)
    assert.match(await render(`${base}/lab`), /Immersive laboratory workspace/)
    assert.match(await render('/experiments/preview/lab'), /Immersive laboratory workspace/)
    assert.equal(simulation.getState().workflow, initialWorkflow)
    assert.equal(simulation.getState().workflow.completed, false)
    assert.equal(simulation.getState().dispatch({ kind: 'validate-step' }), false)
    assert.equal(acknowledgeLabSafety(), true)
    assert.match(await render(base), /Continue Experiment/)
    assert.doesNotMatch(await render(base), />View Results</)
    for (const id of [
      'water',
      'graduated-cylinder',
      'sodium-chloride',
      'spatula',
      'weighing-boat',
      'stirring-rod',
    ]) {
      lab.getState().beginPlacement(id)
      assert.equal(lab.getState().confirmPlacement(), true)
    }
    const operation = (sourceId, targetId, materialId, amount, unit) => {
      assert.equal(
        simulation.getState().beginTransfer({
          requestId: `integration-${sourceId}-${targetId}`,
          sourceId,
          targetId,
          materialId,
          amount,
          unit,
        }).ok,
        true,
      )
      for (let i = 0; simulation.getState().transfer && i < 1000; i++)
        simulation.getState().advanceTransfer(250)
      assert.equal(simulation.getState().transfer, null)
    }
    operation('water', 'graduated-cylinder', 'water', 100, 'mL')
    const water = simulation.getState().workflow.measurements.waterMl
    const positions = structuredClone(lab.getState().positions)
    actions.suspendLaboratoryInteractions()
    const workflow = simulation.getState().workflow
    await render(base)
    await render(`${base}/results`)
    await render(`${base}/lab`)
    assert.equal(simulation.getState().workflow, workflow)
    assert.equal(simulation.getState().workflow.measurements.waterMl, water)
    assert.deepEqual(lab.getState().positions, positions)
    for (const path of [
      '/experiments/unknown/lab',
      '/experiments/unknown/results',
      '/experiments/exp-volume-002/lab',
      '/experiments/exp-volume-002/results',
    ]) {
      const html = await render(path)
      assert.doesNotMatch(html, /Immersive laboratory workspace|Experiment completed — Results/)
      assert.equal(simulation.getState().workflow, workflow)
    }
    operation('graduated-cylinder', 'beaker', 'water', 100, 'mL')
    operation('sodium-chloride', 'spatula', 'NaCl', 5, 'g')
    operation('spatula', 'weighing-boat', 'NaCl', 5, 'g')
    assert.equal(
      handlePhysicalInteraction({
        actorId: 'weighing-boat',
        targetId: 'digital-balance',
        gesture: 'release',
      }),
      true,
    )
    operation('weighing-boat', 'beaker', 'NaCl', 5, 'g')
    for (let i = 0; i < 2; i++) {
      assert.equal(
        simulation.getState().execute({ kind: 'stir', tool: 'stirring-rod', target: 'beaker' }),
        true,
      )
      const effect = simulation.getState().effect
      if (effect) simulation.getState().stopEffect(effect.id)
    }
    assert.equal(simulation.getState().workflow.completed, false)
    assert.match(await render(`${base}/results`), /No Experiment Results Yet/)
    assert.equal(simulation.getState().emit({ type: 'REVIEW_INSPECTED' }), true)
    assert.equal(simulation.getState().workflow.completed, true)
    assert.equal(simulation.getState().workflow.validation.code, 'EXPERIMENT_COMPLETED')
    const completed = simulation.getState().workflow
    assert.match(await render(base), />View Results</)
    const results = await render(`${base}/results`)
    for (const text of [
      'Experiment completed — Results',
      'Recorded water volume',
      '100 mL',
      '5 g',
      'Quiz Preview',
      'Quiz results are separate',
    ])
      assert.ok(results.toLowerCase().includes(text.toLowerCase()), text)
    // The existing scene uses Zustand's initial server snapshot; client mounts
    // subscribe to the retained current state. Server rendering must not reset it.
    assert.match(await render(`${base}/lab`), /Back to Details/)
    assert.match(await render(`${base}/quiz`), /Quiz questions are coming soon/)
    assert.match(await render(`${base}/quiz/results`), /No quiz results yet/)
    assert.equal(simulation.getState().workflow, completed)
    simulation.setState({ definitionVersion: 'incompatible-version' })
    assert.match(await render(`${base}/lab`), /Restart This Experiment/)
    assert.doesNotMatch(await render(`${base}/results`), /Experiment completed — Results/)
    assert.equal(simulation.getState().workflow, completed)
    const revision = simulation.getState().resetRevision
    actions.restartExperimentSession()
    assert.ok(simulation.getState().resetRevision > revision)
    assert.equal(simulation.getState().workflow.completed, false)
    assert.equal(simulation.getState().experiment.waterMl.beaker, 0)
    assert.deepEqual(lab.getState().placedIds, ['beaker', 'digital-balance'])
    assert.match(await render(base), /Start 3D Experiment/)
    assert.match(await render(`${base}/results`), /No Experiment Results Yet/)
  } finally {
    await vite.close()
  }
})
