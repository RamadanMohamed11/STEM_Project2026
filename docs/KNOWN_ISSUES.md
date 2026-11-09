# Known issues and prioritized audit findings

T35, 7 November 2026. Priority reflects actual impact; advisory counts are not proof of an exploitable production vulnerability.

## Fixed in T35

| Priority | Finding                                                                                                                                                          | Resolution                                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Question-bank saves ignored errors and could report success after denied/network/partial writes. Admin load failures could masquerade as successful sample data. | Check every mutation, confirm the affected row, report generic failure, retain prior local state until confirmed. Only duplicate immutable snapshot errors are ignored. Database load failures now fail explicitly; a truly empty database stays empty. |
| P1       | Home copy suggested salt dissolving proved a chemical change and claimed curriculum alignment/account progress beyond the implementation.                        | Corrected the physical-change explanation; labelled sample/draft content and described browser-local practice progress.                                                                                                                                 |
| P2       | Manual chunk groups caused the public entry to eagerly load the 3D libraries.                                                                                    | Remove the problematic grouping; preserve the existing lazy scene boundary and default build splitting.                                                                                                                                                 |
| P2       | “Return to Questions” dismissed confirmation but kept students on quiz review.                                                                                   | Cancel confirmation and leave review; browser regression verifies radio answers become available.                                                                                                                                                       |
| P2       | Shared small primary/outline button text missed normal-text contrast on its surface.                                                                             | Use the existing darker teal text/background; primary contrast improves from 4.15:1 to 6.00:1 against white.                                                                                                                                            |
| P3       | Progress inherited the previous page's document title; grade/home status copy described already working pages as future pages.                                   | Set the progress title and correct the draft/sample journey labels.                                                                                                                                                                                     |

## Remaining limitations / follow-up

| Priority | Issue                                                                                             | Practical implication / next action                                                                                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | Multi-request admin writes are not database transactions.                                         | The UI now reports a partial failure honestly, but earlier successful requests cannot be rolled back by the client. Reload before retrying; consider narrow transactional RPCs and concurrency/version checks in a future admin data-integrity task.                       |
| P2       | Authorized admin UI CRUD/table responsive checks remain manual.                                   | RLS/RBAC transaction tests and denied student/anonymous browser access pass. An owner-authorized admin should run the curriculum, experiments and question-bank edit/publish/reload checklist without granting QA permanent roles.                                         |
| P2       | No end-to-end recovery email delivery, email verification or password change test in T35.         | Production has confirmation OFF by prior explicit owner approval; signup does not prove mailbox ownership. Validate SMTP, exact redirect allowlist and real mailbox flows before institutional rollout.                                                                    |
| P2       | Supabase leaked-password protection disabled.                                                     | Provider security advisor warning remains; owner should review plan support and enable protection deliberately. No auth settings changed here.                                                                                                                             |
| P2       | Academic approval incomplete.                                                                     | Curriculum examples, safety guidance, objectives, quizzes and learning stages remain demonstration/draft content; no official curriculum or safety certification claim is supported.                                                                                       |
| P2       | Simulation refresh and detailed quiz-result refresh persistence are absent by design.             | Same-tab navigation preserves live scientific state. Reload starts a new lab session; detailed quiz review is in memory. Device-local progress summaries survive reload but are not account records.                                                                       |
| P2       | Accessibility/device audit incomplete.                                                            | Canvas manipulation is pointer-oriented; keyboard-only equipment placement and screen-reader descriptions require further work. Shared button contrast is fixed, but muted/hardcoded colors, all modal focus behavior and every text combination were not certified.       |
| P3       | 10 moderate npm findings, 0 high/critical.                                                        | All trace to development-tool minimatch amplification advisory GHSA-g3hv-75wg-m249; no runtime dependency finding. Avoid untrusted glob patterns in tooling. Review a compatible toolchain update; do not blindly apply npm's suggested major downgrades.                  |
| P3       | Main route bundle still large (~1.21 MB raw); lazy 3D bundle ~3.32 MB raw.                        | Initial compressed JS is much lower, but admin/student routes are still eagerly imported. Profile real classroom devices, then introduce measured route splitting. No FPS/memory benchmark was collected.                                                                  |
| P3       | Preview/development Vercel env targets not configured.                                            | Production variables are present. Configure exact non-production URLs/variables only if the owner wants preview testing; no second project/database was created.                                                                                                           |
| P3       | Database performance advisor: 13 unindexed FKs and two multiple-permissive SELECT-policy notices. | Current catalog is small. Measure query plans/volume before adding indexes or changing correct RLS.                                                                                                                                                                        |
| P3       | T43 safety activities (Get lab ready, quick check) are session-only.                              | Reloading /safety resets them, like the checklist; there is no account-level "safety completed" record. Emergency scenarios are general practice, not first-aid training.                                                                                                  |
| P2       | T45 AI tutor not yet deployed or tested against the real NVIDIA API.                              | Owner must apply `202611080002_ai_tutor_usage.sql`, set `NVIDIA_API_KEY`/`NVIDIA_MODEL` secrets and deploy `ai-tutor` (see docs/AI_TUTOR.md). Logic is covered by Node tests and a PGlite RLS run only.                                                                    |
| P3       | AI tutor context lacks procedure steps and expected results.                                      | `public.experiments` stores summary, objectives, tools, materials and safety only; procedure/results live in frontend data files. The tutor relies on the `labState`/`stage` sent by the client for those. Move them to the database (or a shared module) in a later task. |
| P2       | T48 account progress sync not yet applied or tested against the real Supabase project. | Owner applies `202611080003_student_progress_sync.sql`, then signs in to confirm progress and quiz attempts appear on another device. Progress rows are self-reported practice data (students can edit their own rows); logged-out progress made after the first migration stays on the device. See docs/STUDENT_PROGRESS.md (T48). |
| P3       | Flaky 3D pour-stream timing checks in `tests/browserSmartTransfers.py` ("no stream outside transfer flow", "animated stream"). | Pre-existing (fail on the pre-L1 commit too, 4–5 non-fatal render checks per run); science assertions pass. Revisit when L5 replaces live pouring. |
| P3       | L3 extra equipment copies (e.g. Beaker 2) have no chemistry; snap holders (tripod, clamp stand, burner) have no 3D models yet. | Copies are empty practice equipment until the lab moves fully onto the L1 engine (L5); snap rules activate when L4 adds the holder models. |
| P3       | Lab frame rate on integrated GPUs with a full bench. | 15 items on Intel UHD: 49–50 fps by rendering at 0.875 resolution (adaptive); 42 fps without it. Weaker devices may drop to 0.75 resolution (slightly softer image). Phone performance is measured in L12. |
| Scope    | Admin Students/Reports and demonstration videos remain placeholders.                              | Excluded from implemented/release-complete claims. Public practice answer keys are intentionally client-visible; this is not a secure high-stakes examination platform.                                                                                                    |

