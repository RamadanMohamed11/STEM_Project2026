# STEM Virtual Lab — Project Baseline

Audit date: 6 November 2026 (Africa/Cairo). Scope: **Task T01 only**.

## Baseline and preservation contract

This document describes the live working tree, not just the last commit
(`05d51ee`). The project already contained modified simulation files, a modified
`package.json`, new transfer modules, new tests, and an untracked `artifacts/`
directory before this audit. Those files are part of the existing baseline and
must not be overwritten by restoring the committed or archived version.

T01 adds this documentation only. It does not change application source, routes,
simulation interactions, dependencies, tests, configuration, or existing English
UI text. Running the build regenerates ignored `dist/` output and TypeScript
cache files. A SHA-256 comparison of 159 existing source, test, package, config,
and README files found **zero changes** after verification and documentation.

The existing product is a browser-only educational prototype. It has a working
salt-dissolution simulation, a small catalog, a home page, and a safety overview.
It does not yet provide a complete secondary-school curriculum website. Some
existing branding and descriptions refer to Faculty of Education students at
Assiut University; approved secondary-school content is not currently supplied.

## Language requirements for future tasks

- Keep the website in English with `lang="en"` and `dir="ltr"`.
- Do not translate existing content or introduce RTL layouts.
- Use simple, clear, natural English suitable for secondary-school students.
- Keep correct scientific terms and explain unfamiliar terms in plain English.
- Preserve existing English UI copy unless a correction is necessary and within
  the task's scope.

These requirements apply to future development as well as this audit. The comment
about eventual localization in `src/app/locale.ts` is not authorization to change
the current language or direction.

## Stack and dependencies

Installed versions were checked with `npm.cmd ls --depth=0`; no dependency was
added, removed, or upgraded.

| Area        | Installed dependencies                                    | Responsibility                                   |
| ----------- | --------------------------------------------------------- | ------------------------------------------------ |
| Application | React / React DOM 19.3.1, TypeScript 5.9.3                | Strictly typed React UI                          |
| Routing     | React Router 8.5.1                                        | Declarative `BrowserRouter` and nested routes    |
| Build       | Vite 8.3.5, React plugin 6.1.2                            | Development server and production bundle         |
| Styles      | Tailwind CSS / Vite plugin 4.3.3                          | CSS-first tokens and utilities                   |
| Icons       | Lucide React 1.66.0                                       | Navigation and control icons                     |
| 3D          | Three.js 0.187.0, React Three Fiber 9.8.2, Drei 10.7.9    | Scene rendering, camera, labels, asset helpers   |
| Physics     | React Three Rapier 2.2.0                                  | Fixed tabletop and kinematic equipment colliders |
| State       | Zustand 5.0.16                                            | Separate scene and scientific session stores     |
| Quality     | ESLint 10.14.0, typescript-eslint 8.72.1, Prettier 3.9.10 | Lint and formatting checks                       |

The application uses ES modules and the `@/` alias for `src/`. TypeScript uses
strict checks, no emit, unused-variable checks, and separate app and Vite-config
projects. There is no application backend, API client, database, authentication,
or implemented AI service. Current apparatus is procedural geometry; external
GLB assets are optional through `ModelLoader.tsx`.

## Project structure

There are 127 source files and 23 Node test files at audit time.

```text
src/
  main.tsx                         React StrictMode root and global stylesheet
  app/                             App, route tree, navigation, English locale
  components/
    layout/                        Shared shell, header, navigation and wrappers
    ui/                            ButtonLink and StatusPill
  features/
    home/                          Capability cards and learning-journey visuals
    experiments/
      components/                  Catalog, filters, cards and illustrations
      data/                        Demonstration catalog and display mappings
      lib/                         Pure catalog and curriculum selectors
    safety/                        General safety overview
    simulations/
      components/                  Immersive lab UI and supporting panels
      data/                        Presentation/inventory and workflow definition
      engine/                      Pure chemistry, workflow, event and transfer rules
      state/                       Zustand stores and cross-store actions/selectors
      lib/                         Contextual guidance and feedback selectors
      three/                       Canvas scene, camera, interaction and movement
        models/                    Eight apparatus models and shared geometry
        effects/                   Liquid, solid, stirring and transfer visuals
  hooks/                           Document locale and page title
  mocks/                           Product capability preview descriptions
  pages/                           Home, experiments, virtual lab, safety, not-found
  styles/                          Tailwind import, global styles and theme tokens
  types/                           Experiment/curriculum and laboratory contracts
public/                            Favicon
tests/                             Node tests and optional Python browser scripts
artifacts/                         Existing reports, screenshots and archived source
docs/PROJECT_BASELINE.md            This T01 baseline
```

