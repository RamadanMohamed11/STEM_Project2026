# Vercel deployment guide

Use the existing `stem-project2026` Vercel project and approved Supabase project. Keep the SPA architecture, public laboratory routes, migrations and RLS. T35 adds no backend or database migration.

## Before release

1. Review the exact working tree and current production deployment. Preserve unrelated work. Keep `.env.local`, test fixtures, credentials and ignored artifacts out of the upload.
2. Install the locked dependencies with `npm ci` when a clean install is needed. Use the supported project Node version; local and Vercel builds must both be checked.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then `node scripts/qa/inspect-release-build.mjs`. Review warnings and `npm audit --json` rather than automatically changing dependencies.
4. Serve the built `dist` with `npm run preview`. Run the browser checks in `scripts/qa/release-browser.mjs` through the documented CUA tab/viewport APIs. The script accepts `(tab, viewportCapability, origin)` and returns checks/layout metrics; it neither launches a browser nor signs in. Use a fresh anonymous test tab and the current six-question draft fixture.
5. Run the five existing Supabase rollback authorization fixtures only in the approved project. They use transaction-local identities and roll back all fixture data. Never replace them with permanent role grants.
6. Review [KNOWN_ISSUES.md](KNOWN_ISSUES.md). Full institutional readiness additionally needs academic review, authorized-admin browser checks, real email delivery/recovery and representative hardware/accessibility validation.

## Deploy the reviewed source

The user explicitly requested the T35 changes on the current production site after verification. This approval applies to this release; it is not a standing instruction to auto-publish later work.

Use the existing connected Vercel source deployment strategy. `node scripts/prepare-vercel-source.mjs prepare` generates the ignored upload payload from source, public files, lockfile and required build configuration. The historical payload filename is `artifacts/t10-deployment-payload.json`; it is not a second project or old application. Review the payload's files before uploading. Do not include `.env*`, credentials, QA artifacts or account fixtures.

Target the existing project ID `prj_kml5fc5QBOfnT8qMF7AowyUjHMJ1` in team `team_0t2TB2AMYz3hSAonckzq6YKu`, with target `production`. Preserve the existing build settings. Do not create another project, silently promote a preview, change security protection, or run migrations as part of a frontend release.

## Verify the actual deployment

Wait for Vercel `READY`, inspect build logs if it fails, then verify the public production alias itself. Confirm HTML/assets are served, SPA direct URLs survive refresh, updated copy appears, the built entry does not preload 3D, the public lab renders and controls remain available. Re-run the browser regression script against the production origin using disposable browser-local quiz/progress state. This checks the real interface; it does not create fabricated database completion records.

`vercel.json` keeps the React Router catch-all rewrite. Provider callback and reset pages retain `no-store` and `no-referrer` headers. A broader CSP must be tested with Supabase, WebGL, Rapier/WASM and educational media before enforcement; none was added speculatively.

## Rollback

Record the prior READY production deployment before release. If the new frontend breaks critical public/auth flows, use Vercel's existing rollback workflow to that reviewed deployment with owner authorization. A frontend rollback does not undo database writes or auth configuration. T35 has no schema change to reverse. Do not delete the project or database to recover a frontend deployment.
