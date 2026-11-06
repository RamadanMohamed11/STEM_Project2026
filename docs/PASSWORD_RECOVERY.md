# Password recovery UI — T09

Routes: `/forgot-password` and `/reset-password`, both public in the existing shell.
Login links to recovery; both forms link back to Login. Navigation highlights Login
and supplies page-specific labels. The existing Vercel rewrite is unchanged.

New components:

- `PasswordRecoveryPage`: shared responsive page layout and titles.
- `RecoveryForm`: email/reset variants, submit validation, first-error focus,
  duplicate-submit guard, and an unavailable notice after valid local input.
- `PasswordField`: independently controlled Show/Hide controls and new-password
  autocomplete. Values remain in the form, not application or browser storage.
- `AuthFeedback`: accessible loading, general error, success and unavailable states.
- `AuthFieldError`: linked, announced field errors.

`features/auth/recovery.ts` contains pure validation and a future provider interface.
Email is required and format/length checked. New passwords require 8–128 characters,
reject whitespace-only values, and must match the confirmation exactly. Passwords
are not trimmed or placed in URLs. No provider method is implemented or invoked.
The future provider must establish a verified recovery session before changing any
password; the page does not read or create tokens from query strings or fragments.
The exported account-neutral acceptance message is reserved for a real accepted
provider request and is never displayed by these prototype forms.

The checking state disables fields/submission and announces loading. General errors
use an alert; other feedback uses status announcements. Current pages use unavailable
state, not a fake network delay or success. Valid input disables repeated submission;
editing a field permits another validation check. Errors are checked on submit so
blur-time layout changes cannot interrupt a pointer click on the submit button.

Files changed: route paths/tree/navigation and the existing LoginForm recovery link.
No scientific simulation files, dependencies or backend services were changed.

Verification: final TypeScript, lint, production build, targeted formatting, and all 199 serial Node tests passed. Browser checks covered required email errors, password mismatch, Show/Hide,
unavailable notices, disabled submit, Back to Login and the Login recovery link.
A 320px viewport check found no horizontal overflow. Loading/error/success patterns
and direct links are also covered by static-render tests. No actual recovery request
or password update was attempted. The existing large 3D bundle warning remains.
