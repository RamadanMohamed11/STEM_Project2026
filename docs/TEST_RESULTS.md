# T35 actual verification results

Date: 7 November 2026. Existing application at revision `8778975addbc3c094526cd18d3b21bef989fa2ea`, with the T35 working-tree fixes. Evidence files are intentionally ignored under `artifacts/`; they are not bundled in production.

## Automated checks

| Check                      | Actual result                                                                                                                               | Evidence                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Baseline suite             | 325 passed, 0 failed; ~160 seconds                                                                                                          | `artifacts/t35-baseline-tests.log`                                                |
| Final full suite           | **330 passed, 0 failed, 0 cancelled/skipped**; 171.1 seconds                                                                                | `artifacts/t35-final-tests.log`                                                   |
| TypeScript                 | Passed (`tsc -b`)                                                                                                                           | Final command exit 0; initial final-check log `artifacts/t35-final-typecheck.log` |
| ESLint                     | Passed (`eslint .`)                                                                                                                         | Final command exit 0; `artifacts/t35-final-lint.log`                              |
| Production build           | Passed; existing large-chunk warning retained                                                                                               | `artifacts/t35-final-build.log`                                                   |
| Build safety/budget script | Passed: five built text files scanned, no matched secret/private-key/service-role JWT, no eager 3D preload, initial entry below 400 kB gzip | `node scripts/qa/inspect-release-build.mjs`                                       |
| Dependency audit           | Completed against npm registry: 10 moderate, 0 high, 0 critical                                                                             | `artifacts/t35-npm-audit.json`; all findings trace to minimatch tooling advisory  |
| Runtime-only audit         | **0 vulnerabilities** with `npm audit --omit=dev --json`                                                                                    | `artifacts/t35-npm-audit-production.json`                                         |
| Diff whitespace            | `git diff --check` passed                                                                                                                   | Repository check; no full-repository reformat applied                             |

New tests exercise database error, thrown network error, missing affected row, partial write, real empty data, immutable-snapshot duplicate versus other failure, preservation of prior local state, and shared button text contrast. Existing scientific tests still verify solid/liquid transfers, mass/volume conservation, ordering, saturation/dissolution, cancellation, equipment/camera helpers and all nine evidence-validated workflow steps.

An intermediate run had 327/329 passing because two older tests required the inaccurate “Term details coming soon” grade notice. Their content assertions now require the truthful demonstration/academic-review notice; navigation/accessibility assertions remain intact. The final run above is clean.

## Browser checks on the built app

Built app served at `http://127.0.0.1:4174`. The first sandboxed port was unreachable from the browser; the approved local preview server resolved that connection issue. Tests use the documented CUA browser API, not hidden store mutations or fabricated completion.

- Eight reproducible groups passed in `scripts/qa/release-browser.mjs`: home/deferred 3D; signup errors/focus/toggle; search/direct refresh/history; planned/unknown experiment safety; anonymous admin denial; unanswered quiz return; six-question submission/results/retake; responsive layout checks.
- Sixteen responsive combinations passed: 1440×900, 1366×768, 768×1024 and 390×844 × signup/details/quiz/lab. No horizontal document overflow or unlabelled native fields; laboratory height equals the viewport.
- Additional manual browser flow passed: safety incomplete feedback and six explicit checks → grade → term → unit expansion → lesson experiments. Planned cards opened details without offering a playable lab.
- 3D browser smoke passed: scene rendered, camera orbit/reset, inventory selection/placement, two-object selection, numeric 100 mL transfer, volume display/workflow step validation, details return preserving the measured cylinder, history and explicit restart. The full solids/stirring/completion sequence is covered by automated tests, not claimed as a complete T35 browser run.
- A real six-answer practice submission produced **4/6 (67%)**, including correct/incorrect explanations. Results navigation worked. Refresh correctly showed “No quiz results yet”; device-local score summaries remained available separately. Retake cleared selections. No server-side quiz/completion record was invented.
- Browser console error log was empty at the inspected local progress step. This is not a guarantee that all hardware/browsers produce no warnings.

Evidence: `artifacts/t35-browser-local.json`, `artifacts/t35-responsive.json`, `artifacts/t35-mobile-lab.png`.

## Live authentication and database authorization

