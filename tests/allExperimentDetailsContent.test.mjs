import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { renderToResolvedMarkup as renderToStaticMarkup } from './helpers/renderResolved.mjs'
import { createServer } from './helpers/routeTestServer.mjs'
import { egyptianCurriculum } from '../src/features/curriculum/data/egyptianCurriculum.ts'
import { getExperimentToolsAndMaterials } from '../src/features/experiments/data/experimentToolsAndMaterials.ts'
import { getExperimentLearningStages } from '../src/features/experiments/data/experimentLearningStages.ts'

const ARABIC_REGEX = /[\u0600-\u06FF]/

test('every experiment in the syllabus has full, non-empty content for all 7 required sections', () => {
  const experiments = egyptianCurriculum.experiments
  assert.equal(experiments.length, 23, 'Curriculum must contain exactly 23 syllabus experiments')

  for (const exp of experiments) {
    // 1. Name
    assert.ok(exp.title && exp.title.trim().length >= 5, `[${exp.id}] Section 1 (Name) must be non-empty`)

    // 2. Description
    assert.ok(
      exp.shortDescription && exp.shortDescription.trim().length >= 20,
      `[${exp.id}] Section 2 (Description - short) must be non-empty`,
    )
    assert.ok(
      exp.learning && exp.learning.about && exp.learning.about.length >= 2,
      `[${exp.id}] Section 2 (Description - about) must have at least 2 paragraphs`,
    )

    // 3. Objectives (3-5 items)
    assert.ok(exp.learning && exp.learning.objectives, `[${exp.id}] Objectives must exist`)
    const objCount = exp.learning.objectives.length
    assert.ok(
      objCount >= 3 && objCount <= 5,
      `[${exp.id}] Section 3 (Objectives) must contain 3-5 items (found ${objCount})`,
    )
    for (const obj of exp.learning.objectives) {
      assert.ok(obj.id && obj.id.trim().length > 0, `[${exp.id}] Objective has valid id`)
      assert.ok(obj.text && obj.text.trim().length >= 10, `[${exp.id}] Objective has meaningful text`)
    }

    // 4. Tools (referenced by tool ID)
    const tm = getExperimentToolsAndMaterials(exp.id)
    assert.ok(tm, `[${exp.id}] Tools and materials dataset must exist`)
    assert.ok(tm.tools && tm.tools.length >= 2, `[${exp.id}] Section 4 (Tools) must have >= 2 tools`)
    for (const tool of tm.tools) {
      assert.ok(tool.id && tool.id.trim().length > 0, `[${exp.id}] Tool has ID`)
      assert.ok(tool.name && tool.name.trim().length > 0, `[${exp.id}] Tool has name`)
      assert.ok(tool.visual, `[${exp.id}] Tool has visual representation`)
      assert.ok(tool.shortExplanation && tool.shortExplanation.length >= 10, `[${exp.id}] Tool has explanation`)
      assert.ok(tool.purpose && tool.purpose.length >= 10, `[${exp.id}] Tool has purpose`)
    }

    // 5. Materials (name, formula, appearance, role, purpose, safety notes)
    assert.ok(tm.materials && tm.materials.length >= 1, `[${exp.id}] Section 5 (Materials) must have >= 1 material`)
    for (const mat of tm.materials) {
      assert.ok(mat.id && mat.id.trim().length > 0, `[${exp.id}] Material has ID`)
      assert.ok(mat.name && mat.name.trim().length > 0, `[${exp.id}] Material has name`)
      assert.ok(mat.formula && mat.formula.trim().length > 0, `[${exp.id}] Material has formula`)
      assert.ok(mat.physicalAppearance && mat.physicalAppearance.length >= 5, `[${exp.id}] Material has appearance`)
      assert.ok(mat.role && mat.role.trim().length > 0, `[${exp.id}] Material has role`)
      assert.ok(mat.purpose && mat.purpose.length >= 10, `[${exp.id}] Material has purpose`)
      assert.ok(mat.requiredQuantity && mat.requiredQuantity.amount > 0, `[${exp.id}] Material has required quantity`)
      assert.ok(mat.stockQuantity && mat.stockQuantity.amount > 0, `[${exp.id}] Material has stock quantity`)
      assert.ok(mat.safetyNotes && mat.safetyNotes.length >= 1, `[${exp.id}] Material has safety notes`)
    }

    // 6 & 7. Learning Stages (Procedure in Stage 3, Results in Stage 5)
    const stagesData = getExperimentLearningStages(exp.id)
    assert.ok(stagesData, `[${exp.id}] Learning stages data must exist`)
    assert.equal(stagesData.stages.length, 5, `[${exp.id}] Must have exactly 5 educational stages`)

    // Stage 3: Procedure
    const stage3 = stagesData.stages[2]
    assert.equal(stage3.kind, 'procedure', `[${exp.id}] Stage 3 must be procedure`)
    assert.ok(stage3.steps.length >= 3, `[${exp.id}] Section 6 (Procedure) must have >= 3 steps`)
    assert.ok(stage3.scientificExplanation.length >= 20, `[${exp.id}] Stage 3 has scientific explanation`)

    // Stage 5: Results + Scientific Explanation
    const stage5 = stagesData.stages[4]
    assert.equal(stage5.kind, 'observations', `[${exp.id}] Stage 5 must be observations/results`)
    assert.ok(stage5.steps.length >= 2, `[${exp.id}] Section 7 (Results) must have observation/conclusion steps`)
    assert.ok(stage5.scientificExplanation.length >= 30, `[${exp.id}] Section 7 must have scientific explanation`)
    assert.ok(stage5.highlights.length >= 2, `[${exp.id}] Section 7 must have key result takeaways`)

    // Safety and hazards
    assert.ok(exp.safety, `[${exp.id}] Safety metadata must exist`)
    assert.ok(['none', 'low', 'medium', 'moderate', 'high'].includes(exp.safety.level))
    assert.ok(exp.safety.note && exp.safety.note.length >= 15, `[${exp.id}] Safety note must be informative`)
  }
})

