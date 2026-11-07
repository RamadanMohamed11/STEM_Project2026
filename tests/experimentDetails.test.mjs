import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import { sampleCurriculum } from '../src/features/curriculum/data/sampleCurriculum.ts'
import { getReviewedExperimentLessons } from '../src/features/experiments/lib/experimentDetailsSelectors.ts'

test('learning metadata belongs to canonical catalog entries and only reviewed lesson links are eligible', () => {
  assert.deepEqual(
    demoCatalog.experiments.map((item) => item.id),
    ['exp-salt-water-001', 'exp-volume-002', 'exp-ph-003'],
  )
  assert.equal(demoCatalog.experiments[0], sampleCurriculum.experiments[0])
  const salt = demoCatalog.experiments[0]
  assert.equal(salt.learning.reviewStatus, 'draft')
  assert.equal(salt.learning.objectives.length, 5)
  for (const experiment of demoCatalog.experiments) {
    const { about, objectives, reviewStatus } = experiment.learning
    assert.ok(about.length > 0)
    assert.equal(reviewStatus, 'draft')
    assert.equal(new Set(objectives.map((item) => item.id)).size, objectives.length)
    assert.ok(objectives.every((item) => item.id && item.text))
    assert.deepEqual(getReviewedExperimentLessons(sampleCurriculum, experiment.id), [])
  }
  const reviewed = { ...sampleCurriculum, contentStatus: 'reviewed' }
  const before = JSON.stringify(reviewed)
  const contexts = getReviewedExperimentLessons(reviewed, 'exp-volume-002')
  assert.deepEqual(
    contexts.map((item) => item.lesson.id),
    ['sample-lesson-1-1', 'sample-lesson-1-2'],
  )
  assert.ok(
    contexts.every(
      (item) => item.grade.id === 'grade-secondary-1' && item.term.id === 'term-secondary-1-1',
    ),
  )
  assert.deepEqual(getReviewedExperimentLessons(reviewed, salt.id), [])
  assert.deepEqual(getReviewedExperimentLessons(undefined, salt.id), [])
  assert.deepEqual(
    getReviewedExperimentLessons({ ...reviewed, experiments: [] }, 'exp-volume-002'),
    [],
  )
  assert.deepEqual(getReviewedExperimentLessons({ ...reviewed, grades: [] }, 'exp-volume-002'), [])
  const links = {
    ...reviewed,
    lessonExperiments: [
      ...reviewed.lessonExperiments,
      reviewed.lessonExperiments[0],
      { lessonId: 'missing', experimentId: 'exp-volume-002', order: 0 },
    ],
  }
  assert.equal(getReviewedExperimentLessons(links, 'exp-volume-002').length, 2)
  assert.equal(JSON.stringify(reviewed), before)
})

test('direct details routes render structured introductions/objectives, honest availability and existing lab links', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { ExperimentLearningSections } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentLearningSections.tsx',
    )
    const { ExperimentOverview } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentOverview.tsx',
    )
    const render = (path, element = React.createElement(AppRoutes)) =>
      renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, element))
    const salt = demoCatalog.experiments[0]
    const html = render(`/experiments/${salt.id}`)
    assert.match(html, /<h1[^>]*>Dissolving Salt in Water/)
    for (const text of [
      'About This Experiment',
      'What You Will Learn',
      'Experiment Information',
      'Chemistry',
      'Beginner',
      'About 10 minutes',
      'Available Demo',
      'Demonstration learning objectives.',
      'academic review',
      'Concept illustration',
      'simplified computer model',
    ])
      assert.ok(html.includes(text), text)
    for (const objective of salt.learning.objectives)
      assert.ok(html.includes(objective.text), objective.id)
    assert.match(html, /<dl/)
    assert.match(html, /aria-label="Breadcrumb"/)
    assert.match(html, /aria-labelledby="experiment-objectives-title"/)
    assert.ok(html.includes('href="/experiments/exp-salt-water-001/lab"'))
    assert.match(html, />Start 3D Experiment</)
    assert.ok(html.includes('href="/experiments"'))
    assert.doesNotMatch(
      html,
      /More experiment details are coming soon|Related Lessons|First Secondary Grade|View Quiz/,
    )
    for (const title of [
      'Equipment',
      'Materials',
      'Experiment Steps',
      'Videos',
      'Results',
      'Safety Notes',
    ])
      assert.doesNotMatch(html, new RegExp(`<h2[^>]*>${title}</h2>`))
    for (const experiment of demoCatalog.experiments.slice(1)) {
      const planned = render(`/experiments/${experiment.id}`)
      assert.ok(planned.includes(experiment.title))
      assert.match(planned, /Coming Soon/)
      assert.match(planned, /This experiment is planned/)
      assert.match(planned, /About This Experiment/)
      assert.match(planned, /What You Will Learn/)
      assert.match(planned, /academic review/)
      assert.doesNotMatch(planned, />Start 3D Experiment<|Related Lessons/)
      assert.ok(!planned.includes(`href="/experiments/${experiment.id}/lab"`))
    }
    const missing = render('/experiments/unknown-id')
    assert.match(missing, /Experiment Not Found/)
    assert.doesNotMatch(missing, /What You Will Learn|Start 3D Experiment/)
    const returns = render(
      `/experiments/${salt.id}?${new URLSearchParams({ returnTo: '/experiments?q=salt' })}`,
    )
    assert.match(returns, /Back to Search Results/)
    assert.ok(returns.includes('href="/experiments?q=salt"'))
    assert.match(render('/experiments/exp-salt-water-001/lab'), /Immersive laboratory workspace/)
    assert.match(render('/experiments/preview/lab'), /Immersive laboratory workspace/)
    const custom = render(
      '/experiments',
      React.createElement(ExperimentLearningSections, {
        content: {
          reviewStatus: 'reviewed',
          about: ['Teacher-reviewed example text.'],
          objectives: [{ id: 'example', text: 'Example learning goal.' }],
        },
      }),
    )
    assert.match(custom, /Teacher-reviewed example text/)
    assert.match(custom, /Example learning goal/)
    assert.doesNotMatch(custom, /Demonstration learning objectives|salt dissolves/)
    const empty = render('/experiments', React.createElement(ExperimentLearningSections, {}))
    assert.match(empty, /Learning objectives are still being reviewed/)
    assert.doesNotMatch(empty, /<li/)
    const unsupported = render(
      '/experiments',
      React.createElement(ExperimentOverview, { experiment: { ...salt, id: 'unsupported' } }),
    )
    assert.match(unsupported, /Lab Unavailable/)
    assert.doesNotMatch(unsupported, /Start 3D Experiment/)
  } finally {
    await vite.close()
  }
})
