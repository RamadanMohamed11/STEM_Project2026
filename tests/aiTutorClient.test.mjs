import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { MemoryRouter } from 'react-router'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  AI_TUTOR_CLIENT_LIMITS,
  clipLabState,
  createTutorEventParser,
  getAiTutorEndpoint,
  prepareHistory,
  streamTutorReply,
  toStageLabel,
  tutorMessages,
} from '../src/features/ai/lib/aiTutorClient.ts'
import { getSuggestedQuestions, summarizeLabState } from '../src/features/ai/lib/tutorContext.ts'
import { validateTutorRequest } from '../supabase/functions/ai-tutor/core.ts'

const ev = (event) => `data: ${JSON.stringify(event)}\n\n`

function streamResponse(parts, { status = 200, errorAfter } = {}) {
  const encoder = new TextEncoder()
  let i = 0
  return new Response(
    new ReadableStream({
      pull(controller) {
        if (errorAfter !== undefined && i === errorAfter)
          return controller.error(new Error('reset'))
        if (i < parts.length) controller.enqueue(encoder.encode(parts[i++]))
        else controller.close()
      },
    }),
    { status, headers: { 'Content-Type': 'text/event-stream' } },
  )
}

function run(response, extra = {}) {
  const deltas = []
  const calls = []
  return streamTutorReply({
    endpoint: 'https://example.supabase.co/functions/v1/ai-tutor',
    publishableKey: 'sb_publishable_test',
    accessToken: 'jwt-123',
    body: { experimentId: 'exp-salt-water-001', messages: [{ role: 'user', content: 'Why?' }] },
    onDelta: (text) => deltas.push(text),
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      if (typeof response === 'function') return response(init)
      return response
    },
    ...extra,
  }).then((outcome) => ({ outcome, deltas, calls }))
}

test('event parser handles split chunks, CRLF and malformed blocks', () => {
  const parser = createTutorEventParser()
  const text =
    ev({ type: 'delta', text: 'Hel' }) +
    'data: not-json\n\n' +
    ev({ type: 'delta', text: 'lo' }).replace(/\n/g, '\r\n') +
    ev({ type: 'done', finishReason: 'stop' })
  const events = []
  for (let i = 0; i < text.length; i += 5) events.push(...parser.push(text.slice(i, i + 5)))
  events.push(...parser.flush())
  assert.deepEqual(events, [
    { type: 'delta', text: 'Hel' },
    { type: 'delta', text: 'lo' },
    { type: 'done', finishReason: 'stop' },
  ])
})

test('history is trimmed to server limits and always valid for the function', () => {
  const long = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: `m${i}`,
  }))
  long.push({ role: 'user', content: 'x'.repeat(AI_TUTOR_CLIENT_LIMITS.maxMessageChars + 50) })
  long.splice(5, 0, { role: 'assistant', content: '   ' })
  const history = prepareHistory(long)
  assert.ok(history.length <= AI_TUTOR_CLIENT_LIMITS.maxMessages)
  assert.equal(history[0].role, 'user')
  assert.equal(history.at(-1).content.length, AI_TUTOR_CLIENT_LIMITS.maxMessageChars)
  const body = {
    experimentId: 'exp-salt-water-001',
    stage: toStageLabel('Mix & dissolve (2/5)'),
    labState: clipLabState('a\n\n'.repeat(900)),
    messages: history,
  }
  assert.equal(validateTutorRequest(body).ok, true, 'client output must pass server validation')
})

test('stage labels and lab state are sanitized for the server rules', () => {
  assert.equal(toStageLabel('Mix & dissolve (2/5)'), 'Mix dissolve 2 5')
  assert.equal(toStageLabel('  '), undefined)
  assert.equal(toStageLabel('—'), undefined)
  assert.equal(toStageLabel(undefined), undefined)
  assert.equal(clipLabState('  '), undefined)
  assert.equal(clipLabState('x'.repeat(5000)).length, AI_TUTOR_CLIENT_LIMITS.maxLabStateChars)
  assert.equal(
    getAiTutorEndpoint('https://abc.supabase.co/'),
    'https://abc.supabase.co/functions/v1/ai-tutor',
  )
})

test('streams deltas and sends the session token, publishable key and body', async () => {
  const { outcome, deltas, calls } = await run(
    streamResponse([
      ev({ type: 'delta', text: 'Salt ' }),
      ev({ type: 'delta', text: 'dissolves.' }) + ev({ type: 'done', finishReason: 'stop' }),
    ]),
  )
  assert.deepEqual(outcome, { kind: 'done' })
  assert.equal(deltas.join(''), 'Salt dissolves.')
  const { init } = calls[0]
  assert.equal(init.method, 'POST')
  assert.equal(init.headers.Authorization, 'Bearer jwt-123')
  assert.equal(init.headers.apikey, 'sb_publishable_test')
  assert.equal(JSON.parse(init.body).experimentId, 'exp-salt-water-001')
})

test('maps 401, 429 and server errors to student-safe outcomes', async () => {
  const json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  assert.deepEqual((await run(json(401, { error: 'x' }))).outcome, {
    kind: 'unauthorized',
    message: tutorMessages.unauthorized,
  })
  assert.equal((await run(json(429, { error: 'Hourly limit.' }))).outcome.kind, 'rate-limited')
  assert.equal(
    (await run(new Response('nope', { status: 429 }))).outcome.message,
    tutorMessages.rateLimited,
  )
  assert.deepEqual((await run(json(502, { error: 'The AI tutor is not available.' }))).outcome, {
    kind: 'error',
    message: 'The AI tutor is not available.',
  })
  assert.equal(
    (await run(new Response('<html>', { status: 500 }))).outcome.message,
    tutorMessages.unavailable,
  )
  const offline = await run(() => Promise.reject(new TypeError('Failed to fetch')))
  assert.deepEqual(offline.outcome, { kind: 'error', message: tutorMessages.unavailable })
})

