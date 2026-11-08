import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  equipmentCatalog,
  equipmentCatalogMap,
  getEquipmentCatalogItem,
  getToolVisualKey,
  resolveToolItem,
} from '../src/features/experiments/data/equipmentCatalog.ts'
import { experimentToolsAndMaterialsCatalog } from '../src/features/experiments/data/experimentToolsAndMaterials.ts'
import { saltDissolutionWorkspace } from '../src/features/simulations/data/saltDissolutionWorkspace.ts'

test('equipment catalog contains all required minimum tools and every experiment tool ID', () => {
  const minimumRequiredIds = [
    'beaker',
    'beaker-100',
    'beaker-1000',
    'erlenmeyer-flask',
    'erlenmeyer-flask-100',
    'erlenmeyer-flask-250',
    'round-bottom-flask',
    'three-neck-flask',
    'test-tube',
    'test-tube-rack',
    'graduated-cylinder',
    'burette',
    'pipette',
    'dropper',
    'funnel',
    'separating-funnel',
    'distillation-flask',
    'condenser',
    'bunsen-burner',
    'spirit-lamp',
    'tripod',
    'wire-gauze',
    'clamp-stand',
    'tongs',
    'spatula',
    'stirring-rod',
    'watch-glass',
    'evaporating-dish',
    'digital-balance',
    'weighing-boat',
    'thermometer',
    'ph-paper',
    'wash-bottle',
  ]

  for (const id of minimumRequiredIds) {
    const item = getEquipmentCatalogItem(id)
    assert.ok(item, `Minimum required tool '${id}' must exist in equipmentCatalog`)
    assert.ok(item.name.length > 0, `'${id}' must have a name`)
    assert.ok(item.use.length > 10, `'${id}' must describe primary use`)
    assert.ok(item.handling.length > 10, `'${id}' must describe handling instructions`)
    assert.ok(item.safetyNote.length > 10, `'${id}' must have safety precautions`)
  }

  // Every tool ID referenced across all 23 Egyptian syllabus experiments must exist in equipmentCatalog
  const missingExperimentTools = []
  for (const [expId, expData] of Object.entries(experimentToolsAndMaterialsCatalog)) {
    for (const tool of expData.tools) {
      if (!getEquipmentCatalogItem(tool.id)) {
        missingExperimentTools.push({ expId, toolId: tool.id })
      }
    }
  }
  assert.deepEqual(
    missingExperimentTools,
    [],
    'All tool IDs in experimentToolsAndMaterialsCatalog must resolve in equipmentCatalog',
  )

  // Simulation lab inventory items must resolve in equipmentCatalog
  for (const inventoryItem of saltDissolutionWorkspace.inventory) {
    const item = getEquipmentCatalogItem(inventoryItem.id)
    assert.ok(
      item,
      `Inventory item '${inventoryItem.id}' in saltDissolutionWorkspace must exist in equipmentCatalog`,
    )
  }
})

test('equipment catalog entries adhere to strict schema, categories, and English-only text', () => {
  const allowedCategories = new Set([
    'reaction-vessel',
    'assistive-device',
    'measuring',
    'heating',
    'solid-chemical',
    'liquid-chemical',
    'gas-chemical',
  ])

  const seenCategories = new Set()
  const arabicRegex = /[\u0600-\u06FF]/

  assert.ok(equipmentCatalog.length >= 50, 'Catalog must contain comprehensive lab equipment')

  for (const entry of equipmentCatalog) {
    assert.ok(entry.id, 'Entry must have id')
    assert.ok(/^[a-z0-9-]+$/.test(entry.id), `ID '${entry.id}' must be lowercase kebab-case`)
    assert.ok(entry.name, `Entry '${entry.id}' must have name`)
    assert.ok(
      allowedCategories.has(entry.category),
      `Entry '${entry.id}' category '${entry.category}' must be in allowed categories`,
    )
    seenCategories.add(entry.category)

    assert.ok(entry.use && entry.use.length >= 15, `Entry '${entry.id}' must have thorough use text`)
    assert.ok(
      entry.handling && entry.handling.length >= 15,
      `Entry '${entry.id}' must have thorough handling instructions`,
    )
    assert.ok(
      entry.safetyNote && entry.safetyNote.length >= 15,
      `Entry '${entry.id}' must have thorough safety precautions`,
    )
    assert.ok(entry.imageKey, `Entry '${entry.id}' must have imageKey`)

    // English-only check
    assert.equal(
      arabicRegex.test(entry.name),
      false,
      `Entry '${entry.id}' name must not contain Arabic characters`,
    )
    assert.equal(
      arabicRegex.test(entry.use),
      false,
      `Entry '${entry.id}' use must not contain Arabic characters`,
    )
    assert.equal(
      arabicRegex.test(entry.handling),
      false,
      `Entry '${entry.id}' handling must not contain Arabic characters`,
    )
    assert.equal(
      arabicRegex.test(entry.safetyNote),
      false,
      `Entry '${entry.id}' safetyNote must not contain Arabic characters`,
    )

    // Aliases resolve back to the same entry
    if (entry.aliases) {
      for (const alias of entry.aliases) {
        const resolved = getEquipmentCatalogItem(alias)
        assert.equal(
          resolved?.id,
          entry.id,
          `Alias '${alias}' must resolve to canonical item '${entry.id}'`,
        )
      }
    }
  }

  // All 7 categories must be utilized
  for (const cat of allowedCategories) {
    assert.ok(seenCategories.has(cat), `Category '${cat}' should have entries in the catalog`)
  }
})

