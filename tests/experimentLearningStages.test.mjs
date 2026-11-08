import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import {
  getExperimentLearningStages,
  getLearningStageNavigationState,
  resolveLinkedSimulationSteps,
  saltDissolutionLearningStages,
} from '../src/features/experiments/data/experimentLearningStages.ts'
import { saltExperimentDefinition } from '../src/features/simulations/data/saltExperimentDefinition.ts'
import { demoCatalog } from '../src/features/experiments/data/mockExperiments.ts'
import { useSaltSimulationStore } from '../src/features/simulations/state/useSaltSimulationStore.ts'
import { useLabSceneStore } from '../src/features/simulations/state/useLabSceneStore.ts'
import { restartExperimentSession } from '../src/features/simulations/state/sessionActions.ts'

test('five educational stages are ordered, linked to verified simulation steps, and separate from live workflow', () => {
  const data = getExperimentLearningStages('exp-salt-water-001')
  assert.ok(data, 'Salt dissolution learning stages must be defined')
  assert.equal(data, saltDissolutionLearningStages)
  assert.equal(data.stages.length, 5, 'Must support exactly five educational stages')

  // Verify stage ordering and canonical titles
  assert.deepEqual(
    data.stages.map((stage) => stage.order),
    [1, 2, 3, 4, 5],
  )
  assert.deepEqual(
    data.stages.map((stage) => stage.kind),
    ['equipment', 'materials', 'procedure', 'measurements', 'observations'],
  )
  assert.deepEqual(
    data.stages.map((stage) => stage.title),
    [
      'Laboratory Equipment',
      'Reactants and Chemicals',
      'Experimental Procedures',
      'Measurements',
      'Chemical Reactions and Results',
    ],
  )

  // Verify physical dissolution explanation (no invented chemical reaction)
  assert.match(data.reactionClassificationNote, /physical dissolution process/i)
  assert.match(data.reactionClassificationNote, /not a chemical reaction/i)
  const stage5 = data.stages[4]
  assert.equal(stage5.processClassification, 'physical-dissolution')
  assert.match(stage5.summary, /physical dissolution/i)
  assert.match(stage5.scientificExplanation, /Na⁺ and Cl⁻ ions/i)

  // Verify verified quantities (100 mL water, 5 g salt) in procedure & measurements
  const stage3Text = data.stages[2].steps.join(' ')
  assert.match(stage3Text, /100 mL of water/)
  assert.match(stage3Text, /5 g of (sodium chloride|salt)/)
  assert.match(stage3Text, /Stir until the salt dissolves/i)

  // Verify simulation step mapping resolves real step numbers and titles
  for (const stage of data.stages) {
    assert.ok(stage.linkedSimulationSteps.length > 0, `${stage.id} maps to simulation steps`)
    assert.ok(stage.relatedItems.length > 0, `${stage.id} maps to inventory items`)
    assert.equal(stage.video.status, 'coming-soon', 'Default video status is honest coming-soon')
    assert.ok(stage.extension.keyConcepts.length > 0, 'Future extension metadata is populated')
  }

  const resolvedSteps = resolveLinkedSimulationSteps(saltExperimentDefinition, [
    'measure-water',
    'missing-step',
    'stir',
  ])
  assert.deepEqual(
    resolvedSteps.map((s) => ({ id: s.stepId, num: s.stepNumber })),
    [
      { id: 'measure-water', num: 3 },
      { id: 'stir', num: 7 },
    ],
  )

  // Unknown experiments return undefined
  assert.equal(getExperimentLearningStages('unknown-id'), undefined)

  // Syllabus experiments have full 5 learning stages (T40)
  for (const exp of demoCatalog.experiments) {
    const stageData = getExperimentLearningStages(exp.id)
    assert.ok(stageData, `Experiment ${exp.id} has learning stages`)
    assert.equal(stageData.stages.length, 5, `Experiment ${exp.id} must have exactly 5 stages`)
  }
})

