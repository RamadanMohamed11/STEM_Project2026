# T37 — Route-level code splitting

Implemented 8 November 2026 against T36 revision c0b00cd.

All 23 non-Home page modules in src/app/routes.tsx now use React.lazy. Home remains a static import. A Suspense boundary reuses AuthFeedback's accessible loading status. Route paths, authorization guards, layout hierarchy, experiment identity and the existing lazy LaboratoryScene boundary are unchanged. Admin pages build as individual dynamic chunks. No dependencies or build chunk settings were changed.

## Measured production output

The baseline was rebuilt from the HEAD router with the same current build config, using a temporary transform and a separate ignored output directory; source was never swapped.

| Metric                                       |    Before |     After |
| -------------------------------------------- | --------: | --------: |
| Main entry, raw bytes                        | 1,009,996 |   127,932 |
| Entry reduction                              |           |     87.3% |
| HTML entry plus module-preload JS, raw bytes | 4,492,917 | 3,914,390 |
| Same initial JS, gzip bytes (Node zlib)      | 1,425,838 | 1,293,152 |
| Initial gzip reduction                       |           |      9.3% |

Admin page chunks include AdminFoundationPage, AdminCurriculumPage, AdminExperimentsPage, AdminQuestionsPage and AdminSectionPlaceholderPage. Shared dependencies are naturally separate chunks; these sizes do not imply that all page code or all Three.js dependencies have left the initial graph.

Important pre-existing limitation: T36's vite.config.ts contains named Three.js codeSplitting groups again. They still pull three-engine/react-three into the initial preload graph. T37 does not add or edit those groups. Fixing that build configuration requires a separately scoped follow-up; initial-load claims above include its actual cost.

## Verification

- Production build, TypeScript and lint pass. Existing large 3D chunk warning remains.
- Browser: all 27 route destinations checked at 1366px and 375px against the actual production build (54 checks). Public pages render; protected profile/admin routes correctly show login/access states. Authorized admin content is exercised by the existing SSR tests, not by granting browser privileges.
- Vite dev: the same full 54-case matrix passed after the SSR workers finished. An earlier cold load stalled during concurrent dependency optimization; the successful final dev and built-app checks are recorded separately.
- Existing route tests now await actual React lazy resolution with renderToReadableStream, then assert the completed static HTML. Existing assertions and real route/guard code are preserved. The test-only Vite helper disables unnecessary browser dependency discovery for those SSR tests to avoid concurrent optimizer memory pressure.
- Final full suite: 330 passed, 0 failed/skipped/cancelled, 134.8 seconds. One earlier run encountered an optimizer memory allocation failure; this was not treated as a passing run.

Ignored evidence: artifacts/t37-build.log, t37-baseline-build.log, t37-tests-verified.log, t37-browser.json and t37-mobile.png.

No authentication/database/simulation behavior, routes, content or design was changed. No production release or push is part of this task.
