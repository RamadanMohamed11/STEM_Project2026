# L9 — Guided Mode, Free Mode & Mistake Detection

## Modes

The lab header has a **Guided / Free** switch.

|                   | Guided (default)                                                                                                                                                             | Free                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Steps**         | The experiment's steps are followed in order: the step card, hints, highlights (existing `ContextualInstruction`, `ExperimentGuide`, affordance hints) and the progress bar. | No steps or progress bar; the header says "Free mode · no steps — safety rules still apply". |
| **Inventory**     | Experiment items, with "Show all lab equipment" available.                                                                                                                   | All 60 catalogue items.                                                                      |
| **Wrong actions** | Every rejected action shows the workflow's explanation, as before, and is recorded as a **step mistake**.                                                                    | Step mistakes are not recorded.                                                              |
| **Safety rules**  | Active.                                                                                                                                                                      | Active.                                                                                      |

## I1 — Pausing and resuming the salt workflow (10 November 2026)

Free mode shows **"Free mode: guided steps are paused."** at every viewport width. The pause is enforced in the authoritative salt store, not only by hiding the steps.

- `emit` and manual `dispatch` cannot validate steps, acknowledge workflow safety, record measurements/observations, add event evidence or complete the experiment in Free mode. The entire workflow checkpoint and validation stay unchanged.
- Physical commands, held pours and smart transfers still use the existing quantity/conservation/capacity checks and chemistry reducers. Their Free-mode path changes the physical state only; it skips guided order/portion prerequisites and never creates guided receipts. Existing unsupported material routes and solution-partitioning restrictions remain unsupported.
- Practice liquid pouring, heating, instruments, measurement logging and the safety-rules engine remain independent and active. A physical balance contact in Free mode can show the actual load without counting as a guided measurement.
- Guided → Free preserves the current step, recorded measurements and accepted evidence. Mode changes stop held streams/effects and cancel active smart transfers into their existing safe-return phase, retaining delivered quantities. A transfer that crosses a mode boundary cannot later issue a guided completion receipt.
- If a guided transfer had already filled its cumulative target before safe return recorded the result, switching modes offers Reset instead of silently accepting that result or leaving the saved step stuck with a full receiver. The saved step and its measurements still do not change.
- Free → Guided resumes at exactly the saved step if salt chemistry/checkpoint and previously placed equipment needed by that step still agree. Adding or moving practice equipment alone, or removing a tool needed only by a later step, does not invalidate the saved workflow.
- If salt chemistry changed (including operation evidence) or previously placed equipment needed by the saved step is missing, Guided mode shows **"The bench changed in Free mode"** and **"Reset experiment"**. It does not infer or auto-complete any step from the current bench. Guided scientific/workflow actions remain blocked until the student explicitly uses the existing unified experiment reset. Reset clears both the saved workflow and its conflict state; toggling modes, opening a supporting page or returning to the lab does not reset it.

I3 preserves the pause and conflict state in this tab's validated sessionStorage snapshot. Refreshing restores the exact guided checkpoint; it never catches up from Free-mode actions. No chemistry constants, step definitions, safety-rule calculations, backend services or dependencies are changed.

Verification:

- `tests/freeModeWorkflow.test.mjs`: **12 passing Node tests** covering paused dispatches/events/validation, an entire Free-mode salt activity, free physical transfers and capacity checks, held pouring, unchanged resume, conflict/reset, equipment removal, both directions of in-flight mode switching (including completed flow before its receipt), and independent practice/safety/measurement behavior.
- Full repository suite: **497 passed, 0 failed, 0 skipped**. Typecheck, lint and production build passed. The existing Three.js deprecation and large-chunk build warnings remain.
- Actual Chromium keyboard checks against the final production build at **375×812** and **1440×900**: Free-mode notice visible, unchanged mode switches resume, a real 10 mL Free-mode smart pour leaves guided progress at 0/9, Guided mode shows the conflict/reset action, and keyboard reset restores the safety step and initial quantities. No horizontal overflow or page errors. This is local verification, not a production deployment.
- Evidence: `output/playwright/i1-browser.json`, `i1-{375,1440}-accessibility.txt`, and screenshots `i1-{375,1440}-free.png`, `i1-{375,1440}-resume-conflict.png`, `i1-{375,1440}-reset.png`. The phone screenshot wraps the conflict message above a 44px reset button; the desktop screenshot keeps the pause note in a thin row under the header and the lab viewport filled.
- Required `python tests/browserSmartTransfers.py` was run against the final frozen source after warming its unchanged Vite dependency cache. The **selection/cancellation case passed (45 assertions)**. The **full decimal UI workflow reached verified completion (185 assertions, two non-fatal stream-render failures)**: `material-transfer-2` (insufficient animated-stream samples) and `material-transfer-4` (stream observed outside the flow window). These are the pre-existing render-timing checks documented in KNOWN_ISSUES.md, not workflow/scientific-state failures; the renderer was not changed. The reset-mid-operation case then hit the harness's **840-second audit / 900-second task budget**, so that case and a repeat workflow are **not verified by this final run**. The overall browser suite is **not a pass**.
- Final-run evidence: `artifacts/i1-smart-transfers-final.log`, `artifacts/smart-balance.png`, `artifacts/smart-transfer.png` and `artifacts/smart-final.png`. The run ended before writing a fresh summary/observation export; `smart-summary.json`, `smart-observations.json` and `smart-reset.png` are older artifacts and must not be presented as this run's evidence. Earlier attempts included startup timeouts and an interrupted run during system memory pressure; none is counted as a passing suite. The focused final-build UI test above separately verified reset and the new Free/Guided flow at both widths; Node tests cover reset/stale operations and in-flight mode switching.

## Safety rules engine (data-driven)

- The model is pure: `lib/safetyRules.ts`.
  - Lab actions are described as a `SafetyAction`: `pour`, `dip` (pH paper), `light` (a burner) or `heating` (each heated tick).
  - `evaluateSafety(rules, action, { goggles })` returns the violations.
- The rules are data: `data/safetyRules.ts`. Each rule has a T41 hazard id, a severity, an explanation of the correct practice, an optional L6 effect, and a declarative condition.

| Rule                               | Condition                                                              | Effect    |
| ---------------------------------- | ---------------------------------------------------------------------- | --------- |
| Water added to a concentrated acid | A liquid poured into a substance marked `concentrated`                 | heat      |
| Corrosive liquid without goggles   | Pouring or dipping into a `corrosive` substance while goggles are off  | —         |
| Lighting a flame without goggles   | Lighting a burner while goggles are off                                | —         |
| Incompatible chemicals mixed       | Source and target substances list each other in `incompatibleWith`     | smoke     |
| Heating an empty glass vessel      | Lighting a burner under an empty vessel                                | —         |
| Heating a closed container         | Lighting under, or heating above 80 °C, a container with `open: false` | explosion |
| Vessel boiled dry                  | The liquid ran out during a heated tick                                | —         |

- The `SubstanceDefinition` fields `concentrated` and `incompatibleWith` (L1 types) let new experiments trigger these rules from data alone.
- **Goggles** come from the Safety page's "Get Lab Ready" activity (`useLabReadinessStore`, kept for the browser session), or from the **Goggles** toggle in the lab header.
- **Hot-surface touches** (L7) are recorded as safety mistakes too.

## Alerts and the record

- A broken rule:
  - shows the **safety alert**: the hazard label, what went wrong, the right practice and the T41 precautions, plus **Put on safety goggles** when relevant;
  - plays the rule's L6 effect on the vessel;
  - is recorded in `useLabSafetyStore`, once per rule and item (repeats are counted).
- Continuous heating checks alert only the first time.
- **Completion summary:** `ExperimentResults` ends with **Mistakes and safety alerts**, grouped into Safety and Procedure steps, each with its explanation. The results page shows the same section while the experiment is still in progress.
- Restarting the experiment clears the record, and another experiment starts a fresh one.

## Verification

- `tests/labSafety.test.mjs` (6 tests) covers:
  - the rule data is valid;
  - acid-to-water versus water-to-acid;
  - the goggles rules for pouring, dipping and lighting;
  - incompatible chemicals;
  - empty, closed and boiled-dry vessels (a vessel never filled does not count as "boiled dry");
  - store de-duplication, counts, alerts, effects and modes;
  - bench integration: acid without goggles, an empty beaker on a lit burner, and boiling dry.
