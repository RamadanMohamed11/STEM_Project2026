# T10 — Student authentication

Verified on 6 November 2026. This document supersedes the prototype-only authentication notes in the earlier Sign Up, Login and Password Recovery task documents.

## Production setup

- Existing Supabase project: **STEM_Project2026**, reference `pnwauxgwfvmsxemsbvfw`.
- Existing Vercel project: **stem-project2026**.
- Production site: <https://stem-project2026.vercel.app>.
- Final Vercel production deployment: `dpl_2PVmZHxTMpsZofeGECL7MdMWY2t1`, verified **READY** and assigned to the existing production domain.
- No second project, staging database, custom backend server or admin dashboard was created.
- Email authentication and student signups are enabled. **Confirm email is OFF**, as explicitly requested and confirmed by the owner. New registrations receive a real Supabase session immediately. This setting does not establish ownership of the supplied email address.
- Supabase Site URL is `https://stem-project2026.vercel.app`.

The following exact redirect URLs are configured:

```text
https://stem-project2026.vercel.app/auth/callback
https://stem-project2026.vercel.app/reset-password
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
http://127.0.0.1:5178/auth/callback
http://127.0.0.1:5178/reset-password
```

Local redirect entries use the same approved Supabase project. They do not represent another environment or database. Add exact matching callbacks if the site domain or local port changes; avoid broad production wildcards.

## Client and application architecture

`src/lib/supabase/client.ts` lazily creates the official `@supabase/supabase-js` client. The dependency is pinned to `2.119.0`, with its lockfile. PKCE, SDK session persistence, refresh and callback detection are enabled. Auto-confirmed registration with this actual client flow was tested against the production provider.

`src/features/auth/authService.ts` owns registration, sign-in, sign-out, session restoration, profile reads/updates and recovery. `AuthProvider` publishes its snapshot through React context and `useSyncExternalStore`. Forms do not implement separate authentication stores.

The service supports loading, anonymous, authenticated, unavailable and error states. Restored sessions are checked with the provider through `getUser()` before publishing authenticated state. Revision checks prevent late responses from a prior login or logout replacing the current user or profile. Auth callbacks defer asynchronous SDK requests outside the SDK's event lock. Cleanup removes subscriptions and timers.

Passwords are sent directly to the Supabase SDK and cleared from the form after requests. Application code does not persist passwords, create tokens or append passwords to URLs. Supabase manages its own access/refresh session storage. No custom account fixtures are bundled in the application.

Registration passes the name and supported grade ID as profile metadata. The database validates these again. A provider response without a confirmed session is handled as verification pending, never as completed login. Supabase populates `email_confirmed_at` automatically while Confirm email is off. The existing confirmation callback remains available if confirmation is deliberately enabled later.

## Routes and student flow

| Route                            | Access and behavior                                                       |
| -------------------------------- | ------------------------------------------------------------------------- |
| `/signup`                        | Existing design; real registration with shared grade values               |
| `/login`                         | Existing design; real email/password sign-in                              |
| `/account`                       | New minimal private profile page; name and grade only                     |
| `/auth/callback`                 | Provider-managed confirmation callback                                    |
| `/forgot-password`               | Real `resetPasswordForEmail` request; generic account recovery feedback   |
| `/reset-password`                | Password change only following a verified `PASSWORD_RECOVERY` event       |
| `/safety`                        | Next step after successful signup or login; safety is not marked complete |
| `/experiments/preview/lab`       | Existing public 3D demonstration, still public                            |
| `/experiments/:experimentId/lab` | Existing laboratory routing preserved                                     |

`RequireAuth` guards `/account`. Existing intentionally public student content remains public. Log Out is available through the shared navigation. Recovery links use Supabase-managed PKCE data; there is no custom token generator or application token table. Opening `/reset-password` directly does not grant reset access. Recovery authorization is bound to the verified account and cleared on sign-out, sign-in or account changes. A successful password update ends the local session when Supabase sign-out succeeds.

## Database migration and policies

