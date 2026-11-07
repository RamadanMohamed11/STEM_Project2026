import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

test('lesson listings reuse catalog cards and honor associations, availability and direct routes', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { LessonExperiments } = await vite.ssrLoadModule(
      '/src/features/curriculum/components/LessonExperiments.tsx',
    )
    const { ExperimentCard } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentCard.tsx',
    )
    const { sampleCurriculum: data } = await vite.ssrLoadModule(
      '/src/features/curriculum/data/sampleCurriculum.ts',
    )
    const before = JSON.stringify(data)
    const render = (path, element = React.createElement(AppRoutes)) =>
      renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, element))
    const path = '/curriculum/lessons/sample-lesson-1-1'
    const multiple = render(path)
    assert.match(multiple, /Experiments in This Lesson/)
    assert.match(multiple, /First Secondary Grade/)
    assert.match(multiple, /First Term/)
    assert.match(multiple, /Unit 1/)
    assert.match(multiple, /2 experiments assigned/)
    assert.equal((multiple.match(/<article /g) ?? []).length, 2)
    assert.ok(
      multiple.indexOf('Measuring Liquid Volume') < multiple.indexOf('Exploring pH Indicators'),
    )
    assert.match(multiple, /Coming Soon/)
    assert.match(multiple, /Beginner/)
    assert.match(multiple, /~15 min/)
    assert.match(multiple, /Low-risk precautions/)
    assert.match(multiple, /Safety notes pending/)
    assert.ok(multiple.includes('href="/experiments/exp-volume-002?returnTo='))
    assert.ok(multiple.includes('href="/experiments/exp-ph-003?returnTo='))
    assert.ok(
      multiple.includes(
        'href="/curriculum?grade=grade-secondary-1&amp;term=term-secondary-1-1&amp;unit=sample-unit-1"',
      ),
    )
    assert.doesNotMatch(
      multiple,
      /href="\/experiments\/exp-[^\"]*\/lab"|>Start Experiment<|Dissolving Salt in Water/,
    )
    const single = render('/curriculum/lessons/sample-lesson-1-2')
    assert.match(single, /1 experiment assigned/)
    assert.equal((single.match(/<article /g) ?? []).length, 1)
    assert.doesNotMatch(single, /Exploring pH Indicators/)
    assert.match(render('/curriculum/lessons/unknown'), /Lesson Not Found/)

    const renderData = (snapshot) =>
      render(
        path,
        React.createElement(LessonExperiments, { data: snapshot, lessonId: 'sample-lesson-1-1' }),
      )
    const empty = renderData({ ...data, lessonExperiments: [] })
    assert.match(empty, /No Experiments Available/)
    assert.match(empty, /0 experiments assigned/)
    assert.doesNotMatch(empty, /<article /)
    const broken = renderData({ ...data, units: [] })
    assert.match(broken, /Lesson Not Found/)
    const defensive = renderData({
      ...data,
      lessonExperiments: [
        ...data.lessonExperiments,
        { lessonId: 'sample-lesson-1-1', experimentId: 'missing', order: 0 },
        { lessonId: 'sample-lesson-1-1', experimentId: 'exp-volume-002', order: 3 },
      ],
    })
    assert.equal((defensive.match(/<article /g) ?? []).length, 2)

    // Test-only mapping verifies future playable lessons. Production mappings are untouched.
    const available = renderData({
      ...data,
      lessonExperiments: [
        { lessonId: 'sample-lesson-1-1', experimentId: 'exp-salt-water-001', order: 1 },
      ],
    })
    assert.match(available, /Dissolving Salt in Water/)
    assert.match(available, />Start Experiment</)
    assert.ok(available.includes('href="/experiments/exp-salt-water-001/lab"'))
    assert.match(render('/experiments/exp-salt-water-001'), /Dissolving Salt in Water/)
    assert.match(render('/experiments/exp-salt-water-001/lab'), /Immersive laboratory workspace/)
    assert.match(render('/experiments/exp-volume-002'), /This experiment is planned/)
    const unsupported = render(
      path,
      React.createElement(ExperimentCard, {
        experiment: { ...data.experiments[0], id: 'unsupported-demo' },
        index: 0,
      }),
    )
    assert.match(unsupported, /Lab Unavailable/)
    assert.doesNotMatch(unsupported, />Start Experiment<|href="[^\"]*\/lab"/)
    const planned = render(
      path,
      React.createElement(ExperimentCard, {
        experiment: { ...data.experiments[0], status: 'planned' },
        index: 0,
      }),
    )
    assert.doesNotMatch(planned, />Start Experiment<|href="[^\"]*\/lab"/)
    assert.equal(JSON.stringify(data), before)
    assert.equal(
      data.lessonExperiments.some((link) => link.experimentId === 'exp-salt-water-001'),
      false,
    )
  } finally {
    await vite.close()
  }
})
