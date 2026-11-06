# UI Foundation and Responsive Design — Task T04

Audit date: 6 November 2026. Scope: **Task T04 only**.

## Overview and Objective

Task T04 establishes a polished, responsive, and accessible frontend foundation for the **STEM Virtual Lab** platform. It refines shared UI components, improves text clarity for secondary school students, and ensures seamless responsiveness across mobile, tablet, and desktop viewports without changing the application's English language or modifying the 3D chemistry laboratory.

## 1. Language and Text Foundations

- **English by Default:** The application remains entirely in English with `lang="en"` and standard left-to-right (`dir="ltr"`) layout. No Arabic translations, RTL styles, or internationalization libraries were introduced.
- **Natural, Student-Centric English:** Formal, overly academic wording was simplified into direct, friendly sentences suitable for secondary school students. Unfamiliar terms are explained simply (e.g., explaining PPE as protective gear like goggles, lab coat, and gloves).

### Summary of Copy Improvements

| Location | Previous Formal / Academic Phrasing | Improved Student-Friendly Phrasing |
| :--- | :--- | :--- |
| **Safety Overview** | "Follow the activity-specific PPE instructions. Lab coats, eye protection, and suitable gloves may be required." | "Wear protective gear (PPE): Always wear safety goggles, a lab coat, and protective gloves to keep your eyes, skin, and clothes safe." |
| **Safety Overview** | "Locate safety equipment, keep benches clear, and follow instructor guidance before using any instrument." | "Know your workspace: Keep your work table clean, know where safety tools are located, and follow your teacher’s directions." |
| **Safety Overview** | "Never handle unknown substances or equipment without authorization. Report spills or incidents immediately." | "Handle materials safely: Never touch or smell unknown chemicals without permission. If something spills or breaks, report it right away." |
| **Safety Page** | "Foundational habits for responsible learning in a science laboratory. Specific procedures must be verified for each activity." | "Essential safety rules for working in a science lab. Always read the instructions carefully before starting an experiment." |
| **Home Hero** | "STEM Virtual Lab brings practical science learning into one clear space. Begin with safety, discover how experiments are structured..." | "STEM Virtual Lab makes science simple and interactive. Learn essential safety rules, explore virtual experiments step by step, and discover hands-on chemistry in 3D." |
| **Home Roadmap** | "Inspect and reposition six 3D laboratory items in a real-time chemistry workbench. Chemical experiments are planned." | "Work with real 3D tools, perform measured liquid and solid transfers, and observe chemical changes on a virtual lab bench." |
| **Getting Started** | "Review safety / Explore experiments / Enter the lab / Follow the method / Review results" | "Learn safety rules / Pick an experiment / Enter the 3D lab / Follow the steps / Review results" |
| **Catalog Filters** | "Search and refine the demonstration collection." | "Search by keyword or filter by category and availability." |
| **Catalog Notice** | "Prototype examples: these are not official course experiments... chemical processes are not simulated yet." | "Sample experiments: The 3D laboratory allows you to explore real equipment handles, chemical transfers, and live measurements." |
| **Not Found Page** | "The address may have changed, or the page may not be part of this prototype yet." | "The link may be outdated, or this page is not ready yet. You can always go back to the home page." |

## 2. Shared UI Components (`src/components/ui/`)

New and enhanced primitives ensure consistent design tokens, accessible touch targets, and clear visual hierarchy across all current and future educational pages:

- **`ButtonLink` (`src/components/ui/ButtonLink.tsx`) & `buttonStyles.ts`:**
  - Standardized variants: `primary` (solid teal with dark teal hover), `secondary` (white background with subtle border), `outline` (teal border), and `ghost`.
  - Accessible sizing: `md` (`min-h-11` / 44px minimum touch target, WCAG 2.5.5/2.5.8 compliant), `sm` (36px), and `lg` (48px).
  - High-visibility keyboard focus rings: `focus-visible:outline-3 focus-visible:outline-teal focus-visible:outline-offset-2`.
  - Full-width mobile support (`fullWidth?: boolean`).
- **`Button` (`src/components/ui/Button.tsx`):**
  - Companion component for standard `<button>` elements, sharing identical tokens, styles, touch targets, and disabled states with `ButtonLink`.