test('resolveToolItem constructs consistent ExperimentToolItem objects with optional overrides', () => {
  const canonicalBeaker = resolveToolItem('beaker')
  assert.equal(canonicalBeaker.id, 'beaker')
  assert.equal(canonicalBeaker.name, 'Beaker (250 mL)')
  assert.equal(canonicalBeaker.visual, 'beaker')
  assert.ok(canonicalBeaker.purpose.length > 0)
  assert.ok(canonicalBeaker.safetyNote && canonicalBeaker.safetyNote.length > 0)

  // Overrides applied cleanly
  const overridden = resolveToolItem('beaker', {
    name: 'Custom 250 mL Reaction Beaker',
    purpose: 'Specialized dissolution step',
  })
  assert.equal(overridden.id, 'beaker')
  assert.equal(overridden.name, 'Custom 250 mL Reaction Beaker')
  assert.equal(overridden.purpose, 'Specialized dissolution step')
  assert.equal(overridden.visual, 'beaker')

  // Throws on nonexistent ID
  assert.throws(
    () => resolveToolItem('non-existent-device-xyz'),
    /Unknown equipment catalog ID/,
  )
})

test('ToolNotePopover renders accessible trigger and dialog markup', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { ToolNotePopover } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ToolNotePopover.tsx',
    )

    // Test standalone popover trigger markup
    const markup = await renderToStaticMarkup(
      React.createElement(ToolNotePopover, {
        toolId: 'beaker',
        triggerAriaLabel: 'View lab notes for Beaker',
      }),
    )

    assert.ok(markup.includes('aria-haspopup="dialog"'), 'Must have aria-haspopup="dialog"')
    assert.ok(markup.includes('aria-expanded="false"'), 'Must start closed')
    assert.ok(markup.includes('aria-label="View lab notes for Beaker"'), 'Accessible label applied')

    // Open popover markup contains authoritative name, primary use, handling, and safetyNote
    const openMarkup = await renderToStaticMarkup(
      React.createElement(ToolNotePopover, {
        toolId: 'burette',
        initialOpen: true,
      }),
    )
    assert.ok(openMarkup.includes('role="dialog"'), 'Must have role="dialog" when open')
    assert.ok(openMarkup.includes('Burette (50 mL)'), 'Must render authoritative tool name')
    assert.ok(openMarkup.toLowerCase().includes('measuring'), 'Must render category badge')
    assert.ok(openMarkup.includes('Primary Use'), 'Must render Primary Use section heading')
    assert.ok(openMarkup.includes('How to Handle Safely'), 'Must render How to Handle Safely section')
    assert.ok(openMarkup.includes('Safety Precaution:'), 'Must render Safety Precaution section')
    assert.ok(openMarkup.includes('Close tool note'), 'Must render close button with aria-label')

    // Test wrapping children mode
    const wrappedMarkup = await renderToStaticMarkup(
      React.createElement(
        ToolNotePopover,
        { toolId: 'bunsen-burner' },
        React.createElement('span', null, 'Clickable Burner Label'),
      ),
    )
    assert.ok(wrappedMarkup.includes('Clickable Burner Label'))
    assert.ok(wrappedMarkup.includes('aria-haspopup="dialog"'))

    // Graceful fallback for non-existent tool ID
    const unknownMarkup = await renderToStaticMarkup(
      React.createElement(
        ToolNotePopover,
        { toolId: 'completely-unknown-item' },
        React.createElement('span', null, 'Fallback text'),
      ),
    )
    assert.ok(unknownMarkup.includes('Fallback text'))
    assert.ok(!unknownMarkup.includes('aria-haspopup="dialog"'))
  } finally {
    await vite.close()
  }
})

test('ToolNotePopover integrates cleanly into safety EquipmentCard and simulation InventoryItem', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { EquipmentCard } = await vite.ssrLoadModule(
      '/src/features/safety/components/EquipmentCard.tsx',
    )
    const { equipmentGuideList } = await vite.ssrLoadModule(
      '/src/features/safety/data/equipmentGuideData.ts',
    )
    const { InventoryItem } = await vite.ssrLoadModule(
      '/src/features/simulations/components/InventoryItem.tsx',
    )

    // EquipmentCard renders ToolNotePopover
    const cardMarkup = await renderToStaticMarkup(
      React.createElement(EquipmentCard, {
        item: equipmentGuideList[0],
        isSelected: false,
        onSelect: () => {},
      }),
    )
    assert.ok(
      cardMarkup.includes('aria-label="View lab notes for Beaker"'),
      'EquipmentCard must render ToolNotePopover trigger',
    )

    // InventoryItem renders ToolNotePopover
    const inventoryMarkup = await renderToStaticMarkup(
      React.createElement(InventoryItem, {
        item: saltDissolutionWorkspace.inventory[0],
        selected: false,
        placed: false,
        placing: false,
        onSelect: () => {},
        onPlace: () => {},
      }),
    )
    assert.ok(
      inventoryMarkup.includes('aria-label="Equipment safety note for Beaker"'),
      'InventoryItem must render ToolNotePopover trigger',
    )
  } finally {
    await vite.close()
  }
})

test('experiment details route renders ToolNotePopover on equipment tools', async () => {
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

    // Verify popover triggers are rendered
    assert.ok(
      markup.includes('aria-label="View lab notes for Beaker"'),
      'Beaker tool note trigger button must be present',
    )
    assert.ok(
      markup.includes('aria-label="View lab notes for Graduated Cylinder"'),
      'Graduated cylinder note trigger must be present',
    )
    assert.ok(
      markup.includes('aria-label="View lab notes for Digital Balance"'),
      'Digital balance note trigger must be present',
    )
  } finally {
    await vite.close()
  }
})
