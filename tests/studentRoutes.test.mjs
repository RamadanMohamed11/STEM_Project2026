import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { getExperimentPaths } from '../src/app/paths.ts'
import { getActiveNavigationId, getPageContext } from '../src/app/navigation.ts'

test('student journey pages support direct entry without accounts, selections or quiz attempts', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const render = (path) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )
    const id = 'exp-salt-water-001'
    const paths = getExperimentPaths(id)
    for (const [path, heading, nextPath] of [
      ['/signup', 'Sign Up', '/safety'],
      ['/login', 'Login', '/safety'],
      ['/grades', 'Choose Your Grade', '/terms'],
      ['/terms', 'Choose Your Term', '/experiments'],
      [paths.details, 'Dissolving Salt in Water', paths.laboratory],
      [paths.quiz, 'Experiment Quiz', paths.results],
      [paths.results, 'Quiz Results', paths.quiz],
    ]) {
      const markup = render(path)
      assert.ok(markup.includes(heading), path)
      assert.ok(markup.includes(`href="${nextPath}"`), `${path} next link`)
      if (path === '/terms') assert.match(markup, /Demonstration curriculum/)
      else if (path === paths.details) assert.match(markup, /What You Will Learn/)
      else assert.match(markup, /[Cc]oming soon/)
      assert.match(markup, /Main navigation/)
      assert.doesNotMatch(markup, /Immersive laboratory workspace/)
      if (path === '/signup') {
        assert.match(markup, /aria-label="Student registration"/)
        assert.match(markup, /autocomplete="new-password"/i)
      } else if (path === '/login') {
        assert.match(markup, /aria-label="Student login"/)
        assert.match(markup, /autocomplete="current-password"/i)
      } else {
        assert.doesNotMatch(markup, /<form|type="password"/)
      }
      assert.doesNotMatch(markup, /Page not found|404 \/ PAGE NOT FOUND/)
    }
    assert.match(render('/signup'), /cannot create an account yet/)
    assert.match(render('/login'), /without an account/)
    assert.match(render(paths.results), /No quiz results yet/)
    assert.match(render(paths.results), /no score to show/)
    assert.match(render('/safety'), /href="\/grades"/)
    assert.match(render('/'), /href="\/signup"/)
    const catalog = render('/experiments')
    for (const experimentId of [id, 'exp-volume-002', 'exp-ph-003']) {
      assert.ok(catalog.includes(`href="${getExperimentPaths(experimentId).details}"`))
    }
    assert.ok(catalog.includes(`href="${paths.laboratory}"`), 'existing direct lab link remains')
    const planned = render('/experiments/exp-volume-002')
    assert.match(planned, /This experiment is planned/)
    assert.doesNotMatch(planned, />Start (?:3D )?Experiment</)
    for (const suffix of ['', '/quiz', '/quiz/results']) {
      const unknown = render('/experiments/unknown-id' + suffix)
      assert.match(unknown, /Experiment Not Found/)
      assert.match(unknown, /Not found/)
      assert.doesNotMatch(unknown, /Coming soon|>Quiz Results<\/h1>|>Start Experiment</)
    }
    assert.match(render('/grades/not-a-grade'), /404 \/ PAGE NOT FOUND/)
    assert.match(render(paths.quiz + '/not-a-page'), /404 \/ PAGE NOT FOUND/)
  } finally {
    await vite.close()
  }
})

test('navigation highlights the experiment area for details, quizzes and results and keeps the lab separate', () => {
  const cases = [
    ['/signup', 'signup', 'Sign Up'],
    ['/login/', 'login', 'Login'],
    ['/grades', 'grades', 'Choose Your Grade'],
    ['/terms/', 'terms', 'Choose Your Term'],
    ['/experiments', 'experiments', 'Experiments'],
    ['/experiments/exp-salt-water-001', 'experiments', 'Experiment Details'],
    ['/experiments/exp-salt-water-001/quiz', 'experiments', 'Experiment Quiz'],
    ['/experiments/exp-salt-water-001/quiz/results/', 'experiments', 'Quiz Results'],
    ['/experiments/exp-salt-water-001/lab', 'lab', 'Virtual Lab'],
    ['/experiments/preview/lab/', 'lab', 'Virtual Lab'],
    ['/safety', 'safety', 'Safety Procedures'],
    ['/LOGIN', 'login', 'Login'],
    ['/not-a-page', null, 'Page not found'],
    ['/experiments/id/quiz/unknown', null, 'Page not found'],
  ]
  for (const [path, id, context] of cases) {
    assert.equal(getActiveNavigationId(path), id, path)
    assert.equal(getPageContext(path), context, path)
  }
})

test('experiment links encode identifiers and keep the existing laboratory URL', () => {
  assert.deepEqual(getExperimentPaths('salt / water?'), {
    details: '/experiments/salt%20%2F%20water%3F',
    laboratory: '/experiments/salt%20%2F%20water%3F/lab',
    quiz: '/experiments/salt%20%2F%20water%3F/quiz',
    results: '/experiments/salt%20%2F%20water%3F/quiz/results',
  })
})
