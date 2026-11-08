# STEM Virtual Lab — Completion Plan (Task Breakdown)

## How to use this plan (read first — applies to EVERY task)
Each task below is self-contained. Give the executing model **this whole file plus the task ID** (e.g. "Execute T39").

**Global rules every model must follow:**
1. Do ONLY what the task's "Scope" says. Anything in "Do NOT" or not listed is out of scope — stop and ask instead of improvising.
2. UI language is **English only**. No i18n, no RTL, no Arabic UI text.
3. Reuse existing components, styles, data shapes and helpers before creating new ones. Follow the existing folder pattern `src/features/<feature>/{components,data,lib,state,types}` and Tailwind tokens in `src/styles/global.css` (`navy`, `teal`, `ink`, `line`, `surface-muted`, `shadow-card`).
4. Never put secrets (API keys) in frontend code or committed files.
5. Do not change database tables, RLS policies or auth settings unless the task says so; schema changes go in a new file in `supabase/migrations/` named `YYYYMMDDNNNN_<name>.sql`.
6. Do not delete or rewrite working features (salt simulation, quiz, admin, auth) unless the task says so. Existing tests in `tests/` must keep passing.
7. Do not copy third-party lab software (e.g. NOBOOK seen in the reference video): no copied images, names, layouts pixel-for-pixel or assets. Mechanics may be similar; design and 3D models must be our own.
8. Every task ends with the **Definition of Done** (bottom of file) and one commit: `feat(<area>): <TaskID> <short summary>`.
9. If something in the task is ambiguous, write the question in the final message instead of guessing.

---

## Context
**Sources reviewed:** `Project.txt` (full product spec), `مثال على شكل تنظيم التجارب.jpeg` (curriculum layout: Grade → Term badge → Unit → card per Lesson → bulleted Experiments), `مثال على المشروع.mp4` (reference virtual lab: left sidebar with categories *Reaction vessel / Assistive devices / Solid chemical / Liquid chemicals / Gas chemicals*, search box, A–Z index, item cards with images, drag items onto a dark workbench, on-screen volume readout like `0.1mL / 154.3mL`, a particle/molecule view, and a "chemical experiments carry risks" disclaimer).

**Already built (T1–T35, see git log and `docs/`):** Home page, Supabase sign-up/login/password recovery, Safety page, Choose Grade, Choose Term, curriculum browser, lesson page, experiment details, five learning stages viewer (with video placeholders), 3D lab (React Three Fiber + Rapier + Zustand) for ONE experiment (salt dissolution), results summary + contextual safety warnings, MCQ quiz + scoring + results + encouragement animations, browser-local progress page, admin (roles/permissions, curriculum, experiments, question bank).

**Gaps this plan covers:**
- Lab supports only salt dissolution; engine and registry are hardcoded (`src/features/simulations/lib/simulationRegistry.ts` returns `undefined` for anything except the salt experiment).
- Curriculum is sample data (`src/features/curriculum/data/sampleCurriculum.ts`, ~15 entries; `src/features/experiments/data/mockExperiments.ts`, 5 experiments).
- Demonstration videos are placeholders (`src/features/experiments/data/experimentLearningStages.ts`, `video:` blocks).
- AI assistant is a static placeholder (`src/features/simulations/components/EducationalAssistantPlaceholder.tsx`).
- Admin Students/Reports are placeholders (`src/pages/AdminSectionPlaceholderPage.tsx`).
- Progress is browser-local only.
- Large main bundle (see `docs/KNOWN_ISSUES.md`).

**Decisions made by the owner:**
- UI: English only.
- AI provider: **NVIDIA build / NIM API** (`https://integrate.api.nvidia.com/v1`, OpenAI-compatible chat completions). The key lives only in a Supabase Edge Function secret.
- The virtual lab upgrade is done last, step by step (Phase 4).