- Seven grouped live SDK checks passed against the approved Supabase project using two separate disposable students, repeated with stricter PostgreSQL error-code assertions. Passwords/session tokens stayed in process memory.
- Actual signup, profile creation and grade values; metadata role escalation denied; cross-student reads and updates empty/denied; own name/grade persistence; invalid grade constraint; protected timestamps denied; published experiment mutation and role assignment denied; real login/logout; restored session verified by `getUser`; invalid password issued no session.
- Browser additionally passed real signup → Safety, own profile name/grade save, grade/session restoration after reload, real login, signed-in student denied admin questions, and logout. Safe evidence: `artifacts/t35-browser-auth.json`.
- Five database transaction suites passed: `student_profiles_rls_transaction.sql`, `user_roles_rls_transaction.sql`, `curriculum_management_rls_transaction.sql`, `experiment_management_rls_transaction.sql`, `question_bank_rls_transaction.sql`. They test separate anon/student/instructor/admin identities and roll back fixture data.
- Live audit confirmed RLS on **14 public tables**. No schema migration or lasting role grant was applied.
- Removed exactly five disposable live auth fixtures across the two SDK runs and one UI run. Final database count for T35 fixtures was **0**.

Provider email confirmation is auto-confirm under the owner's previous explicit choice. No verification email, real recovery-link delivery or password change was tested. No authorized administrator browser session was used. Database authorization evidence is distinct from these missing browser/email checks.

## Performance observations

Baseline initial compressed JS was approximately **1,438 kB** across the entry, runtime, Three.js and React Three chunks. The reviewed build loads approximately **317 kB** of entry JavaScript initially (about **78% less**); 3D loads at the existing lazy scene boundary. CSS is ~90.48 kB raw/~14.97 kB compressed. The lazy scene remains ~3.32 MB raw/~1.14 MB compressed; main route code remains ~1.21 MB raw. Compression readings vary slightly between Vite and Node zlib settings.

Only `public/favicon.svg` is a static public asset; the existing lab uses procedural geometry rather than large public model/texture downloads. No quantitative GPU FPS, memory, throttled mobile Web Vitals or React render-profiler benchmark was collected. Avoid claiming these metrics improved solely because transfer size fell.

Production deployment is READY. The same eight browser groups and sixteen layout checks also passed against the public production alias, and the published lab rendered. Five direct HTTP paths, entry JS content/type and callback/reset security headers passed. Evidence is in `artifacts/t35-browser-production.json` and `artifacts/t35-production-http.json`; the deployment and source identifiers are recorded in [RELEASE_READINESS.md](RELEASE_READINESS.md).

## L12 verification status — 9 November 2026

Implementation adds keyboard bench controls, shared validated placement/snap actions, instance-aware screen-reader descriptions, lab-scoped 44px targets, touch cancellation/two-finger camera mapping, and hidden-tab frame/physics suspension (including molecular view). Existing instancing and adaptive resolution remain. A development-only FPS/draw-call/DPR display is available; it measures rendered frames rather than inventing a performance result.

Browser acceptance and real mobile FPS: **NOT VERIFIED**. Computer Use could not initialize (`failed to write kernel assets`, OS error 3); reset and retry did not fix it. There are no L12 FPS samples, mobile screenshots or hardware-performance claims. See `LAB_MOBILE_ACCESSIBILITY.md` for the exact pending keyboard/touch/visibility/device matrix. Earlier T35/T37 browser results do not validate these new L12 controls.

L12 automated results: `npm test` passed **483/483**, with zero failures, skips or cancellations (186.6 seconds; `artifacts/l12-tests-final.log`). TypeScript, ESLint and production build passed; the existing large-chunk warning remains. Five new accessible-bench tests cover placement/undo, measurement constraints, descriptions, visibility subscriptions and the authoritative non-pointer salt workflow. These automated results do not replace the pending browser/device checks.

### L12 authorized release follow-up — 9 November 2026

The repeated full regression run passed **483/483**, zero failures/skips/cancellations, in 185.1 seconds (`artifacts/l12-release-tests.log`). After the final compact-panel layout and independent live-description changes, all **6 focused accessible-bench tests** passed, including native controls and independent description markup (2.9 seconds). The additional markup test was added after that file had run in the full suite; these counts are separate, not a claim of 484 full-suite tests.