test('stage navigation state clamps boundaries and computes Previous/Next availability', () => {
  const stages = saltDissolutionLearningStages.stages

  const first = getLearningStageNavigationState(stages, 0)
  assert.equal(first.activeIndex, 0)
  assert.equal(first.stage?.title, 'Laboratory Equipment')
  assert.equal(first.progressPercent, 20)
  assert.equal(first.hasPrevious, false)
  assert.equal(first.hasNext, true)

  const middle = getLearningStageNavigationState(stages, 2)
  assert.equal(middle.activeIndex, 2)
  assert.equal(middle.stage?.title, 'Experimental Procedures')
  assert.equal(middle.progressPercent, 60)
  assert.equal(middle.hasPrevious, true)
  assert.equal(middle.hasNext, true)

  const last = getLearningStageNavigationState(stages, 4)
  assert.equal(last.activeIndex, 4)
  assert.equal(last.stage?.title, 'Chemical Reactions and Results')
  assert.equal(last.progressPercent, 100)
  assert.equal(last.hasPrevious, true)
  assert.equal(last.hasNext, false)

  // Clamping out-of-range indices
  assert.equal(getLearningStageNavigationState(stages, -10).activeIndex, 0)
  assert.equal(getLearningStageNavigationState(stages, 99).activeIndex, 4)

  // Empty/undefined handling
  const empty = getLearningStageNavigationState(undefined, 0)
  assert.equal(empty.stage, undefined)
  assert.equal(empty.totalStages, 0)
  assert.equal(empty.hasPrevious, false)
  assert.equal(empty.hasNext, false)
})

test('experiment details route renders five educational stages, navigation controls, and honest Video Coming Soon state without mutating simulation progress', async () => {
  restartExperimentSession()
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const { ExperimentLearningStageViewer } = await vite.ssrLoadModule(
      '/src/features/experiments/components/ExperimentLearningStageViewer.tsx',
    )
    const { useSaltSimulationStore: ssrSimStore } = await vite.ssrLoadModule(
      '/src/features/simulations/state/useSaltSimulationStore.ts',
    )
    const { useLabSceneStore: ssrSceneStore } = await vite.ssrLoadModule(
      '/src/features/simulations/state/useLabSceneStore.ts',
    )

    const beforeWorkflow = structuredClone(ssrSimStore.getState().workflow)
    const beforeChemistry = structuredClone(ssrSimStore.getState().experiment)
    const beforePlaced = [...ssrSceneStore.getState().placedIds]

    const detailsMarkup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments/exp-salt-water-001'] },
        React.createElement(AppRoutes),
      ),
    )

    // Verify section heading and all 5 stage navigation buttons
    assert.ok(detailsMarkup.includes('Educational Learning Stages'))
    for (const title of [
      'Laboratory Equipment',
      'Reactants and Chemicals',
      'Experimental Procedures',
      'Measurements',
      'Chemical Reactions and Results',
    ]) {
      assert.ok(detailsMarkup.includes(title), `Stage navigation includes ${title}`)
    }

    // Verify stage 1 content and honest Video Coming Soon state
    assert.ok(detailsMarkup.includes('Stage 1 of 5'))
    assert.ok(detailsMarkup.includes('Video Coming Soon'))
    assert.ok(detailsMarkup.includes('Previous Stage'))
    assert.ok(detailsMarkup.includes('Next Stage'))
    assert.ok(detailsMarkup.includes('Related 3D Workbench Steps'))
    assert.doesNotMatch(detailsMarkup, /<video/)

    // Render each stage (0..4) and verify stage-specific content and zero simulation mutation
    for (let idx = 0; idx < 5; idx++) {
      const stageMarkup = await renderToStaticMarkup(
        React.createElement(ExperimentLearningStageViewer, {
          data: saltDissolutionLearningStages,
          initialStageIndex: idx,
        }),
      )
      const expectedStage = saltDissolutionLearningStages.stages[idx]
      assert.ok(stageMarkup.includes(expectedStage.title))
      assert.ok(stageMarkup.includes(expectedStage.scientificExplanation))
      assert.ok(stageMarkup.includes(`Stage ${idx + 1} of 5`))
      assert.equal(
        /[\u0600-\u06FF]/.test(stageMarkup),
        false,
        `Stage ${idx + 1} must not contain Arabic characters`,
      )
    }

    // Verify simulation state was not mutated by rendering or navigating stages
    assert.deepEqual(ssrSimStore.getState().workflow, beforeWorkflow)
    assert.deepEqual(ssrSimStore.getState().experiment, beforeChemistry)
    assert.deepEqual(ssrSceneStore.getState().placedIds, beforePlaced)
    assert.equal(useSaltSimulationStore.getState().workflow.completed, false)
    assert.equal(useSaltSimulationStore.getState().workflow.stepIndex, 0)

    // Syllabus experiment renders full learning stages without empty state
    const volumeMarkup = await renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/experiments/exp-volume-002'] },
        React.createElement(AppRoutes),
      ),
    )
    assert.ok(volumeMarkup.includes('Educational Learning Stages'))
    assert.ok(
      !volumeMarkup.includes(
        'Five-stage educational explanations and demonstration videos for this planned experiment have not been finalized yet.',
      ),
    )

    // Undefined data produces honest empty placeholder
    const emptyMarkup = await renderToStaticMarkup(
      React.createElement(ExperimentLearningStageViewer, { data: undefined }),
    )
    assert.ok(
      emptyMarkup.includes(
        'Five-stage educational explanations and demonstration videos for this planned experiment have not been finalized yet.',
      ),
    )
  } finally {
    await vite.close()
  }
})