## Model selection guide
| Difficulty | Model + effort | Typical work |
|---|---|---|
| 1–3 | **Gemini 3.8 Flash High** | Data/content entry, simple pages following an existing pattern, cleanup |
| 4–5 | **Claude 5.5 Low** (4) / **Claude 5.5 Medium** (5) | Medium UI components, Supabase wiring |
| 6–7 | **Claude 5.5 High** (or **GPT 6.1 Sol** as alternative) | Complex logic, 3D interaction, backend functions |
| 8–10 | **Claude 5.5 Extra** | Core architecture (generic chemistry engine) |

Rule: repetitive tasks that follow a template created by a stronger model (new experiment data, new 3D model after the first few) go to Gemini, then a quick **Claude 5.5 Low** review.

Recommended order: T36 → T37 → T38 → T39 → T40 → T42 → T41 → T44 → T43 → T45 → T46 → T47 → T48 → T49 → L1 → (L2 ∥ L4a) → L3 → L4b → L5 → L6 → L7 → L8 → L9 → L11 (ongoing) → L10 → L12.

---

# Phase 0 — Cleanup & stability

### T36 — Repository cleanup
- **Difficulty:** 1 · **Model:** Gemini 3.8 Flash High
- **Goal:** Clean working tree and commit pending work.
- **Scope:**
  1. Commit the currently modified files (`src/app/App.tsx`, layout components, home components, `src/styles/global.css`, new `src/components/layout/ScrollToTop.tsx`) as one commit `chore: T36 commit pending UI polish` — first run Definition of Done checks; if they fail, report and stop.
  2. Create `docs/reference/` and move `Project.txt`, the reference `.mp4` and `.jpeg` there (rename to `project-spec.txt`, `reference-lab-video.mp4`, `curriculum-layout-example.jpeg`).
  3. Move root screenshots (`taskc-preview.png`, `taske-desktop-preview.png`, `taskf-*.png`) into `docs/reference/screenshots/`.
  4. Confirm the deleted `WhatsApp Video ...mp4` stays deleted.
- **Do NOT:** touch `src/` logic, `dist/`, `node_modules/`, or `.gitignore` beyond adding `dist/` if missing.
- **Acceptance:** `git status` clean; app builds.

### T37 — Route-level code splitting
- **Difficulty:** 4 · **Model:** Claude 5.5 Low
- **Goal:** Reduce initial JS (known issue: main bundle ~1.21 MB raw).
- **Scope:** In the router (`src/app/App.tsx` / route config), convert all page imports from `src/pages/*` to `React.lazy` + `Suspense` with the existing loading UI (search for an existing spinner/skeleton component; create a minimal one in `src/components/ui/` only if none exists). Keep the Home page eager. Admin pages must be in separate chunks.
- **Do NOT:** add manual `manualChunks` (T35 removed them on purpose), change routes/paths, or change the existing lazy 3D scene boundary.
- **Acceptance:** `npm run build` output shows separate chunks for admin pages and the main entry chunk smaller than before (write before/after sizes in the commit message). All routes still load in the browser.

---

# Phase 1 — Content & core pages

### T38 — Real curriculum data (Egyptian secondary chemistry)
- **Difficulty:** 3 · **Model:** Gemini 3.8 Flash High · **Owner must review scientific accuracy**
- **Goal:** Replace sample curriculum with the real structure: Grade 1/2/3 Secondary → First Term / Second Term → Units → Lessons → Experiments.
- **Scope:**
  1. Read the existing types (`src/types/`, `src/features/curriculum/data/sampleCurriculum.ts`, `gradeMetadata.ts`, `termMetadata.ts`) and the existing tables in `supabase/migrations/202611070003_curriculum_management.sql` and `202611070004_experiment_management.sql`. Use EXACTLY those shapes and column names.
  2. Produce the curriculum in English (unit/lesson/experiment titles), following the Egyptian Ministry of Education secondary chemistry syllabus. Only include lessons that have practical experiments. Each experiment: id/slug, title, short description (1–2 sentences), hazard level (`none|low|medium|high`).
  3. Create a seed migration `supabase/migrations/<timestamp>_curriculum_seed.sql` (idempotent: `insert ... on conflict do nothing`) and update the local fallback data file to match.
  4. Mark every new experiment `status = 'draft'` (not playable) except the existing salt experiment which keeps its current status.
  5. Add `docs/CURRICULUM_SOURCES.md` listing for each grade/term which syllabus source was used and a "needs review" checklist.
