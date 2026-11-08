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

---

# T48 — Account-Based Progress Sync

Signed-in students' progress is now saved to their Supabase account. Logged-out visitors keep the device-only behaviour above, unchanged.

## Database (`supabase/migrations/202611080003_student_progress_sync.sql`)

| Table | Contents |
| ----- | -------- |
| `student_experiment_progress` | One row per (`user_id`, `experiment_id`): `definition_version`, `status`, `current_step_id`/`current_step_index`, `completed_step_count` (the "stage completed" progress), `total_step_count`, `lab_completed_at`, `last_activity_at`, `updated_at` |
| `student_quiz_attempts` | Append-only: `attempt_id` (client id, unique per student), `experiment_id`, `assessment_id`/`assessment_version`, `score`, `total`, `percentage`, `correct_count`, `total_questions`, `answers` (the student's chosen option per question only), `submitted_at` |

- **RLS**
  - Students select, insert and update only their own progress rows.
  - Students select and insert only their own attempts.
  - Students have no update or delete permission on attempts, and no delete on progress.
  - Users with `admin:access_portal` can read every row, for T49 reports. No separate "reports" permission exists yet; this is the existing admin-only permission.
- `anon` has no access.
- Check constraints keep the data consistent:
  - steps cannot exceed the total, and `completed` requires `lab_completed_at`;
  - score cannot exceed the total, and percentage stays between 0 and 100;
  - `answers` must be a JSON object of at most 16 KB.
- **No answer keys are stored.** `answers` holds only the student's choices. Feedback and correct options are never sent.

## Client

- `src/features/progress/lib/accountProgress.ts` (pure): row ⇄ record mapping, `envelopeFromAccountRows` (latest attempt per experiment, recent activity derived from the rows), `planLocalProgressMigration` and `changedProgressRows`.
- `src/features/progress/lib/accountProgressApi.ts`: the Supabase calls. Progress uses `upsert` on `(user_id, experiment_id)`. Attempts use `upsert(…, ignoreDuplicates)`, which is insert-or-ignore, so no UPDATE permission is needed. Errors become generic messages.
- `src/features/progress/state/studentProgressStore.ts`:
  - **`connectStudentProgressAccount`** loads the account rows. It switches the store to an in-memory, write-through account repository. Every validated lab milestone upserts only the changed experiment row. Every quiz submission inserts the full attempt.
  - **First sign-in on a device** (flag `stem_virtual_lab_progress_migrated_v1:<userId>`):
    - Device progress is uploaded once: local records only when the account has none or an older one, and local quiz summaries the account lacks. Migrated attempts have empty `answers`, because the device kept only the score summary.
    - The device copy is then **removed**, so another student signing in on a shared computer does not inherit it.
    - The page shows "Progress saved on this device was added to your account."
  - **Failures**:
    - If the account can't be loaded, device progress stays visible with a warning.
    - If a save fails, the data stays queued and the page shows a warning with **Try again**. The retry also runs with the student's next step.
  - **`disconnectStudentProgressAccount`** (sign-out) returns to device storage. Account data is never written to the device.
- `src/features/progress/components/ProgressAccountSync.tsx` is mounted in `App` inside `AuthProvider`. It connects when the auth status is `authenticated` and disconnects for anonymous, error or unavailable states.
- `/progress`:
  - In account mode it shows "saved to your account" wording, a syncing line, sync messages and an account privacy notice, and hides **Clear Local Progress**.
  - Device mode is unchanged, apart from a hint that logging in saves progress to the account.

## Known limits

- Detailed 3D bench positions are still not saved. An unfinished experiment shows **Restart Experiment** on another device.
- Progress rows are self-reported by the browser: a student could edit their own row through the API. These are practice records, not certification.
- Progress made while logged out after the first migration stays on the device. It is not merged into the account on later sign-ins.

## Verification

- `tests/accountProgress.test.mjs` (7 tests, with a fake API) covers:
  - the mapping round trip (no spurious writes);
  - answers holding choices only;
  - choosing the latest attempt and dropping unknown experiments;
  - the migration plan;
  - the full sign-in → migrate → write-through → sign-out → sign-in flow;
  - a second account not inheriting progress;
  - save failure → error → retry;
  - load failure → device fallback.
- `supabase/tests/student_progress_rls_transaction.sql`:
  - It passed in PGlite, with stubs for `auth`, `experiments` and the role helpers.
  - Negative controls (SELECT `true`, attempt INSERT `true`) made it fail as expected.
  - PGlite caught a real bug before release: a named constraint collided with Postgres' auto-generated column check name.
- Full suite: 389 pass. Typecheck, lint and build pass.
- Browser: logged-out `/progress` shows the device-mode text and hint, with no new console errors.
- **Not verified:**
  - the migration on the real Supabase project (not applied);
  - a real signed-in sync (Claude did not sign in);
  - a sign-in on a second device.
