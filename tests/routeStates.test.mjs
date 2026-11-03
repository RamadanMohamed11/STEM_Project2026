import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

test('catalog and lab routes render honest available, planned, and invalid states', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const renderRoute = (path) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )

    const catalog = renderRoute('/experiments')
    assert.match(catalog, /Dissolving Salt in Water/)
    assert.match(catalog, /Measuring Liquid Volume/)
    assert.match(catalog, /Exploring pH Indicators/)
    assert.match(catalog, /href="\/experiments\/exp-salt-water-001\/lab"/)
    assert.doesNotMatch(catalog, /href="\/experiments\/exp-volume-002\/lab"/)
    assert.doesNotMatch(catalog, /href="\/experiments\/exp-ph-003\/lab"/)
    assert.match(catalog, /Not assigned yet/)

    const demo = renderRoute('/experiments/exp-salt-water-001/lab')
    assert.match(demo, /Dissolving Salt in Water/)
    assert.match(demo, /Interactive 3D laboratory/)
    assert.match(demo, /Toggle equipment inventory/)
    assert.match(demo, /Experiment guide/)
    assert.match(demo, /Immersive laboratory workspace/)
    assert.match(demo, /h-dvh/)
    assert.match(demo, /Live measurements/)
    assert.match(demo, /Validated steps 0 \/ 9/)
    assert.match(demo, /0% validated/)
    assert.match(demo, /Interactive 3D laboratory/)
    assert.match(demo, /Reset camera/)
    assert.match(demo, /Restart experiment/)
    assert.match(demo, /drag TILT handles to pour/)
    assert.match(demo, /Confirm safety/)
    assert.match(demo, /Step 1 \/ 9/)
    assert.match(demo, /Current experiment instruction/)
    assert.match(demo, /Read the laboratory safety rules/)
    assert.match(demo, /Show contextual hint/)
    assert.match(demo, /Expand measurements/)
    assert.doesNotMatch(demo, /Next physical action/)
    assert.match(demo, /Toggle equipment inventory/)
    assert.match(demo, /Enter fullscreen/)
    assert.doesNotMatch(demo, /Add measured salt/)
    assert.doesNotMatch(demo, /Run the demonstration/)
    assert.doesNotMatch(demo, /Experiment completed — Results/)

    const [
      { ExperimentResults },
      { saltExperimentDefinition },
      { initialWorkflowState },
      { initialSaltExperimentState },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/features/simulations/components/ExperimentResults.tsx'),
      vite.ssrLoadModule('/src/features/simulations/data/saltExperimentDefinition.ts'),
      vite.ssrLoadModule('/src/features/simulations/engine/workflow.ts'),
      vite.ssrLoadModule('/src/features/simulations/engine/saltExperiment.ts'),
    ])
    const initialWorkflow = initialWorkflowState(saltExperimentDefinition)
    const initialChemistry = initialSaltExperimentState()
    const props = {
      definition: saltExperimentDefinition,
      workflow: initialWorkflow,
      experiment: initialChemistry,
      onRestart: () => {},
    }
    assert.equal(renderToStaticMarkup(React.createElement(ExperimentResults, props)), '')
    const resultsMarkup = renderToStaticMarkup(
      React.createElement(ExperimentResults, {
        ...props,
        workflow: {
          ...initialWorkflow,
          completed: true,
          observationRecorded: true,
          measurements: { waterMl: 100, saltG: 5 },
        },
        experiment: {
          ...initialChemistry,
          waterMl: { water: 300, 'graduated-cylinder': 0, beaker: 100 },
          saltStockG: 95,
          saltInBeakerG: 5,
          dissolvedSaltG: 5,
        },
      }),
    )
    assert.match(resultsMarkup, /Experiment completed — Results/)
    assert.match(resultsMarkup, /Recorded water volume/)
    assert.match(resultsMarkup, /100 mL/)
    assert.match(resultsMarkup, /Modelled weighed sodium chloride mass/)
    assert.match(resultsMarkup, /5 g/)
    assert.match(resultsMarkup, /Simulated observation/)
    assert.match(resultsMarkup, /not measured kinetics/)
    assert.match(resultsMarkup, /Retry experiment/)
    assert.doesNotMatch(demo, /Experiment not found/)

    const preview = renderRoute('/experiments/preview/lab')
    assert.match(preview, /Interactive 3D laboratory/)

    const planned = renderRoute('/experiments/exp-volume-002/lab')
    assert.match(planned, /This lab is not available yet/)
    assert.doesNotMatch(planned, /Interactive 3D laboratory/)

    const invalid = renderRoute('/experiments/unknown-id/lab')
    assert.match(invalid, /Experiment not found/)
    assert.doesNotMatch(invalid, /Interactive 3D laboratory/)

    assert.match(renderRoute('/safety'), /Laboratory safety/)
    assert.match(renderRoute('/not-a-page'), /404 \/ PAGE NOT FOUND/)
  } finally {
    await vite.close()
  }
})