test('all details content is strictly English with zero Arabic characters', () => {
  for (const exp of egyptianCurriculum.experiments) {
    assert.equal(ARABIC_REGEX.test(exp.title), false, `[${exp.id}] Title has no Arabic`)
    assert.equal(ARABIC_REGEX.test(exp.shortDescription), false, `[${exp.id}] Description has no Arabic`)
    for (const paragraph of exp.learning.about) {
      assert.equal(ARABIC_REGEX.test(paragraph), false, `[${exp.id}] About paragraph has no Arabic`)
    }
    for (const obj of exp.learning.objectives) {
      assert.equal(ARABIC_REGEX.test(obj.text), false, `[${exp.id}] Objective has no Arabic`)
    }

    const tm = getExperimentToolsAndMaterials(exp.id)
    if (tm) {
      for (const tool of tm.tools) {
        assert.equal(ARABIC_REGEX.test(tool.name), false, `[${exp.id}] Tool name has no Arabic`)
        assert.equal(ARABIC_REGEX.test(tool.shortExplanation), false, `[${exp.id}] Tool explanation has no Arabic`)
        assert.equal(ARABIC_REGEX.test(tool.purpose), false, `[${exp.id}] Tool purpose has no Arabic`)
      }
      for (const mat of tm.materials) {
        assert.equal(ARABIC_REGEX.test(mat.name), false, `[${exp.id}] Material name has no Arabic`)
        assert.equal(ARABIC_REGEX.test(mat.physicalAppearance), false, `[${exp.id}] Material appearance has no Arabic`)
        assert.equal(ARABIC_REGEX.test(mat.purpose), false, `[${exp.id}] Material purpose has no Arabic`)
      }
    }

    const stagesData = getExperimentLearningStages(exp.id)
    if (stagesData) {
      for (const stg of stagesData.stages) {
        assert.equal(ARABIC_REGEX.test(stg.summary), false, `[${exp.id}] Stage summary has no Arabic`)
        assert.equal(ARABIC_REGEX.test(stg.scientificExplanation), false, `[${exp.id}] Stage explanation has no Arabic`)
        for (const step of stg.steps) {
          assert.equal(ARABIC_REGEX.test(step), false, `[${exp.id}] Stage step has no Arabic`)
        }
        for (const h of stg.highlights) {
          assert.equal(ARABIC_REGEX.test(h), false, `[${exp.id}] Stage highlight has no Arabic`)
        }
      }
    }
  }
})