Final `npm run typecheck`, `npm run lint` and `npm run build` passed. Build retained the existing large JavaScript chunk warning. `git diff --check` passed. The release preserves scientific state, uses existing validated actions and does not include backend/schema changes. Production release identifiers and public HTTP verification are recorded in `LAB_MOBILE_ACCESSIBILITY.md`. HTTP/compiled-source checks do not execute the browser UI, validate physical gestures or measure mobile FPS.

## I15 — Mobile lab header (9 November 2026)

- `npm test`: **484/484 passed**, zero failures/skips/cancellations, 240.5 seconds (`artifacts/i15-tests.log`). Includes the authoritative salt workflow and material-transfer regressions.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed. Existing large-chunk warning remains (`artifacts/i15-build.log`).
- Actual local Chromium/Playwright CLI: 375px has exactly two primary header buttons; 768px and 1440px retain inline controls. All header buttons fit within the 60px header and page scroll width equals viewport width. Menu buttons are at least 44×44px. Screenshots visually inspected.
- Keyboard Tab/Enter/Space, focus entry, Escape/focus restoration without clearing bench selection, Tab exit, outside click, resize close and mode/goggles state across breakpoints passed. Data-log and selected-container particle-view actions use the real current state.
- Actual salt UI: confirmed safety, added cylinder and water through Inventory, selected them with native bench controls, transferred 100mL, observed source drop from 400 to 300mL and cylinder rise to 100mL; workflow advanced to Step 4 / 9. Restart also reset the practice state. A full nine-step browser completion is not claimed; existing automated workflow tests cover completion.
- Evidence: `output/playwright/i15-browser-report.json` and `i15-*-header.png` / `i15-mobile-options.png`. Computer Use could not initialize; the supported Playwright CLI skill provided real-browser verification. No physical-phone FPS or screen-reader audit is claimed for this header task.
- The same 13 browser assertions also passed on the public production alias after deployment `dpl_GDj9iN5S95KS3dHe8zM9mLHrqBeJ` reached READY. The production report confirms scroll widths of 375/768/1440px, 2 mobile primary buttons versus 10 inline controls, and a 44px minimum menu target height. No console errors; existing Three.js/Rapier deprecation warnings remain. The local report is preserved separately as `output/playwright/i15-browser-local-report.json`.

## I16 — Small-screen responsive pass on non-lab pages (9 November 2026)

- Automated test run: **484/484 passed**, zero failures/skips/cancellations (124.0s).
- TypeScript: passed (`tsc -b`).
- ESLint: passed (`eslint .`).
- Production build: passed (`tsc -b && vite build`).
- Real Chromium/Playwright verification at 375×812, 768×1024, and 1280×800 across all non-lab routes.
- Zero horizontal page overflow (`scrollWidth - clientWidth === 0`) across all 16 tested routes and 3 breakpoints.
- Interactive controls and touch targets meet the ≥ 44×44 px minimum on mobile devices.

### Responsive layout pass results

