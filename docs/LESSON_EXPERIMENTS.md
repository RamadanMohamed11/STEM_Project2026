# T18 — Lesson Experiments Listing

## Route and integration

The existing public `/curriculum/lessons/:lessonId` route is retained. T17's View Experiments links now open the listing without changing stable URLs. Direct visits require neither authentication nor stored grade/term selections. The validated lesson parent chain supplies the grade, term and unit. Back to Your Lessons returns to the correct `/curriculum?grade=...&term=...` context.

`CurriculumLessonPage` delegates to the reusable `LessonExperiments` component. It uses `getCurriculumLessonContext` and the existing ordered `getExperimentsForLesson` selector. Only actual `lessonExperiments` links are read; missing and duplicate links are handled by that shared selector. No independent catalog or filter engine was introduced.

## Cards and data

The listing uses the existing `ExperimentCard`, illustrations, category metadata, difficulty labels, durations and safety labels. The shared card now offers Start Experiment only when the entry has demo status and `getLaboratoryPresentation` resolves a supported workspace. Planned entries say Coming Soon and never offer a start link. View Experiment uses the existing stable details route. Missing safety metadata is explicitly marked Safety notes pending; no risk rating is invented.

The catalog and lesson mappings are unchanged. Lesson 1 in Unit 1 has two planned entries; the other two sample lessons have one each. These remain clearly marked demonstration relationships, not official curriculum assignments. The salt-dissolution demo remains unassigned and available through the public catalog. Empty lessons show No Experiments Available; invalid IDs or incomplete parent chains show Lesson Not Found.

## Files

- Added `src/features/curriculum/components/LessonExperiments.tsx`.
- Updated `src/pages/CurriculumLessonPage.tsx` to replace the T17 placeholder.
- Updated `src/features/experiments/components/ExperimentCard.tsx` for supported-lab gating, clear action labels and missing-safety feedback.
- Added `tests/lessonExperiments.test.mjs` and updated T17's route-render expectations in `tests/curriculumBrowser.test.mjs`.

No route definitions, scientific simulation files, experiment records, curriculum assignments, dependencies or backend services were changed for T18. Experiment Details remains its existing placeholder; T19 and T20 are outside this task.

## Verification

Automated coverage includes multiple/one/zero linked experiments, invalid lessons, broken parents, duplicate/dangling links, link order, canonical details/lab navigation, supported demo versus unsupported/planned workspace controls, unchanged source mappings and the unassigned salt demo. Playable lesson behavior is tested using an in-memory fixture only; it does not add a production curriculum assignment.

- TypeScript, ESLint, Prettier and production build: passed.
- Complete automated suite: **232 passed, 0 failed, 0 cancelled** (`artifacts/t18-tests.log`).
- A SHA-256 comparison against the existing baseline checked 87 simulation files: zero changes.
- The existing large JavaScript chunk warning remains; no dependencies were added.

The first new test run caught an overly broad assertion matching the application's intentionally public Virtual Lab navigation link. The assertion was narrowed to experiment-card lab destinations; the planned lesson itself never offered a start link. The corrected test and the full suite passed.

## Production browser verification

Deployment `dpl_5H2kyK3FmGE9pL7wQRvbfTHdZBSC` reached READY on the existing production project at https://stem-project2026.vercel.app. No second project was created.

Observed on production:

- Direct entry to `/curriculum/lessons/sample-lesson-1-1` shows two planned cards in association order, the actual parent context and no Start Experiment action.
- View Experiment opens the existing planned details page. Browser Back returns to the lesson list.
- Back to Your Lessons restores First Secondary Grade / First Term. Opening Lesson 2 shows its single assigned experiment, without the other lesson's pH entry.
- An unknown lesson ID shows Lesson Not Found with a working return link.
- At 390 × 844, cards stack in one column and actions remain readable. Desktop and mobile screenshots are saved as `artifacts/t18-lesson-experiments-desktop.png` and `artifacts/t18-lesson-experiments-mobile.png`.
- The global catalog still lists the standalone salt demo. Its shared Start Experiment action opens the existing laboratory and renders the scene and live measurement controls. This is a route/render smoke check, not a replay of every 3D interaction.

The empty lesson and future playable-lesson cases are covered by automated fixtures rather than fabricated production assignments. No official curriculum mapping has been added. React component review confirmed stable entity keys, semantic headings/list structure, accessible links and no duplicated interaction state.
