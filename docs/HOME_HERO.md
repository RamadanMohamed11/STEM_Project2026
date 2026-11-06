# Chemistry Home Page Hero — Task T05

Audit date: 6 November 2026. Scope: **Task T05 only**.

## 1. Summary of the Design

Task T05 implements a modern, welcoming, and educationally focused chemistry hero section for the **STEM Virtual Lab** home page. Designed specifically for secondary school students, the hero establishes an inspiring first impression:

- **Headline:** *"Discover Chemistry Through Experiments"* — direct, friendly, and motivational.
- **Supporting Text:** *"Explore chemistry in a new way. Learn how experiments work, use lab tools in a 3D environment, and understand science step by step."*
- **Feature Chips:** Quick visual pills highlighting *"Full 3D Virtual Lab"*, *"Step-by-Step Guidance"*, and *"Safe Chemical Practice"*.
- **Action Buttons:**
  - **Primary:** *"Get Started"* (`size="lg"` with arrow icon), routing directly to the student entry point (`/signup`).
  - **Secondary:** *"Explore Experiments"* (`variant="secondary"`, `size="lg"` with flask icon), routing to the experiments library (`/experiments`).
- **Student Reassurance:** Clear subtext confirming: *"Interactive science education for secondary school students · No installation required"*.

## 2. Components Created

- **`ChemistryHeroBanner` (`src/features/home/components/ChemistryHeroBanner.tsx`):**
  - Custom, high-precision SVG/CSS visual banner depicting an authentic chemistry laboratory setting.
  - Features:
    1. **Erlenmeyer Conical Flask (Center):** Calibrated markings (200 mL), dual-tone liquid gradient (`#138b85` to `#0d6f6a`), curved meniscus line (`#76d5cb`), glass reflection glints, and effervescent chemical reaction bubbles.
    2. **Glass Beaker & Stirring Rod (Left):** Cylindrical body with pouring spout, 100 mL and 150 mL volume lines, glass stirring rod, and settling solute particles.
    3. **Graduated Cylinder (Right):** Precision column with heavy base, millimeter tick marks, meniscus reading at 100 mL, and amber-tinted calibrated solution.
    4. **Molecular Structure Lattice (Top Right):** Hexagonal bond network with $Na^+$ and $Cl^-$ atomic nodes representing dissolution chemistry.
    5. **Measurement Badge (Center Left):** Translucent floating callout displaying $H_2O + NaCl$ with solute mass (5.0 g).
    6. **Status Footer:** Dynamic indicators for real-time reactions and calibrated laboratory tools.

## 3. Assets Used

- **Lucide React Icons:**
  - `FlaskConical`: Experiment & lab representation.
  - `ArrowRight`: Direct call to action indicator.
  - `CheckCircle2`: Feature checklist pills.
  - `Sparkles`: Welcome chip and calibrated tool highlight.
  - `Atom`: Molecular and chemical badge icon.
- **Pure Vector Artwork (SVG):**
  - Zero heavy raster images or external JPEG/PNG dependencies.
  - Completely responsive across all resolutions from 320px mobile to 4K desktop screens without pixelation or layout shifts.
  - Respects `@media (prefers-reduced-motion)`.

## 4. Files Modified and Created

- **Created:**
  - `src/features/home/components/ChemistryHeroBanner.tsx`: Visual chemistry banner component.
  - `docs/HOME_HERO.md`: This architecture and design documentation.
- **Modified:**
  - `src/pages/HomePage.tsx`: Integrated the new headline, welcome pill, supporting copy, feature checklist, primary and secondary CTA buttons, and `ChemistryHeroBanner`.
  - `tests/uiFoundation.test.mjs`: Added assertions verifying the new headline (*"Discover Chemistry"*) and both action buttons (*"Get Started"*, *"Explore Experiments"*).

## 5. Actual Verification Results

| Verification Check | Command | Status | Details |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `npm.cmd run typecheck` | **Passed (exit 0)** | Zero type errors across all application and test code |
| **ESLint Check** | `npm.cmd run lint` | **Passed (exit 0)** | Zero lint warnings or errors |
| **Full Test Suite** | `npm.cmd test` | **Passed (exit 0)** | **192 passed, 0 failed, 0 skipped** across all test files |
| **Production Build** | `npm.cmd run build` | **Passed (exit 0)** | Client bundle compiled cleanly into `dist/` |
| **3D Lab Integrity** | Full physics & scene suite | **Passed (exit 0)** | Preserved all 3D kinematics, coordinates, and state management |