test('error events, cut-off streams and network resets end as errors with partial text kept', async () => {
  const errored = await run(
    streamResponse([
      ev({ type: 'delta', text: 'Part' }) + ev({ type: 'error', message: 'Stopped.' }),
    ]),
  )
  assert.deepEqual(errored.outcome, { kind: 'error', message: 'Stopped.' })
  assert.equal(errored.deltas.join(''), 'Part')
  const cut = await run(streamResponse([ev({ type: 'delta', text: 'Half' })]))
  assert.deepEqual(cut.outcome, { kind: 'error', message: tutorMessages.interrupted })
  const reset = await run(streamResponse([ev({ type: 'delta', text: 'A' })], { errorAfter: 1 }))
  assert.equal(reset.outcome.kind, 'error')
})

test('aborting returns an aborted outcome', async () => {
  const controller = new AbortController()
  const pending = run(
    (init) =>
      new Promise((_, reject) =>
        init.signal.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
        ),
      ),
    { signal: controller.signal },
  )
  controller.abort()
  assert.deepEqual((await pending).outcome, { kind: 'aborted' })
})

test('suggested questions depend on the surface and lab stage', () => {
  assert.equal(getSuggestedQuestions({ surface: 'details' }).length, 3)
  const procedure = getSuggestedQuestions({ surface: 'lab', stageId: 'procedure' })
  assert.ok(procedure.some((q) => /stirring/i.test(q)))
  assert.notDeepEqual(procedure, getSuggestedQuestions({ surface: 'lab', stageId: 'setup' }))
  assert.deepEqual(
    getSuggestedQuestions({ surface: 'lab', stageId: 'procedure', completed: true }),
    getSuggestedQuestions({ surface: 'lab', stageId: 'review' }),
  )
  assert.equal(getSuggestedQuestions({ surface: 'lab', stageId: 'unknown' }).length, 3)
})

test('lab state summary is short, readable and skips empty values', () => {
  const summary = summarizeLabState({
    stageTitle: 'Mix and dissolve',
    stepTitle: 'Stir until no solid remains',
    stepNumber: 7,
    totalSteps: 9,
    completed: false,
    placedEquipment: ['Beaker', 'Stirring rod'],
    liquids: { beaker: 100, 'graduated-cylinder': 0 },
    substances: { saltStockG: 95, saltInBeakerG: 5, saltOnBoatG: 0, dissolvedSaltG: 4.96 },
    measurements: { waterMl: 100, saltG: null },
  })
  assert.equal(
    summary,
    'Step 7 of 9: Stir until no solid remains. Stage: Mix and dissolve. On the bench: Beaker, Stirring rod. Water: beaker 100 mL. Sodium chloride: salt stock 95 g, salt in beaker 5 g, dissolved salt 5 g. Recorded: water 100 mL.',
  )
  const empty = summarizeLabState({
    stepNumber: 1,
    totalSteps: 9,
    completed: false,
    placedEquipment: [],
    liquids: {},
    substances: {},
    measurements: {},
  })
  assert.equal(empty, 'Step 1 of 9. No equipment on the bench yet.')
  assert.match(
    summarizeLabState({
      ...{
        stepNumber: 9,
        totalSteps: 9,
        placedEquipment: [],
        liquids: {},
        substances: {},
        measurements: {},
      },
      completed: true,
    }),
    /^Experiment completed\./,
  )
})

test('experiment details renders the collapsible AI tutor panel', async () => {
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
    assert.match(html, /Ask the AI tutor/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /AI answers can be wrong — check with your teacher\./)
    assert.match(html, /aria-live="polite"/)
    assert.doesNotMatch(html, /AI assistant planned/)
  } finally {
    await vite.close()
  }
})

test('signed-in students see suggestions, a labelled input and send control', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AiTutorPanel } = await vite.ssrLoadModule(
      '/src/features/ai/components/AiTutorPanel.tsx',
    )
    const { AuthContext } = await vite.ssrLoadModule('/src/features/auth/authContext.ts')
    const state = { status: 'authenticated', user: { id: 'u1', email: 's@example.test' } }
    const render = (props) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(
            AuthContext.Provider,
            { value: { auth: {}, state } },
            React.createElement(AiTutorPanel, {
              experimentId: 'exp-salt-water-001',
              experimentTitle: 'Dissolving Salt in Water',
              suggestions: getSuggestedQuestions({ surface: 'lab', stageId: 'procedure' }),
              ...props,
            }),
          ),
        ),
      )
    const overlay = await render({ variant: 'overlay' })
    for (const q of getSuggestedQuestions({ surface: 'lab', stageId: 'procedure' }))
      assert.ok(overlay.includes(q.replace(/’/g, '’')), q)
    assert.match(overlay, /<label[^>]*>Your question for the AI tutor<\/label>/)
    assert.match(overlay, /<textarea[^>]*maxLength="2000"/)
    assert.match(overlay, /aria-label="Send question"/)
    assert.doesNotMatch(overlay, /Log in to ask/)
    const page = await render({ variant: 'page' })
    assert.match(page, /aria-expanded="false"/)
    assert.match(page, /hidden=""/)
  } finally {
    await vite.close()
  }
})
