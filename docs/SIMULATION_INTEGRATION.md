# T22 — Details, Laboratory and Verified Results Integration

## Routes and registration

- `/experiments/:experimentId`: existing details route, with Start 3D Experiment, Continue Experiment or View Laboratory according to the current authoritative session. View Results appears only after completion.
- `/experiments/:experimentId/lab`: existing immersive laboratory, now resolved through `resolveSimulation`.
- `/experiments/preview/lab`: preserved compatibility alias explicitly bound to the existing salt experiment ID, independent of catalog order.
- `/experiments/:experimentId/results`: new public scientific-results route. It renders `ExperimentResults` only for the completed matching session; direct entry before completion shows No Experiment Results Yet.
- `/experiments/:experimentId/quiz`: existing honest quiz placeholder, linked as Quiz Preview after completion.
- `/experiments/:experimentId/quiz/results`: existing quiz-results placeholder, unchanged. The legacy `getExperimentPaths().results` helper still means quiz results; the new `.experimentResults` helper means scientific experiment results.

`simulationRegistry.ts` connects a canonical catalog record to an implemented workflow definition, its version, matching presentation and supported engine adapter. A catalog status or illustration alone is not enough. Only the existing salt adapter is registered. Planned, unknown and unrelated demo identifiers cannot load the salt renderer or expose another experiment's results. Future experiments require their own implemented adapter; this task adds none.

## State ownership

There are still only the existing authoritative stores:

- `useSaltSimulationStore`: chemistry, workflow, accepted event evidence, operations, effects and reset revision. Session identity now also includes `definitionId` and `definitionVersion` beside `activeExperimentId`.
- `useLabSceneStore`: committed equipment placement, positions, rotations, relationships and transient selection/interaction state.

`getSimulationSessionStatus` derives navigation status without storing a second progress or completion record. `useSimulationSession` subscribes to the same stores via React's external-store API, including the same current snapshot for static rendering of these client-only routes. It does not create an authentication/session backend or duplicate scientific state. `sessionSelectors` exposes the new identity metadata in its existing diagnostic snapshot.

The workflow engine's `workflow.completed` remains the completion source of truth. Navigation, starting the lab, visiting results and animations do not set it. The new results page consumes the original workflow/chemistry and the original `ExperimentResults` component. No independent calculator, fabricated observation, completion archive or quiz score is introduced.

## Lifecycle rules

| Action                                        | Behavior                                                                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First lab entry                               | Use the existing definition's initial state and scene defaults. Opening a page does not advance a step.                                                                                                                                                        |
| Preparation or scientific action              | Continue Experiment becomes available from actual safety/workflow/chemical evidence or additional placed equipment. Moving an initial object alone may leave the Start label; that link still resumes without resetting.                                       |
| Details, catalog, quiz, results, Back/Forward | Keep committed quantities, measurements, workflow evidence, placements and relationships during client-side navigation in the same app/tab.                                                                                                                    |
| Leave while interacting                       | Stop transient effects/pouring and cancel uncommitted placement/press state. Existing manipulation cleanup and `MaterialTransferController` retain their safe interruption behavior, including material already delivered. No new transfer loop is introduced. |
| Return to lab                                 | Render the same scientific state. The canvas is recreated, transient panels close and the existing camera reframes to its default view. No GPU or physics objects are serialized.                                                                              |
| Unsupported/planned/different ID              | Show an unavailable/not-found state; never repurpose or reset the salt session.                                                                                                                                                                                |
| Wrong definition identity/version             | Block entry/results for that state and offer an explicit Restart Experiment action. Never silently reset or display prior-version results.                                                                                                                     |
| Explicit restart                              | Use `restartExperimentSession`: clear chemistry/workflow/evidence/effects, reset equipment/relationships and camera, increment reset revision and restore the current definition identity.                                                                     |
| Browser refresh/full page load/closing tab    | Start a fresh in-memory session. There is no durable browser or account persistence. Details, results and laboratory Help explain this limit. Separate tabs have independent sessions.                                                                         |

The lab remains viewport-filling with its existing compact controls. Its back arrow now opens the matching details page. Completed lab results include Back to Details and View Results links, so students can leave the overlay without restarting. All existing public routes remain public.

## Files changed

Added:

- `src/features/simulations/lib/simulationRegistry.ts`
- `src/features/simulations/state/simulationSession.ts`
- `src/features/simulations/state/useSimulationSession.ts`
- `src/features/simulations/components/SimulationJourneyActions.tsx`
- `src/pages/ExperimentResultsPage.tsx`
- `tests/simulationIntegration.test.mjs`
- This document.

Updated:

- `src/app/paths.ts`, `routes.tsx`, `navigation.ts`.
- `src/components/layout/AppShell.tsx` (immersive routing uses the same registration).
- `src/pages/VirtualLabPage.tsx`, `ExperimentQuizPage.tsx` (clear quiz-results label).
- `src/features/experiments/components/ExperimentOverview.tsx`, `ExperimentCard.tsx`.
- `src/features/simulations/components/LaboratoryLayout.tsx`.
- `src/features/simulations/state/useSaltSimulationStore.ts`, `sessionActions.ts`, `sessionSelectors.ts`.
- `tests/studentRoutes.test.mjs` (add the new helper URL expectation).

T21's existing tools/materials sections are retained. No backend, authentication, dependencies, scientific definitions, calculation engine, camera/physics code or equipment/transfer interaction implementation was changed.

## Verification

New tests verify definition/ID/version binding, unavailable adapters, transient cleanup with retained quantities, public direct routes, navigation without workflow advancement, cross-ID isolation, explicit reset and scientific/quiz-results separation. The full integration test performs accepted material transfers, a real weighed mass, dissolution and final workflow review before checking the results route. No completion flag is fabricated.

The new integration tests passed (3/3), along with TypeScript, ESLint and a production build before the final full regression run. The initial server-render test used Zustand's initial snapshot rather than current retained state; the new shared session subscriber now exposes the current authoritative snapshot consistently. Existing renderer components retain their original Zustand subscription behavior.

A SHA-256 comparison of 87 pre-existing simulation files found 83 unchanged files and exactly four intended changes: `LaboratoryLayout`, `useSaltSimulationStore`, `sessionActions` and `sessionSelectors`. Calculation-engine, simulation-definition and Three.js interaction files are unchanged. Final test/deployment/browser evidence follows below.

- Full automated suite: **244 passed, 0 failed, 0 cancelled** (`artifacts/t22-tests.log`).
- TypeScript, ESLint and production build: passed (`artifacts/t22-build.log`).
- Formatting and whitespace checks: passed.
- The existing large JavaScript chunk warning remains.