- **Do NOT:** invent experiments that are not in the syllabus; change table schemas; delete the salt experiment; apply the migration to the production database (owner applies it).
- **Acceptance:** typecheck passes; curriculum pages show the new data locally; migration file runs cleanly on a fresh local DB (`supabase db reset` if the CLI is available, otherwise state it was not run).

### T39 — Experiments Library page (matches the reference image)
- **Difficulty:** 3 · **Model:** Gemini 3.8 Flash High
- **Goal:** After choosing grade + term, show all experiments organized like the reference image.
- **Layout (top to bottom):**
  - Page title = grade name (e.g. "Grade 1 Secondary").
  - Small pill badge = term ("First Term").
  - For each unit: unit heading ("Unit 1: …").
  - Under each unit: one rounded card containing all its lessons; each lesson = lesson title + bulleted list of experiment links; lessons separated by a thin divider.
  - Footer note: "Remaining units follow the same structure according to the curriculum." only when data is partial.
  - Experiments with `status = 'draft'` show a small "Coming soon" tag and are not clickable; playable ones link to the existing Experiment Details route.
- **Scope:** Update the existing `src/pages/ExperimentsPage.tsx` / `CurriculumPage.tsx` (whichever renders the grade+term listing — check `docs/CURRICULUM_BROWSER.md` and `docs/STUDENT_ROUTING.md`) using existing components in `src/features/curriculum/components/`. Use existing theme colors (light theme; do not copy the dark colors from the image).
- **Do NOT:** add new routes; add search/filter; change data fetching logic.
- **Acceptance:** Works at 375px and desktop widths; keyboard-focusable links; empty state when a term has no experiments.

### T40 — Experiment Details content for all experiments
- **Difficulty:** 3 · **Model:** Gemini 3.8 Flash High · **Owner reviews accuracy**
- **Goal:** Every experiment from T38 has full details content.
- **Scope:** Following exactly the structure already used for the salt experiment in `src/features/experiments/data/experimentLearningContent.ts`, `experimentToolsAndMaterials.ts` and `experimentLearningStages.ts`, add for each experiment: name, description, 3–5 learning objectives, tools (by id from the tool catalog — see T42; if T42 not done, use the existing tool ids and list new ones in the commit message), materials (name, formula, appearance, hazard), ordered procedure steps, expected results + scientific explanation, balanced chemical equation where applicable, hazards.
- **Do NOT:** change components or types; add content for experiments not in T38.
- **Acceptance:** Every experiment details page renders all 7 sections from the spec (Name, Description, Objectives, Tools, Materials, Procedure, Results) without empty sections. Add/extend a test in `tests/` that asserts every experiment has non-empty values for each section.

### T41 — Generic hazard warning system
- **Difficulty:** 4 · **Model:** Claude 5.5 Low
- **Goal:** Any experiment with risk shows a clear warning describing the hazard type and the required precautions (spec requirement).
- **Scope:**
  1. Define a hazard catalog in `src/features/safety/data/hazards.ts`: types `flammable`, `toxic-gas`, `explosive`, `corrosive`, `oxidizer`, `hot-surface`, `irritant`. Each: label, short description, icon (lucide-react or a simple inline SVG GHS-style pictogram drawn by us), list of precautions, required PPE (coat, goggles, gloves, fume hood).
  2. Experiments/materials reference hazards by id (extend the existing data type with an optional `hazards: HazardId[]`).
  3. Reusable `HazardAlert` component (reuse/extend `src/features/simulations/components/SafetyNotice.tsx` if suitable) shown: (a) at the top of Experiment Details, (b) as a dismissible banner when entering the lab, (c) via the existing contextual safety logic (`src/features/simulations/lib/contextualSafety.ts`) when the risky step happens.
  4. High-hazard experiments require the student to tick "I have read the safety precautions" before opening the lab (store only in session state).
