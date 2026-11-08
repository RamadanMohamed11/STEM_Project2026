# T43 — Interactive Safety Page

The `/safety` page keeps all T12–T14 lessons. It now adds three interactive sections and requires students to finish them before **Continue to Grade Selection**. The route order is unchanged: Safety, then Choose Grade.

## Page order

| #   | Section (anchor)                                | Type                             |
| --- | ----------------------------------------------- | -------------------------------- |
| 01  | Why safety matters (`#why-safety`)              | Lesson                           |
| 02  | Your protective equipment (`#ppe-guide`)        | Lesson                           |
| 03  | **Get lab ready** (`#lab-ready`)                | Activity, required               |
| 04  | Before entering the laboratory                  | Lesson                           |
| 05  | Good habits in the lab                          | Lesson                           |
| 06  | Laboratory equipment safety guide               | Explorer (T13/T42)               |
| 07  | **What to do in an emergency** (`#emergencies`) | Practice scenarios, not required |
| 08  | **Quick understanding check** (`#quick-check`)  | 3 MCQ, required (3/3)            |
| —   | Safety Checklist (`#safety-checklist`)          | 6 acknowledgements, required     |

## Get lab ready

`components/LabReadyActivity.tsx` shows an original SVG student. In the activity's scenario, the teacher's risk assessment calls for a coat, goggles, gloves, closed shoes and tied-back hair. This framing keeps the T12 rule that gloves depend on the activity. Five correct items each change the drawing. Three distractors explain why they are not allowed instead of being added: sandals, a snack and drink, and dangling jewellery.

- Students can drag an item onto the figure (HTML5 drag and drop). As the keyboard and touch alternative, they can press an item button to toggle it (`aria-pressed`).
- Feedback is shown in a polite live region. The progress element shows how many items are on, and there is a Start again button.

## Emergency scenarios

There are five scenarios: a small fire, a splash in the eyes, a chemical on the skin, an unusual gas smell, and broken glass. Each is a native radio group, and choosing an answer shows immediate feedback with the explanation. These are practice only and do not block progress. Every scenario starts with telling the teacher. This is general guidance; no chemical-specific first aid is given.

## Quick understanding check and gating

`SafetyQuickCheck` has three questions: who chooses PPE, never tasting chemicals, and reporting incidents. A student passes only with all three correct. They can change answers and check again, and changing an answer after checking clears the pass.

`SafetyChecklist` accepts an optional `requirements` list. `SafetyPage` passes it two items: Get lab ready, and the quick check. Each item shows as To do or Done with a link to its section. Submitting with all six statements confirmed but an activity unfinished shows an alert that names the missing activity.

## Data, state and tests

- `data/labReadiness.ts` holds typed gear items, scenarios and questions with source IDs from `safetyContent.ts`. It also has the pure helpers `getGearProgress`, `scoreChoices` and `isCorrectChoice`.
- State is React state in the mounted page only, like the checklist. Nothing is saved to an account or to browser storage, and a reload starts again.
- `tests/labReadiness.test.mjs` covers data integrity, source references, the scoring and pass rule, and SSR rendering of the sections. Rendering is checked for unchecked radios, the requirement list, and an unchanged checklist checkbox count.

## Verification

- Typecheck, lint, the full test suite and the build were run (see the T43 commit).
- Browser checks in the dev server at 1280 px:
  - A distractor shows its rejection message.
  - All five items show "Ready for the lab!".
  - Continue is blocked with "Finish the quick understanding check" until 3/3 are correct.
  - After 3/3, Continue opens `/grades`.
- At 375 px there is no horizontal overflow (`scrollWidth` = 375).
- Screenshots could not be captured because the preview window was hidden.

Content is draft educational guidance that needs academic review, like the rest of the safety page.
