import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  getExperimentToolsAndMaterials,
  saltDissolutionToolsAndMaterials,
} from '../src/features/experiments/data/experimentToolsAndMaterials.ts'
import { saltExperimentDefinition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'

test('tools and materials catalog adheres to experiment definition and avoids fabricated planned data', () => {
  // Salt dissolution tools must match executable simulation requiredEquipment exactly
  const saltData = getExperimentToolsAndMaterials('exp-salt-water-001')
  assert.ok(saltData, 'Salt dissolution tools and materials must be defined')
  assert.equal(saltData.experimentId, 'exp-salt-water-001')

  const toolIds = saltData.tools.map((t) => t.id)
  assert.deepEqual(
    toolIds,
    saltExperimentDefinition.requiredEquipment,
    'Tool IDs must match simulation required equipment exactly',
  )

  // Verify all 6 tools have required educational fields
  assert.equal(saltData.tools.length, 6)
  for (const tool of saltData.tools) {
    assert.ok(tool.id, 'Tool has ID')
    assert.ok(tool.name, 'Tool has name')
    assert.ok(tool.visual, 'Tool has visual key')
    assert.ok(tool.shortExplanation, 'Tool has explanation')
    assert.ok(tool.purpose, 'Tool has primary purpose')
  }

  // Materials must match simulation requiredMaterials
  const materialIds = saltData.materials.map((m) => m.id)
  assert.deepEqual(
    materialIds,
    saltExperimentDefinition.requiredMaterials,
    'Material IDs must match simulation required materials',
  )
  assert.equal(saltData.materials.length, 2)

  // Water specifications
  const water = saltData.materials.find((m) => m.id === 'water')
  assert.ok(water)
  assert.equal(water.name, 'Water')
  assert.equal(water.formula, 'H₂O')
  assert.equal(water.role, 'Solvent')
  assert.equal(water.requiredQuantity.amount, 100)
  assert.equal(water.requiredQuantity.unit, 'mL')
  assert.equal(water.stockQuantity.amount, 400)
  assert.equal(water.stockQuantity.unit, 'mL')
  assert.ok(water.safetyNotes.length > 0)

  // Sodium chloride specifications
  const salt = saltData.materials.find((m) => m.id === 'sodium-chloride')
  assert.ok(salt)
  assert.equal(salt.name, 'Sodium Chloride')
  assert.equal(salt.formula, 'NaCl')
  assert.equal(salt.role, 'Solute')
  assert.equal(salt.requiredQuantity.amount, 5)
  assert.equal(salt.requiredQuantity.unit, 'g')
  assert.equal(salt.stockQuantity.amount, 100)
  assert.equal(salt.stockQuantity.unit, 'g')
  assert.ok(salt.safetyNotes.length > 0)

  // Planned experiments must return undefined (no fabricated data)
  for (const planned of demoCatalog.experiments.filter((e) => e.status === 'planned')) {
    assert.equal(
      getExperimentToolsAndMaterials(planned.id),
      undefined,
      `Planned experiment ${planned.id} must not have fabricated tools/materials`,
    )
  }

  // Unknown IDs return undefined
  assert.equal(getExperimentToolsAndMaterials('unknown-experiment'), undefined)
})

test('experiment details route renders laboratory tools and chemical materials with accessible landmarks', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments/exp-salt-water-001'] },
        React.createElement(AppRoutes),
      ),
    )

    // Sections exist with proper accessible headings
    assert.ok(markup.includes('Laboratory Tools'), 'Laboratory Tools heading')
    assert.ok(markup.includes('Chemical Materials'), 'Chemical Materials heading')
    assert.ok(markup.includes('aria-labelledby="experiment-tools-title"'), 'Tools section landmark')
    assert.ok(
      markup.includes('aria-labelledby="experiment-materials-title"'),
      'Materials section landmark',
    )

    // All 6 tools are rendered
    assert.ok(markup.includes('Beaker'), 'Beaker tool title')
    assert.ok(markup.includes('Graduated Cylinder'), 'Graduated cylinder tool title')
    assert.ok(markup.includes('Glass Stirring Rod'), 'Glass stirring rod tool title')
    assert.ok(markup.includes('Digital Balance'), 'Digital balance tool title')
    assert.ok(markup.includes('Laboratory Spatula'), 'Laboratory spatula tool title')
    assert.ok(markup.includes('Weighing Boat'), 'Weighing boat tool title')

    // Tool specifications and purposes
    assert.ok(markup.includes('250 mL Borosilicate Glass'), 'Beaker specification')
    assert.ok(markup.includes('100 mL Calibrated Glass'), 'Cylinder specification')
    assert.ok(markup.includes('Primary Purpose:'), 'Primary purpose label')

    // Materials rendered
    assert.ok(markup.includes('Water'), 'Water material')
    assert.ok(markup.includes('Sodium Chloride'), 'Sodium chloride material')
    assert.ok(markup.includes('Solvent'), 'Solvent role badge')
    assert.ok(markup.includes('Solute'), 'Solute role badge')

    // Formula subscripts rendered
    assert.ok(markup.includes('H<sub>2</sub>O'), 'H2O formatted with subscript')
    assert.ok(markup.includes('NaCl'), 'NaCl formula')

    // Stock vs target quantities
    assert.ok(markup.includes('Experiment Target'), 'Experiment Target label')
    assert.ok(markup.includes('Stock Supply'), 'Stock Supply label')
    assert.ok(markup.includes('100 mL'), '100 mL target')
    assert.ok(markup.includes('400 mL'), '400 mL stock')
    assert.ok(markup.includes('5 g'), '5 g target')
    assert.ok(markup.includes('100 g'), '100 g stock')

    // Educational disclaimer
    assert.ok(
      markup.includes('Quantities reflect educational simulation targets'),
      'Measurement disclaimer',
    )

    // Strict English check: no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Experiment details page must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})

test('planned experiments render honest empty states without fabricated requirements', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments/exp-volume-002'] },
        React.createElement(AppRoutes),
      ),
    )

    // Headings still render
    assert.ok(markup.includes('Laboratory Tools'), 'Laboratory Tools heading')
    assert.ok(markup.includes('Chemical Materials'), 'Chemical Materials heading')

    // Honest empty states
    assert.ok(
      markup.includes('Tools and laboratory apparatus for this planned experiment have not been finalized yet'),
      'Honest tools placeholder',
    )
    assert.ok(
      markup.includes('Chemical materials and reagents for this planned experiment have not been finalized yet'),
      'Honest materials placeholder',
    )

    // Ensure NO fabricated tools are shown
    assert.ok(!markup.includes('250 mL Borosilicate Glass'))
    assert.ok(!markup.includes('Experiment Target'))
    assert.ok(!markup.includes('Stock Supply'))
  } finally {
    await vite.close()
  }
})

test('individual tools and materials section components handle undefined gracefully', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { ExperimentToolsSection } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentToolsSection.tsx',
    )
    const { ExperimentMaterialsSection } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentMaterialsSection.tsx',
    )

    const toolsMarkup = await renderToStaticMarkup(
      React.createElement(ExperimentToolsSection, { tools: undefined }),
    )
    assert.ok(toolsMarkup.includes('have not been finalized yet'))

    const materialsMarkup = await renderToStaticMarkup(
      React.createElement(ExperimentMaterialsSection, {
        materials: undefined,
        measurementDisclaimer: undefined,
      }),
    )
    assert.ok(materialsMarkup.includes('have not been finalized yet'))
  } finally {
    await vite.close()
  }
})