- **Do NOT:** rewrite `contextualSafety.ts`; block experiments without hazards.
- **Acceptance:** unit tests for hazard lookup; visual check on one hazardous and one safe experiment.

### T42 — Equipment catalog with tool notes
- **Difficulty:** 3 · **Model:** Gemini 3.8 Flash High
- **Goal:** Single source of truth for all lab tools; clicking any tool anywhere shows a note: name, use, how to handle safely.
- **Scope:**
  1. Create/extend `src/features/experiments/data/equipmentCatalog.ts` with entries: `id, name, category ('reaction-vessel'|'assistive-device'|'measuring'|'heating'|'solid-chemical'|'liquid-chemical'|'gas-chemical'), use, handling, safetyNote, imageKey`. Include at minimum: beaker (100/250/1000 mL), Erlenmeyer flask (100/250 mL), round-bottom flask, three-neck flask, test tube, test tube rack, graduated cylinder, burette, pipette, dropper, funnel, separating funnel, distillation flask, condenser, Bunsen burner, spirit lamp, tripod, wire gauze, clamp stand, tongs, spatula, stirring rod, watch glass, evaporating dish, digital balance, weighing boat, thermometer, pH paper, wash bottle.
  2. Move existing tool data from `experimentToolsAndMaterials.ts` to reference catalog ids (no duplication).
  3. One `ToolNotePopover` component used in Experiment Details tool list, Safety page equipment section and lab inventory (`InventoryItem.tsx`). Reuse existing tooltip work if present (see `docs/EQUIPMENT_SAFETY_GUIDE.md`).
- **Do NOT:** create 3D models here (that is L4); change lab behavior.
- **Acceptance:** test that every tool id referenced by any experiment exists in the catalog.

### T43 — Final interactive Safety page
- **Difficulty:** 5 · **Model:** Claude 5.5 Medium · **BLOCKED until the owner confirms the final concept** (spec says "idea to be finalized")
- **Proposed concept (default if owner approves):**
  1. Intro: what lab safety means.
  2. "Get Lab Ready" activity: a student illustration (our own SVG); student drags/clicks lab coat, safety goggles, gloves, closed shoes, tied hair onto the figure; wrong items (sandals, food) show why they're not allowed. Must finish before continuing.
  3. General lab rules (cards).
  4. Safe handling of tools / devices / chemicals (uses T42 catalog + T41 hazards).
  5. Emergency procedures: fire, chemical splash on skin/eyes, gas leak, broken glass — each as a short scenario with the correct action.
  6. Short 3-question check; passing marks safety as completed (existing progress/session logic; see `docs/LABORATORY_SAFETY.md` and `docs/SAFETY_CHECKLIST.md`).
- **Do NOT:** change the routing order (Safety → Choose Grade) unless asked.
- **Acceptance:** fully keyboard-operable (click alternative to drag), works on mobile.

### T44 — Demonstration videos integration
- **Difficulty:** 3 · **Model:** Gemini 3.8 Flash High · **Videos are produced by the owner/team (not by the model)**
- **Goal:** Each experiment has a video split into the 5 stages: Laboratory Equipment, Reactants and Chemicals, Experimental Procedures, Measurements, Chemical Reactions and Results.
- **Scope:**
  1. Supabase Storage public bucket `experiment-videos` (migration with bucket + read-only public policy; uploads only by admins with `admin:manage_experiments` permission — check existing permission names in `202611070002_user_roles_and_permissions.sql`).
  2. Data: per experiment either one video with 5 chapter timestamps OR 5 separate videos; support both via `video: { src, chapters?: {stage, startSec}[] }`.
  3. Replace placeholder in the existing stages viewer: HTML5 `<video>` with controls, chapter buttons that seek, captions track support (`.vtt` optional), poster image, and keep the existing "being prepared" placeholder when `src` is missing.
  4. Admin experiment editor: field to upload/attach a video and edit chapter timestamps.
