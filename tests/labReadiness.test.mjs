import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  gearItems,
  requiredGearIds,
  getGearProgress,
  emergencyScenarios,
  safetyCheckQuestions,
  scoreChoices,
  isCorrectChoice,
} from '../src/features/safety/data/labReadiness.ts'
import { safetySources } from '../src/features/safety/data/safetyContent.ts'

test('gear items: unique ids, correct items have unique slots, wrong items never count', () => {
  assert.equal(new Set(gearItems.map((g) => g.id)).size, gearItems.length)
  const correct = gearItems.filter((g) => g.correct)
  assert.equal(correct.length, 5)
  assert.ok(
    gearItems.some((g) => !g.correct),
    'activity needs distractor items',
  )
  assert.equal(new Set(correct.map((g) => g.slot)).size, correct.length)
  for (const g of gearItems) {
    assert.ok(g.label.trim() && g.feedback.trim())
    if (!g.correct) assert.equal(g.slot, undefined)
  }
  const wrongOnly = new Set(gearItems.filter((g) => !g.correct).map((g) => g.id))
  assert.deepEqual(getGearProgress(wrongOnly), { count: 0, total: 5, complete: false })
  const all = new Set(requiredGearIds)
  assert.equal(getGearProgress(all).complete, true)
  all.delete('safety-goggles')
  assert.equal(getGearProgress(all).complete, false)
})

test('emergency and check questions are well formed with traceable sources', () => {
  const sources = new Set(safetySources.map((s) => s.id))
  assert.equal(emergencyScenarios.length, 5)
  assert.equal(safetyCheckQuestions.length, 3)
  for (const q of [...emergencyScenarios, ...safetyCheckQuestions]) {
    const ids = q.options.map((o) => o.id)
    assert.equal(new Set(ids).size, ids.length, q.id)
    assert.ok(ids.includes(q.correctOptionId), q.id)
    assert.ok(q.options.length >= 3)
    assert.ok(q.prompt.trim() && q.explanation.trim())
    assert.ok(q.sourceIds.length > 0)
    for (const s of q.sourceIds) assert.ok(sources.has(s), `${q.id}: ${s}`)
  }
  const eye = emergencyScenarios.find((q) => q.id === 'eye-splash')
  assert.match(eye.explanation, /15 minutes/)
})

test('quick check passes only when every answer is correct', () => {
  const allCorrect = Object.fromEntries(safetyCheckQuestions.map((q) => [q.id, q.correctOptionId]))
  assert.deepEqual(scoreChoices(safetyCheckQuestions, allCorrect), {
    correct: 3,
    answered: 3,
    total: 3,
    passed: true,
  })
  const oneWrong = { ...allCorrect, [safetyCheckQuestions[0].id]: 'student' }
  assert.equal(scoreChoices(safetyCheckQuestions, oneWrong).passed, false)
  const missing = { ...allCorrect, [safetyCheckQuestions[1].id]: undefined }
  assert.equal(scoreChoices(safetyCheckQuestions, missing).answered, 2)
  assert.equal(scoreChoices(safetyCheckQuestions, missing).passed, false)
  assert.equal(scoreChoices([], {}).passed, false)
  assert.equal(isCorrectChoice(safetyCheckQuestions[0], undefined), false)
})

test('safety page renders the interactive sections and lists the activity requirements', async () => {
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
    for (const id of ['lab-ready', 'emergencies', 'quick-check']) {
      assert.ok(html.includes(`id="${id}"`), id)
      assert.ok(html.includes(`href="#${id}"`), id)
    }
    assert.match(html, /0 of 5 required items on/)
    for (const g of gearItems) assert.ok(html.includes(g.label), g.label)
    assert.match(html, /aria-pressed="false"/)
    for (const q of emergencyScenarios) assert.ok(html.includes(q.title), q.title)
    assert.match(html, /Check my answers/)
    const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? []
    const optionCount = [...emergencyScenarios, ...safetyCheckQuestions].reduce(
      (n, q) => n + q.options.length,
      0,
    )
    assert.equal(radios.length, optionCount)
    for (const r of radios) assert.doesNotMatch(r, /checked=""/)
    assert.match(html, /To do:/)
  } finally {
    await vite.close()
  }
})
