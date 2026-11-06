# Student journey routing — T02

The existing React Router / BrowserRouter application now has entry points for
the student journey. `PROJECT_BASELINE.md` remains the historical T01 baseline.
No authentication, saved grade/term choices, quiz questions, scores, backend,
dependencies, or simulation behavior are added by T02.

## Route map

| Page                | URL                                       | Current content                                                            |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| Home                | `/`                                       | Existing home with an added Sign Up link                                   |
| Sign Up             | `/signup`                                 | Account feature placeholder; continue without an account                   |
| Login               | `/login`                                  | Login placeholder; continue without an account                             |
| Safety              | `/safety`                                 | Existing safety content, with a link to grades                             |
| Choose Your Grade   | `/grades`                                 | Placeholder; no choices or saved selection                                 |
| Choose Your Term    | `/terms`                                  | Placeholder; no choices or saved selection                                 |
| Experiments Library | `/experiments`                            | Existing searchable catalog, with added View Details links                 |
| Experiment Details  | `/experiments/:experimentId`              | Catalog title/summary, placeholder, Start Experiment for the playable demo |
| 3D Laboratory       | `/experiments/:experimentId/lab`          | Existing unchanged route and simulation                                    |
| Laboratory preview  | `/experiments/preview/lab`                | Existing salt-lab alias preserved                                          |
| Experiment Quiz     | `/experiments/:experimentId/quiz`         | Placeholder; no answer submission                                          |
| Quiz Results        | `/experiments/:experimentId/quiz/results` | Empty state; no fabricated scores                                          |
| Page Not Found      | Unmatched paths                           | Existing 404 page                                                          |

The current playable experiment ID is `exp-salt-water-001`. The two planned IDs
remain `exp-volume-002` and `exp-ph-003`. New experiment pages resolve IDs against
the existing catalog; unknown IDs show Experiment Not Found. Planned details do
not offer Start Experiment. The `preview` alias is specific to the existing lab;
it does not create a second catalog experiment for details or quizzes.

## Layout, links, and future protection

- `app/paths.ts` defines named URL patterns and encoded experiment link builders.
- `app/routes.tsx` retains the existing AppShell and lab route. A pathless
  `StudentRouteBoundary` groups grades, terms, catalog, details, lab, quiz, and
  results. It returns `Outlet` unconditionally. Future login checks can be
  introduced there when authentication is authorized; account, home, and safety
  pages remain outside that boundary.
- `ExperimentRouteLayout` resolves a real experiment once and passes it through
  typed outlet context to details, quiz, and results pages.
- `JourneyPlaceholder` uses the existing PageHeader, ButtonLink, StatusPill,
  design tokens, and page-title hook. It has no data mutations or forms.
- Shared navigation has Explore and Account sections. Details, quiz, and results
  highlight Experiments; lab routes highlight Virtual Lab. Route matching is
  exact so unknown nested URLs do not appear to be real pages.
- Home, account pages, safety, grade, term, and catalog links connect the journey.
  The direct catalog-to-lab link remains available alongside View Details.
- The lab layout is unchanged. Students can use the existing Exit laboratory
  link to return to the catalog, reopen details, and find the quiz. There is no
  automatic quiz redirect or new control inside the simulation.
- Navigation uses React Router links and URL parameters. No prerequisite login,
  grade choice, term choice, prior navigation state, or quiz attempt is needed
  to open a direct link. Back/Forward uses normal browser history.
- `vercel.json` is unchanged: its existing SPA rewrite serves `index.html` for
  nested URLs. A Vercel deployment was not performed by this task.

Keep all future UI in simple English and LTR, as required by the T01 baseline.
These placeholders prepare routes only; they do not start T03 or later features.

## File inventory

Added:

- `src/app/paths.ts` and `src/app/StudentRouteBoundary.tsx`
- `src/components/layout/JourneyPlaceholder.tsx` and `ExperimentRouteLayout.tsx`
- `src/pages/SignUpPage.tsx`, `LoginPage.tsx`, `ChooseGradePage.tsx`,
  `ChooseTermPage.tsx`, `ExperimentDetailsPage.tsx`, `ExperimentQuizPage.tsx`,
  and `QuizResultsPage.tsx`
- `tests/studentRoutes.test.mjs` and `docs/STUDENT_ROUTING.md`

Modified:

- `src/app/routes.tsx` and `src/app/navigation.ts`
- `src/components/layout/NavigationLinks.tsx`
- `src/pages/HomePage.tsx` and `src/pages/SafetyPage.tsx`
- `src/features/experiments/components/ExperimentCard.tsx`

## Verification

The new `tests/studentRoutes.test.mjs` checks direct route rendering, forward
links, planned and unknown IDs, empty results, the absence of account forms,
navigation context, encoded experiment URLs, and fallback behavior. Existing
route and simulation tests continue to cover both laboratory entry points and
scientific behavior.

Verified on 6 November 2026 using the existing Node v24.19.0 / npm 11.17.0
installation:

| Check                             | Result                                                  |
| --------------------------------- | ------------------------------------------------------- |
| `npm.cmd run typecheck`           | Passed, exit 0                                          |
| `npm.cmd run lint`                | Passed, exit 0                                          |
| `npm.cmd test`                    | 179 passed, 0 failed, 0 skipped; exit 0                 |
| `npm.cmd run build`               | Passed, exit 0; existing large 3D chunk warning remains |
| Targeted Prettier check           | All T02 files passed                                    |
| Protected-file SHA-256 comparison | 92 existing files checked; zero changes                 |

The protected comparison includes the entire simulation feature, VirtualLabPage,
AppShell, package manifests, and Vercel configuration.

The production build was served with Vite preview on port 5177 for browser checks:

- Home → Sign Up → Login links worked. Browser Back returned to Sign Up and
  Forward returned to Login, with correct headings and page titles.
- Direct entry worked for grade, term, details, quiz, results, planned details,
  unknown experiment results, and the global 404 page.
- All seven new pages had no horizontal overflow at 320 px and 768 px. Desktop
  account and tablet results layouts, plus the 390 px grade layout, were visually
  checked. The mobile menu showed the new learning and account links and closed
  after choosing a route. Document language remained `en`, with direction `ltr`.
- Start Experiment opened the real 3D laboratory with the existing full-viewport
  layout and rendered apparatus. The direct preview alias also retained the
  immersive layout without standard website navigation.
- No error-level browser messages were captured. Full scientific interactions
  were not repeated in this T02 browser run; the preserved source and existing
  regression suite cover the scientific boundary.

The preview server was stopped after verification. No deployment or real-device
test was performed. The repository-wide formatting debt recorded in T01 remains
outside this task.