- **Do NOT:** autoplay with sound; embed YouTube.
- **Acceptance:** one test video (any short mp4 the owner provides) plays and chapter buttons seek correctly.

---

# Phase 2 — AI assistant (NVIDIA NIM)

### T45 — AI backend: Supabase Edge Function proxy
- **Difficulty:** 7 · **Model:** Claude 5.5 High (alt: GPT 6.1 Sol)
- **Goal:** Secure server-side endpoint the frontend calls; it calls NVIDIA's API.
- **Scope:**
  1. `supabase/functions/ai-tutor/index.ts` (Deno). Accepts POST `{ experimentId, stage?, labState?, messages: {role, content}[] }`.
  2. Verify Supabase JWT (logged-in students only). Reject anonymous.
  3. Rate limit: 30 requests/user/hour using a new table `ai_usage(user_id, created_at)` with RLS (insert/select own rows only) — migration file.
  4. Build the system prompt server-side from the experiment's data (description, procedure, materials, hazards, expected results) loaded from the DB. Instructions: answer as a chemistry tutor for secondary students, English, concise, only about chemistry/this experiment, never give instructions to do dangerous experiments outside a supervised lab, refuse off-topic.
  5. Call `POST https://integrate.api.nvidia.com/v1/chat/completions` with `Authorization: Bearer ${NVIDIA_API_KEY}` (from `Deno.env`), model from env `NVIDIA_MODEL` (default to a Llama/Nemotron instruct model available on build.nvidia.com — owner confirms the exact model name), `stream: true`, `max_tokens` 600, `temperature` 0.3. Stream back as SSE.
  6. Limits: max 20 messages, max 2,000 chars per message, timeout 30s, generic error messages (never leak the key or upstream error body).
  7. `docs/AI_TUTOR.md`: how to set secrets (`supabase secrets set NVIDIA_API_KEY=... NVIDIA_MODEL=...`), deploy command, limits.
- **Do NOT:** call NVIDIA from the browser; commit any key; store chat contents in the DB (only usage timestamps).
- **Acceptance:** local test with `supabase functions serve` + curl (documented); unauthenticated request → 401; 31st request in an hour → 429.

### T46 — AI chat UI
- **Difficulty:** 5 · **Model:** Claude 5.5 Medium · **Depends on T45**
- **Scope:**
  1. Replace `EducationalAssistantPlaceholder.tsx` with `AiTutorPanel` (keep the same placement in Experiment Details and Lab layout).
  2. Collapsible chat panel: message list, input, send, stop-generation, streaming text rendering, 3 suggested questions based on current stage (e.g. "Why did the color change?").
  3. Sends current `experimentId`, current stage and a SHORT lab state summary (from existing selectors in `src/features/simulations/lib/workspaceSelectors.ts` / `sessionSelectors.ts`) — not the whole store.
  4. Client helper `src/features/ai/lib/aiTutorClient.ts` using `supabase.functions.invoke` or fetch with the user's session token.
  5. States: logged-out (prompt to log in), loading, rate-limited ("You've reached the hourly limit"), error with retry. Conversation kept in memory only.
  6. Label: "AI answers can be wrong — check with your teacher."
- **Do NOT:** add markdown libraries larger than necessary (plain text + simple line breaks is fine); persist chats.
- **Acceptance:** works on mobile; screen reader announces new messages (`aria-live="polite"`).

### T47 — "Explain what happened" AI explanations
- **Difficulty:** 4 · **Model:** Claude 5.5 Medium · **Depends on T45, T46**
- **Scope:** In each learning stage and in the lab results panel (`ExperimentResults.tsx`), add an "Explain this" button that sends a predefined prompt ("Explain what happens in the <stage> stage of <experiment>" / "Explain the observed change: <event>") through the same client. If the AI fails, show the existing static explanation text as fallback.
- **Do NOT:** call the AI automatically without a click.
- **Acceptance:** fallback works when the function is unreachable.

