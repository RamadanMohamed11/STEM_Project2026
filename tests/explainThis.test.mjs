import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import { buildExplainPrompt } from '../src/features/ai/lib/tutorContext.ts'
import {
  explainFallbackReasons,
  explainStateFromOutcome,
} from '../src/features/ai/lib/explainState.ts'
import { validateTutorRequest } from '../supabase/functions/ai-tutor/core.ts'

test('explain prompts are fixed templates that pass server validation', () => {
  const stage = buildExplainPrompt({
    kind: 'stage',
    stageTitle: 'Reactants and Chemicals',
    experimentTitle: 'Dissolving Salt in Water',
  })
  assert.match(
    stage,
    /^Explain what happens in the "Reactants and Chemicals" stage of "Dissolving Salt in Water"\./,
  )
  const observation = buildExplainPrompt({
    kind: 'observation',
    experimentTitle: 'Dissolving Salt in Water',
    observation: 'No solid salt\nremains.   The solution is clear',
  })
  assert.match(
    observation,
    /^Explain the observed change in "Dissolving Salt in Water": No solid salt remains\. The solution is clear\./,
  )
  assert.match(observation, /physical or chemical change/)
  const huge = buildExplainPrompt({
    kind: 'observation',
    experimentTitle: 'T',
    observation: 'x'.repeat(10_000),
  })
  assert.ok(huge.length <= 2000)
  for (const content of [stage, observation, huge])
    assert.equal(
      validateTutorRequest({
        experimentId: 'exp-salt-water-001',
        messages: [{ role: 'user', content }],
      }).ok,
      true,
    )
})

test('every failure falls back to the saved explanation; stop keeps partial text', () => {
  assert.deepEqual(explainStateFromOutcome({ kind: 'done' }, 'Because ions separate.'), {
    status: 'done',
    text: 'Because ions separate.',
  })
  assert.deepEqual(explainStateFromOutcome({ kind: 'done' }, '  '), {
    status: 'fallback',
    reason: explainFallbackReasons.failed,
  })
  assert.deepEqual(explainStateFromOutcome({ kind: 'aborted' }, 'Part'), {
    status: 'done',
    text: 'Part',
    stopped: true,
  })
  assert.deepEqual(explainStateFromOutcome({ kind: 'aborted' }, ''), { status: 'idle' })
  assert.equal(
    explainStateFromOutcome({ kind: 'unauthorized', message: 'x' }, '').reason,
    explainFallbackReasons.loggedOut,
  )
  assert.match(
    explainStateFromOutcome({ kind: 'rate-limited', message: 'Hourly limit reached.' }, '').reason,
    /^Hourly limit reached\. Here is the saved explanation:/,
  )
  const failed = explainStateFromOutcome({ kind: 'error', message: 'secret upstream' }, 'partial')
  assert.deepEqual(failed, { status: 'fallback', reason: explainFallbackReasons.failed })
})

test('learning stages render an Explain this button without calling the AI', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const html = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments/exp-salt-water-001'] },
        React.createElement(AppRoutes),
      ),
    )
    assert.match(html, />Explain this</)
    assert.doesNotMatch(html, /AI explanation|saved explanation:/)
    assert.match(html, /aria-live="polite"/)
  } finally {
    await vite.close()
  }
})