`dist/` and `node_modules/` are generated/installed directories. Existing root
screenshots, reference video, `artifacts/initial-source/`, and earlier audit
reports are not application entry points or evidence of a new T01 test run.

## Application entry, routes and navigation

The render path is `main.tsx` → `app/App.tsx` → `BrowserRouter` → `AppRoutes` →
`AppShell` → the selected page. `useDocumentLocale` applies the English LTR
default; `usePageTitle` supplies page-specific document titles.

| URL                                              | Current behavior                                       |
| ------------------------------------------------ | ------------------------------------------------------ |
| `/`                                              | Home page, capability preview, getting-started journey |
| `/experiments`                                   | Searchable and filterable demonstration catalog        |
| `/experiments/exp-salt-water-001/lab`            | Playable immersive salt-and-water lab                  |
| `/experiments/preview/lab`                       | Compatibility entry point for the same salt lab        |
| `/experiments/exp-volume-002/lab`                | Planned Measuring Liquid Volume page; no scene         |
| `/experiments/exp-ph-003/lab`                    | Planned Exploring pH Indicators page; no scene         |
| `/experiments/:experimentId/lab` with unknown ID | Experiment-not-found state with catalog return link    |
| Any unmatched path                               | Global not-found page                                  |

`VirtualLabPage.tsx` resolves the stable experiment ID, checks availability, and
looks up its presentation. It also has a defensive workspace-unavailable state
for an available entry without a registered presentation.

`app/navigation.ts` is the shared source for Home, Experiments, Virtual Lab, and
Safety Procedures links and active-page matching. Virtual Lab deliberately points
to `/experiments/preview/lab`; preserve that URL.

The normal shell uses an 80 px icon rail at 768–1279 px, a 248 px sidebar at
1280 px and above, and a native modal navigation drawer below 768 px. The drawer
supports Escape, outside click, focus handling, route-close behavior, and scroll
locking. The standard shell provides a skip link, header, content wrapper, and
footer.

The two playable lab URLs use a separate full-viewport shell (`h-dvh`, no vertical
page scrolling), without the normal sidebar/header/footer. This distinction is
currently hard-coded in `AppShell.tsx`. Other routes keep the standard shell.
`vercel.json` supplies a SPA rewrite; other static hosts need their own nested-URL
fallback to `index.html`.

## Design system and shared UI

`styles/tokens.css` defines Tailwind `@theme` colors, typography, spacing, radii,
shadows, and breakpoints. The base look uses navy (`#162635`), teal (`#138b85`),
light canvas (`#f4f6f7`), white cards, muted borders, and semantic status colors.
The font stack starts with Segoe UI, followed by Inter and system fonts.
Breakpoints are 640, 768, 1024, and 1280 px.

`styles/global.css` supplies the reset, 320 px minimum body width, focus outlines,
selection styling, guide progress styling, and a CSS reduced-motion override.
Most styling lives in component Tailwind classes. `PageContainer`, `PageHeader`,
`ButtonLink`, and `StatusPill` are the main reusable website primitives.

The immersive lab has a distinct dark navy/teal HUD with translucent overlays,
many locally specified colors, and responsive inventory, measurements, guidance,
help, results, and object-interaction panels. Reuse website tokens for new pages;
do not globally restyle the lab to make it match a future page layout. The CSS
reduced-motion rule alone does not establish reduced motion for Three.js effects.

## Experiment catalog and curriculum data

`types/experiment.ts` defines stable experiment IDs, slugs, categories, difficulty,
duration, safety metadata, availability, and optional curriculum associations.
It already models `Semester` → `Unit` → `Lesson` relationships.

`features/experiments/data/mockExperiments.ts` contains three illustrative entries:

| ID                   | Title                    | Availability  | Duration |
| -------------------- | ------------------------ | ------------- | -------- |
| `exp-salt-water-001` | Dissolving Salt in Water | Playable demo | 10 min   |
| `exp-volume-002`     | Measuring Liquid Volume  | Planned       | 15 min   |
| `exp-ph-003`         | Exploring pH Indicators  | Planned       | 20 min   |

Categories are Chemistry and Measurement; all entries are beginner level. The
semester, unit, and lesson arrays are empty. Semester filtering is therefore
disabled and labeled “Not assigned yet.” These are not approved course records.

`catalogSelectors.ts` implements case-insensitive search across title,
description, slug, and category; category/status/semester filters; curriculum
association resolution; semester grouping; ID lookup; and encoded lab links.
`ExperimentCatalog` owns local filter state and result counts. Planned cards
do not offer a playable-lab link. `CatalogEmptyState` provides recovery from
filters with no results.

## Existing 3D laboratory architecture

All paths in this section are under `src/features/simulations/` unless stated.

| Layer                | Important modules                                                                             | Responsibility                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Route composition    | `components/LaboratoryLayout.tsx`                                                             | Persistent scene plus inventory, HUD, guide, results, restart and fullscreen                           |
| Renderer boundary    | `components/LaboratoryCanvas.tsx`                                                             | Lazy scene import, loading state and error boundary                                                    |
| Scene                | `three/LaboratoryScene.tsx`                                                                   | R3F Canvas, camera, environment, lighting, physics, placement, labels, effects and WebGL recovery      |
| Spatial authority    | `state/useLabSceneStore.ts`                                                                   | Placement, positions, rotations, hover, selection/pairs, press/drag state, relationships, camera reset |
| Scientific authority | `state/useSaltSimulationStore.ts`                                                             | Chemistry, workflow, accepted events, transfers, effects, validation, reset revision                   |
| Apparatus            | `three/sceneConfig.ts`, `three/models/`, `three/EquipmentRenderer.tsx`                        | Stable IDs, dimensions, footprints, model rendering and quantity-driven visuals                        |
| Pointer input        | `three/useEquipmentManipulation.ts`, `selectionLogic.ts`, `gestureMath.ts`                    | Click/grab distinction, pointer capture, drag, scoop, weighing and circular stirring                   |
| Placement/movement   | `three/PlacementController.tsx`, `movement.ts`                                                | Bench projection, ghost preview, bounds, swept collision and valid placement                           |
| Pair transfers       | `components/PairInteractionPanel.tsx`, `engine/materialTransfers.ts`                          | Compatible source/receiver routes, amounts, units, capacity and operation creation                     |
| Transfer execution   | `three/MaterialTransferController.tsx`, `engine/materialTransferWorkflow.ts`                  | Timed quantities, receipt validation, cancellation and safe return                                     |
| Transfer poses       | `three/transferMotion.ts`, `equipmentPose.ts`, `equipmentVisualAnchors.ts`                    | Absolute visual poses and source/receiver model anchors                                                |
| Scientific rules     | `engine/saltExperiment.ts`, `workflow.ts`, `simulationEvents.ts`                              | Chemistry conservation, prerequisites and evidence-based progress                                      |
| Guidance             | `lib/contextualGuidance.ts`, `lib/mouseInteractionCoach.ts`, `state/useContextualGuidance.ts` | Contextual hints without scientific state changes                                                      |
| Effects              | `three/SimulationSceneEffects.tsx`, `three/effects/`                                          | Streams, liquid fills, salt solids and stirring response                                               |
| Session boundary     | `state/sessionActions.ts`, `state/sessionSelectors.ts`                                        | Unified restart and a diagnostic cross-store summary                                                   |

The bench is 6.4 × 3.25 world metres at Y = 0.78. Eight stable apparatus IDs are
registered: `beaker`, `digital-balance`, `water`, `graduated-cylinder`,
`sodium-chloride`, `spatula`, `weighing-boat`, and `stirring-rod`. Only the beaker
and balance start on the bench.