---

# Phase 3 — Accounts & admin leftovers

### T48 — Account-based progress sync
- **Difficulty:** 5 · **Model:** Claude 5.5 Medium
- **Scope:**
  1. Migration: tables `student_experiment_progress(user_id, experiment_id, stage_completed, lab_completed_at)` and `student_quiz_attempts(id, user_id, experiment_id, score, total, answers jsonb, created_at)` with RLS: students read/write own rows; admins with existing report permission read all.
  2. Update `src/features/progress/` to write to Supabase when logged in, and on first login migrate existing browser-local progress once (then mark migrated).
  3. `/progress` page reads from the DB when logged in, local storage otherwise.
- **Do NOT:** change quiz scoring logic; store answer keys.
- **Acceptance:** progress survives logout/login on another browser; RLS test added in `supabase/tests/`.

### T49 — Admin Students & Reports pages
- **Difficulty:** 4 · **Model:** Gemini 3.8 Flash High, then Claude 5.5 Low review · **Depends on T48**
- **Scope:** Replace the placeholders for Students and Reports in admin using the existing admin layout/table patterns (`src/features/admin/components/AdminLayout.tsx`, `AdminQuestionsPage.tsx` as reference). Students: list (name, email, grade, experiments completed, average score), search by name, detail view. Reports: per experiment — attempts count, average score, most-missed question. Read-only.
- **Do NOT:** allow editing/deleting students; add charts libraries (simple tables/bars with CSS).
- **Acceptance:** non-admin cannot access (existing guard); empty states.

---

# Phase 4 — Virtual Lab upgrade (step by step, last)
**Vision:** an open lab similar in mechanics to the reference video — categorized inventory, drag any equipment/chemical onto the workbench, pour/measure/heat/mix, realistic reactions with visual effects, live measurements, safety triggers, particle view — where **new experiments are added as data only**, without new engine code. Our own visual design and 3D models.

### L1 — Generic data-driven chemistry engine
- **Difficulty:** 9 · **Model:** Claude 5.5 Extra
- **Goal:** Replace the salt-specific engine with a general one, keeping the salt experiment working on top of it.
- **Scope:**
  1. Study first: `src/features/simulations/engine/*` (workflow, transfers, events, spatialInteractions), `state/*` stores, `data/saltExperimentDefinition.ts`, `lib/simulationRegistry.ts`, and the docs `docs/SIMULATION_INTEGRATION.md`.
  2. New pure-TypeScript model (no React/Three imports) in `src/features/simulations/engine/core/`:
     - `Substance` (id, name, formula, state solid/liquid/gas/aqueous, color, density, molarMass, hazards).
     - `Container` instance (equipment id, capacity mL, contents: list of `{substanceId, amount (g or mL or mol)}`, temperature °C, pH computed, isOpen).
     - `ReactionRule` (reactants with min amounts, conditions: temperature range / catalyst / heating / stirring, products, rate, heat released, effects: `colorChange|precipitate|gas|flame|smoke|heat|explosion|dissolve`, hazards triggered, observation text).
     - `PhysicalProcess` rules (dissolving with solubility, evaporation, heating, mixing).
     - `simulateTick(state, dtSeconds) → {state, events[]}` deterministic and unit-testable.
     - Measurement readers: mass, volume, temperature, pH.
  3. `ExperimentDefinition` schema (data only): allowed equipment + chemicals, optional guided steps (each step = expected action + validation predicate in declarative form), success criteria, hazards. Validate with a runtime validator (hand-written type guards; no new libs unless necessary).
  4. New registry: `resolveSimulation(experiment)` looks up definitions by id from a map; the salt experiment is rewritten as a definition on the new engine.
  5. Adapter so existing UI components keep working (or update them minimally).
  6. Extensive unit tests in `tests/` (dissolving, a precipitation reaction, a gas-producing reaction, temperature effect, overflow of capacity).
