# Curriculum data structure — T03

T03 adds a data layer for **Grade → Term → Unit → Lesson → Experiment**. It does
not add curriculum UI, login state, a database, Supabase, API calls, or new
scientific definitions. All existing application and simulation files are kept
unchanged. T04 has not been started.

## Models and relationships

`src/types/curriculum.ts` is the entry point for the new student curriculum types.

| Model                   | Fields                                                          | Relationship                                                  |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Grade                   | `id`, `slug`, `title`, `order`                                  | Parent of terms                                               |
| Term                    | `id`, `gradeId`, `slug`, `title`, `order`                       | Belongs to one grade                                          |
| Unit                    | `id`, `termId`, `slug`, `title`, `order`                        | Belongs to one term                                           |
| Lesson                  | `id`, `unitId`, `slug`, `title`, `order`                        | Belongs to one unit; reused from existing types               |
| Experiment              | Existing catalog metadata                                       | Reused from `types/experiment.ts`; never copied into lessons  |
| LessonExperiment        | `lessonId`, `experimentId`, `order`                             | Joins a lesson to an experiment                               |
| CurriculumRelationships | `lessonExperiments`                                             | Collection of joins; other parent keys live on their entities |
| CurriculumData          | Dataset ID/title/description, content status, and entity arrays | Complete normalized snapshot                                  |

IDs are independent of titles, slugs, and order. Term IDs are unique even when
different grades use the same title, such as First Term. Orders are positive
integers within each parent's list. Equal orders are allowed; selectors break
ties by stable ID. Relationships use the composite identity
`(lessonId, experimentId)`. An experiment can appear in more than one lesson,
with a different order in each, without copying its definition.

The `contentStatus` of a dataset is `sample` or `reviewed`. This describes content
review, not experiment availability; each experiment keeps its existing `demo`
or `planned` status. The sample snapshot's title, description, and status clearly
identify it as demonstration data rather than the official Egyptian chemistry
curriculum.

The older semester-based `Semester`, `Unit`, `CurriculumAssociation`, catalog data,
and catalog selectors in `types/experiment.ts` and `features/experiments/` remain
compatible with existing UI/tests. New student curriculum code should import
`Unit` from `types/curriculum.ts`: it requires `termId`, whereas the legacy catalog
unit requires `semesterId`. No automatic semester-to-grade mapping is assumed.
`Lesson` and `Experiment` are re-exported from the existing models, not redefined.
New lesson membership uses the join collection, not `Experiment.curriculum`.

## Sample organization

`features/curriculum/data/sampleCurriculum.ts` contains all three grade names
requested for the platform. Each grade has First Term and Second Term. Only the
first term of First Secondary Grade has sample units and lessons:

```text
First Secondary Grade
  First Term
    Unit 1
      Lesson 1
        exp-volume-002 — Measuring Liquid Volume (planned)
        exp-ph-003 — Exploring pH Indicators (planned)
      Lesson 2
        exp-volume-002 — Measuring Liquid Volume (planned)
    Unit 2
      Lesson 1
        exp-ph-003 — Exploring pH Indicators (planned)
  Second Term: no units yet
Second Secondary Grade
  First Term: no units yet
  Second Term: no units yet
Third Secondary Grade
  First Term: no units yet
  Second Term: no units yet
```

These four links are **sample relationships only**, using the two already planned
catalog entries. Unit and lesson names carry no invented chemistry topics. No
official curriculum association is asserted and no new chemical experiment is
created. `sampleCurriculum.experiments` references the existing metadata array.

`exp-salt-water-001` remains unassigned, available through the same catalog, details,
and laboratory routes. Its lab URL remains
`/experiments/exp-salt-water-001/lab`, and `/experiments/preview/lab` remains the
preview alias. The sample is not connected to grade/term pages or current catalog
filters; those pages and their existing content are unchanged by T03.

## Read utilities

All utilities in `features/curriculum/lib/curriculumSelectors.ts` accept a dataset
argument. They do not import the sample fixture, modify records, or access stores.
The existing catalog experiment lookup is reused internally.

