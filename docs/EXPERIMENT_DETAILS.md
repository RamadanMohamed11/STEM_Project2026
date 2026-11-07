# T20 — Experiment Details and Learning Objectives

## Existing routes and resolution

`/experiments/:experimentId` remains the details route. `ExperimentRouteLayout` still resolves a canonical catalog record and passes it through the existing outlet context. Unknown IDs retain the existing Experiment Not Found state. T19's validated Back to Search Results navigation remains intact.

The details page reuses `getExperimentPaths`, category metadata, difficulty labels, `StatusPill`, `ButtonLink`, `Breadcrumbs` and the maintained SVG `ExperimentIllustration`. Start 3D Experiment appears only for a demo record with a supported `getLaboratoryPresentation` result. It opens the original `/experiments/:experimentId/lab` route. The legacy `/experiments/preview/lab` route is unchanged. Planned or unsupported entries never offer a start link.

## Educational data

`Experiment` now has an optional `learning: ExperimentLearningContent` property. The new type contains:

- `reviewStatus`: draft or reviewed.
- `about`: short introduction paragraphs.
- `objectives`: stable objective IDs and text.
- Optional `modelNote`: a plain-language explanation of model limitations.

`experimentLearningContent.ts` contains educational copy only. The existing catalog records reference it without duplicating experiment IDs, scientific definitions, procedures, measurement values or curriculum assignments. Metadata such as names, descriptions, category, difficulty, duration and availability continues to come from the canonical experiment record.

All current introductions and objectives are drafts. The page labels them **Demonstration learning objectives** and states that they need academic review. The salt introduction follows the existing activity: use virtual tools, measure water volume and salt mass, mix and observe dissolution. It explains that dissolved salt is still present and distinguishes it from remaining solid grains. A model note makes clear that readings come from a simplified simulation rather than physical equipment.

The five salt demonstration objectives are:

1. Identify the main laboratory tools.
2. Measure water volume using the virtual tools.
3. Measure the mass of salt using the virtual balance.
4. Observe how salt dissolves in water.
5. Explain the difference between dissolved and undissolved salt.

The two existing planned entries have short draft introductions and basic goals limited to their existing catalog concepts: volume scales/meniscus reading and comparing indicator colors. Their unreleased status is explicit. No reagents, detailed procedures, new experiments or official curriculum claims were invented.

## Components and future extension

`ExperimentOverview` renders the header, canonical metadata, illustration and navigation. `ExperimentLearningSections` renders About This Experiment and What You Will Learn from structured content. Missing content produces honest review messages; it does not fabricate objectives.

The page composes these sections independently of the simulation engine. Future equipment, materials, steps, videos, laboratory, results and safety-note components can be added to this composition with separately typed content. T20 does not create their functionality, empty placeholder sections, assessments or progress state. The former View Quiz placeholder action is omitted from the introduction; the quiz route itself remains unchanged.

`getReviewedExperimentLessons` returns only existing, valid lesson relationships from a curriculum snapshot marked reviewed. It deduplicates links, checks the experiment exists and rejects broken parent chains. The current snapshot is sample content, so no school lesson placement is claimed. The playable salt demo remains unassigned. Related Lessons will render only when reviewed relationships actually exist.

## Files changed for T20

Added:

- `src/features/experiments/data/experimentLearningContent.ts`
- `src/features/experiments/components/ExperimentOverview.tsx`
- `src/features/experiments/components/ExperimentLearningSections.tsx`
- `src/features/experiments/lib/experimentDetailsSelectors.ts`
- `tests/experimentDetails.test.mjs`
- This document.

Updated:

- `src/pages/ExperimentDetailsPage.tsx`
- `src/types/experiment.ts`
- `src/features/experiments/data/mockExperiments.ts`
- `tests/studentRoutes.test.mjs` and `tests/curriculumDiscovery.test.mjs` to expect the implemented page instead of its former placeholder.

No route definitions, authentication, backend services, dependencies, simulation files or existing English catalog descriptions were changed for T20.

## Verification

The focused details, curriculum-discovery and student-route tests passed: **8 passed, 0 failed**. They cover direct IDs, structured content rendering, five salt objectives, planned/unsupported entries, unknown IDs, valid results return links, existing lab routes, draft/reviewed/fallback content and reviewed-only curriculum relationships. In-memory reviewed test fixtures do not change production mappings.

- Full automated suite: **237 passed, 0 failed, 0 cancelled** (`artifacts/t20-tests.log`).
- TypeScript, ESLint, Prettier and whitespace checks: passed.
- Production build: passed; the existing large JavaScript chunk warning remains (`artifacts/t20-build.log`).
- SHA-256 comparison of 87 simulation files: zero changes.

React review confirmed stable content keys, unconditional hook use, semantic headings/metadata, accessible controls and no duplicated interaction state. No new dependencies or deployment environment variables are required.

## Production browser observations

Deployment `dpl_HnQBsvpUrANjiZ8CngKnF92gounJ` reached READY on the existing production project at https://stem-project2026.vercel.app. No additional project was created.

Observed on production:

- Direct entry to the salt details URL renders its canonical overview, illustration, About section, five structured objectives and explicit academic-review notice.
- Desktop (1280 × 1000), tablet (768 × 1024) and mobile (390 × 844) layouts are readable. The information/illustration and learning sections stack on smaller screens. All five objectives and the review notice remain visible when scrolled into view on mobile.
- Keyboard Tab moves between Start 3D Experiment and Back to Experiments with a visible focus ring.
- The pH details URL shows Coming Soon, its draft introduction/objectives and no start action.
- An unknown experiment ID shows the existing Experiment Not Found state with a working catalog return link.
- Searching salt in the global catalog opens the details page with its valid return URL. Back to Search Results restores the salt query and single matching experiment. Browser Back returns to details.
- Start 3D Experiment opens the original salt laboratory route and renders its 3D scene, live measurements and first-step controls. This is a route/render smoke check; the full manual equipment/transfer sequence was not replayed for T20. Automated simulation regression tests passed and all 87 simulation files remain unchanged.

Screenshots: `artifacts/t20-experiment-details-desktop.png`, `artifacts/t20-experiment-details-tablet.png` and `artifacts/t20-learning-objectives-mobile.png`.

Remaining limitations: educational copy/objectives need academic review; the two planned activities still have no executable laboratories; the current sample curriculum contains no approved lesson mappings. Equipment, materials, detailed steps, videos, results, experiment-specific safety sections and assessments remain outside T20.