- **Do NOT:** change 3D visuals or UI layout in this task; add new experiments beyond one test reaction; break existing tests (update them only when behavior is intentionally identical but API changed — explain each in the commit message).
- **Acceptance:** salt experiment plays identically in the browser; all tests pass; new engine has ≥90% of rules covered by tests; `docs/SIMULATION_ENGINE.md` explains how to add an experiment as data.

### L2 — Inventory UI (like the reference video)
- **Difficulty:** 5 · **Model:** Claude 5.5 Medium · **Depends on L1, T42**
- **Scope:** Redesign `InventoryPanel.tsx` / `InventoryItem.tsx`: left vertical category rail with icons + labels (Reaction vessels, Assistive devices, Measuring, Heating, Solid chemicals, Liquid chemicals, Gas chemicals); search box filtering by name/formula; A–Z quick index; grid of item cards (image/preview + name; chemicals show formula); click card → tool note (T42 `ToolNotePopover`); "Add to bench" button + drag start. Collapsible on mobile (bottom sheet). In guided mode only the experiment's allowed items are enabled; in free mode all.
- **Do NOT:** implement free placement on the bench (L3).
- **Acceptance:** keyboard navigable; search and categories combine.

### L3 — Free-form workbench
- **Difficulty:** 7 · **Model:** Claude 5.5 High (alt: GPT 6.1 Sol)
- **Scope:** Drag from inventory to the 3D bench (and "Add to bench" button for keyboard users); multiple instances of the same item; select, move, rotate (limited), remove (to a waste bin area); snap points (clamp stand holds flask, tripod holds beaker, burner under tripod); collision via existing Rapier setup; undo/redo of placement actions (last 20); "Reset bench". Extend existing `PlacementController.tsx`, `useEquipmentManipulation.ts`, `useLabSceneStore.ts` — don't fork new parallel systems.
- **Do NOT:** implement pouring (L5).
- **Acceptance:** 15+ items on bench without FPS below 45 on a mid laptop (measure with drei `<Stats>` in dev only).

### L4 — 3D models library
- **L4a — Difficulty 6 · Claude 5.5 Medium:** build a reusable parametric glassware generator on top of `GlassVesselShell.tsx`, `glassMaterial.ts`, `modelGeometry.ts` (lathe profiles) + 3 models: test tube, Erlenmeyer flask, round-bottom flask; each exposes liquid anchor points and a fill-level API used by `VesselContents.tsx`. Write `docs/3D_MODELS.md` with the template.
- **L4b — Difficulty 3 · Gemini 3.8 Flash High (repeat per batch of ~5), Claude 5.5 Low review:** using exactly the L4a template, add the remaining catalog items from T42 (three-neck flask, funnel, separating funnel, dropper, burette, pipette, Bunsen burner, spirit lamp, tripod + gauze, clamp stand, tongs, watch glass, evaporating dish, thermometer, test tube rack, reagent bottles with our own label design).
- **Do NOT:** import external 3D model files or textures from the internet; all procedural geometry.
- **Acceptance:** every catalog equipment id renders a model; low poly (each < 5k triangles).

### L5 — Liquids, pouring and volume readout
- **Difficulty:** 8 · **Model:** Claude 5.5 High (alt: GPT 6.1 Sol)
- **Scope:** Pour from container A to B by tilting (drag gesture + keyboard alternative "Pour 10 mL"); flow rate depends on tilt angle; animated stream; dropper adds single drops (0.05 mL); liquid level rises with correct meniscus height per vessel geometry; live readout near the vessel `poured: X mL / total: Y mL` (like the video); overflow → spill event + warning; mixing contents updates color via L1 engine. Extend `MaterialTransferController.tsx`, `transferMotion.ts`, `effects/LiquidFill.tsx`.
- **Acceptance:** volumes are conserved (unit test); readout accurate to 0.1 mL.

