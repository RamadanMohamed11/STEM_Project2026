# T11 — Student Profile and Grade Preferences

## Routes and data

`/profile` is the primary profile URL. The existing `/account` URL renders the same page and remains supported. Both routes use the existing `RequireAuth` boundary. The authenticated navigation links to `/profile` and shows its active state.

The page reads the verified T10 authentication context. It shows Full Name, Current Grade and Account Information with the actual Auth email. No fictional account data, passwords or session tokens are kept in profile form state. An additional ownership selector rejects mismatched profile/user IDs before rendering any profile details. Missing configuration, loading, authentication errors and unavailable profiles retain honest feedback states.

## Editing

Students can update their full name and grade through the existing `auth.updateProfile` service. The form validates trimmed names of 2–100 characters and the shared grade IDs from T03. The three grade options come directly from `sampleGrades`; no additional grade list is maintained.

Only changed values can be saved. While a request is pending the form controls are disabled and an immediate submission guard prevents repeated saves. Field errors focus the first invalid control and use accessible descriptions. Loading, confirmed success and general errors reuse the existing AuthFeedback components. Failed saves keep the entered values for another attempt. The form is keyed by the profile owner so another signed-in student never inherits the previous student's draft.

Email is read-only. Email editing and its provider verification flow are deliberately left for future account management. IDs, timestamps and other protected account fields are not editable.

The existing Supabase table and RLS policies are unchanged: students can SELECT their own profile and UPDATE only their own `full_name` and `grade` columns. Client-side routing is not treated as database authorization. No database migration or dependency was added for T11.

## Choose Grade integration

The saved grade is available through `useAuth().state.profile.grade`, after checking ownership with `getOwnStudentProfile(state)`. A future Choose Grade implementation can use that stable ID as the student's starting preference and reuse the shared grade entities. T11 does not implement Choose Grade content, change curriculum relationships or select a term automatically.

## Files

- `src/features/profile/ProfileForm.tsx`: accessible editable form, loading and feedback.
- `src/features/profile/profile.ts`: validation and safe own-profile selector.
- `src/pages/StudentProfilePage.tsx`: profile layout and read-only account email.
- `src/app/paths.ts`, `routes.tsx`, `navigation.ts`: profile route, preserved account route and page context.
- `src/features/auth/AuthAccountControl.tsx`: primary profile link and active state.
- `tests/studentProfile.test.mjs`: validation, ownership and protected route coverage.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: **215 passed, 0 failed, 0 cancelled**.
- `npm run build`: passed; existing large 3D chunk warning remains.
- Existing simulation preservation check: **87 files compared by SHA-256, 0 changed**.
- Live database privileges were inspected: student UPDATE privileges remain limited to `full_name` and `grade`.
- Published to the existing Vercel production project, deployment `dpl_HyaEB66LxK4Ns53k326EEdcEbkPk`, confirmed READY.

No required dependencies are missing: T10 real authentication, its protected profile service, shared grade definitions and UI components are present. Automated tests use explicit unit/SSR fixtures only, not application accounts or mock sessions in the product.

## Production browser verification

Using one synthetic student account, authorized by the owner for live testing:

- Anonymous direct `/profile` redirected to Login.
- The profile displayed the actual registered name, email and First Secondary Grade.
- Empty names produced a field-specific error and focused the name input.
- Saving a changed name and Third Secondary Grade showed disabled controls while pending, followed by confirmed success feedback.
- Reload restored the updated name and grade. A direct database read also confirmed `STEM T11 Updated Student` and `grade-secondary-3`.
- `/account` still displayed the same saved profile.
- A 390 × 844 viewport displayed the form and account information without horizontal clipping. The viewport override was reset afterward.
- The test account was signed out and the protected account page returned to Login.

Screenshots are in the ignored `artifacts/t11-profile-desktop.png` and `artifacts/t11-profile-mobile.png` files. The synthetic account remains labeled with the T11 test name; no password was saved in project files. Email editing remains unavailable and Choose Grade content is outside T11.
