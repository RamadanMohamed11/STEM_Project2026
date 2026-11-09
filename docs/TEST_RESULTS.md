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
