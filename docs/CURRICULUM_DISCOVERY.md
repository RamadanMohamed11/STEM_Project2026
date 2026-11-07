# T19 — Curriculum Navigation, Search and Filtering

## Existing routes retained

- `/experiments`: global catalog, now with shareable URL filters.
- `/curriculum?grade=:gradeId&term=:termId&unit=:unitId`: units and lessons; unit is optional. A unit link selects and opens that unit.
- `/curriculum/lessons/:lessonId`: lesson experiments with local search, category and availability controls. Academic context comes from the actual lesson hierarchy rather than additional dropdowns.
- `/experiments/:experimentId`: existing details placeholder is unchanged. Its route layout can show Back to Search Results when supplied with a validated results destination.
- Existing grade, term, laboratory, authentication and other routes remain available.

## URL state

Catalog query keys are `q`, `category`, `status`, `grade`, `term`, `unit` and `lesson`. The existing `semester` filter is still supported for catalog datasets that provide legacy semester records. Defaults are omitted when writing URLs. No session, account or backend is required for search.

`useCatalogSearch` reads from React Router search parameters and uses the existing `filterExperiments` engine. Updates push browser history and preserve scroll position. Refresh and Back/Forward restore the URL's controls and results. There is no second copy of filter state to synchronize. The unit browser can still use existing session preferences when no explicit academic parameters are present; an explicit partial unit URL does not borrow parents from storage.

`readCatalogFilters` validates categories, availability, semesters, academic parent chains and duplicate recognized parameters. Invalid combinations show an alert and zero results; they never silently widen to the entire catalog. Changing a parent filter clears its descendant filters while retaining text search, category and availability.

On the catalog, Grade is always available. Term appears after a valid grade, Unit after a valid term, and Lesson after a valid unit. Lesson pages show only the useful text/category/availability controls. Unsupported academic query values on a lesson page are rejected rather than allowed to override its route context. Empty datasets do not produce invented options or records.

## Shared selectors and data accuracy

`curriculumDiscovery.ts` composes T03's ordered selectors to resolve a complete academic context and collect assigned experiment IDs. `filterExperiments` uses these IDs as one additional constraint alongside its existing text, category, status and semester logic. Many-to-many lesson links produce unique catalog results. No independent search engine, catalog, scientific definitions or curriculum records were introduced.

The salt-dissolution demo remains unassigned. It appears in the unrestricted catalog and stays playable at its original route; it never appears as an assigned lesson experiment. Existing sample links remain clearly marked demonstration data. Planned-only results explain that the 3D labs are not available. Empty units, empty lessons, unassigned contexts, invalid combinations and unmatched searches have helpful messages and recovery actions.

## Breadcrumbs and return navigation

`Breadcrumbs` renders a semantic navigation landmark and ordered list with a current-page indicator. `curriculumBreadcrumbs` builds links only from validated records. Grade and term links open their curriculum context, Unit selects and opens the proper unit, and Lesson opens its existing experiment listing. Invalid contexts show no invented parent path.

Experiment cards can attach their source results URL as `returnTo` on the details link. The route layout accepts only local catalog or lesson-results paths with valid filters that actually contain the current experiment. External URLs, unrelated routes, invalid contexts and unrelated lessons are rejected. Return links survive refresh; arbitrary destinations are never rendered. This adds navigation around the existing details placeholder without implementing T20 content.

## Files changed for T19

New:

- `src/components/ui/Breadcrumbs.tsx`
- `src/features/curriculum/lib/curriculumBreadcrumbs.ts`
- `src/features/curriculum/lib/curriculumDiscovery.ts`
- `src/features/experiments/lib/catalogUrlState.ts`
- `src/features/experiments/lib/useCatalogSearch.ts`
- `tests/curriculumDiscovery.test.mjs`
- This document.

Updated:

- `src/features/experiments/lib/catalogSelectors.ts`
- `src/features/experiments/components/ExperimentCatalog.tsx`
- `src/features/experiments/components/CatalogFilters.tsx`
- `src/features/experiments/components/CatalogEmptyState.tsx`
- `src/features/experiments/components/ExperimentCard.tsx`
- `src/features/curriculum/components/LessonExperiments.tsx`
- `src/features/curriculum/components/UnitBrowser.tsx`
- `src/pages/CurriculumPage.tsx`
- `src/components/layout/ExperimentRouteLayout.tsx`
- `tests/lessonExperiments.test.mjs` (updated navigation expectations).
- `tests/routeStates.test.mjs` (the active Grade filter replaces the old disabled semester control).

No dependencies, backend services, official content, experiment assignments or simulation interactions were added or changed.

## Verification

The 12 focused catalog/curriculum tests passed before final verification. New coverage combines all filter types, deduplicates academic links, rejects invalid/partial/duplicate URL context, round-trips URLs, validates result return paths, checks real breadcrumb context, restores a selected open unit, renders scoped/empty results and preserves the public laboratory route. Final checks and production browser observations are recorded below.

- Full suite after updating the obsolete disabled-semester assertion: **235 passed, 0 failed, 0 cancelled** (`artifacts/t19-tests.log`).
- TypeScript and ESLint: passed.
- Production build: passed; the pre-existing large-chunk warning remains (`artifacts/t19-build.log`).
- Prettier and whitespace checks: passed.
- SHA-256 comparison: 87 simulation files checked, zero changes.

The first full run had 234 passing tests and one outdated assertion for the old disabled semester control. It was updated to assert the current Grade control and absence of the irrelevant semester control. The complete suite was rerun successfully. No dependencies or environment variables were changed.

## Production browser observations

Deployment `dpl_4JvZTGu3YiWB2gRmmeQ1kvbPHJqN` reached READY on the existing production project, https://stem-project2026.vercel.app. No second project was created.

Verified through the production UI:

- A direct catalog URL containing text, availability and all four academic filters restores the correct controls, breadcrumbs and one matching planned experiment.
- Combining pH search with Measurement produces No Results Found; changing the search to volume produces the correct single result.
- Changing the grade removes term/unit/lesson selections while retaining search/category/availability. Changing the term removes unit/lesson selections. The empty term shows No Units Available.
- Refresh and browser Back/Forward restore the selected values and correct results.
- Details links from both global and lesson search pages offer Back to Search Results and restore the exact validated source query.
- The Unit 1 breadcrumb opens the corresponding curriculum URL with only Unit 1 shown and its disclosure expanded.
- Lesson search returns only linked experiments. Its academic context remains visible without additional academic dropdowns.
- A mismatched grade/term URL shows an invalid-selection message and zero results. Clear Filters removes the query and restores all three catalog entries.
- Responsive layouts were inspected at desktop (1280 × 1000), tablet (768 × 1024) and mobile (390 × 844) dimensions. Keyboard Tab moves from the search input to Category with a visible focus ring. Filters remain readable and breadcrumbs wrap on mobile.
- The standalone salt demo still opens from the global catalog and renders its 3D scene, live measurements and original first-step controls. This browser check covers routing and rendering; the complete physical interaction sequence was not manually replayed for T19.

Screenshots are saved in `artifacts/t19-breadcrumbs-desktop.png`, `artifacts/t19-catalog-desktop.png`, `artifacts/t19-catalog-tablet.png` and `artifacts/t19-catalog-mobile.png`.

Remaining limits: academic records and mappings are demonstration content; five terms still have no units. Experiment Details remains the existing placeholder. These are data/content limits, not fabricated records or new route restrictions.