- **Browser**, with real clicks:
  - **Free** hid the steps and progress bar, and the inventory listed all 60 items.
  - **Pour 1 mL** of HCl with no goggles raised the alert. **Put on safety goggles** switched the header to "Goggles on".
  - **Light bunsen burner** under the empty beaker raised "Heating an empty glass vessel", with no goggles alert.
  - Recording the water before the cylinder was filled was rejected with the workflow's message and recorded as a step mistake. This rejected action was sent from JS.
  - The results page listed the mistakes.
- **Found and fixed during the check:**
  - an empty vessel heated without limit and was tagged "boiling" (it is now capped at 300 °C and tagged "heating");
  - the 3D name tags drew over the alerts (their z-index range is now capped below the panels).

## I15 — Compact mobile header (9 November 2026)

Below `sm` (640px), the header shows Inventory and **Lab options** beside the existing Back link and title. The non-modal popover reuses the tool-note popover's Escape/outside-click pattern. It contains the existing Guided/Free radiogroup, goggles toggle, selected container's `ParticleViewButton`, data-log action and other header actions. Control names, pressed/checked states and store actions are preserved. Controls are at least 44×44px; focus enters on opening, Escape returns it to the trigger without cancelling bench selection, and Tab/outside clicks close the panel. Resizing to `sm` closes it.

At `sm` and above, the existing controls remain inline in their original order. The title is truncated rather than wrapped; the read-only progress/free-mode description appears from `lg` to leave room at 768px. The mobile header's z-index is 25: above 3D labels (0–19), below safety alerts (30). Bench controls are hidden while options are open to avoid overlap; the live bench description stays mounted.

Verified in a real Chromium browser through Playwright CLI at **375, 768 and 1440px**: no horizontal page overflow, header buttons within its bounds, keyboard opening/toggling/closing/Tab exit, focus restoration, state across breakpoints, data log and particle view. The salt lab rendered and a real 100mL water transfer advanced its validated workflow to the pouring step. All **484 tests**, TypeScript, lint and production build passed; the existing large-chunk build warning remains. Computer Use's startup error persisted, so these screenshots/checks use the Playwright skill instead. These viewport checks are not physical-device or screen-reader certification.

Screenshots: `output/playwright/i15-375-header.png` (two primary controls), `i15-mobile-options.png` (open menu and particle-view state), `i15-768-header.png` (tablet inline controls), `i15-1440-header.png` (desktop inline controls). Browser assertions: `output/playwright/i15-browser-report.json`. No store logic, simulation scene or dependency changes.

Production: `dpl_GDj9iN5S95KS3dHe8zM9mLHrqBeJ` reached READY on the existing `stem-project2026` project and <https://stem-project2026.vercel.app>. Source payload: 366 files, SHA-256 `2084d44d13d4ffc30b92f2d6886afa42afe7ce87b386ba29a5f09ae8ca6e2792`. The same responsive/keyboard browser assertions passed on the public production lab, with zero console errors. Screenshots above show that production release. Existing Three.js deprecation warnings remain.

## I3 — Same-tab refresh recovery (10 November 2026)

