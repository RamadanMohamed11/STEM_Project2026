# Choose Academic Term Page (Task T16)

## Overview

Task T16 implements the **Choose Academic Term** page (`/terms`) for **STEM Virtual Lab**, replacing the earlier placeholder with a fully accessible educational term selection interface. It enables secondary school students to choose their academic term (**First Term** or **Second Term**) based on their selected grade before proceeding to the experiments and curriculum lessons.

---

## 1. Architectural Structure

```
src/
├── features/
│   └── curriculum/
│       ├── data/
│       │   ├── sampleCurriculum.ts     # Canonical sampleGrades & sampleTerms definition
│       │   └── termMetadata.ts         # UI metadata: icons, subtitles, period badges, topic lists
│       ├── state/
│       │   ├── gradeSelection.ts       # Shared grade selection: sessionStorage & memory fallback
│       │   └── termSelection.ts        # Shared term selection: sessionStorage & memory fallback
│       └── components/
│           ├── TermOptionCard.tsx      # Accessible radio card with visual selection indicator
│           └── TermSelectionGrid.tsx   # Radiogroup container with keyboard arrow navigation
└── pages/
    └── ChooseTermPage.tsx              # Page layout, grade banner, term grid, navigation CTAs
```

---

## 2. Term Options & Single Source of Truth

Terms are derived directly from the canonical [`sampleTerms`](file:///e:/STEM%20Project/src/features/curriculum/data/sampleCurriculum.ts) dataset (2 terms per grade, 6 terms total across the 3 secondary grades):

| Term Slug | Term Title | Subtitle & Semester | Key Pedagogical Topics |
|:---|:---|:---|:---|
| `first-term` | **First Term** | Semester 1 · Autumn / Winter | Chemistry & Measurement, Nanotechnology, Chemical Stoichiometry, Solutions & Colloids, Acids & Bases |
| `second-term` | **Second Term** | Semester 2 · Spring | Thermochemistry & Heat of Reaction, Nuclear Chemistry, Chemical Kinetics, Applied Chemistry |

### Grade Context Integration

- When a student arrives from `/grades` (or has previously chosen a grade), the active grade title and level badge (e.g. `First Secondary Grade · Grade 10`) are prominently displayed in the grade banner.
- A quick link (`Change Grade`) allows students to return to [`/grades`](file:///e:/STEM%20Project/src/pages/ChooseGradePage.tsx) at any point.
- If no grade is selected (e.g. direct URL navigation), a friendly non-blocking banner notifies the student to select a grade first, with direct links to [`/grades`](file:///e:/STEM%20Project/src/pages/ChooseGradePage.tsx) and [`/experiments`](file:///e:/STEM%20Project/src/pages/ExperimentsCatalogPage.tsx).

---

## 3. State Management & Persistence

- **Session Persistence:** Managed in [`src/features/curriculum/state/termSelection.ts`](file:///e:/STEM%20Project/src/features/curriculum/state/termSelection.ts) under the key `stem_selected_term_id`.
- **Graceful Fallback:** If `sessionStorage` is unavailable (such as in SSR, private browsing, or restrictive browser security policies), safe in-memory fallback state prevents errors.
- **Lookup Utilities:**
  - `getStoredTermId()`: Retrieves currently active term ID.
  - `setStoredTermId(termId)`: Validates ID against `sampleTerms` and stores selection.
  - `clearStoredTermId()`: Resets active term selection.
  - `getTermsForGrade(gradeId)`: Returns the sorted list of terms belonging to a given grade.
  - `getTermById(termId)`: Finds a specific term entity by ID.

---

## 4. UI/UX & Accessibility

- **WAI-ARIA Radiogroup Pattern:**
  - Container uses `role="radiogroup"` with `aria-label="Academic terms"`.
  - Cards use `role="radio"` with `aria-checked="true"|"false"`.
- **Keyboard Navigation:**
  - Full keyboard accessibility: navigate between options with <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> arrow keys.
  - Select via <kbd>Space</kbd> or <kbd>Enter</kbd>.
- **Visual Distinction:**
  - High-contrast teal selection border, background glow, and solid teal checkmark indicator.
  - Numbered term pill (`Term 1`, `Term 2`), calendar period badge, and listed topic highlights.
- **Form-Free Action:**
  - "Continue to Experiments" button activates once a term is chosen and directs the student to `/experiments`.
  - Secondary text navigation provides direct pathways to change grade or explore experiments catalog.

---

## 5. Strict Constraints & Compliance

- **English Only:** All headlines, descriptions, button labels, and assistive text are in clear, accessible secondary school English. No Arabic characters.
- **Direction:** Standard Left-to-Right (`dir="ltr"`).
- **Simulation Isolation:** Zero changes to the 3D laboratory simulation or `src/features/simulations/`.
- **Backend-Free:** Zero mock network latency, no fake authentication, and no database dependencies.