Rapier uses zero gravity, a fixed bench collider, and kinematic equipment
colliders. The scene store is the authority for positions; physics mirrors it.
Pure movement rules enforce tabletop boundaries and avoid crossing apparatus.
This is not a free-falling rigid-body or physical fluid simulation. Camera
framing is separate from scientific coordinates, with bounded orbit/pan/zoom,
aspect-aware fitting, and disabled camera input during equipment manipulation
and automatic transfers.

### Selection, movement and placement

- A completed click toggles apparatus selection. Ordinary sequential clicks can
  select a pair; Ctrl/Command can replace the second object. `selectedId` and
  `selectedIds` coexist for compatibility. A genuine drag must not become a click.
- Inventory offers drag-and-drop and click-item/click-bench placement. A ghost
  model and validity message precede commitment. Invalid drops stay editable;
  Escape cancels. Hover labels and selection rings are presentation only.
- Equipment movement projects the pointer ray onto world-space planes, applies
  validated/swept movement, and captures the pointer. Cancellation restores the
  prior placement/contact where appropriate. Stirring and scooping use separate
  vessel-opening projections and gesture evidence.
- Some return/rotate/reset capabilities remain in store APIs and older panels;
  their presence in source does not mean every control is exposed in the current
  immersive HUD.

### Material transfer

The current live UI uses **Smart Transfer**: select two placed objects, choose an
enabled direction, enter an amount and unit, and start the transfer. A single
selection shows contents; unsupported or premature pairs explain their limits.
This is the current implementation, even though older README sections describe
TILT grips as the primary control.

`materialTransfers.ts` validates supported equipment/material routes, safety,
placement, workflow stage, scientific checkpoints, available material, and free
capacity. Water supports mL/L with 0.1 mL canonical precision; NaCl supports g/mg
with 0.001 g canonical precision. Exact decimal conversion rejects unsupported
precision instead of silently rounding the requested quantity.

An operation has approach, flow, and return phases. Only flow delivers material.
Its controller is mounted outside the Canvas and advances authority independently
of R3F rendering, using bounded elapsed-time ticks. The renderer reads its absolute
pose; animation completion alone cannot manufacture a successful experiment.
Duplicate requests and stale operation/session callbacks are guarded.

Cancel, Escape, blur, document hiding, and unmount use safe-return handling. Already
delivered material remains delivered. Equipment stays locked until the return
finishes. Scene positions remain the bench/home authority while the model moves
through its transfer pose.

The allowed teaching sequence measures stock water into the cylinder, then moves
the measured water into the beaker. During that pure-water stage, compatible
cylinder/beaker reverse transfers can be resolved. Direct stock-to-beaker use and
post-salt solution transfers are restricted. Solid transfers follow jar → spatula
→ weighing boat → beaker, with physical balance contact required before addition.
Legacy direct-interaction APIs remain for compatibility and regression tests.

### Measurements, chemistry and progress

The initial stock is 400 mL water and 100 g NaCl. Container capacities are 500 mL
for the stock water vessel, 100 mL for the cylinder, and 250 mL for the beaker.
The target is **100 mL water plus 5 g NaCl**.

The HUD reads actual modeled quantities from the scientific store. Balance mass
comes from salt on a tared weighing boat with a validated boat/pan relationship;
selecting the balance alone does not establish a measurement. Dissolved and
undissolved salt are tracked separately. Dissolution uses a simplified teaching
rate and an approximate solubility limit, not calibrated sensor readings, CFD,
or validated real-world kinetics.

`data/saltExperimentDefinition.ts` declares five stages and nine ordered steps:

1. Confirm safety and inventory.
2. Position/validate the beaker.
3. Measure 100 mL water in the cylinder.
4. Transfer the measured water into the beaker.
5. Scoop and weigh 5 g NaCl.
6. Add exactly that measured salt to the beaker.
7. Stir with valid rod circles until no solid remains.
8. Record the observation.
9. Inspect/review the solution to complete the experiment.

Safety confirmation also validates the already placed beaker, so the initial UI
can advance directly from step 1 to step 3. Successful dissolution emits the
observation automatically after validated stirring; final inspection uses a
beaker click. These are existing behaviors, not skipped scientific requirements.

`workflow.ts`, `simulationEvents.ts`, and the transfer adapter check step order,
actors/targets, units, quantities, conserved stock, chemistry checkpoints, and
accepted evidence. Invalid actions do not advance progress. The guide's separate
reading position and visual effects do not authorize completion. Results depend
on validated completion.