### L6 — Reaction visual effects
- **Difficulty:** 7 · **Model:** Claude 5.5 High
- **Scope:** One effect component per engine effect type in `three/effects/`: smooth color transitions, precipitate (particles settling to bottom), gas bubbles (instanced), gas escaping from mouth, flame (shader or sprite), smoke, heat glow/shimmer, small explosion/pop (flash + particles + camera shake option, respects `prefers-reduced-motion`). Driven only by engine events — no experiment-specific code.
- **Acceptance:** demo scene (dev-only route or Storybook-like page) showing all effects; performance budget kept.

### L7 — Heating & temperature
- **Difficulty:** 6 · **Model:** Claude 5.5 Medium
- **Scope:** Burner/spirit lamp on/off with flame; heats container placed above (via snap from L3); temperature rises over time in engine; thermometer reading; boiling and evaporation visuals; hot-surface hazard triggers if the student "touches" a hot item; temperature-dependent reactions use L1 conditions.

### L8 — Measurement instruments & data log
- **Difficulty:** 5 · **Model:** Claude 5.5 Medium
- **Scope:** Balance with tare, thermometer, pH paper (color chart) / pH meter, stopwatch; "Record measurement" button adds rows to a data table (time, instrument, value, unit); simple line chart of temperature/pH over time (SVG, no heavy libs); integrates with existing `SimulationMeasurements.tsx`; data feeds the results page.

### L9 — Guided mode, free mode, mistake detection
- **Difficulty:** 6 · **Model:** Claude 5.5 High
- **Scope:** Guided mode follows the definition's steps with highlights (reuse `ExperimentGuide.tsx`, `LaboratoryInteractionCoach.tsx`); validates each action; wrong action → explanation, not silent failure. Free mode: no steps, all items. Safety rules engine (data-driven): e.g. adding water to concentrated acid, heating a closed container, mixing incompatible chemicals, no goggles (from Safety page state) → hazard alert (T41) + effect. Completion summary lists mistakes.

### L10 — Particle (molecular) view
- **Difficulty:** 7 · **Model:** Claude 5.5 High
- **Scope:** Toggle "Particle view" on a selected container: zoomed panel showing instanced particles representing species in it (e.g. Na⁺ / Cl⁻ separating in water, ions forming precipitate); motion speed tied to temperature; legend with colors/formulas. Driven by engine state.

### L11 — Add experiments one by one (data only)
- **Difficulty:** 3–4 each · **Model:** Gemini 3.8 Flash High per experiment, Claude 5.5 Low review · **Depends on L1–L9**
- **Scope per task:** one experiment = one definition file in `src/features/simulations/data/experiments/<slug>.ts` following `docs/SIMULATION_ENGINE.md`, plus any missing substances/reaction rules, plus a unit test that simulates the guided steps and asserts the expected result. Set its status to playable. Suggested first batch: sodium + water, NaCl + AgNO₃ precipitation, CaCO₃ + HCl (CO₂), flame tests, acid-base titration with phenolphthalein, copper sulfate crystallization.
- **Do NOT:** write new engine/effect code — if something is missing, stop and report it as a new L-task.

### L12 — Mobile, accessibility & performance pass
- **Difficulty:** 6 · **Model:** Claude 5.5 Medium
- **Scope:** Touch gestures (drag, two-finger rotate camera), larger hit targets, keyboard-only flow for all lab actions, screen-reader descriptions of bench state, instancing/LOD where needed, pause rendering when tab hidden, measure FPS on mobile and document in `docs/TEST_RESULTS.md`.

---

## Definition of Done (every task)
1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass (paste results summary in final message).
2. Manual check in the browser with `npm run dev` of every screen touched (desktop + 375px width); for lab tasks also check the salt experiment still works.
3. Update the related file in `docs/` (or create one named in the task) and add any new limitation to `docs/KNOWN_ISSUES.md`.
4. One commit: `feat(<area>): <TaskID> <summary>` (or `chore`/`docs`). No pushing unless the owner asks.
5. Final message lists: what was done, files changed, anything skipped or not verified, open questions.
