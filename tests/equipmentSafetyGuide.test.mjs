import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { equipmentCategories, equipmentGuideList } from '../src/features/safety/data/equipmentGuideData.ts'

const requiredToolIds = [
  'beaker',
  'test-tube',
  'graduated-cylinder',
  'stirring-rod',
  'digital-balance',
  'spatula',
  'dropper-pipette',
  'chemical-container',
]

test('equipment guide dataset includes all 8 required tools with complete safety and educational metadata', () => {
  assert.equal(equipmentGuideList.length, 8, 'Must have exactly 8 laboratory equipment entries')

  const presentIds = equipmentGuideList.map((tool) => tool.id)
  for (const requiredId of requiredToolIds) {
    assert.ok(presentIds.includes(requiredId), `Missing required tool: ${requiredId}`)
  }

  // Ensure unique IDs
  const idSet = new Set(presentIds)
  assert.equal(idSet.size, 8, 'All equipment IDs must be unique')

  // Validate every entry structure
  for (const tool of equipmentGuideList) {
    assert.ok(tool.name.length > 2, `${tool.id} must have a descriptive name`)
    assert.ok(tool.shortPurpose.length > 10, `${tool.id} must have a short purpose description`)
    assert.ok(tool.description.length > 30, `${tool.id} must have a detailed educational description`)
    assert.ok(tool.materialType.length > 3, `${tool.id} must specify material type`)
    assert.ok(tool.intendedUse.length >= 2, `${tool.id} must have at least 2 intended use examples`)
    assert.ok(tool.safetyNotes.length >= 3, `${tool.id} must have at least 3 safe handling notes`)
    assert.ok(tool.commonMistakes.length >= 2, `${tool.id} must have at least 2 common mistakes to avoid`)
    assert.ok(tool.visualKey.length > 0, `${tool.id} must have a valid visualKey`)
  }

  // Categories
  assert.ok(equipmentCategories.length >= 4, 'Must have category filters')
  const validCatIds = new Set(equipmentCategories.map((c) => c.id))
  for (const tool of equipmentGuideList) {
    assert.ok(validCatIds.has(tool.category), `${tool.id} category ${tool.category} must be in equipmentCategories`)
  }
})

test('safety page integrates the interactive equipment guide with accessible navigation and simple English', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/safety'] },
        React.createElement(AppRoutes),
      ),
    )

    // Verify anchor nav link
    assert.ok(markup.includes('href="#equipment-guide"'), 'Top anchor link to equipment-guide')
    assert.ok(markup.includes('Equipment safety'), 'Top nav label for equipment-guide')

    // Verify section heading and landmark
    assert.ok(markup.includes('id="equipment-guide"'), 'Section ID landmark')
    assert.ok(
      markup.includes('Laboratory equipment safety guide'),
      'Section title for equipment safety guide',
    )
    assert.ok(markup.includes('05'), 'Section 05 number')

    // Verify search & filter toolbar
    assert.ok(markup.includes('id="equipment-search"'), 'Search input landmark')
    assert.ok(markup.includes('Search tools, purpose, or safety terms'), 'Search placeholder')
    assert.ok(markup.includes('Category:'), 'Category label')
    assert.ok(markup.includes('All Equipment'), 'All Equipment filter')
    assert.ok(markup.includes('Glassware'), 'Glassware filter')
    assert.ok(markup.includes('Measurement'), 'Measurement filter')
    assert.ok(markup.includes('Handling Tools'), 'Handling Tools filter')
    assert.ok(markup.includes('Storage &amp; Containers') || markup.includes('Storage & Containers'), 'Storage filter')

    // Verify all 8 tool names are rendered in the guide
    assert.ok(markup.includes('Beaker'), 'Beaker card')
    assert.ok(markup.includes('Test Tube'), 'Test Tube card')
    assert.ok(markup.includes('Graduated Cylinder'), 'Graduated Cylinder card')
    assert.ok(markup.includes('Glass Stirring Rod'), 'Glass Stirring Rod card')
    assert.ok(markup.includes('Digital Balance'), 'Digital Balance card')
    assert.ok(markup.includes('Laboratory Spatula'), 'Laboratory Spatula card')
    assert.ok(markup.includes('Dropper (Pipette)'), 'Dropper Pipette card')
    assert.ok(markup.includes('Chemical Container'), 'Chemical Container card')

    // Verify interactive action button labels
    assert.ok(markup.includes('View handling &amp; safety') || markup.includes('View handling & safety'), 'Action button')

    // Verify standard science rule reminder
    assert.ok(markup.includes('Standard Science Rule:'), 'Educational safety banner')

    // Verify existing safety content is fully preserved
    assert.ok(markup.includes('Laboratory safety'), 'Main page title')
    assert.ok(markup.includes('Why safety matters'), 'Section 01')
    assert.ok(markup.includes('Your protective equipment'), 'Section 02')
    assert.ok(markup.includes('Before entering the laboratory'), 'Section 03')
    assert.ok(markup.includes('Good habits in the lab'), 'Section 04')
    assert.ok(markup.includes('href="/grades"'), 'Grade link preserved')

    // Strict English check: no Arabic characters
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Safety page must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})
