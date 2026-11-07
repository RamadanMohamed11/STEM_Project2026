# Student Learning Progress Tracking (T29)

## Overview

The STEM Virtual Lab student learning progress system tracks validated 3D chemistry experiment milestones and submitted post-experiment practice quiz results on the student's local browser/device. It is architected behind a small, testable repository interface (`StudentProgressRepository`) so that a future authenticated backend service can synchronize student progress without modifying simulation engines or UI components.

---

## 1. Versioned Storage Envelope & Schema (`schemaVersion: 1`)

Progress is stored under the browser `localStorage` key `stem_virtual_lab_student_progress_v1` using a versioned envelope (`StudentProgressStoreEnvelope` in `src/types/progress.ts`):

```ts
export interface StudentProgressStoreEnvelope {
  schemaVersion: 1
  scope: 'local-device'
  updatedAt: string
  experiments: Readonly<Record<ExperimentId, ExperimentProgressRecord>>
  recentActivities: readonly ProgressActivityEntry[]
}
```

### Per-Experiment Record (`ExperimentProgressRecord`)

Each executable experiment entry contains only plain, serializable JSON primitives:

- `experimentId`: Stable catalog experiment identifier (e.g., `exp-salt-water-001`).
- `experimentDefinitionVersion`: Semantic version of the scientific experiment definition (`1.0.0`).
- `experimentStatus`: `'not-started' | 'in-progress' | 'completed'`.
- `lastActivityAt`: ISO-8601 timestamp of the most recent validated milestone or quiz submission (`string | null`).
- `currentValidatedStepId`: Stable step identifier from `saltExperimentDefinition.steps` (`string | null`).
- `currentValidatedStepIndex`: 0-based index of the active validated step (`number`).
- `completedStepCount`: Number of validated laboratory steps completed (`0..totalStepCount`).
- `totalStepCount`: Total number of validated steps in the executable experiment definition (`9` for `exp-salt-water-001`).
- `experimentCompleted`: Boolean flag set to `true` only when `workflow.completed === true` in the simulation store.
- `experimentCompletedAt`: ISO-8601 completion timestamp (`string | null`).
- `latestQuizResult`: `QuizProgressSummary | null` copied directly from the T27/T28 `AssessmentResultRecord` (`attemptId`, `assessmentId`, `assessmentVersion`, `score`, `maxScore`, `percentage`, `correctCount`, `totalQuestions`, `submittedAt`).
- `quizAssessmentVersion`: Semantic version of the submitted assessment definition (`string | null`).

---

## 2. Validated Milestone Tracking & Animation Write Protection

Progress updates are connected to `useSaltSimulationStore` (`src/features/progress/state/studentProgressStore.ts`) via a milestone-gated listener:

1. **No False Starts on Page Load:** Simply navigating to `/experiments/exp-salt-water-001/lab` leaves `safetyAcknowledged === false`, `stepIndex === 0`, and `completed === false`, so no progress record is created or marked started.
2. **Zero Writes During 3D Animations:** High-frequency 3D transfer ticks (`tickTransfer`), pouring streams (`streamTick`), and stirring effects do not change the milestone tuple `(experimentId, definitionVersion, resetRevision, safetyAcknowledged, stepIndex, completed)`. The listener exits in $O(1)$ without touching `localStorage`.
3. **Tracked Milestones:**
   - `experiment-started`: Recorded when the student acknowledges laboratory safety (`SAFETY_ACKNOWLEDGED`).
   - `step-completed`: Recorded when `workflow.stepIndex` advances after a scientifically validated action.
   - `experiment-completed`: Recorded when `workflow.completed` becomes `true`.
   - `experiment-restarted`: Recorded when the student resets an in-progress or completed experiment (`resetRevision` increments), resetting step progress to Step 1 while preserving `latestQuizResult`.
   - `quiz-submitted`: Recorded when `setLatestAssessmentResult` stores a graded `AssessmentResultRecord` from T27/T28.

---

## 3. Validation, Corruption Recovery, and Storage Fallback

Before loading or saving (`src/features/progress/lib/progressValidation.ts` and `src/features/progress/lib/progressRepository.ts`):

- **Forbidden Payload Guard:** Rejects functions, class instances, React elements (`$$typeof`), Three.js objects (`isObject3D`, `isMesh`, `isBufferGeometry`, `isMaterial`), and credential/secret fields (`password`, `accessToken`, `refreshToken`, `secret`, `apiKey`).
- **Unknown & Planned Experiments:** Drops unknown experiment IDs (`UNKNOWN_EXPERIMENT_ID`) and ensures planned experiments (`exp-volume-002`, `exp-ph-003`) are never counted as started or completed activities.
- **Version Drift Protection:** If a stored record's `experimentDefinitionVersion` does not match the current `saltExperimentDefinition.version`, the outdated step progress is safely discarded (`OUTDATED_DEFINITION_VERSION`).
- **Storage Failure Fallback:** If `window.localStorage` is disabled, blocked by browser privacy settings, or throws `QuotaExceededError`, `createLocalProgressRepository` falls back to an in-memory session envelope and surfaces `storageHealthy: false` in the UI.

---

## 4. Honest Resume Behavior (`Continue` vs. `Restart Experiment`)

Because 3D apparatus coordinates (`useLabSceneStore`) and active pouring/weighing states live in tab memory:

- **`continue-live-session` (`Continue`):** Shown only when `useSaltSimulationStore` is actively in progress for that experiment in the current browser tab.
- **`restart-required` (`Restart Experiment`):** Shown when `in-progress` step counts were loaded from `localStorage` after a page refresh, honestly informing the student that starting the laboratory will begin a clean 3D session from Step 1.
