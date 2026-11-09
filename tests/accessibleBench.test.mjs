import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  moveBenchItem,
  attachBenchItem,
  describeBench,
} from '../src/features/simulations/lib/accessibleBench.ts'
import { useLabSceneStore as scene } from '../src/features/simulations/state/useLabSceneStore.ts'
import { useSaltSimulationStore as salt } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'
import { subscribeToPageVisibility } from '../src/hooks/usePageVisibility.ts'
import {
  acknowledgeLabSafety,
  handlePhysicalInteraction,
  inspectFinalSolution,
} from '../src/features/simulations/state/directInteractions.ts'

test('keyboard movement uses placement validation, creates undo history and never accepts invalid coordinates', () => {
  restartExperimentSession()
  const from = scene.getState().positions.beaker
  const to = { x: from.x + 0.15, z: from.z }
  assert.equal(moveBenchItem('beaker', to), true)
  assert.deepEqual(scene.getState().positions.beaker, to)
  assert.equal(scene.getState().undo(), true)
  assert.deepEqual(scene.getState().positions.beaker, from)
  assert.equal(moveBenchItem('beaker', { x: NaN, z: 0 }), false)
  assert.equal(moveBenchItem('beaker', { x: 999, z: 0 }), false)
  assert.equal(moveBenchItem('not-placed', to), false)
  assert.equal(salt.getState().workflow.completed, false)
})

test('keyboard attachment rejects incompatible/missing targets and cannot fabricate an empty salt measurement', () => {
  restartExperimentSession()
  assert.equal(attachBenchItem('beaker', 'missing'), false)
  assert.equal(attachBenchItem('beaker', 'digital-balance'), false)
  scene.getState().addToBench('weighing-boat')
  assert.equal(attachBenchItem('weighing-boat', 'digital-balance'), false)
  assert.equal(salt.getState().workflow.measurements.saltG, null)
  assert.equal(salt.getState().workflow.completed, false)
})

test('screen-reader bench summary distinguishes instances and current selection', () => {
  const text = describeBench(['beaker', 'beaker~2'], ['beaker~2'])
  assert.match(text, /2 items/)
  assert.match(text, /Selected: .*beaker~2/)
  assert.match(describeBench([], []), /0 items.*Selected: none/)
})

test('bench controls expose native selection and camera actions; description remains independent of the panel', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AccessibleBenchControls, BenchDescription } = await vite.ssrLoadModule(
      '/src/features/simulations/components/AccessibleBenchControls.tsx',
    )
    const controls = renderToStaticMarkup(React.createElement(AccessibleBenchControls))
    const description = renderToStaticMarkup(React.createElement(BenchDescription))
    assert.match(controls, /<summary[^>]*>Bench controls<\/summary>/)
    assert.match(controls, /type="checkbox"/)
    assert.match(controls, /View left|View right|Zoom in|Zoom out/)
    assert.match(controls, /Close bench controls/)
    assert.match(description, /id="bench-description"/)
    assert.match(description, /role="status"/)
    assert.match(description, /items on the bench/)
  } finally {
    await vite.close()
  }
})

test('visibility subscriptions observe hide/resume transitions and clean up when unmounted', () => {
  class Page extends EventTarget {
    hidden = false
  }
  const page = new Page(),
    seen = []
  const unsubscribe = subscribeToPageVisibility(page, () => seen.push(!page.hidden))
  page.hidden = true
  page.dispatchEvent(new Event('visibilitychange'))
  page.hidden = false
  page.dispatchEvent(new Event('visibilitychange'))
  unsubscribe()
  page.hidden = true
  page.dispatchEvent(new Event('visibilitychange'))
  assert.deepEqual(seen, [false, true])
})

test('non-pointer salt flow still requires real transfers, loaded weighing, timed mixing and final inspection', () => {
  restartExperimentSession()
  acknowledgeLabSafety()
  for (const id of [
    'water',
    'graduated-cylinder',
    'sodium-chloride',
    'spatula',
    'weighing-boat',
    'stirring-rod',
  ]) {
    scene.getState().beginPlacement(id)
    assert.equal(scene.getState().confirmPlacement(), true)
  }
  const transfer = (sourceId, targetId, materialId, amount, unit) => {
    assert.equal(
      salt.getState().beginTransfer({
        requestId: `keyboard-${sourceId}`,
        sourceId,
        targetId,
        materialId,
        amount,
        unit,
      }).ok,
      true,
    )
    for (let i = 0; salt.getState().transfer && i < 1000; i++) salt.getState().advanceTransfer(250)
    assert.equal(salt.getState().transfer, null)
  }
  transfer('water', 'graduated-cylinder', 'water', 100, 'mL')
  transfer('graduated-cylinder', 'beaker', 'water', 100, 'mL')
  transfer('sodium-chloride', 'spatula', 'NaCl', 5, 'g')
  transfer('spatula', 'weighing-boat', 'NaCl', 5, 'g')
  assert.equal(attachBenchItem('weighing-boat', 'digital-balance'), true)
  assert.equal(salt.getState().workflow.measurements.saltG, 5)
  transfer('weighing-boat', 'beaker', 'NaCl', 5, 'g')
  for (let i = 0; i < 50; i++) {
    if (salt.getState().workflow.stepIndex >= 8) break
    assert.equal(
      handlePhysicalInteraction({
        actorId: 'stirring-rod',
        targetId: 'beaker',
        gesture: 'stir',
        elapsedMs: 150,
      }),
      true,
    )
  }
  assert.equal(salt.getState().workflow.completed, false)
  assert.equal(inspectFinalSolution('beaker'), true)
  assert.equal(salt.getState().workflow.completed, true)
})