test('SSR routes for syllabus experiments render all 7 sections without empty placeholders', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')

    // Test a representative cross-section across all 3 secondary grades and terms
    const testExperimentIds = [
      'exp-salt-water-001',       // Grade 1 Term 1 (demo)
      'exp-volume-002',           // Grade 1 Term 1
      'exp-titration-005',        // Grade 1 Term 1
      'exp-heat-dissolution-006', // Grade 1 Term 2
      'exp-flame-tests-008',      // Grade 2 Term 1
      'exp-halogen-displacement-010', // Grade 2 Term 1
      'exp-sodium-water-012',     // Grade 2 Term 2
      'exp-ammonia-prep-013',     // Grade 2 Term 2
      'exp-catalysis-014',        // Grade 3 Term 1
      'exp-anions-015',           // Grade 3 Term 1
      'exp-cations-016',          // Grade 3 Term 1
      'exp-volumetric-titration-017', // Grade 3 Term 1
      'exp-daniell-cell-019',     // Grade 3 Term 2
      'exp-electrolysis-020',     // Grade 3 Term 2
      'exp-esterification-023',   // Grade 3 Term 2
    ]

    for (const id of testExperimentIds) {
      const exp = egyptianCurriculum.experiments.find((e) => e.id === id)
      assert.ok(exp, `Experiment ${id} must exist in curriculum`)

      const markup = await renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [`/experiments/${id}`] },
          React.createElement(AppRoutes),
        ),
      )

      // Section 1: Name / Title
      assert.ok(markup.includes(exp.title), `[${id}] Must render experiment title: ${exp.title}`)

      // Section 2: Description & Overview
      assert.ok(markup.includes('About This Experiment'), `[${id}] Must render About section`)

      // Section 3: Learning Objectives
      assert.ok(markup.includes('What You Will Learn'), `[${id}] Must render Objectives section`)

      // Section 4: Laboratory Tools
      assert.ok(markup.includes('Laboratory Tools'), `[${id}] Must render Tools section heading`)

      // Section 5: Chemical Materials
      assert.ok(markup.includes('Chemical Materials'), `[${id}] Must render Materials section heading`)

      // Section 6 & 7: Educational Learning Stages (Procedure & Results)
      assert.ok(markup.includes('Educational Learning Stages'), `[${id}] Must render Learning Stages`)

      // Must NOT contain empty/unfinalized fallback banners
      assert.ok(
        !markup.includes('This experiment is not in the current library'),
        `[${id}] Must not show "Not found" placeholder`,
      )
      assert.ok(
        !markup.includes('Tools and laboratory apparatus for this planned experiment have not been finalized yet'),
        `[${id}] Must not show empty tools placeholder`,
      )
      assert.ok(
        !markup.includes('Chemical materials and reagents for this planned experiment have not been finalized yet'),
        `[${id}] Must not show empty materials placeholder`,
      )
      assert.ok(
        !markup.includes('Five-stage educational explanations and demonstration videos for this planned experiment have not been finalized yet'),
        `[${id}] Must not show empty stages placeholder`,
      )
    }
  } finally {
    await vite.close()
  }
})
