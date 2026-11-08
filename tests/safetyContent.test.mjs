import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  safetySources,
  safetyIntroduction,
  ppeGuide,
  beforeLab,
  labBehavior,
  safetyReviewStatus,
} from '../src/features/safety/data/safetyContent.ts'

test('safety lessons have stable unique IDs, complete PPE explanations and traceable references', () => {
  const sources = new Set(safetySources.map((source) => source.id))
  assert.equal(sources.size, safetySources.length)
  for (const group of [safetyIntroduction, ppeGuide, beforeLab, labBehavior]) {
    assert.equal(new Set(group.map((item) => item.id)).size, group.length)
    for (const item of group) {
      assert.ok(item.sourceIds.length > 0)
      for (const source of item.sourceIds) assert.ok(sources.has(source), `${item.id}: ${source}`)
    }
  }
  assert.equal(ppeGuide.length, 5)
  for (const item of ppeGuide)
    for (const field of ['title', 'what', 'why', 'when', 'avoid']) assert.ok(item[field].trim())
  const gloves = ppeGuide.find((item) => item.id === 'gloves')
  assert.match(gloves.when, /risk assessment/)
  assert.match(gloves.avoid, /every chemical or heat/)
  assert.match(safetyReviewStatus, /review needed/)
})

test('public safety route renders guidance, grade navigation and the local review checklist', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const html = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/safety'] },
        React.createElement(AppRoutes),
      ),
    )
    for (const id of ['why-safety', 'ppe-guide', 'before-lab', 'lab-behavior']) {
      assert.ok(html.includes(`id="${id}"`))
      assert.ok(html.includes(`href="#${id}"`))
      assert.ok(html.includes(`aria-labelledby="${id}-title"`))
    }
    for (const item of ppeGuide) assert.ok(html.includes(item.title))
    for (const source of safetySources) assert.ok(html.includes(`href="${source.url}"`))
    assert.match(html, /href="\/grades"/)
    assert.match(html, /gloves are not needed for every activity/)
    assert.match(html, /academic review before use as official/)
    assert.match(html, /Never taste laboratory chemicals/)
    assert.match(html, /Safety Checklist/)
    assert.match(html, /Continue to Grade Selection/)
    assert.doesNotMatch(html, /safety completed|Safety Quiz/i)
  } finally {
    await vite.close()
  }
})
