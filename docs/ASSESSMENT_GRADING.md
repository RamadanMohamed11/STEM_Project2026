# Automatic MCQ Scoring & Answer Feedback (Task T27)

## Overview

Task T27 implements the pure automatic grading engine, attempt submission lifecycle, score calculation, and structured educational answer feedback for post-experiment multiple-choice assessments in the **STEM Virtual Lab**.

---

## 1. Pure Scoring Engine (`src/features/assessments/lib/assessmentGrading.ts`)

All grading logic is implemented as pure, deterministic TypeScript functions independent of React components and 3D simulation state:

- **`gradeAssessment(assessment, answers, options)`**:
  - Validates the assessment definition, semantic version, and question/option integrity.
  - Enforces duplicate submission protection when `existingSubmission` is supplied (`DUPLICATE_SUBMISSION`).
  - Verifies `expectedAssessmentId` (`ASSESSMENT_ID_MISMATCH`) and `expectedAssessmentVersion` (`ASSESSMENT_VERSION_MISMATCH`).
  - Rejects zero-question assessments (`EMPTY_ASSESSMENT`).
  - Orders questions deterministically via `getOrderedAssessmentQuestions(assessment)` (`fixed` vs. `ordered-by-field`).
  - Compares student selections against `correctOptionId` using stable IDs (never array indices).
  - Sanitizes invalid question IDs (`UNKNOWN_QUESTION_ID`) and invalid option IDs (`INVALID_OPTION_ID`), recording non-fatal warnings in `validationWarnings`.
  - Calculates `totalQuestions`, `correctCount`, `incorrectCount`, `unansweredCount`, `score`, `maxScore` (`maximumScore`), and rounded `percentage`.
- **`calculatePercentageScore(score, maximumScore)`**:
  - Computes `Math.round((score / maximumScore) * 100)` clamped to `[0, 100]`, returning `0` for zero or non-finite inputs.
- **`evaluatePassStatus(score, percentage, passingScore)`**:
  - Returns `'unconfigured'` when `passingScore.status === 'unconfigured-draft'`, preventing arbitrary Pass/Fail labels.
  - Evaluates `'passed' | 'failed'` only when an approved threshold is explicitly configured.
- **`validateAttemptAnswers(assessment, answers)`**:
  - Inspects an in-progress or submitted answer map to report answered, unanswered, unknown question IDs, and invalid option selections.
- **`buildQuestionFeedback(question, rawSelectedOptionId, displayOrderIndex)`**:
  - Produces structured `QuestionFeedbackItem` records containing option letters (`A`, `B`, `C`, `D`), student answer text, correct answer text, status (`correct`, `incorrect`, `unanswered`), heading (`Correct Answer` or `Not Quite Right`), and scientific explanation (`explanation`).

---

## 2. Assessment Result Data Model (`src/types/assessment.ts`)

`AssessmentResultRecord` provides a structured, immutable result object:

- `attemptId: string` — Stable attempt identifier (`attempt-<assessmentId>-v<version>-<attemptNumber>`).
- `experimentId: EntityId` — Associated experiment identifier.
- `assessmentId: AssessmentId` — Assessment definition identifier.
- `assessmentVersion: string` — Semantic version of the graded assessment.
- `submittedAnswers: Readonly<Record<QuestionId, OptionId | null>>` — Sanitized map of submitted answers (`null` for unanswered questions).
- `score: number` — Total earned points (equal weight: 1 point per correct question).
- `maxScore: number` / `maximumScore: number` — Maximum possible score (`totalQuestions`).
- `percentage: number` — Integer percentage score (`0–100`).
- `totalQuestions: number`, `correctCount: number`, `incorrectCount: number`, `unansweredCount: number`.
- `passStatus: 'unconfigured' | 'passed' | 'failed'`.
- `questionFeedback: readonly QuestionFeedbackItem[]` — Ordered per-question feedback items.
- `submittedAt: string` / `submissionTimestamp: string` — ISO-8601 submission timestamp.
- `isPracticeAssessment: true` — Explicit integrity marker indicating a client-side practice result rather than an official examination grade.
- `validationWarnings: readonly AssessmentGradingWarning[]`.

---

## 3. Submission Lifecycle & Feedback UI

- **Unanswered Confirmation (`QuizReviewScreen.tsx` & `useQuizState.ts`)**:
  - If a student clicks **Submit Quiz** while `unansweredCount > 0`, the interface displays a clear confirmation alert (`You have X unanswered questions`) allowing the student to either **Submit Anyway** or **Return to Questions**.
- **Single-Submission & Answer Locking (`useQuizState.ts`)**:
  - Once submitted, `status` transitions to `'submitted'`, the score is calculated once, duplicate submissions are ignored, and `selectOption` / `clearOption` are locked.
- **Educational Answer Feedback (`QuizFeedbackView.tsx`)**:
  - Displays **Your Score**, breakdown counters, a practice assessment disclaimer, a **Try Again (Retake Quiz)** button that initializes a fresh attempt, and **Review Your Answers** cards with **Correct Answer**, **Not Quite Right**, and **Here's Why** concept explanations.