`restartExperimentSession()` cancels/resets the scientific session first, restores
equipment, and resets the camera. The chemistry store alone also clears balance
relationships. Zustand state is held in memory without storage middleware: it
can survive client-side route changes during the page lifetime, but there is no
saved student history across reloads or devices.

## Modules to preserve and safe integration points

Treat the simulation engine, both stores, spatial relationships, stable equipment
and experiment IDs, transfer timing/receipt checks, placement validation, pointer
capture/cancellation, camera coordination, procedural models, and associated
tests as protected behavior. Do not replace the simulation to add website pages.
Do not reset its stores in a shared layout effect or advance scientific progress
from website navigation, guide reading, animation callbacks, or new UI counters.

| Future concern              | Best existing integration point                                          | Boundary to respect                                                                   |
| --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Student website pages       | `src/pages/`, `app/routes.tsx`, shared layout components                 | Add normal pages under the existing shell; preserve immersive lab routing             |
| Website navigation          | `app/navigation.ts`, `NavigationLinks`, sidebar/mobile navigation        | Keep links consistent and preserve the preview alias                                  |
| Secondary-school curriculum | `types/experiment.ts`, catalog data and curriculum selectors             | Populate approved local content through existing associations; keep stable IDs        |
| Experiment information      | Catalog cards plus separate route-level content                          | Reuse metadata and link to the existing lab; do not put course UI inside the Canvas   |
| Student progress display    | Read-only projections of accepted workflow state/events                  | Scientific completion remains authoritative; do not treat guide reading as completion |
| Session reporting           | `state/sessionSelectors.ts`                                              | Use only as a starting summary; it is not a complete persistence contract             |
| Lab guidance/reference      | `saltDissolutionWorkspace.ts`, guidance selectors, `ExperimentGuide`     | Keep explanations separate from execution and validated evidence                      |
| Visual consistency          | `styles/tokens.css`, shared UI primitives                                | Scope new styles so they do not disturb the existing lab HUD or canvas sizing         |
| Future experiments          | Catalog/presentation lookup, workflow types, scientific adapter boundary | A new catalog row alone cannot create a working lab                                   |

The lab layout, scientific store, transfer engine, definition imports, and
`AppShell` immersive-path matcher are currently salt-specific. Registering another
simulation would require a deliberate adapter/registry change across those
boundaries; this audit does not implement that abstraction.

Several older panels (`ExperimentInteractionPanel`, `ExperimentExecutionPanel`,
`InventoryPanel`, `SimulationMeasurements`, `ExperimentControls`) and
`EducationalAssistantPlaceholder` exist but are not mounted by the current
`LaboratoryLayout`. Their tests/components are not a reason to reintroduce old
procedure-button flows or implement an AI service.

## Verification performed for T01

Environment: Windows PowerShell, Node **v24.19.0**, npm **11.17.0**, existing
installed dependencies. Commands ran against the current working tree.

| Check                      | Result                     | Actual evidence                                          |
| -------------------------- | -------------------------- | -------------------------------------------------------- |
| `npm.cmd ls --depth=0`     | PASS, exit 0               | Installed dependency tree resolved                       |
| `npm.cmd run typecheck`    | PASS, exit 0               | `tsc -b --pretty`, app and Vite config                   |
| `npm.cmd run lint`         | PASS, exit 0               | `eslint .`                                               |
| `npm.cmd test`             | PASS, exit 0               | **176 passed, 0 failed, 0 skipped**, 23 test files       |
| `npm.cmd run build`        | PASS, exit 0, with warning | 2,781 modules transformed; production output generated   |
| `npm.cmd run format:check` | FAIL, exit 1               | 16 pre-existing files under `artifacts/` need formatting |

The automated suite includes catalog selectors, static route rendering, scene
state/composition, click/drag selection, placement/movement, gestures, contextual
guidance, transfer validation/store/timing/poses, chemistry conservation, forged
or stale evidence rejection, all nine workflow steps, reset, and controller
cancellation. These are domain/component checks, not a claim that every case ran
through a physical GPU browser.

