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

## Verification

The new `tests/studentRoutes.test.mjs` checks direct route rendering, forward
links, planned and unknown IDs, empty results, the absence of account forms,
navigation context, encoded experiment URLs, and fallback behavior. Existing
route and simulation tests continue to cover both laboratory entry points and
scientific behavior.

Final command and browser results are reported with the T02 delivery.