| Function                                  | Behavior                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `getAvailableGrades(data)`                | Listed grades, including grades with no units/lessons yet                             |
| `getTermsForGrade(data, gradeId)`         | Terms belonging to a known grade                                                      |
| `getUnitsForTerm(data, termId)`           | Units under a reachable grade/term                                                    |
| `getLessonsForUnit(data, unitId)`         | Lessons under a reachable grade/term/unit                                             |
| `getExperimentsForLesson(data, lessonId)` | Existing experiment records in lesson-specific order; skips duplicate/dangling links  |
| `findExperimentById(data, experimentId)`  | Exact ID lookup, independent of curriculum membership; returns `undefined` if missing |
| `getUnassignedExperiments(data)`          | Experiments without a reachable lesson link, in existing catalog order                |

Missing datasets (`null`/`undefined`), missing IDs, unknown parents, and empty
branches return empty arrays, or `undefined` for a single experiment lookup.
Ordered lists are sorted copies; source arrays are not rearranged. Returned
entities are shared canonical records: consumers should treat them as read-only.
A future page can show **No Experiments Available** for an empty experiment list.

```ts
import { sampleCurriculum } from '@/features/curriculum/data/sampleCurriculum'
import {
  getAvailableGrades,
  getTermsForGrade,
  getUnitsForTerm,
  getLessonsForUnit,
  getExperimentsForLesson,
} from '@/features/curriculum/lib/curriculumSelectors'

const grade = getAvailableGrades(sampleCurriculum)[0]
const term = getTermsForGrade(sampleCurriculum, grade?.id)[0]
const unit = getUnitsForTerm(sampleCurriculum, term?.id)[0]
const lesson = getLessonsForUnit(sampleCurriculum, unit?.id)[0]
const experiments = getExperimentsForLesson(sampleCurriculum, lesson?.id)
```

## Integrity and future storage

`validateCurriculum(data)` in `lib/validateCurriculum.ts` reports duplicate entity
IDs, empty IDs, missing parents, repeated lesson/experiment links, and invalid
orders. Reuse across different lessons is valid. Empty datasets and branches are
valid; defensive getters do not invent fallback content for broken references.

The validator checks an **already typed** snapshot. It is not a parser for
arbitrary API JSON, a chemistry validator, or proof of official approval. A future
repository should validate external payload shape first, then check integrity
before publishing content. Read utilities still behave defensively if a reference
is missing during editing.

The arrays are plain serializable records, suited to future grade/term/unit/lesson
tables plus a lesson-experiment join table. An importer can attach the canonical
experiment registry by ID, validate references, and supply a `CurriculumData`
snapshot to the same selectors. Renaming or moving a lesson changes its parent
reference; it does not change an experiment's ID, lab route, or scientific engine.
There is no dependency from the simulation feature back into this curriculum layer.

## Files and verification

New files:

- `src/types/curriculum.ts`
- `src/features/curriculum/data/sampleCurriculum.ts`
- `src/features/curriculum/lib/curriculumSelectors.ts`
- `src/features/curriculum/lib/validateCurriculum.ts`
- `tests/curriculumData.test.mjs`
- `docs/CURRICULUM_DATA.md`

The ten curriculum tests cover the hierarchy, grade-specific term IDs, reuse of
catalog metadata, the unassigned salt demo and its lab ID, missing/empty data,
ordering/immutability, broken references, duplicate IDs/links, invalid orders,
JSON serialization, and editing lesson placement without changing experiments.

Verified on 6 November 2026 with Node v24.19.0 and npm 11.17.0:

| Check                                                                          | Result                                                   |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `npm.cmd run typecheck`                                                        | Passed, exit 0                                           |
| `npm.cmd run lint`                                                             | Passed, exit 0                                           |
| Focused curriculum tests                                                       | 10 passed, 0 failed                                      |
| `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs` | 189 passed, 0 failed, 0 skipped; exit 0                  |
| `npm.cmd run build`                                                            | Passed, exit 0; existing large 3D bundle warning remains |
| Targeted Prettier check                                                        | All six T03 files passed                                 |
| SHA-256 preservation check                                                     | 124 existing files checked; zero changes                 |

The first `npm.cmd test` run was executed alongside other checks and failed when
Vite's native bundler could not allocate memory in three existing UI/route test
processes. It also logged an HMR port-in-use warning. After the build finished,
the complete suite passed with one test file running at a time, using the exact
command above. No existing tests, package scripts, or runtime dependencies were
changed to obtain that result.

The preservation comparison covers the entire simulation feature, existing app,
pages and shared components, original experiment models/catalog/selectors, package
manifests, and Vercel configuration. Existing scientific and route regression
tests passed in the serial suite. No rendered UI changes or full scientific
browser workflow are part of this data-only task.