Browser smoke checks also ran through the in-app browser against a temporary
Vite server at `http://127.0.0.1:5176`:

- Home → catalog navigation and searching “salt” reduced the catalog to one result.
- The live lab rendered its bench, beaker, and balance; selection and a real
  pointer drag visibly moved the beaker.
- Safety confirmation produced 2/9 validated steps and the water-measurement step.
- Water and cylinder were placed through inventory click/bench click.
- Two-object transfer moved 100 mL stock water into the cylinder: the panel showed
  300 mL remaining stock, the HUD showed 100 mL cylinder, and progress reached 3/9.
- A second transfer moved that 100 mL into the beaker: the HUD showed 100 mL beaker,
  0 mL cylinder, and progress reached 4/9 at the salt-measurement step.
- Restart restored 0/9, empty beaker/cylinder, and the original two bench objects.
- The preview alias, both planned routes, unknown experiment state, safety page,
  and global not-found route displayed their expected content. The pH planned
  route was verified with a fresh full state after a differential snapshot omitted
  its unchanged shared heading.
- No browser error-level messages were captured. Three warning messages are
  recorded below. The temporary development server was stopped after verification.

The existing Python browser scripts were **not run**: `python` is unavailable on
PATH, the installed Python 3.12 executable cannot run in this environment, and
the accessible bundled Python does not contain the `playwright` package. No
package was installed to work around this. The in-app browser smoke checks above
are a separate verification run, not a pass for those Python suites.

The new `docs/PROJECT_BASELINE.md` separately passes its targeted Prettier check.

Not verified end-to-end in this browser session: salt scooping/depositing, physical
boat weighing, salt addition, rod circles, final results, interruption cases,
mobile/touch layouts, keyboard-only completion, or physical-device performance.
The deterministic automated tests cover their underlying rules; additional
browser/device acceptance remains appropriate before a student-facing release.

## Known issues and limitations

1. **Large 3D bundles:** Vite warns about minified chunks over 500 kB. The emitted
   `react-three` chunk is 2,738.97 kB (1,002.42 kB gzip), `three-engine` is
   743.21 kB (187.71 kB gzip), and the lazy scene is 64.37 kB. The main index JS is
   220.72 kB. Existing lazy loading and chunk groups are already configured;
   performance work should measure the current behavior before changing them.
2. **Outdated feature copy:** `HomePage.tsx`, `mocks/platformPreview.ts`, and the
   catalog footer still describe chemistry as planned/not simulated; the capability
   description says six apparatus although the current inventory has eight. The
   existing README and workflow description also retain tilt-first instructions.
   Current source and browser behavior establish Smart Transfer as the live flow.
   No UI copy was changed during T01.
3. **Runtime compatibility warnings:** The browser reported deprecated
   `THREE.Clock`, deprecated initialization parameters, and removal of
   `PCFSoftShadowMap` with fallback to `PCFShadowMap`. They did not prevent the
   tested scene/transfers. Their exact dependency/source ownership was not fully
   traced; do not upgrade dependencies or change rendering during this audit.
4. **Formatting debt is in existing artifacts:** The repository-wide Prettier
   check reports 16 JSON/Markdown files in `artifacts/`. This is separate from the
   passing TypeScript/lint/build/tests. Do not reformat those reports as part of
   T01 or treat earlier evidence as this run's output.
5. **The session summary is incomplete for future saves:**
   `getExperimentSessionSnapshot()` does not include the active Smart Transfer,
   both selected IDs, event history, or full workflow evidence; its interaction
   status does not check the new `transfer` field. It should not be used as a
   complete save/restore payload or definitive transfer-busy signal.
6. **Content and service gaps:** Curriculum groupings are empty; two experiments
   are planned; no student accounts, persistent learning history, backend, or AI
   service exists. Safety content is general orientation and scientific values
   are modeled teaching values. These are scope limits, not T01 implementation work.
7. **Existing dirty working tree:** New transfer modules and tests are not yet
   tracked, and many simulation files differ from HEAD. Future tasks must preserve
   that working state rather than replacing it with `artifacts/initial-source/`
   or a clean checkout.

No Task T02 or later feature was started. Future work can build around the existing
route, catalog, layout, and read-only state boundaries documented here.
