# T35 QA checklist

Audit date: 7 November 2026. Starting revision: `8778975addbc3c094526cd18d3b21bef989fa2ea` plus the T35 working tree. No simulation engine, database schema, authentication setting, or dependency was changed by T35.

## Architecture and ownership

- [x] Review `src/app/routes.tsx`, route helpers, public student boundary, protected profile and admin boundaries.
- [x] Review Supabase configuration, `AuthProvider`, `authService`, verified role/permission checks, database grants and migrations.
- [x] Review curriculum, experiment and assessment repositories, published student selectors and sample fallback behavior.
- [x] Review details, immersive lab, results, quiz and local progress state ownership.
- [x] Preserve the salt registry, scientific calculations, workflow evidence and Three.js rendering code.

## Student journey

- [x] Browser: Home → signup validation → login/recovery navigation.
- [x] Browser: real signup → Safety; no automatic checklist completion.
- [x] Browser: required safety feedback, six explicit acknowledgements, grade and term selection, units, lessons and assigned planned experiments.
- [x] Browser: catalog search, URL state, refresh, Back/Forward and details.
- [x] Browser: planned experiments have no playable lab action; unknown IDs fail safely.
- [x] Browser: salt details → lab → details → continued lab retains measured water.
- [x] Browser: practice answers, unanswered confirmation, submission, real score, explanations, results and retake.
- [x] Browser: progress records real practice activity locally; refresh loses detailed quiz review honestly.
- [x] Automated: verified full scientific workflow → experiment results; false/forged completion rejected.
- [ ] Full nine-step workflow repeated manually in a browser during T35. Browser exercised the water-transfer portion; automated tests cover solids, weighing, stirring and completion.

## Security and accounts

- [x] Two separate real SDK student accounts: registration, profile trigger, grades, login/logout, restoration, invalid password, cross-student read/update denial.
- [x] Metadata requesting `admin` still creates a database-authorized `student`.
- [x] Invalid grades and protected profile timestamps rejected by PostgreSQL.
- [x] Student content mutation and role escalation rejected.
- [x] Five transaction/rollback database suites: profiles, roles, curriculum, experiments, question bank.
- [x] Browser: real profile save/reload, login/logout; anonymous and authenticated student denied admin routes.
- [x] Only disposable T35 fixtures removed; cleanup checked by IDs/fixture marker or exact reserved test email/name.
- [x] Public environment configuration and generated bundle reviewed for secret/service-role credentials.
- [ ] Authorized administrator browser CRUD and responsive admin tables: no administrator browser session used or privileges granted for QA.
- [ ] Real mailbox recovery/reset/confirmation delivery: not exercised; email confirmation remains disabled under the owner's existing decision.

## Responsive, accessibility and performance

- [x] 1440×900, 1366×768, 768×1024, 390×844: signup, details, quiz, lab; no document horizontal overflow, labelled native fields, viewport-filling lab.
- [x] Browser camera orbit, camera reset, equipment placement, dual selection, numeric water transfer and session return.
- [x] Required-field focus, short errors, password visibility, semantic headings/navigation, labelled controls and native keyboard-capable inputs reviewed.
- [x] Shared primary/outline button contrast corrected and tested against normal-text 4.5:1 threshold.
- [x] Global visible-focus and reduced-motion CSS reviewed.
- [x] Production build: heavy 3D chunk deferred, initial compressed JS budget checked.
- [ ] Full screen-reader certification, automated axe scan, reduced-motion browser emulation, hardware-device touch testing, GPU memory/FPS profiling. No WCAG compliance or device performance guarantee is claimed.

See [TEST_RESULTS.md](TEST_RESULTS.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and [RELEASE_READINESS.md](RELEASE_READINESS.md) for evidence and limitations.
