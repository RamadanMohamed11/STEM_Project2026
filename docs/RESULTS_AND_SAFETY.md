# Experiment Results & Contextual Safety Warnings (Task T24)

## Overview

Task T24 enhances how secondary school students review experiment results and receive contextual safety warnings while performing chemistry activities in the **STEM Virtual Lab**. All results and safety states derive directly from the existing authoritative simulation engine (`useSaltSimulationStore`, `useLabSceneStore`, `saltExperimentDefinition`, and `workflow.ts`) without introducing duplicate state stores or secondary scientific calculation systems.

---

## 1. Experiment Results Experience

### Authoritative Results Selector (`src/features/simulations/lib/resultsSummary.ts`)

`getExperimentResultsSummary` is a pure, side-effect-free selector that transforms the live simulation state into a structured `ExperimentResultsSummary` across five availability phases:

1. **Not Started (`not-started`):**
   - Displayed when an interactive 3D lab exists (`exp-salt-water-001`) and no actions, placements, or steps have been started (`0 of 9 steps validated`).
   - Shows `No Experiment Results Yet`, a `Not Started` status badge, and unrecorded measurement placeholders (`Water Used: Not recorded yet`, `Salt Added: Not recorded yet`).
   - Never fabricates measurements or claims final conclusions (`finalConclusions: []`).

2. **In Progress (`in-progress`):**
   - Displayed when the student has begun the experiment (`started === true`) but has not yet completed all 9 validated steps (`completed === false`).
   - Shows `No Experiment Results Yet — Experiment In Progress` with an `In Progress` status badge, current step count (`X of 9 steps validated`), **Available Measurements So Far** (e.g., recorded `100 mL` water volume while salt mass is still `Not recorded yet`), **Procedural Progress & Student Actions** (completed, current, and pending steps), and **Current Simulated State**.
   - Explicitly locks final scientific conclusions until all 9 steps are validated in the 3D laboratory.

3. **Completed (`completed`):**
   - Unlocked only when the authoritative workflow reducer sets `workflow.completed === true`.
   - Renders `ExperimentResults` (`src/features/simulations/components/ExperimentResults.tsx`) with clearly separated sections:
     - **Simulated Measurements & Recorded Quantities:** `Water Used` (`100 mL`), `Salt Added` (`5 g`), `Final Beaker Volume` (`100 mL`), and `Dissolved Solute` (`5.00 g`, `0.00 g` solid remaining).
     - **Simulated Observation:** Homogeneous, transparent aqueous solution with no visible solid $\text{NaCl}$ crystals remaining, explicitly labeled as a software model observation.
     - **Scientific Principle & Explanation:** Physical dissolution of $\text{NaCl}$ in $\text{H}_2\text{O}$ where existing $\text{Na}^+$ and $\text{Cl}^-$ ions separate from the crystal lattice and disperse evenly in the solvent without forming a new chemical substance.
     - **Verified Student Actions:** Ordered step-by-step summary of the 9 validated actions performed by the student.
     - **Final Educational Conclusions:** Key chemistry takeaways for secondary school students.
     - **Model Assumptions & Scientific Scope:** Explicit disclosure of the $35.9\text{ g / 100 mL}$ solubility ceiling, $4\text{ g}$ per stirring action teaching rule, and deterministic tared balance model.

4. **Unavailable (`unavailable`) & Session Out of Sync (`incompatible`):**
   - Safe fallbacks for planned experiments without a 3D lab (`exp-volume-002`, `exp-ph-003`) or mismatched definition versions.

---

## 2. Contextual Safety System & Warning Levels

### Pure Safety Selector (`src/features/simulations/lib/contextualSafety.ts`)

`getContextualSafetyState` derives contextual safety notices from the current experiment's `SafetyMetadata`, `definition.safetyRules`, `workflow` step and acknowledgement state, active apparatus selection/hover, and `WorkflowValidation` / `feedback` rejections.

It supports four reusable warning levels (`SafetyWarningLevel`):

| Level | Badge Label | Purpose & Triggers |
| :--- | :--- | :--- |
| `'info'` | `General Information` | General lab safety awareness, post-experiment cleanup reminders, and software model scope notes (`observe`, `review`, `completed`). |
| `'caution'` | `Be Careful` | Step-specific safe handling reminders during active procedure steps (`place-beaker`, `measure-water`, `transfer-water`, `measure-salt`, `add-salt`, `stir`). |
| `'warning'` | `Important Safety Warning` | Unacknowledged mandatory safety rules at the start of the lab (`prepare`) or higher-risk experiment precautions. |
| `'blocked'` | `This Action Is Not Allowed` | Triggered when the simulation engine rejects an invalid, out-of-order, or unsupported student action (`SAFETY_REQUIRED`, `BOAT_NOT_ON_BALANCE`, `WRONG_TARGET`, `WRONG_EQUIPMENT`, `WRONG_SOLID_ROUTE`, incompatible hover target, etc.). |

### Presentation Components (`src/features/simulations/components/SafetyNotice.tsx`)

- **`ContextualSafetyAlert`:** Renders any `ContextualSafetyNotice` with level-appropriate icons (`Info`, `AlertTriangle`, `ShieldAlert`, `Ban`), ARIA roles (`status` or `alert`), clear secondary-school English explanations, actionable guidance (`What to do`), and keyboard-accessible dismiss buttons so warnings never permanently block the 3D viewport.
- **`SafetyNotice`:** Displays experiment-level safety considerations, active contextual notices, and the experiment's safety rules checklist.
- **3D Laboratory Integration:** Integrated into `ExperimentGuide.tsx`, `ContextualInstruction.tsx`, and `ExperimentResultsPage.tsx` without mutating scientific quantities or obstructing 3D canvas interactions.