Applied to the approved live project:

`supabase/migrations/202611060001_student_profiles.sql`

| Column       | Type        | Constraint                                                         |
| ------------ | ----------- | ------------------------------------------------------------------ |
| `user_id`    | UUID        | Primary key; references `auth.users(id)`, cascade on user deletion |
| `full_name`  | text        | Required, trimmed length 2–100                                     |
| `grade`      | text        | Required; one of the three shared grade IDs                        |
| `created_at` | timestamptz | Required; database default                                         |
| `updated_at` | timestamptz | Required; database default and update trigger                      |

Allowed grade IDs: `grade-secondary-1`, `grade-secondary-2`, `grade-secondary-3`. Email identity and passwords remain in Supabase Auth.

RLS is enabled and forced. Anonymous users receive no table privileges. Authenticated students have SELECT access only to their own row, using `(select auth.uid()) = user_id`. UPDATE has both an ownership `USING` condition and a matching `WITH CHECK` condition. Column privileges restrict updates to `full_name` and `grade`. Students cannot insert/delete profiles or modify identity and timestamp columns.

A private, non-exposed `SECURITY DEFINER` trigger creates the profile atomically when Supabase inserts an Auth user. It uses an empty search path and its execution privilege is revoked from public application roles. This narrow privileged operation is needed because students have no direct profile INSERT permission. Invalid name/grade metadata fails the constraints and rolls back signup. User-editable metadata does not control authorization and cannot overwrite an existing profile. A separate private trigger owns `updated_at`.

Do not rerun the already-applied migration. On a fresh authorized project, apply this SQL through the Supabase migration workflow before accepting student signups. No unrelated tables or simulation state are stored in the database.

## Environment and deployment

Copy `.env.example` to the ignored `.env.local` and set:

```dotenv
VITE_SUPABASE_URL=https://pnwauxgwfvmsxemsbvfw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_PROJECT_PUBLIC_KEY
```

Both values are browser-public configuration. Never put a secret key, service-role key, database password or management access token in a `VITE_` variable. The build guard rejects sensitive key names, non-publishable credentials and unsafe configured URLs before Vite bundles them. Missing/invalid configuration makes account services unavailable; it never creates a fake session.

The real URL and browser-safe publishable key have been configured locally and in the existing Vercel project's **production** environment. Vite embeds these at build time: redeploy after changing them. The production build uses Node 24, `npm ci`, `npm run build` and output `dist`. The existing SPA rewrite is preserved so direct routes work. Callback/reset paths receive `Referrer-Policy: no-referrer` and `Cache-Control: no-store` headers.

The current workspace source was deployed directly to the existing Vercel production project. It was not replaced by an older Git commit. The workspace has existing uncommitted work from earlier tasks; no commit, reset or staging operation was performed. Include the current source changes in the repository before any later Git-based deployment to avoid overwriting them with older source.

For local development:

```text
npm ci
npm run dev
```

For a later deployment, retain these public variables, the migration, exact redirect allowlist and chosen confirmation setting. No manual setup remains for signup/login on the current production URL. A different domain needs its own redirect configuration.

## Verification and limits

