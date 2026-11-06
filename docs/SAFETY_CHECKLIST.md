# T14 — Safety Checklist and Learning Flow

## Checklist and content

The existing `/safety` learning page now ends with a six-item Safety Checklist. It keeps the T12 introduction and PPE guide and the existing T13 equipment explorer intact. A topic link jumps to the checklist. Each acknowledgement has a stable ID and a link back to the relevant lesson:

| Item                                                 | Review section                 |
| ---------------------------------------------------- | ------------------------------ |
| Appropriate protective equipment                     | PPE guide                      |
| Reading experiment instructions and asking questions | Before entering the laboratory |
| Careful use of laboratory tools                      | Equipment safety guide         |
| Organized workspace and clear exits                  | Before entering the laboratory |
| Reporting spills, damage and unsafe situations       | Good habits in the lab         |
| Never tasting laboratory chemicals                   | Good habits in the lab         |

The statements summarize the existing draft educational content. They do not replace teacher instructions or add new chemical-specific precautions. Academic review of the lessons is still pending.

## State, acknowledgement and navigation

`data/safetyChecklist.ts` holds typed local items separately from the lessons and interaction. `getChecklistProgress` counts only IDs in the current item list. Unknown or older IDs cannot complete the current list, and an empty configuration cannot unlock Continue.

`components/SafetyChecklist.tsx` owns a local React Set of confirmed IDs. It starts empty. All checkboxes are controlled and can be checked or unchecked; no automatic selections, account updates, cookies or browser-storage writes are used. Progress is derived from the current list and choices, not stored as a second completion flag. Adding an item updates the total and completion requirement automatically.

Students read the guide, mark the statements they understand and press **Continue to Grade Selection**. An incomplete submission stays on Safety, announces the number of missing items and focuses the first unchecked box. A complete list shows acknowledgement feedback and the same action navigates through the existing React Router `/grades` route. Unchecking a statement immediately removes the completed state.

The UI uses native labeled checkboxes, a fieldset and legend, a labeled progress element, live progress feedback, an accessible error and the existing shared Button component. Review links are outside checkbox labels so reviewing a lesson does not change acknowledgement state. There are no blocking modals.

Acknowledgement wording explicitly distinguishes this activity from practical skill verification or certification. It never claims that results were saved to an account, even when a student is signed in. There is no approved safety-persistence model, so the existing authentication service is not involved.

Choices are held only in the mounted page. Refreshing or leaving and returning starts a new review. This is intentional for the prototype; browser-session persistence was optional and is not implemented.

Only this checklist's Continue action checks acknowledgement. The shared Grade navigation and direct public experiment/laboratory routes remain available. No global route restriction or simulation safety-state change was introduced.

## Files

- Added `src/features/safety/data/safetyChecklist.ts`.
- Added `src/features/safety/components/SafetyChecklist.tsx` (including a separate acknowledgement view).
- Updated `src/pages/SafetyPage.tsx` to include the topic link and checklist, replacing its previous unguarded bottom next-step action.
- Added `tests/safetyChecklist.test.mjs` for current-list progress rules, initial accessibility and public-route preservation.
- Updated the earlier T12 test in `tests/safetyContent.test.mjs` to allow T14's checklist while retaining educational-content checks.

No dependency, database, authentication, routing or laboratory file changes are required. The existing T13 guide is present; no missing dependency blocks T14.

## Verification

- TypeScript: passed, including the final production build's TypeScript step.
- ESLint: passed.
- Full automated suite: **221 passed, 0 failed, 0 cancelled**. After moving the incomplete-message above the items for visibility, all four safety/checklist tests were rerun and passed.
- Production build: passed locally and on Vercel. The existing large JavaScript chunk warning remains.
- Final production deployment: `dpl_7QD2QK1mbUsJb7sutE1pyx2GskUm`, verified READY on the existing project/domain.
- Simulation preservation: **87 SHA-256 comparisons, 0 changed files**.

Initial parallel checks encountered host memory exhaustion in Node/Vite and PowerShell. Checks were retried sequentially with `RAYON_NUM_THREADS=1`, `UV_THREADPOOL_SIZE=1` and a reduced V8 worker pool. A single-threaded Node run completed the final targeted tests and build. These are execution-environment adjustments, not source or dependency changes. Failed attempts are not counted as successful verification.

### Production browser checks

- Initial page: all six checkboxes unchecked, progress 0/6.
- Incomplete Continue: stayed on Safety, announced remaining statements and focused the first unchecked box. The final layout places this feedback above the items so it is visible near that focus.
- Keyboard Space: toggled a checkbox and updated progress to 1/6.
- Confirming every item: progress 6/6 and local acknowledgement feedback.
- Unchecking the last item: progress 5/6, completion feedback removed, Continue rejected with one statement remaining.
- Rechecking and continuing: navigated to `/grades`.
- Browser Back and refresh: started a new 0/6 review, consistent with the in-memory limitation.
- Mobile: reviewed at 390 × 844 with readable labels, touch controls and the visible incomplete-message. The viewport override was reset afterward.
- Public lab: opened directly from a fresh 0/6 review without login or a new route restriction. The simulation's separate in-lab safety confirmation was preserved.

Screenshots are stored in ignored `artifacts/t14-checklist-desktop.png` and `artifacts/t14-checklist-mobile.png`. Documentation for T12 and T13 remains a record of those earlier tasks; T14 adds the interactive review described here.