| Page | 375 | 768 | Desktop | Fix applied |
| --- | --- | --- | --- | --- |
| Home (`/`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Added `min-h-11` to `Brand` header logo; `min-h-11` on feature link; mobile `buttonSizeStyles.sm` min 44px. |
| Login (`/login`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Password visibility toggle button enlarged to `min-h-11` (44px) at `top-2.5`. |
| Sign up (`/signup`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Password toggle enlarged to `min-h-11`; `px-1.5` padding added to login text link for ≥44px target. |
| Password recovery (`/forgot-password`, `/reset-password`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Shared `PasswordField` toggle button enlarged to `min-h-11` (44px). |
| Safety page + "Get Lab Ready" (`/safety`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Filter chips enlarged to `min-h-11 px-3.5`; `ToolNotePopover` trigger enlarged to 44×44px (`min-h-11 min-w-11 size-11`); "Start again" activity button updated to `min-h-11`. |
| Choose Grade (`/grades`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | "Browse all terms directly" link updated to `inline-flex min-h-11 items-center`. |
| Choose Term (`/terms`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | "Change Grade" button updated from `min-h-10` to `min-h-11`; "Explore sample experiments" link updated to `inline-flex min-h-11 items-center`. |
| Experiments library (`/experiments`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | "Catalog View" switch button updated from `min-h-9` to `min-h-11 px-3.5`; curriculum cards adapt with `min-h-11` targets. |
| Experiment Details (`/experiments/:id`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Tool note popover buttons enlarged to 44×44px; AI Tutor "Explain this" buttons updated to `min-h-11 px-3.5 py-2`. |
| Five learning stages viewer | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Stage pagination preserved with `min-h-11`; video player controls (Play, Pause, Retry) updated to `min-h-11 px-3.5/4 py-2`. |
| Quiz (`/experiments/:id/quiz`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Progress bar question buttons updated to `min-h-11 min-w-11 sm:size-8`; "Clear" answer button updated to `min-h-11 px-2.5 py-1.5`. |
| Quiz results (`/experiments/:id/quiz/results`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | `QuizReviewScreen` "Change Answer" buttons updated to `min-h-11 px-3.5 py-2`; review list stacks vertically on small screens. |
| Progress page (`/progress`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Action buttons (Browse Experiments, Start Lab, View Results) enlarged to `min-h-11` on mobile via `buttonSizeStyles.sm`. |
| Lab results (`/experiments/:id/results`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | Wrapped `MeasurementTable` in `<div className="overflow-x-auto">` ensuring table contents scroll safely horizontally without clipping. |
| Admin pages (`/admin/*`) | Pass (0px ovf) | Pass (0px ovf) | Pass (0px ovf) | `AdminLayout` header sign out button compacts to icon with `aria-label` below `sm`; inputs and action buttons in Curriculum, Experiments, Questions pages updated to `min-h-11`; existing `overflow-x-auto` table wrappers verified. |

### I16 commit review follow-up

Reviewed all 24 files changed by `4743760`, including the shared button styles, Brand, admin layout/editors, AI explanation button, all three quiz components, login/registration/shared password fields, video controls, tool-note popover, home/safety links and controls, measurement table, grade/term/catalog pages, ignore entries and this report. No event handlers, routes, validation, stores or scientific operations were removed or changed. The measurement table retains its contents, semantics and remove handlers inside the new scroll wrapper. Larger touch targets were left intact.

Two concrete regressions fixed separately:

- `QuizProgressBar`: `min-h-11 min-w-11` continued to override `sm:size-8`, making desktop navigation 44px instead of its intended 32px. Added matching `sm:min-h-8 sm:min-w-8`; mobile remains 44px.
- `AdminLayout`: the new fixed `aria-label` overrode the visible pending sign-out text. Its accessible name now follows `signingOut`, including on the icon-only mobile button. No sign-out handler or authentication logic changed.

Actual Chromium checks on the local quiz at 375/768/1280px confirmed 44/32/32px button dimensions, no horizontal overflow and working question selection. Screenshots were visually inspected (`output/playwright/i16-review-*.png`); dimensions are recorded in `output/playwright/i16-review.json`. An initial measurement immediately after resizing ran before responsive styles settled; the final assertions wait for the expected layout. An authenticated admin sign-out was not executed; that label change was verified by code review. This follow-up does not claim a fresh browser pass over every original I16 page.

Review-fix verification: TypeScript, ESLint, production build and `git diff --check` passed. Full suite: **484/484 passed**, zero failures/skips/cancellations, 204.2 seconds (`artifacts/i16-review-tests.log`). Existing bundle-size and Three.js deprecation warnings remain. No deployment or Git push was performed for this review.

## I17 — Shared non-lab accessibility changes (9 November 2026)

Full suite: **485/485 passed**, zero failures/skips/cancellations, 206.3 seconds (`artifacts/i17-tests.log`). This preceded the final explicit native-drawer boundary helper; the student drawer subsequently passed 30 real keyboard Tab operations and Escape/focus return. The two contrast tests passed independently. Browser route trees, keyboard tests, findings/fixes and limits are recorded in ACCESSIBILITY.md. No dependency, authentication/data logic or 3D scene changes. Full WCAG AA conformance and all authenticated flows are not claimed.

Final rerun including drawer helpers and stable results selectors: **485/485 passed**, 205.8 seconds (`artifacts/i17-tests-final.log`). The final review-heading focus adjustment passed **21 focused tests** and the built-preview Space/Enter quiz-to-feedback flow. Final typecheck, lint, build and diff checks passed. The preview safety/PPE/questions/checklist → Grade → Term → filtered experiments flow also passed using keyboard controls. See ACCESSIBILITY.md for the full page/criterion/fix table and explicit remaining acceptance checks.
