# Choose Your Grade Page (Task T15)

## Overview

Task T15 implements the **Choose Your Grade** page (`/grades`) for **STEM Virtual Lab**, replacing the earlier placeholder with a fully accessible educational grade selection interface. It enables secondary school students to choose their academic grade level before proceeding to academic term selection.

## 1. Architectural Structure

```
src/
├── features/
│   └── curriculum/
│       ├── data/
│       │   ├── sampleCurriculum.ts     # Canonical sampleGrades definition from T03
│       │   └── gradeMetadata.ts        # UI metadata: icons, level badges, subtitles, topics
│       ├── state/
│       │   └── gradeSelection.ts       # Shared state interface: sessionStorage & memory fallback
│       └── components/
│           ├── GradeOptionCard.tsx     # Accessible radio card with visual feedback
│           └── GradeSelectionGrid.tsx   # Radiogroup container with keyboard arrow navigation
└── pages/
    └── ChooseGradePage.tsx             # Page layout, profile sync, selection feedback, CTAs
```

## 2. Grade Options (Single Source of Truth)

Reuses canonical definitions from [`src/features/curriculum/data/sampleCurriculum.ts`](file:///e:/STEM%20Project/src/features/curriculum/data/sampleCurriculum.ts):

| Grade | Title | Level Badge | Subtitle & Focus Topics |
|:---|:---|:---|:---|
| `grade-secondary-1` | **First Secondary Grade** | Grade 10 | *Matter & Solutions:* Chemical calculations, solutions, acids & bases, measurement |
| `grade-secondary-2` | **Second Secondary Grade** | Grade 11 | *Atomic Structure & Bonding:* Quantum numbers, periodic trends, ionic & covalent bonds |
| `grade-secondary-3` | **Third Secondary Grade** | Grade 12 | *Advanced & Organic Chemistry:* Transition metals, chemical equilibrium, electrochemistry, organic reactions |

## 3. State Management & Persistence

- **Session Persistence:** Managed via [`src/features/curriculum/state/gradeSelection.ts`](file:///e:/STEM%20Project/src/features/curriculum/state/gradeSelection.ts).
- **Graceful Fallback:** If `sessionStorage` is unavailable (SSR, private browsing mode, restricted cookies), safely falls back to in-memory state.
- **T10 Profile Integration:**
  - If a student is authenticated, their saved profile grade is read and preselected.
  - Selecting a new grade updates local state and synchronizes with the student's profile via `auth.updateProfile` upon continuing.
- **Clean Interface for T16:** Future Term Selection (`/terms`) can import `getStoredGradeId()` or `getGradeById()` to filter units and lessons.

## 4. UI/UX & Accessibility

- **Semantic HTML & Radiogroup:** Container uses `role="radiogroup"` with `aria-label="Secondary school grades"`. Each card uses `role="radio"` with `aria-checked`.
- **Keyboard Navigation:** Students can navigate between cards using <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> arrow keys, and select using <kbd>Space</kbd> or <kbd>Enter</kbd>.
- **Visual Feedback:** Selected cards display high-contrast teal ring highlights, background shading, and a filled checkmark indicator.
- **Disabled Continue State:** "Continue to Term Selection" remains disabled until a valid grade is selected.
- **Direct Navigation:** Includes direct fallback links (`Browse all terms directly` to `/terms` and `Review Laboratory Safety` to `/safety`).

## 5. Verification Results

- **TypeScript (`tsc -b --pretty`):** Clean compilation, 0 errors.
- **ESLint (`eslint .`):** Clean linting, 0 warnings/errors.
- **Node Test Runner (`npm test`):** 224 passing tests, including dedicated [`tests/chooseGradePage.test.mjs`](file:///e:/STEM%20Project/tests/chooseGradePage.test.mjs).
- **Production Build (`npm run build`):** Clean Vite bundle generation in 1.41s.
