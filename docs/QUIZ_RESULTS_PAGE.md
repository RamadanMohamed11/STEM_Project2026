# Quiz Results Page & Encouragement Animations (Task T28)

## Overview

Task T28 replaces the temporary placeholder on `QuizResultsPage` (`/experiments/:experimentId/quiz/results`) with a complete, accessible results page displaying verified assessment outcomes, age-appropriate encouraging performance feedback, and lightweight animations that support `prefers-reduced-motion`.

---

## 1. Key Features & Architectural Boundaries

1. **Submitted Assessment Results Only**:
   - Scores, counters, and feedback strictly reflect the submitted `AssessmentResultRecord` from Task T27.
   - Never fabricates fake scores or random results for students.
2. **Honest Empty State**:
   - If a student visits the results URL directly or before completing a quiz, the page renders a clear "No Quiz Results Yet" empty state explaining that there is no score to show, with a direct link to the quiz.
   - Durable cross-session progress tracking is reserved for **Task T29**.
3. **Session Store & Router Integration**:
   - `src/features/assessments/state/assessmentResultsStore.ts` provides safe in-memory session storage for the latest submitted attempt per experiment.
   - `QuizResultsPage` checks both React Router location state (`location.state?.result`) and `getLatestAssessmentResult(experiment.id)`.
   - Submitting on `ExperimentQuizPage` navigates seamlessly to `QuizResultsPage`.
4. **Zero Calculation in UI**:
   - Reuses grading engine outcomes (`AssessmentResultRecord`, `QuestionFeedbackItem[]`) generated in Task T27 without recalculating grades.
5. **No `<form>` Invariant**:
   - Adheres to application routing audit rules across student journey routes: semantic `<section>`, `<article>`, `<button type="button">`, `<Link>`, and `<ButtonLink>` without enclosing `<form>` tags.

---

## 2. Component Architecture (`src/features/assessments/components/`)

### `ScoreRingMeter.tsx`
- Circular SVG progress meter with `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
- Displays `{percentage}%` and `{score} / {maxScore}` in bold tabular numerals.
- Features smooth stroke transition animation in `motion-safe:`.
- In `prefers-reduced-motion: reduce`, animations are immediately disabled and the static meter renders directly.

### `CelebrationEffect.tsx`
- Subtle celebration particle burst for high scores (>= 80%) rendered using pure SVG and CSS `@keyframes`.
- Non-looping, gentle 1.3s fade out.
- Completely hidden and disabled when `prefers-reduced-motion: reduce` is active (`motion-reduce:hidden`).
- Zero audio or autoplay sound.

### `AchievementIllustration.tsx`
- Tailored SVG science achievement illustration for each score tier:
  - `perfect` (100%) and `excellent` (80–99%): Science flask with graduation marks and gold star sparkles.
  - `good` (50–79%): Laboratory beaker with checkmark badge.
  - `practice` (< 50%): Open laboratory guide book and test tube encouraging exploration.

### `QuizResultsAnswerReview.tsx`
- Complete question-by-question review section with filter tabs:
  - `All (N)`: View all questions.
  - `Needs Review (X)`: Filter to missed and unanswered questions.
  - `Correct (Y)`: Filter to correctly answered questions.
- Displays question prompt, student's answer, correct answer, status badge (`Correct Answer`, `Not Quite Right`, `Not Answered`), and "Here's Why" scientific explanation.

---

## 3. Performance Feedback Tiers (`src/features/assessments/lib/performanceFeedback.ts`)

Pure mapping function `getPerformanceFeedback(percentage)`:

- **100% — Excellent Work!**:
  - *"Outstanding achievement! You answered every question correctly and demonstrated a complete understanding of this experiment’s scientific principles."*
- **80%–99% — Great Job!**:
  - *"You showed a clear grasp of the laboratory techniques and concepts. Review the detailed feedback below to master every question."*
- **50%–79% — Good Effort!**:
  - *"You understand several key ideas from the experiment. Review the scientific explanations below to strengthen your understanding."*
- **< 50% — Keep Practicing!**:
  - *"Every experiment and quiz is an opportunity to learn. Take a close look at the explanations below, then try the quiz again."*

*Pass/Fail Policy:* No Pass/Fail labels are shown unless `result.passStatus !== 'unconfigured'`, preventing invented grading thresholds for draft content.

---

## 4. Navigation Actions

- **Review Answers**: Smoothly scrolls down and focuses `#answer-review`.
- **Try Again**: Clears the stored attempt for this experiment and navigates to the quiz to start fresh.
- **Back to Experiment**: Navigates to experiment details (`paths.details`).
- **Explore Experiments**: Navigates to `/experiments` (`routePaths.experiments`).

---

## 5. Verification

- `tests/quizResultsPage.test.mjs` (8/8 tests passed).
- All 42 assessment and student route tests passed.
- `npm run typecheck`, `npm run lint`, and `npm run build`: 0 errors.
