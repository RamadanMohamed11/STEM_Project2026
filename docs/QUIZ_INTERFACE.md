# Interactive MCQ Quiz Interface (Task T26)

## Overview

Task T26 replaces the temporary placeholder on `ExperimentQuizPage` with a complete, accessible, interactive multiple-choice assessment interface for secondary school students in the **STEM Virtual Lab**.

---

## 1. Architectural Boundaries & Constraints

To maintain strict educational and simulation separation:

1. **Independent State:** The quiz interface state (`useQuizState`) operates completely independently from the 3D simulation stores (`useSimulationWorkflowSession`, `useLaboratorySessionStore`). No chemical reaction or physical placement state is affected by taking a quiz.
2. **Zero Automatic Grading / Scoring (Reserved for T27):** In compliance with Task T26 requirements, this task does **not** evaluate answers, calculate percentages, assign letter grades, show final scores, or leak correct answers. Automatic scoring, feedback badges, and explanations are exclusively deferred to Task T27.
3. **No `<form>` Invariant:** To respect routing invariants and security audit rules across non-login student routes, the quiz uses accessible `<fieldset>`, `<legend>`, and native `<input type="radio">` wrapped inside semantic `<article>` and `<div>` elements without any enclosing `<form>` tags.
4. **Honest Availability:** If an experiment does not have an assessment registered (e.g. planned experiments `exp-volume-002`, `exp-ph-003`), the page displays `QuizUnavailable` with direct links back to the experiment details and results routes.

---

## 2. Component Architecture (`src/features/assessments/components/`)

### `QuizProgressBar.tsx`
- Displays question position: `"Question X of Y"`.
- Displays answered progress summary: `"N of Y answered (P%)"`.
- Features an accessible progress bar with `role="progressbar"`, `aria-valuenow`, and `aria-valuemin`/`aria-valuemax`.
- Provides numbered step-jump buttons (`1`, `2`, ..., `N`) with accessible labels (`"Question 1: Answered"`, `"Question 2: Answered (Current)"`, `"Question 3: Unanswered"`), allowing students to immediately jump to any question.

### `QuizQuestionCard.tsx`
- Renders one question at a time to keep cognitive load low for secondary school students.
- Uses semantic `<fieldset>` and `<legend>` for assistive technology and screen readers.
- Presents lettered option choices (`A`, `B`, `C`, `D`) with native radio inputs, large clickable touch targets, visible focus-within outlines, and checked highlight styling.
- Controls include:
  - **Previous Question:** Navigate backward (disabled on the first question).
  - **Next Question:** Navigate forward (available on all except the last question).
  - **Review Answers:** Jump directly to the comprehensive review checklist.
  - **Clear Choice:** Deselect the selected option for the current question.

### `QuizReviewScreen.tsx`
- Summary statistics card displaying Total Questions, Answered Questions, and Unanswered Questions.
- Complete question checklist showing question prompt, answered/unanswered status badges, selected option text (or `"No answer selected yet"`), and a `"Change Answer"` / `"Answer Question"` button that jumps directly back to that question card.
- Submission Preparation Notice indicating that answers are recorded locally during the current session, and that automatic grading and scoring are coming soon in Task T27.
- Action links to continue answering, return to experiment details, or view the upcoming quiz results placeholder.

### `QuizUnavailable.tsx`
- Informative fallback card when an experiment has no registered assessment.
- Explains honestly that review questions are in preparation without inventing fake questions or scores.

---

## 3. Quiz State Management (`src/features/assessments/state/useQuizState.ts`)

A lightweight, purely client-side React hook managing the quiz attempt lifecycle:

- `assessmentId`: Associated assessment identifier.
- `assessmentVersion`: Loaded assessment version.
- `currentQuestionIndex`: 0-based index of the currently displayed question.
- `answers`: Record of `{ [questionId]: selectedOptionId }`.
- `isReviewMode`: Boolean toggle between the single question view and the summary review screen.
- **Methods:**
  - `selectAnswer(questionId, optionId)`: Record or change an option selection.
  - `clearAnswer(questionId)`: Deselect the current choice.
  - `goToQuestion(index)`: Navigate directly to a specific question (and exit review mode).
  - `nextQuestion()`: Advance to the next question.
  - `prevQuestion()`: Return to the previous question.
  - `enterReviewMode()`: Switch to the summary checklist view.
  - `exitReviewMode()`: Return to the single question view.
  - `resetQuiz()`: Reset answers and return to question 1.

---

## 4. Verification

All assessment architecture and interactive quiz tests pass:
- `tests/quizInterface.test.mjs` (7/7 tests passed).
- `tests/assessmentArchitecture.test.mjs` (10/10 tests passed).
- `tests/studentRoutes.test.mjs` (3/3 tests passed).
- `tests/simulationIntegration.test.mjs` (3/3 tests passed).
- Full test suite: 272/272 tests passed.
- `npm run typecheck`, `npm run lint`, and `npm run build`: 0 errors.
