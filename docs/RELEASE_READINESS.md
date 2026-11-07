# T35 release readiness

Audit: 7 November 2026. Decision: **reviewed corrective release for the existing educational prototype**, with the limits in [KNOWN_ISSUES.md](KNOWN_ISSUES.md). This is not a claim of complete institutional, accessibility, academic or high-stakes assessment readiness.

## Architecture reviewed

`src/app/routes.tsx` and `paths.ts` own stable student/admin URLs. `AppShell` wraps the student pages; the full-screen lab has its own layout. Curriculum hierarchy and experiment links use shared typed selectors and separate published repositories. Experiment IDs resolve through the existing simulation registry; only the supported salt definition launches a lab.

`useSaltSimulationStore`, `useLabSceneStore`, session selectors/actions and the existing workflow engine remain authoritative for science and completion. Details/lab/results share the current tab's ID/version-bound session. Supporting navigation does not reset it; explicit restart or browser refresh creates a fresh scientific session. Scientific state is not duplicated in curriculum or quiz logic.

The assessment engine grades actual selected options and retains detailed latest results in memory; device-local progress stores safe summaries independently. Auth uses the official Supabase SDK, server-verified restored identities, own-profile access and verified database roles. Admin route protection is additional UX; PostgreSQL grants/RLS and permission-checked RPCs enforce authorization.

## Gates passed before production upload

- 330 automated tests; TypeScript, lint and Vite build.
- Eight local browser regression groups plus sixteen responsive layout checks.
- Browser 3D water-transfer/session/reset smoke, real practice submission/feedback/retake and student journey checks.
- Two-student live authorization/login/profile tests and real browser signup/profile/login/logout.
- Five rollback database authorization suites and fourteen-table RLS review.
- No matched secret/service-role credential in the inspected build; upload excludes environment files and fixtures.
- Corrective changes reviewed without touching scientific rendering/engine modules or applying database migrations.

## Production release record

The owner explicitly requested that completed changes be visible on the current production site. Same Vercel project and team, no second project or database:

- Site: `https://stem-project2026.vercel.app`
- Vercel project: `prj_kml5fc5QBOfnT8qMF7AowyUjHMJ1`
- Source base: `8778975addbc3c094526cd18d3b21bef989fa2ea` plus T35 working-tree fixes.
- Prior READY production deployment: `dpl_21CvcQP2Z3r4krRDgj7zFVi4vyGj`.
- New source deployment: `dpl_6kBkyLbySd6urJ1Mmp9bFbxwc53N`.
- Reviewed upload: 274 source/config/public files; SHA-256 `f28f166cfbb5b6496ff6a29560627e2afece060b1ae6f4ef3dcc14030639170c`.
- Remote status: **READY**, target `production`, no alias error. The existing public alias resolves to this release.
- Public-alias browser regression: **8 groups passed**, including **16 responsive layout combinations**. The published 3D scene rendered; the inspected production console error log was empty.
- Public HTTP checks passed on Home, curriculum, direct lab URL, auth callback and password reset. JavaScript asset returned 200 with the correct content type and updated educational copy. Auth callback/reset retained `no-store` and `no-referrer`.
- Actual entry asset: `/assets/index-RtwobaxN.js`, 1,212,984 bytes, SHA-256 `342edd6c69c69519a9e17b6ca8c142ca3676c747bf6efe1e4e38dfda0ab0918e`.
- HTTP verification timestamp: `2026-11-07T12:33:57.686Z`. Evidence: `artifacts/t35-browser-production.json`, `artifacts/t35-production-http.json`, `artifacts/t35-production-journey.png`, `artifacts/t35-production-lab.png`.

This is a source upload, not a fabricated Git commit. Include these workspace changes in the normal reviewed Git workflow before a later Git-driven deployment, so it cannot unintentionally replace the fixes with the older revision.

## Remaining readiness work

Before an official school rollout: academic review, real mailbox recovery/confirmation testing under the intended email policy, an authorized admin's browser edit/publish/reload flow, representative low-power device tests, keyboard/screen-reader and broader contrast audit. Separate tasks should address transactional admin writes and deliberate route splitting. Students/Reports admin placeholders, missing demonstration videos and account-synced progress are excluded from completed functionality.

No production security setting was changed. Email confirmation OFF remains the owner's existing decision, and leaked-password protection remains an advisor warning. Review both before expanding real student use. Preview environment variables are absent; the user requested the existing production project rather than a second environment.

See [QA_CHECKLIST.md](QA_CHECKLIST.md), [TEST_RESULTS.md](TEST_RESULTS.md), [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) and [ENVIRONMENT_CONFIGURATION.md](ENVIRONMENT_CONFIGURATION.md).