- One guarded, versioned `sessionStorage` envelope per experiment keeps the measurement log, mistakes/mode, placed equipment/transforms/snaps, practice contents/temperatures/lit burners and salt chemistry/workflow/evidence together. The current interactive adapter is salt dissolution; unrelated or unregistered experiment data cannot hydrate these stores.
- The full salt state is plain data, so its exact step/stage, checkpoint, measured values, command/event evidence, completion flags and Free-mode conflict boundary can be saved safely. Hydration never advances a step. Stored completion is checked against the existing workflow engine. Restored transfer receipt IDs/sequences are reserved before another transfer can start.
- Effects, active pours/transfers, selection, alerts, camera/drag state, undo history, particle view and open panels are not restored. Saved practice quantities are retained with vessels upright. A refresh during a guided transfer retains delivered chemistry and the saved step but shows the existing paused-workflow notice with **Reset experiment**; it never manufactures a transfer receipt. An interrupted manual drag restores the last confirmed layout.
- Bench clocks stop when leaving the lab; supporting pages no longer destroy practice contents. Refresh resumes from saved temperatures, without offline heating or offline reactions. Lit burners are restored. The stopwatch restores paused at its saved reading; automatic recording is off.
- **Reset experiment** cancels pending saves while clearing its stored slot. A successful **Reset bench** also deletes that slot and cancels its pending write; a hot-item-blocked reset leaves the saved slot intact. A later student action may create a new snapshot. Reset bench retains its existing in-memory workflow semantics; it is not a second workflow restart.
- A small dismissible **“Your lab session was restored.”** status appears after a valid load. No completion, training certificate or account record is inferred from restoration.
- Snapshots are captured at most once per second, including while heating or running the stopwatch. The most recent second may be lost on sudden reload/crash. All storage access is guarded; private mode/quota errors fall back to memory. Obsolete schemas, mismatched definitions and malformed data start fresh. No localStorage, account data, backend, dependencies or chemistry rules are added.
- A normal new tab starts fresh. Browser session recovery, “reopen closed tab”, or tab duplication can retain/copy sessionStorage according to browser behavior; this is not permanent application storage. See `MEASUREMENTS.md` for storage/measurement details.

I3 verification:

- `tests/labSessionPersistence.test.mjs`: 17 Node tests cover all five store round trips, corrupt JSON/schema/definition/experiment mismatches, invalid nested state, action-injection protection, 1 Hz writes, an idle running stopwatch, storage getter/read/write/remove failures, both reset paths (including hot-item-blocked reset), restoration/dismissal, Free-mode pausing, interrupted transfers and a restored workflow reaching real completion with unique transfer receipts.
- Real Chrome/Playwright at **1440×900 and 375×812**, using rendered controls for all actions: confirm safety/preplaced beaker and complete the 100 mL cylinder transfer (**three validated steps**); switch Free; pour 10 mL from a wash bottle to a practice beaker; snap burner and vessel to a tripod; light without goggles to trigger a real safety mistake; heat above 23°C; record two thermometer readings; refresh. Exact workflow/chemistry/evidence, log rows, mistakes, mode, placed IDs/transforms/snaps, quantities and lit burner were restored. Saved temperature resumed heating; transient alerts/panels stayed closed. The notice dismissed by keyboard. Back to Details/browser Back retained state; returning Guided retained the saved step. Closing the page and opening a new page in the **same browser context** started a fresh lab. No page errors or horizontal overflow.
- Screenshots `output/playwright/i3-1440-restored.png` and `i3-375-restored.png` show the narrow restored-status strip below the existing header, the retained bench/100 mL cylinder and the heated practice beaker. Fresh-tab screenshots show the starting bench. Assertions/accessibility snapshots: `output/playwright/i3-browser.json`, `i3-1440-accessibility.txt`, `i3-375-accessibility.txt` (ignored local artifacts). Early audit attempts stopped on test locators; the final run passed both viewports. These are software-rendered desktop browser checks, not a physical-device/FPS certification.
- Final checks: TypeScript, ESLint and production build passed (existing large-chunk warning); **529/529 Node tests passed**, 0 failed/skipped, 182.2s. The required `python tests/browserSmartTransfers.py` ran for **844.86s**: **248/251 assertions passed**, with three known **“no stream outside transfer flow”** timing failures at `material-transfer-2`, `-4`, `-12`. Selection/pointer cancellation passed all 45 assertions, the 185-assertion decimal workflow reached engine-verified 100 mL + 5 g completion, and mid-operation reset/stale tick protection passed all 16 assertions. Repeating the full workflow after reset was explicitly skipped by the harness's time budget. The suite exited **1**, so it is not reported as a pass. Zero page errors, unchanged source hashes during the run, and server/port cleanup succeeded. Evidence: `artifacts/i3-smart-transfers.log`, `artifacts/smart-summary.json`, `smart-report.md`, `smart-observations.json`, `smart-*.png` (ignored local artifacts). No push or deployment.