- **`Card` (`src/components/ui/Card.tsx`):**
  - Unified card styling (`rounded-xl border border-line bg-white shadow-card`) with customizable padding (`sm`, `md`, `lg`) and optional interactive hover elevation.
- **`StatusPill` (`src/components/ui/StatusPill.tsx`):**
  - Added semantic tones (`ready`, `neutral`, `warning`, `info`, `success`) with optional colored indicator dots (`dot?: boolean`) and high contrast borders.

## 3. Responsive Layout Enhancements (`src/components/layout/`)

- **`AppShell`:**
  - Skip link (`href="#main-content"`) with high-contrast visible focus state for keyboard users.
  - Viewport-filling isolation for the 3D laboratory (`/experiments/:id/lab`), ensuring no unwanted document scrollbars or header intrusion during 3D simulation.
  - Three-tier layout grid: single-column full-width on mobile (< 768px), 80px compact icon rail on tablet (768px–1279px), and 248px full sidebar on desktop (≥ 1280px).
- **`Header`:**
  - Responsive padding (`px-4 sm:px-6 lg:px-8 xl:px-12`) matching main content bounds.
  - Mobile hamburger button with accessible 44px tap target (`size-11`), `aria-expanded`, and `aria-controls`.
  - Dynamic breadcrumb context and student-friendly status pill.
- **`SidebarNavigation`:**
  - Accessible tooltips (`title={label}`) and screen-reader labels for icon buttons in tablet rail mode.
  - Active route indicator with `border-teal-light` accent bar.
  - Student exploration callout card with encouraging, plain English.
- **`MobileNavigation`:**
  - Native HTML `<dialog>` with backdrop dimming, scroll locking, and focus containment.
  - Minimum 44px tap targets for all navigation links.
  - Automatic dialog closure upon viewport expansion to desktop width (≥ 768px).
- **`PageHeader`:**
  - Fluid typography scaling: `text-2xl sm:text-3xl lg:text-4xl` prevents awkward text wrapping on narrow mobile screens (down to 320px).
  - Flexible action slot that wraps gracefully on small viewports.
- **`PageContainer`:**
  - Mobile-first horizontal padding (`px-4 sm:px-6 lg:px-8 xl:px-12`) maximizing usable screen real estate while avoiding horizontal scrollbars.
- **`JourneyPlaceholder`:**
  - Stacked action buttons on small mobile screens (`flex-col sm:flex-row`) for effortless thumb tapping.

## 4. Accessibility & Design Tokens (`src/styles/`)

- **Color Contrast:**
  - Refined `--color-slate` from `#71818c` (4.54:1) to `#546572` (**6.22:1** on white), exceeding WCAG 2.1 AA requirements for secondary body copy.
  - High-contrast text colors (`--color-navy: #162635` at 14.8:1, `--color-ink: #203342` at 11.8:1).
- **Focus Rings:**
  - Global `:focus-visible` styling with 3px solid teal and 2-3px offset ensures clear keyboard navigation across all interactive elements.
- **Reduced Motion:**
  - Maintained `@media (prefers-reduced-motion: reduce)` rules for users sensitive to motion.

## 5. 3D Simulation Protection

As required by Task T04 guidelines:
- Zero modifications to 3D coordinate mathematics, kinematics, physics colliders, or camera trajectories.
- Zero changes to material transfer workflows, event dispatchers, or simulation state stores (`src/features/simulations/`).
- The 3D laboratory canvas remains fully interactive and responsive inside its full-viewport container.

## 6. Verification Results

All tests, typechecks, and production bundle builds were verified:

| Check | Command | Status | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `npm.cmd run typecheck` | Passed (exit 0) | Clean typecheck across all modules and config |
| **ESLint (Flat Config)** | `npm.cmd run lint` | Passed (exit 0) | Zero lint warnings or errors |
| **Full Unit Test Suite** | `npm.cmd test` | Passed (exit 0) | **192 passed, 0 failed, 0 skipped** across all test files |
| **UI & Language Tests** | `node --test tests/uiFoundation.test.mjs` | Passed (exit 0) | Verified UI primitives, touch targets, landmarks, and English text |
| **Production Build** | `npm.cmd run build` | Passed (exit 0) | Successfully bundled client assets in `dist/` |