test('educational video player supports native HTML5 playback, poster image, and WebVTT captions without autoplay', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { EducationalVideoPlayer } = await vite.ssrLoadModule(
      '/src/features/experiments/components/EducationalVideoPlayer.tsx',
    )

    // 1. Missing / Coming-soon video state
    const comingSoonMarkup = await renderToStaticMarkup(
      React.createElement(EducationalVideoPlayer, {
        stageTitle: 'Experimental Procedures',
        video: {
          status: 'coming-soon',
          title: 'Step-by-Step Procedure Video',
          description: 'Approved lab recording is in preparation.',
          durationLabel: '2 min',
        },
      }),
    )
    assert.ok(comingSoonMarkup.includes('Video Coming Soon'))
    assert.ok(comingSoonMarkup.includes('Step-by-Step Procedure Video'))
    assert.doesNotMatch(comingSoonMarkup, /<video/)

    // 2. Available video with poster and WebVTT captions track
    const availableMarkup = await renderToStaticMarkup(
      React.createElement(EducationalVideoPlayer, {
        stageTitle: 'Experimental Procedures',
        video: {
          status: 'available',
          title: 'Measuring 100 mL Water and Dissolving 5 g NaCl',
          description: 'Recorded laboratory demonstration of aqueous solution preparation.',
          posterUrl: '/media/posters/salt-procedure.jpg',
          sources: [
            { src: '/media/videos/salt-procedure.mp4', type: 'video/mp4' },
            { src: '/media/videos/salt-procedure.webm', type: 'video/webm' },
          ],
          tracks: [
            {
              id: 'en-captions',
              src: '/media/captions/salt-procedure.en.vtt',
              srclang: 'en',
              label: 'English',
              kind: 'captions',
              default: true,
            },
          ],
        },
      }),
    )

    assert.match(availableMarkup, /<video[^>]*controls/)
    assert.match(availableMarkup, /preload="metadata"/)
    assert.match(availableMarkup, /poster="\/media\/posters\/salt-procedure\.jpg"/)
    assert.doesNotMatch(availableMarkup, /autoplay/i, 'Must never autoplay video with sound')
    assert.ok(availableMarkup.includes('src="/media/videos/salt-procedure.mp4"'))
    assert.ok(availableMarkup.includes('src="/media/videos/salt-procedure.webm"'))
    assert.ok(availableMarkup.includes('src="/media/captions/salt-procedure.en.vtt"'))
    assert.match(availableMarkup, /srclang="en"/i)
    assert.ok(availableMarkup.includes('label="English"'))
    assert.ok(availableMarkup.includes('Captions available (English)'))
    assert.ok(availableMarkup.includes('Play demonstration video'))
  } finally {
    await vite.close()
  }
})