The three authenticated SECURITY DEFINER helper advisories were reviewed: role lookup is scoped to `auth.uid()`, permission checks use authoritative role assignments, role mutation checks `admin:assign_roles`, and functions have fixed empty search paths. Revoking these helpers would break legitimate authorization. Their advisory presence is documented, not hidden.

References: [minimatch maintainer advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249), [Supabase password security](https://supabase.com/docs/guides/auth/password-security), [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [ACS dissolving and recovery of salt](https://www.acs.org/education/resources/k-8/inquiryinaction/fifth-grade/chapter-1-investigating-matter-at-the-particle-level/lesson-1-3--dissolving-and-back-again.html), [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## T37 follow-up (8 November 2026)

Route pages are now lazy and the main entry is smaller, but the T36 baseline has manual Three.js chunk groups in vite.config.ts again. These existing groups still preload heavy 3D libraries on Home. They were not changed in T37; the measured total initial gzip reduction is 9.3%, versus 87.3% for the main entry alone. See ROUTE_CODE_SPLITTING.md for reproducible before/after figures and browser verification limits.

## T38 follow-up (8 November 2026)

The real Egyptian Ministry of Education secondary chemistry curriculum (Grades 1, 2, and 3 Secondary; 2 terms each; 11 units; 22 lessons with practical experiments; 23 total experiments) is defined in `src/features/curriculum/data/egyptianCurriculum.ts` and seeded via `supabase/migrations/202611080001_curriculum_seed.sql`. All 22 new experiments are marked `draft` (publication status) and `planned` (simulation status); only the salt dissolution experiment (`exp-salt-water-001`) is playable (`demo`). The migration was not applied to production (owner will apply it). Scientific accuracy review checklist is documented in `docs/CURRICULUM_SOURCES.md`.

## T39 follow-up (8 November 2026)

The Experiments Library page (`src/features/curriculum/components/CurriculumExperimentsLibrary.tsx`) renders the curriculum hierarchically matching the reference layout: Grade title (h1) → Term pill badge → Unit headings → one rounded card per unit containing lessons with thin dividers → bulleted list of experiments with playable ones linked to Experiment Details and draft ones labeled "Coming soon". When visiting `/experiments` without grade/term parameters, it defaults to the flat searchable catalog (`ExperimentCatalog`). All 22 new experiments from T38 display "Coming soon" badges and remain unclickable until their details and simulations are implemented in subsequent tasks.

## T41 limitations (8 November 2026)

The reusable hazard catalog is draft guidance requiring academic review. No hazardous experiment was invented or published for demonstration: the acknowledgement interaction used an isolated ignored QA fixture, while the existing planned halogen experiment was visually reviewed with its actual T40 material data. Future real hazardous content needs explicit reviewed associations and end-to-end validation with its supported simulation and catalog loading/fallback behavior. The acknowledgement is in-memory frontend learning UX, not verified training, account persistence, scientific completion or server authorization. Fume hoods are engineering controls; PPE and glove selection remain activity-specific. See HAZARD_WARNINGS.md.

## L4 limitations (8 November 2026)

- The 52 library models are practice equipment: they render, collide, snap, copy and undo, but hold no chemistry until the 3D lab moves onto the L1 engine (L5).
- The experiment's own chemistry-linked items (salt beaker, cylinder…) do not snap onto holders yet.
- Snapping happens only when the item is dragged onto the holder, not when the holder is dragged under the item.
- Rotating a holder does not swing its snapped items around it.
- The burette shows a capacity label instead of a top-down 0–50 mL scale; that scale comes with the L8 instruments.
- Standing items without a stand (test tube, hard-glass tube) stand upright on the bench for clarity.
- See 3D_MODELS.md.

## L5 limitations (8 November 2026)

- Practice pouring covers library vessels and practice copies only; the guided salt experiment keeps its own validated pour.
- Liquid is discarded when a vessel leaves the bench, and undo/redo do not restore liquids.
- The burette and separating-funnel taps come with L8.
- The catalogue liquids are colourless, so mixtures look clear; pH is the visible result for now.
- Tilting uses a tilt control and buttons in the panel, not a 3D grab-and-tip gesture.
- See LIQUIDS_POURING.md.

## L6 limitations (8 November 2026)

- The effects pipeline is live in the lab, but the bench's practice liquids (water, dilute HCl) have no reactions yet, so no effect appears there until L11 adds reacting chemicals. All eight effects can be seen on the dev-only page `/dev/effects`.
- The engine blends colour by amount × opacity, not by concentration. A clear solvent needs a low `opacity` in the substance data, or it swamps a strongly coloured product (see the demo's water).
- Heat shimmer is a translucent overlay, not true screen-space refraction.
- Precipitate grains settle visually and then slowly fade. The solid stays in the engine's contents but has no permanent mesh of its own.
- The explosion is a teaching "pop" (a flash, sparks and a short shake), not a destructive simulation. Reduced motion disables the shake and cuts the particles.
- With the Claude browser pane hidden, frames are throttled. Effects then advance slowly, so check them with the pane visible.
- drei `Html` labels sometimes log "synchronously unmount a root" errors in development (React 19 StrictMode). In the demo, the first of eight labels went missing, so the demo shows its readouts as plain DOM text instead.
- See REACTION_EFFECTS.md.

## L7 limitations (8 November 2026)

- Heating works only through a tripod (burner under it, vessel on it). There is no heating over a flame with tongs or in a clamp, and no water bath.
- Heating and boiling run at teaching speed. Water boils away at 0.25 mL/s, and there is no tongs tool yet for moving hot glassware.
- Undo and redo can still move a hot item; they restore layout only.
- Thermometer readings are shown on vessel tags and in panels; the thermometer as an instrument comes with L8.
- The guided salt experiment is unchanged and has no heating.
- See HEATING.md.

## L8 limitations (8 November 2026)

- The balance works only for the practice copy (`digital-balance~2`). The salt experiment's balance keeps its own net-mass display.
- Empty glassware mass is an estimate from capacity, not a catalogue value.
- There is no pH meter; pH paper reads whole numbers only.
- The thermometer and pH paper are used by selecting them with a vessel; they are not placed into the vessel in 3D.
- The log lives in memory for the session. Refreshing the tab clears it, as it does the simulation.
- "Copy as CSV" needs clipboard permission in the browser.
- See MEASUREMENTS.md.

## L9 limitations (9 November 2026)

- The current catalogue has no concentrated acid, bleach or sealed container, so "water into concentrated acid", "incompatible chemicals" and "heating a closed container" fire only for experiments whose data defines them (L11). They are covered by the unit tests.
- Free mode hides the salt steps, but the salt workflow still runs underneath. Doing the salt steps in free mode still advances it silently.
- Mistakes are kept in memory for the session, like the measurement log.
- Goggles are a session flag (Safety page activity or the lab toggle), not a 3D avatar.
- The completion summary inside `ExperimentResults` was not seen at full completion in the browser; it was checked in the in-progress results section and by type checks.
- See GUIDED_FREE_SAFETY.md.

## L10 limitations (9 November 2026)

- The particle view is a teaching picture, not a simulation: counts are scaled, and motion is random kicks, not molecular dynamics. Ions are not drawn with surrounding water shells.
- Dilute HCl is shown as H₃O⁺ and Cl⁻ (complete ionisation). Other substances without particle data show one generic particle per substance.
- The panel uses its own small WebGL canvas, so it adds a second WebGL context while it is open.
- It shows one container at a time.
- See PARTICLE_VIEW.md.
