import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from './helpers/routeTestServer.mjs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { hazardCatalog, getHazard, getHazards } from '../src/features/safety/data/hazards.ts'
import {
  getExperimentHazardIds,
  requiresHazardAcknowledgement,
  hazardAcknowledgementKey,
} from '../src/features/safety/lib/experimentHazards.ts'
import {
  acknowledgeHazards,
  hasAcknowledgedHazards,
} from '../src/features/safety/state/hazardAcknowledgement.ts'

test('seven draft hazards have stable lookups, protection and specific precautions; missing data is safe', () => {
  assert.equal(Object.keys(hazardCatalog).length, 7)
  assert.equal(getHazard('unknown'), undefined)
  assert.equal(getHazard('toString'), undefined)
  assert.deepEqual(getHazards(), [])
  assert.deepEqual(
    getHazards(['corrosive', 'unknown', 'corrosive']).map((h) => h.id),
    ['corrosive'],
  )
  for (const [id, hazard] of Object.entries(hazardCatalog)) {
    assert.equal(hazard.id, id)
    assert.ok(hazard.description && hazard.label && hazard.icon)
    assert.ok(hazard.precautions.length >= 2)
    assert.ok(hazard.requiredPpe.includes('goggles'))
    assert.ok(!hazard.requiredPpe.includes('fume-hood'))
  }
  assert.deepEqual(getHazard('toxic-gas').engineeringControls, ['fume-hood'])
})

test('hazards combine actual experiment, safety, material and step associations without inventing hazards', () => {
  assert.deepEqual(getExperimentHazardIds({}), [])
  const experiment = {
    hazards: ['irritant'],
    safety: { hazards: ['corrosive'] },
    hazardSteps: [{ stepId: 'heat', hazards: ['hot-surface'] }],
  }
  assert.deepEqual(getExperimentHazardIds(experiment, [{ hazards: ['irritant', 'oxidizer'] }]), [
    'irritant',
    'corrosive',
    'hot-surface',
    'oxidizer',
  ])
  assert.equal(requiresHazardAcknowledgement({ safety: { level: 'high' } }), false)
  assert.equal(
    requiresHazardAcknowledgement({ hazards: ['corrosive'], safety: { level: 'low' } }),
    false,
  )
  assert.equal(
    requiresHazardAcknowledgement({ hazards: ['corrosive'], safety: { level: 'high' } }),
    true,
  )
})

test('acknowledgement is explicit and scoped to experiment and current risk data', () => {
  const experiment = { id: 'qa-ack', hazards: ['corrosive'], safety: { level: 'high' } }
  const key = hazardAcknowledgementKey(experiment)
  assert.equal(hasAcknowledgedHazards(key), false)
  acknowledgeHazards(key)
  assert.equal(hasAcknowledgedHazards(key), true)
  assert.equal(
    hasAcknowledgedHazards(hazardAcknowledgementKey({ ...experiment, id: 'different' })),
    false,
  )
  assert.equal(
    hasAcknowledgedHazards(hazardAcknowledgementKey({ ...experiment, hazards: ['oxidizer'] })),
    false,
  )
})

test('hazard UI and direct-entry gate render safely; contextual hazards occur only on explicitly mapped steps', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { HazardAlert } = await vite.ssrLoadModule(
      '/src/features/safety/components/HazardAlert.tsx',
    )
    const { ExperimentHazardGate } = await vite.ssrLoadModule(
      '/src/features/safety/components/ExperimentHazardGate.tsx',
    )
    const { getContextualSafetyState } = await vite.ssrLoadModule(
      '/src/features/simulations/lib/contextualSafety.ts',
    )
    const { saltExperimentDefinition } = await vite.ssrLoadModule(
      '/src/features/simulations/data/saltExperimentDefinition.ts',
    )
    const { useSaltSimulationStore } = await vite.ssrLoadModule(
      '/src/features/simulations/state/useSaltSimulationStore.ts',
    )
    const { demoCatalog } = await vite.ssrLoadModule(
      '/src/features/experiments/data/mockExperiments.ts',
    )
    const safe = demoCatalog.experiments.find((e) => e.id === 'exp-salt-water-001')
    const { getExperimentToolsAndMaterials } = await vite.ssrLoadModule(
      '/src/features/experiments/data/experimentToolsAndMaterials.ts',
    )
    const plannedMaterials = getExperimentToolsAndMaterials(
      'exp-halogen-displacement-010',
    ).materials
    assert.deepEqual(getExperimentHazardIds({}, plannedMaterials), ['toxic-gas', 'flammable'])
    assert.equal(renderToStaticMarkup(React.createElement(HazardAlert, { hazardIds: [] })), '')
    const warning = renderToStaticMarkup(
      React.createElement(HazardAlert, { hazardIds: ['corrosive'], dismissible: true }),
    )
    assert.match(warning, /Corrosive|Safety Precautions/)
    assert.match(warning, /Dismiss hazard warning/)
    const renderGate = (experiment) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            ExperimentHazardGate,
            { experiment },
            React.createElement('p', null, 'REAL LAB CHILD'),
          ),
        ),
      )
    assert.match(renderGate(safe), /REAL LAB CHILD/)
    const risky = {
      ...safe,
      id: 'qa-high',
      hazards: ['corrosive'],
      safety: { ...safe.safety, level: 'high' },
      hazardSteps: [{ stepId: saltExperimentDefinition.steps[0].id, hazards: ['corrosive'] }],
    }
    const gate = renderGate(risky)
    assert.doesNotMatch(gate, /REAL LAB CHILD/)
    assert.match(gate, /I have read the safety precautions/)
    assert.match(gate, /disabled=""/)
    const workflow = useSaltSimulationStore.getState().workflow
    const notices = getContextualSafetyState({ experiment: risky, workflow })
    assert.match(notices.stepPrecaution.id, /^hazards-/)
    assert.match(notices.stepPrecaution.title, /Corrosive/)
    assert.doesNotMatch(
      getContextualSafetyState({ experiment: { ...risky, hazardSteps: [] }, workflow })
        .stepPrecaution.id,
      /^hazards-/,
    )
    assert.equal(useSaltSimulationStore.getState().workflow.completed, false)
  } finally {
    await vite.close()
  }
})
