# T17 — Curriculum Units and Lessons Browser

## Routes and learning flow

- `/curriculum`: public Your Lessons page. Students can choose a grade and term here, including on a fresh direct visit.
- `/curriculum?grade=grade-secondary-1&term=term-secondary-1-1`: shareable example with explicit context.
- `/curriculum/lessons/:lessonId`: a small, honest coming-soon destination for View Experiments. T18 can replace this destination with the lesson experiment browser later. T17 does not implement that browser or list unrelated catalog entries as lesson experiments.
- `/terms?grade=:gradeId&term=:termId`: the existing term-selection page accepts explicit context and Continue opens the matching curriculum URL. Existing `/grades`, `/terms`, `/experiments` and laboratory URLs remain available.

Explicit curriculum URL parameters take precedence over session preferences. A partial or invalid URL does not silently reuse another grade's term. The page prompts for a valid selection and rejects mismatched grade/term pairs. With no URL context, existing grade/term preferences can be used if valid. Missing or blocked storage does not prevent choosing context directly on the page.

Changing the grade clears the term in the URL. Changing the term updates the URL and resets the unit disclosures for that context. React Router handles Back/Forward navigation without maintaining a second copy of URL selection state. Browsing does not update the student's authenticated profile.

## Data and academic accuracy

The page uses T03's existing `sampleCurriculum`, shared normalized entity types and selectors. It introduces no experiment records or curriculum assignments. Generic Unit 1 / Lesson 1 examples remain marked as demonstration data, not the official Egyptian curriculum. The salt-dissolution demo remains unassigned and independently accessible.

All three grades and both terms are selectable. The existing sample snapshot currently has units only in First Secondary Grade / First Term. The other five contexts show the empty state rather than invented lessons. Native expandable unit lists support any number of units and lessons, including empty units. Optional descriptions are additive fields on the existing curriculum/lesson models; no sample academic descriptions were invented.

Each lesson shows its available experiment count separately from planned experiments. Planned catalog entries are not counted as playable experiments. Lessons with no available experiments say **No Experiments Available**. A unit without lessons says **No Lessons Available**; a term without units says **No Units Available**.

## Selectors and components

`lib/curriculumBrowser.ts` composes the existing ordered selectors:

- `resolveCurriculumContext`: validates a grade and a term belonging to it.
- `getCurriculumUnits`: returns ordered units and lessons plus available/planned counts.
- `getCurriculumLessonContext`: resolves a lesson's complete valid parent chain for direct links.

These reuse `getAvailableGrades`, `getTermsForGrade`, `getUnitsForTerm`, `getLessonsForUnit` and `getExperimentsForLesson`. The selectors copy before sorting, retain stable IDs and never mutate the source snapshot.

`UnitBrowser` is a reusable presentation component using native details/summary disclosures. Unit headings include lesson counts; lesson headings and scoped View Experiments links identify their parent unit. Keyboard disclosure behavior is provided by the browser. The layout stacks lesson actions on mobile and supports reduced-motion preferences.

## Files

- Added `src/pages/CurriculumPage.tsx` and `CurriculumLessonPage.tsx`.
- Added `src/features/curriculum/components/UnitBrowser.tsx` and `lib/curriculumBrowser.ts`.
- Updated `src/pages/ChooseTermPage.tsx` for contextual links and the new Continue destination; removed outdated lesson-browser/official-alignment wording.
- Updated `src/app/paths.ts`, `routes.tsx` and `navigation.ts` for public routes, URL helpers and Your Lessons navigation.
- Added optional description fields to `src/types/curriculum.ts` and the existing Lesson in `src/types/experiment.ts`.
- Added `tests/curriculumBrowser.test.mjs`; updated the older term-route assertion in `tests/studentRoutes.test.mjs` now that its destination is implemented.

No backend, dependencies, simulation logic or scientific experiment definitions were added or changed. T15 and T16 exist in this repository; no required dependency is missing.

## Verification

- TypeScript and ESLint: passed.
- Full automated suite: **231 passed, 0 failed, 0 cancelled**.
- All three curriculum browser tests also passed after the final context-link adjustment.
- Production build: passed; the existing large JavaScript chunk warning remains.
- A SHA-256 check of 87 simulation files found zero changes.

Tests cover reordered input arrays, immutable selector reads, every grade/term pair, mismatched contexts, null data, empty terms/units/lessons, optional descriptions, available versus planned counts, direct lesson destinations and preservation of public laboratory routes. Browser observations and final deployment status are recorded below.

The initial full test attempt encountered a full workspace disk while Vite wrote temporary dependency bundles. Only verified generated `node_modules/.vite/deps_temp_*` cache folders were removed (149 folders, 3.56 GB); application code and data were not part of that cleanup. Tests were rerun after recovering disk space. Resource-limited local checks used reduced Node/Rust worker counts, without changing application settings or dependencies.

### Production and browser verification

The existing production project at https://stem-project2026.vercel.app was updated without creating another project. Deployment `dpl_3vCMvoaouZAnNkWPj6YtDsZweyJK` reached **READY**.

Observed on production:

- Direct grade/term links render the correct context. Unit 1 appears before Unit 2; Lesson 1 appears before Lesson 2.
- Units expand and collapse independently. Keyboard Space collapses a focused unit summary.
- Changing the grade clears the previous term. Selecting a term updates the URL. Empty terms show No Units Available.
- Browser Back and Forward restore the selected context and corresponding units or empty state.
- View Experiments opens the intended lesson placeholder. Back to Your Lessons restores its grade and term.
- Change Term preserves both selections; Continue returns to the matching curriculum page.
- At a 390 × 844 viewport, fields and lesson actions stack cleanly and unit controls work. Desktop and mobile screenshots are saved in `artifacts/t17-curriculum-desktop.png` and `artifacts/t17-curriculum-mobile.png`.
- Open 3D Demo opens the existing public salt-dissolution route and renders its 3D laboratory, live measurements and original first-step controls. This was a route/render smoke check; the full experiment interaction sequence was not replayed for T17.

The final React review found no additional changes needed for component structure, hook ordering, stable entity keys or accessible controls. The official curriculum remains unavailable, and the lesson experiments listing remains intentionally deferred to T18.
