# L9 — Guided Mode, Free Mode & Mistake Detection

## Modes

The lab header has a **Guided / Free** switch.

|                   | Guided (default)                                                                                                                                                             | Free                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Steps**         | The experiment's steps are followed in order: the step card, hints, highlights (existing `ContextualInstruction`, `ExperimentGuide`, affordance hints) and the progress bar. | No steps or progress bar; the header says "Free mode · no steps — safety rules still apply". |
| **Inventory**     | Experiment items, with "Show all lab equipment" available.                                                                                                                   | All 60 catalogue items.                                                                      |
| **Wrong actions** | Every rejected action shows the workflow's explanation, as before, and is recorded as a **step mistake**.                                                                    | Step mistakes are not recorded.                                                              |
| **Safety rules**  | Active.                                                                                                                                                                      | Active.                                                                                      |

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
