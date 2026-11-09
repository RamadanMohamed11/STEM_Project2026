# I17 — Non-lab accessibility audit

9 November 2026. Target: WCAG 2.1 AA. This is an engineering audit, not a conformance certification. English content, authentication/data logic and the 3D scene are preserved. No dependencies were added.

## Findings and fixes

| Page | Issue | WCAG criterion | Fix |
| --- | --- | --- | --- |
| Shared theme; auth, grade/term, catalog, admin | Teal text / white-on-teal failed normal-text contrast in some uses | 1.4.3, 1.4.11 | Teal changed from `#138b85` to `#0e7772`; contrast now 5.38:1 against white, 4.97:1 against canvas, 4.75:1 against teal-soft. Reviewed token usages, including white button labels, borders, active navigation, focus outlines and decorative accents. |
| Safety activities/checklist | Success text on teal-soft fell below 4.5:1 | 1.4.3 | Success changed from `#1e8062` to `#196f55`. Regression test checks semantic foregrounds against their supported light surfaces. |
| Shared header | Small caption at `text-ink/65` measured 4.38:1 | 1.4.3 | Increased caption to `text-ink/75`. |
| Auth, catalog and admin forms | Light field borders were not distinguishable at 3:1 | 1.4.11 | Light-page input/select/textarea borders use `#74838d`; placeholders use slate at full opacity. Disabled/invalid controls and the immersive workspace are excluded so error borders remain intact. Empty keyboard-submitted login retained `aria-invalid`, `aria-describedby="email-error"` and the danger border in the browser. Decorative separators retain their light tokens. |
| All non-lab routes | SPA transitions changed title without announcing the resolved page | 4.1.3, 2.4.2 | Persistent polite, atomic route-title status observes title updates, including lazy page resolution. Lab routes are excluded. Existing Skip to main content link is retained. |
| Tool notes in experiment details / Safety | Focus did not enter, stay in, or return from the custom popover | 2.1.1, 2.4.3, 4.1.2 | Shared `FocusDialog` enters the panel, wraps Tab/Shift+Tab, handles Escape before page shortcuts and returns focus to the invoking control. Modal semantics retained explicitly; dialog title is named without an arbitrary h4 heading. |
| Admin Students / Reports detail dialogs | Custom modal dialogs lacked keyboard focus lifecycle | 2.1.1, 2.4.3, 4.1.2 | Reuse `FocusDialog`; dialog headings start at h2 with h3 subsections. Authorized browser-session verification remains pending. |
| Student / admin mobile navigation | Native dialog Tab cycling could leave the document for browser chrome | 2.4.3 | Explicit shared boundary wrapping supplements native `showModal`; Escape and native focus return remain. Student drawer passed 30 consecutive Tabs and Escape return in Chromium. |
| Choose Grade | Grade cards skipped from h1 to h3 | 1.3.1 | Card headings changed to h2 without text/style changes. |
| Quiz / immediate feedback | Question changes and practice completion lacked dedicated announcements | 4.1.3 | Short polite status text announces the current question and the existing practice percentage. No scoring or answer logic changed. |
| Quiz review | Opening review removed the invoking button without establishing a reading position | 2.4.3 | Focus the review h2 once when the review screen mounts; the heading is programmatically focusable without adding a Tab stop. |
| Direct lab-results page | New empty selector arrays in `MistakesSummary` and `RecordedMeasurements` caused a React external-store update loop and blank page before an experiment session existed | 1.3.1, 2.1.1 | Reuse stable private empty arrays in these UI selectors. Direct route now renders its h1, named navigation and empty summary. Recorded values, session/store logic and scientific operations are unchanged. |

## Contrast scope

Foreground tokens navy, ink, slate, teal, teal-dark, success, danger and info pass 4.5:1 on white/canvas/teal-soft; warning-dark passes on warning-soft. These pairs are tested in `tests/uiContrast.test.mjs`. Teal-light is a dark-surface/decorative accent, warning is a decorative accent, and line tokens are separators; they are not approved as small text on white. The field-boundary pair is tested at 3:1.

Rendered text scan across 12 public pages found no remaining failures in measured solid-background pairs after fixes. It composites alpha colors and handles Tailwind's `oklab` colors using browser canvas conversion. Gradient/image backgrounds, opacity effects, closed/disabled controls, all hover states and protected admin content are not exhaustively measured. This is not an axe or assistive-technology conformance report.

## Verification evidence

- Browser: supported Playwright CLI skill; native keyboard events and Chromium accessibility snapshots (`ariaSnapshot`, the available equivalent of `read_page`). No axe/runtime package installed.
- Route trees: Home, four auth pages, Safety, Grade, Term, catalog, details, quiz/results, Progress and signed-out admin guards. Initial results-route scan exposed the update loop above; after fixing both selectors, the direct empty-state results route rendered its h1 and navigation in the browser. Learning stages are embedded in Details; `/learn` is not a valid route and is not counted as a learning-stage test.
- The scanned states had named visible buttons and no `<img>` without alt. Choose Grade's heading skip was fixed. Existing meaningful illustration names and decorative `aria-hidden` SVGs were retained.
- Actual keyboard tests: five learning stages forward/back; grade navigation and route-title status; Tab traversal and labels on login/signup/recovery/reset forms; tool-note entry, repeated Tab/Shift+Tab containment, Escape/return; native student drawer 30 Tabs and Escape/return. Sign-in/signup/recovery service operations were not submitted during this audit.
- Built preview quiz: all six questions answered through radio Space and Next Enter; review and practice feedback rendered using the actual grading flow, with no injected answer/result records. Initial selectors were refined for two identically named Review buttons and the tool's full catalog name; failed selector waits were not counted as passed checks.
- Final preview retest completed six answers → Review → Submit → Your Score using Space/Enter, and confirmed the review heading receives focus. Safety PPE, emergency/quick-check answers and acknowledgement checkboxes were operated with Space/Enter, followed by Grade → Term → the context-filtered experiment library. Answer choices came from existing safety data and were selected through real controls, not injected state. Evidence: `output/playwright/i17-safety-grade.json`. The first URL assertion expected `/curriculum`; the actual supported destination is `/experiments?grade=…&term=…`, subsequently verified with both context values.
- Existing reduced-motion CSS suppresses repeating animation and transition durations; celebration and score components already have reduced-motion rules. Browser emulation is not a physical assistive-technology review.
- Evidence: ignored `output/playwright/i17-audit.json`, `i17-keyboard.json`, `i17-contrast-final.json`; ignored `artifacts/i17-*` logs. Initial regex-only contrast parsing produced false positives with modern CSS colors and was replaced; only the final canvas-normalized report is used.

## Open acceptance checks

The owner confirmed no admin account exists yet. No account/role changes were made. All six signed-out guards were read; protected CRUD, publication, Students/Reports dialogs and sign-out have source review and existing automated tests, not completed authenticated keyboard flows. Full successful auth/recovery service flows, populated scientific results states, real screen-reader announcements and exhaustive gradient/state contrast still need manual verification. Do not mark every listed page keyboard-complete or claim full WCAG AA conformance from this audit alone.

## Checks

Final broad regression: **485/485 passed**, zero failures/skips/cancellations, 205.8 seconds (`artifacts/i17-tests-final.log`). After the final review-heading focus change, **21 focused tests passed** (`artifacts/i17-last-focused.log`), plus the real preview keyboard retest above. TypeScript, ESLint, production build and diff whitespace checks passed. Existing large-bundle warnings remain. No Git push or deployment was performed.