- TypeScript, ESLint and production build passed. The complete automated suite passed **212 tests, 0 failures, 0 cancelled** (36.8 seconds). Local logs are in the ignored `artifacts/t10-*.log` files.
- Unit/SSR checks cover config validation, missing services, registration metadata, pending email verification, generic login errors, restored sessions, logout, stale-response races, scoped profiles, account switching, recovery authorization and secret rejection at build time. These use SDK contract doubles and are not evidence of live provider behavior.
- Actual production Supabase signup returned HTTP 200 and real sessions for two authorized synthetic students. Actual password sign-in, automatic profile creation, grade persistence, own-grade changes, invalid credentials, session restoration with server verification and logout passed.
- Actual JWT-backed Data API calls proved that student A cannot read/update B, B cannot read A, and identity/timestamp changes are denied. Anonymous profile reads are denied.
- `student_profiles_rls_transaction.sql` separately exercised both PostgreSQL student roles, grade validation, forbidden operations and anonymous access. Its temporary fixture transaction rolled back successfully.
- Production browser checks passed: signup immediately opened Safety without email confirmation; profile showed the submitted name/grade; refresh restored the account; invalid login showed a generic error; valid login worked; logout redirected the private profile to Login; anonymous direct `/account` redirected to Login.
- Production browser checks also confirmed invalid recovery email validation, disabled password reset without recovery access, and actual rendering of the public Full 3D lab. SHA-256 comparison found **0 changes across 87 simulation files**.
- Supabase accepted a real recovery email request with HTTP 200. Mailbox delivery, opening the link and completing the password change were **not verified end to end**. Earlier confirmation-enabled requests hit the built-in email rate limit; immediate signup no longer depends on confirmation email. Use a configured mail provider for reliable production recovery delivery. PKCE recovery links should be opened in the browser that requested them.
- No verification email test was performed after disabling confirmation, because that is intentionally no longer part of registration. Verification-pending behavior remains covered by contract tests.
- The current Supabase security advisor reports **Leaked Password Protection Disabled**. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). This is separate from RLS; no table policy warnings were reported.
- The build retains the existing large 3D chunk warning. Dependency installation reported 10 moderate audit findings; no unrelated dependency upgrades were made.
- Five clearly named synthetic T10 test accounts were created with the owner's permission. Passwords/tokens were not logged or saved in application data. They remain in Supabase: the connector's deletion confirmation expired without executing cleanup. Test accounts are not student-facing fixtures or hard-coded accounts. Cleanup is documented below.

## Repeating live checks safely

`scripts/check-supabase-connection.mjs` is a read-only/negative probe. Run with `node --env-file=.env.local scripts/check-supabase-connection.mjs`.

`scripts/live-student-auth-test.mjs` is explicitly opt-in. It creates **real** synthetic users in the configured project and can send a real recovery request. Set `T10_TEST_EMAIL_BASE` to a mailbox you control and authorize, plus `T10_TEST_AUTO=1`, before running it with the same env file. It generates random passwords and keeps credentials/session tokens in process memory only. It is not part of `npm test` or the deployed source bundle. Use it only with explicit permission for that project's real writes and email activity.

`supabase/tests/student_profiles_rls.sql` supports two existing authorized student IDs. `supabase/tests/student_profiles_rls_transaction.sql` instead uses passwordless, sessionless transactional identities and rolls them back. These tests must never loosen production policies.

Test account cleanup must be limited to the Auth users tagged `test_fixture = T10-production-test` and the explicitly named `STEM T10 UI Test Student`. Revoke their sessions first, then delete through an authorized management workflow; profiles cascade. Never delete by a broad email-domain predicate. Deletion does not retroactively invalidate an already-issued access token, although removing the profile prevents access to that row.

## Files owned by T10

- Client/config: `src/lib/supabase/{client,config}.ts`, `.env.example` and ignored local configuration.
- Auth service/state: `authService.ts`, `authContext.ts`, `AuthProvider.tsx`, `RequireAuth.tsx`, `AuthAccountControl.tsx` under `src/features/auth/`.
- Forms/feedback: existing `RegistrationForm.tsx`, `LoginForm.tsx`, `RecoveryForm.tsx`, `AuthFeedback.tsx` integrated with the service.
- Pages/routes: `StudentProfilePage.tsx`, `AuthCallbackPage.tsx`, `App.tsx`, route paths, route tree, navigation context and shared navigation links.
- Database: the single migration and two RLS test scripts above.
- Build/deployment: `package.json`, lockfile, `vite.config.ts`, `vercel.json`, `scripts/validate-public-auth-env.ts`, the connection/live-test/source-packaging scripts.
- Tests: `supabaseAuth.test.mjs`, `authRoutesAndSchema.test.mjs`, `publicAuthEnvironment.test.mjs`.

The curriculum entities, scientific definitions, simulation engine and all working laboratory interactions were preserved.
