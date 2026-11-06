import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('contextual object interaction and selection-first guidance render from domain state', async (t) => {
  const vite = await createServer({
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  })
  try {
    const [
      { PairInteractionPanel },
      { ContextualInstruction },
      { LaboratoryInteractionCoach },
      { useLabSceneStore: scene },
      { useSaltSimulationStore: science },
      { saltExperimentDefinition: definition },
      { acknowledgeLabSafety },
    ] = await Promise.all([
      vite.ssrLoadModule('/src/features/simulations/components/PairInteractionPanel.tsx'),
      vite.ssrLoadModule('/src/features/simulations/components/ContextualInstruction.tsx'),
      vite.ssrLoadModule('/src/features/simulations/components/LaboratoryInteractionCoach.tsx'),
      vite.ssrLoadModule('/src/features/simulations/state/useLabSceneStore.ts'),
      vite.ssrLoadModule('/src/features/simulations/state/useSaltSimulationStore.ts'),
      vite.ssrLoadModule('/src/features/simulations/data/saltExperimentDefinition.ts'),
      vite.ssrLoadModule('/src/features/simulations/state/directInteractions.ts'),
    ])
    const sceneInitial = { ...scene.getInitialState() }
    const scienceInitial = { ...science.getInitialState() }
    const render = (component = PairInteractionPanel, props = {}) => {
      // Zustand's bound hook closes over its original API; update the SSR snapshots, not the hook.
      Object.assign(scene.getInitialState(), scene.getState())
      Object.assign(science.getInitialState(), science.getState())
      return renderToStaticMarkup(React.createElement(component, props))
    }
    let sequence = 0
    const choose = (...selectedIds) =>
      scene.setState({ selectedIds, selectedId: selectedIds.at(-1) ?? null })
    const reset = () => {
      scene.getState().resetEquipment()
      science.getState().reset()
      scene.setState({
        selectedIds: [],
        clearSelection: () => scene.setState({ selectedIds: [], selectedId: null }),
        placedIds: definition.availableInventory,
      })
    }
    const ready = () => {
      reset()
      assert.equal(acknowledgeLabSafety(), true)
      assert.equal(science.getState().workflow.stepIndex, 2)
    }
    const start = (sourceId, targetId, amount, materialId = 'water', unit = 'mL') => {
      const result = science.getState().beginTransfer({
        requestId: `panel-test-${++sequence}`,
        sourceId,
        targetId,
        amount,
        materialId,
        unit,
      })
      assert.equal(result.ok, true, result.message)
      return science.getState().transfer
    }
    const complete = (...args) => {
      const op = start(...args)
      science.getState().advanceTransfer(100000, op.operationId)
      assert.equal(science.getState().transfer, null)
    }
    const saltStage = () => {
      ready()
      complete('water', 'graduated-cylinder', 100)
      complete('graduated-cylinder', 'beaker', 100)
    }
    const button = (markup, label) => {
      const tag = markup.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]
      assert.ok(tag, `Missing button: ${label}`)
      return tag
    }

    try {
      await t.test(
        'empty selection is quiet; single information has live quantities and capacity',
        () => {
          reset()
          assert.equal(render(), '')
          choose('water')
          const markup = render()
          assert.match(markup, /aria-label="Object interaction"/)
          assert.match(markup, /Water container/)
          assert.match(markup, /400 \/ 500 mL/)
          assert.doesNotMatch(markup, /<form|type="number"/)
          choose('beaker')
          assert.match(render(), /0 \/ 250 mL/)
          choose('stirring-rod')
          assert.match(render(), /draw complete circles/)
        },
      )

      await t.test(
        'pair form is unordered, labeled, and exposes exact canonical limits and units',
        () => {
          ready()
          choose('graduated-cylinder', 'water')
          const markup = render()
          assert.match(markup, /<form noValidate=""/)
          assert.match(markup, /aria-label="Transfer amount"/)
          assert.match(markup, /type="number"[^>]*min="0.1"[^>]*step="0.1"[^>]*max="100"/)
          assert.match(markup, /<option value="mL" selected="">mL<\/option>/)
          assert.match(markup, /<option value="L">L<\/option>/)
          assert.doesNotMatch(markup, /<option value="g"/)
          assert.match(markup, /Available/)
          assert.match(markup, /Free capacity/)
          assert.match(markup, /Max now/)
          assert.match(
            button(markup, 'Transfer water from Water container to Graduated cylinder'),
            /aria-pressed="true"/,
          )
          assert.doesNotMatch(markup, /TILT|tilt handle|mesh/i)
        },
      )

      await t.test('defaults to first enabled direction, not first selected object', () => {
        ready()
        complete('water', 'graduated-cylinder', 100)
        choose('beaker', 'graduated-cylinder')
        const markup = render()
        assert.match(
          button(markup, 'Transfer water from Graduated cylinder to Beaker'),
          /aria-pressed="true"/,
        )
        assert.match(
          button(markup, 'Transfer water from Beaker to Graduated cylinder'),
          /disabled=""/,
        )
        assert.match(markup, /selected source is empty/)
        complete('graduated-cylinder', 'beaker', 30.1)
        const reversible = render()
        assert.doesNotMatch(
          button(reversible, 'Transfer water from Graduated cylinder to Beaker'),
          / disabled=""/,
        )
        assert.doesNotMatch(
          button(reversible, 'Transfer water from Beaker to Graduated cylinder'),
          / disabled=""/,
        )
      })

      await t.test(
        'restrictions and unsupported pairs explain rather than inventing operations',
        () => {
          saltStage()
          choose('sodium-chloride', 'weighing-boat')
          const restricted = render()
          assert.match(
            restricted,
            /Use the spatula to scoop NaCl, then deposit it into the weighing boat/,
          )
          assert.match(restricted, /<fieldset disabled=""/)
          choose('digital-balance', 'beaker')
          const unsupported = render()
          assert.match(unsupported, /No material transfer is supported/)
          assert.doesNotMatch(unsupported, /<form/)
          choose('WaterMesh', 'beaker')
          assert.doesNotMatch(render(), /<form/)
          choose('water', 'beaker', 'spatula')
          assert.match(render(), /Select exactly two objects/)
        },
      )

      await t.test(
        'solid operations use grams and milligrams with domain precision and limits',
        () => {
          saltStage()
          choose('spatula', 'sodium-chloride')
          const markup = render()
          assert.match(markup, /type="number"[^>]*min="0.001"[^>]*step="0.001"[^>]*max="5"/)
          assert.match(markup, /<option value="g" selected="">g<\/option>/)
          assert.match(markup, /<option value="mg">mg<\/option>/)
          assert.doesNotMatch(markup, /<option value="mL"/)
          assert.match(markup, /scoop NaCl from Sodium chloride jar to Spatula/)
        },
      )

      await t.test(
        'active transfer stays visible without selection and locks form and dismiss until safe return',
        () => {
          ready()
          const op = start('water', 'graduated-cylinder', 12.3)
          choose()
          const markup = render()
          assert.match(markup, /Positioning equipment/)
          assert.match(markup, /Delivered \/ requested/)
          assert.match(markup, /0 \/ 12.3 mL/)
          assert.match(markup, /<fieldset disabled=""/)
          assert.match(
            button(markup, 'Dismiss object interaction and clear selection'),
            /disabled=""/,
          )
          assert.match(markup, /Cancel transfer from Water container to Graduated cylinder/)
          assert.notEqual(render(PairInteractionPanel, { inventoryOpen: true }), '')
          science.getState().advanceTransfer(op.approachMs + op.flowMs / 2, op.operationId)
          assert.match(render(), /Transferring material/)
          const delivered = science.getState().transfer.transferred
          science.getState().cancelTransfer(op.operationId)
          const cancelled = render()
          assert.match(cancelled, /Cancelled · returning safely/)
          assert.match(cancelled, /Waiting for safe return/)
          assert.match(
            button(cancelled, 'Cancel transfer from Water container to Graduated cylinder'),
            /disabled=""/,
          )
          assert.ok(science.getState().transfer)
          science.getState().advanceTransfer(100000, op.operationId)
          assert.equal(science.getState().transfer, null)
          assert.equal(science.getState().experiment.waterMl['graduated-cylinder'], delivered)
          assert.equal(render(), '')
        },
      )

      await t.test(
        'visible guidance preserves safety and teaches pairs, amounts and direct stirring without tilt instructions',
        () => {
          reset()
          const instruction = () =>
            render(ContextualInstruction, { inventoryOpen: false, presentation: { inventory: [] } })
          assert.match(instruction(), /Confirm safety/)
          assert.match(instruction(), /Read the laboratory safety rules/)
          assert.doesNotMatch(render(LaboratoryInteractionCoach), /TILT|tilt/i)
          ready()
          choose('water')
          assert.match(instruction(), /Select the water container and graduated cylinder/)
          assert.match(instruction(), /100 mL more/)
          assert.match(render(LaboratoryInteractionCoach), /Click a second object/)
          choose('water', 'graduated-cylinder')
          assert.match(render(LaboratoryInteractionCoach), /Choose a transfer direction and amount/)
          assert.doesNotMatch(instruction(), /TILT|tilt/i)
          saltStage()
          assert.match(instruction(), /sodium chloride jar and spatula/)
          assert.doesNotMatch(instruction(), /TILT|tilt/i)
          scene.setState({ draggingId: 'stirring-rod' })
          assert.match(render(LaboratoryInteractionCoach), /draw complete circles/)
        },
      )
    } finally {
      Object.assign(scene.getInitialState(), sceneInitial)
      Object.assign(science.getInitialState(), scienceInitial)
    }
  } finally {
    await vite.close()
  }
})
