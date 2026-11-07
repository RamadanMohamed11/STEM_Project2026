# MCQ Assessment Data Architecture (Task T25)

## Overview

Task T25 establishes the strongly typed multiple-choice assessment data architecture, demonstration question bank, pure validation rules, and selector utilities for post-experiment student reviews in the **STEM Virtual Lab**.

---

## 1. Separation of Concerns

The assessment system separates five distinct responsibilities across tasks:

1. **Question Content (`MultipleChoiceQuestion`, `QuestionOption`):** Defined in `src/types/assessment.ts` and `src/features/assessments/data/saltDissolutionAssessment.ts`.
2. **Assessment Definitions (`ExperimentAssessmentDefinition`, `PassingScoreConfiguration`):** Defined in `src/types/assessment.ts` and registered in `src/features/assessments/data/assessmentCatalog.ts`.
3. **Pure Validation & Selectors:** Implemented in `src/features/assessments/lib/assessmentValidation.ts` and `src/features/assessments/lib/assessmentSelectors.ts`.
4. **Interactive Quiz UI & Student Answer State (`StudentQuestionResponse`, `AssessmentAttemptRecord`):** Reserved for **Task T26**.
5. **Automatic Scoring & Quiz Results Presentation:** Reserved for **Task T27**.

---

## 2. Core Data Models (`src/types/assessment.ts`)

- **`QuestionOption`:**
  - `id: OptionId` — Stable option identifier independent of display order.
  - `text: string` — Student-facing choice text in clear, simple English.
  - `order: number` — Explicit 1-based display order.
- **`MultipleChoiceQuestion`:**
  - `id: QuestionId` — Stable question identifier.
  - `experimentId: EntityId` — Associated experiment ID (e.g., `exp-salt-water-001`).
  - `version: string` — Semantic version string (`1.0.0`).
  - `order: number` — Explicit 1-based display order within the assessment.
  - `prompt: string` — Question prompt text.
  - `options: readonly QuestionOption[]` — At least two valid options.
  - `correctOptionId: OptionId` — Stable reference to the single correct option in `options`.
  - `explanation: string` — Scientifically accurate explanation.
  - `difficulty?: ExperimentDifficulty` — Optional difficulty (`beginner`, `intermediate`, `advanced`).
  - `learningObjectiveId?: EntityId` — Optional reference to an `ExperimentLearningContent` objective ID.
  - `reviewStatus: AssessmentContentReviewStatus` — Editorial status (`draft`, `reviewed`, `approved`).
- **`ExperimentAssessmentDefinition`:**
  - `id: AssessmentId`, `experimentId: EntityId`, `version: string`, `title: string`, `description: string`, `scopeDisclaimer: string`
  - `availabilityStatus: 'draft-demo' | 'available' | 'coming-soon' | 'archived'`
  - `reviewStatus: 'draft' | 'reviewed' | 'approved'`
  - `questionOrdering: 'fixed' | 'ordered-by-field'`
  - `passingScore: PassingScoreConfiguration`
  - `allowMultipleAttempts: boolean`
  - `questions: readonly MultipleChoiceQuestion[]`

---

## 3. Demonstration Questions (`src/features/assessments/data/saltDissolutionAssessment.ts`)

Provides 6 draft demonstration questions (`reviewStatus: 'draft'`) for `exp-salt-water-001` (`Dissolving Salt in Water`):

1. **`q-salt-001-cylinder-purpose`:** Purpose of the 100 mL graduated cylinder (`learningObjectiveId: 'salt-tools'`).
2. **`q-salt-002-meniscus-reading`:** Reading the bottom of the curved liquid meniscus at eye level (`learningObjectiveId: 'salt-water-volume'`).
3. **`q-salt-003-weighing-salt`:** Using the clean spatula and tared weighing boat on the digital balance (`learningObjectiveId: 'salt-mass'`).
4. **`q-salt-004-stirring-rod-function`:** Gentle circular stirring with the glass rod to disperse and dissolve salt (`learningObjectiveId: 'salt-tools'`).
5. **`q-salt-005-what-happens-when-dissolved`:** Dispersion of $\text{Na}^+$ and $\text{Cl}^-$ ions in water to form a clear homogeneous solution (`learningObjectiveId: 'salt-dissolving'`).
6. **`q-salt-006-physical-not-chemical`:** Distinguishing physical dissolution from a chemical reaction (`learningObjectiveId: 'salt-observation'`).

---

## 4. Pure Validation Rules (`src/features/assessments/lib/assessmentValidation.ts`)

- `validateMultipleChoiceQuestion(question, context)`
- `validateAssessmentDefinition(assessment, context)`
- `validateAssessmentCatalog(assessments, experiments)`

Checks enforced:
- Unique question IDs (`DUPLICATE_QUESTION_ID`) and non-empty question IDs (`MISSING_QUESTION_ID`)
- Unique option IDs within each question and across the assessment (`DUPLICATE_OPTION_ID`)
- Non-empty question prompt (`MISSING_QUESTION_TEXT`) and scientific explanation (`MISSING_EXPLANATION`)
- At least two valid options (`INSUFFICIENT_OPTIONS`, `MISSING_OPTION_TEXT`, `DUPLICATE_OPTION_TEXT`)
- Exactly one valid correct answer (`MISSING_CORRECT_ANSWER`, `MULTIPLE_CORRECT_ANSWERS`) and valid option ID reference (`INVALID_CORRECT_ANSWER_REFERENCE`)
- Valid experiment associations (`INVALID_EXPERIMENT_ASSOCIATION`, `QUESTION_EXPERIMENT_MISMATCH`) and learning objective IDs (`INVALID_OBJECTIVE_REFERENCE`)
- Valid semantic versions (`INVALID_ASSESSMENT_VERSION`, `INVALID_QUESTION_VERSION`) and passing score configuration (`INVALID_PASSING_SCORE`).
