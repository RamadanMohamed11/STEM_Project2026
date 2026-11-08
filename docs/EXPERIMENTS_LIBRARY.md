# Experiments Library Page (T39)

## Overview

Task T39 implements the **Experiments Library** page organized according to the reference syllabus layout (`docs/reference/curriculum-layout-example.jpeg` and `docs/reference/project-spec.txt` section 5).

After choosing a grade and term (e.g., via `/grades` and `/terms`), the student is presented with all practical chemistry experiments organized hierarchically by the Egyptian secondary school curriculum syllabus.

---

## Layout Hierarchy (Top to Bottom)

The presentation strictly adheres to the visual structure in the specification:

1. **Page Title**: The active secondary school grade name (e.g., `First Secondary Grade` / `Second Secondary Grade` / `Third Secondary Grade`) as an `<h1>` heading.
2. **Term Pill Badge**: A styled `StatusPill` indicating the academic term (`First Term` or `Second Term`) directly beneath the title.
3. **Unit Headings**: For each curriculum unit containing practical lessons, a bold `<h2>` section heading (e.g., `Unit 1: Chemistry: The Central Science`).
4. **Rounded Unit Card**: Each unit renders one unified rounded card (`rounded-2xl border border-line bg-white shadow-card overflow-hidden divide-y divide-line`) holding all lessons within that unit.
5. **Lesson Blocks & Dividers**:
   - Each lesson renders its title (`<h3>`) and optional pedagogical description.
   - Lessons within a unit card are cleanly separated by subtle dividers (`divide-y divide-line`).
6. **Bulleted Experiment Links**:
   - **Playable Experiments** (`status = 'demo'`): The Salt Dissolution demo (`exp-salt-water-001`) renders as a keyboard-focusable, interactive link to the Experiment Details route (`/experiments/exp-salt-water-001`) with clear hover and focus indicator styling (`focus-visible:outline-teal`).
   - **Draft / Planned Experiments** (`status = 'draft'` or `'planned'`): Non-playable syllabus experiments render as unclickable text paired with a discrete `Coming soon` tag badge (`rounded-full bg-slate-100 text-slate-500`).
7. **Empty State**: When an academic term has no units or scheduled experiments, an accessible `role="status"` empty state is rendered with prompt options to choose another term or grade.
8. **Partial Curriculum Footer Note**: When viewing sample or partial syllabus data, the exact footer note is displayed:
   > *"Remaining units follow the same structure according to the curriculum."*

---

## Route & Navigation Architecture

- **Path**: `/experiments?grade=:gradeId&term=:termId`
- **Continue Flow**: On the term selection page (`/terms`), choosing an academic term and clicking **Continue** navigates directly to the Experiments Library for that grade and term.
- **Catalog View Switcher**: A switcher link allows students to toggle between the structured curriculum view and the flat searchable catalog view (`/experiments?view=catalog`).
- **Direct Catalog Entry**: Navigating directly to `/experiments` without grade/term parameters preserves the full `<ExperimentCatalog />` with search and filters, maintaining 100% backward compatibility with existing tests and exploratory browsing.
- **Your Lessons Integration**: On `/curriculum`, students can view lesson-level details and use the "Browse Experiments" action to jump directly to the matching Experiments Library. Adding `?view=library` to `/curriculum` also activates the reference layout.

---

## Design System Tokens & Accessibility

- **Theme**: Light theme utilizing existing palette tokens (`navy`, `teal`, `ink`, `slate`, `line`, `shadow-card`, `bg-white`).
- **Typography & Language**: 100% English text; zero Arabic characters in the user interface.
- **Mobile Responsive**: Fully adaptive from 375px mobile viewports up to wide desktop screens.
- **Keyboard Navigation**: Interactive experiment links are standard anchor elements supporting tab focus, enter activation, and accessible outlines.

---

## Verification & Automated Tests

- New test file: `tests/experimentsLibraryLayout.test.mjs` (3 passing tests):
  - Validates full top-to-bottom layout against the reference specification.
  - Verifies playable vs. draft experiment link behaviors and "Coming soon" tags.
  - Verifies accessible empty state when a term has no experiments.
  - Verifies English text integrity and absence of Arabic characters.
  - Verifies fallback to the flat catalog when no grade/term is provided.
- Full regression suite: 338 passing tests across 27 test files.
