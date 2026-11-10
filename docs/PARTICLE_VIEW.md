# L10 — Particle (Molecular) View

Selecting a container and pressing **Particle view** opens a zoomed panel. The panel shows the particles inside that container, built from the L1 engine state, so it updates as the chemistry changes.

Containers with a particle view:

- the salt experiment's beaker, graduated cylinder and water container (via `saltStateToLabState`);
- every bench vessel holding practice liquids (L5).

## What it shows

- **Solvent** (for example H₂O): a fixed background sample of 90 small, semi-transparent molecules moving around each other.
- **Solute particles** keep their stoichiometric ratio (Na⁺ : Cl⁻ = 1 : 1). They are scaled so the largest group has 40 particles; this is _not to scale_ with the solvent, and the panel says so.
- **States:**
  - Particles of a **solid** sit in a lattice at the bottom, a checkerboard so alternating ions neighbour each other.
  - **Dissolved** particles move freely below the liquid surface.
  - **Gas** particles rise and escape.
- **Dissolving:** NaCl(s) and NaCl(aq) share the same Na⁺ and Cl⁻ species. As salt dissolves, the total stays the same and particles move from the lattice into the solution; a precipitate does the reverse.
- **Temperature:** speed (random kicks, speed limit and lattice vibration) follows √(T / 293 K). Hot liquids move visibly faster. Reduced motion slows everything to 30 %.
- **Legend:** colour, formula, name and counts ("16 in solid · 24 free"). A plain-language description is read out with `aria-live`; the canvas itself is `aria-hidden`.

## Data

- `SubstanceDefinition.particles` (L1 types) lists `{ species, per, solvent? }`. Species are shared in `data/particleSpecies.ts`: H₂O, Na⁺, Cl⁻ and H₃O⁺, with our own colours.
- Substances without particle data still show: one species named after the substance, solids as a lattice, liquids as the solvent, gases rising. New experiments only add data (L11).

## Code

| Piece         | Where                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pure model    | `lib/particleModel.ts`: `buildParticleScene`, `molesOf`, `particleSpeed`, `describeParticles`, `latticeSlots`.                                                     |
| Engine source | `state/useParticleScene.ts`: the bench liquids store, or the salt store projected to the core state.                                                               |
| Panel         | `components/ParticleViewPanel.tsx`: the same DOM panel, legend and live description, with a 2D bitmap output instead of a second R3F Canvas (I13). |
| Shared output | `three/ParticleViewRenderer.tsx`, `three/ParticleSceneContent.tsx`, `lib/particleRenderTarget.ts`: isolated scene/camera, instanced animation and an asynchronously copied render target owned by the lab renderer. |
| Toggle        | `components/ParticleViewButton.tsx`, in the selected-object panels (salt items and bench vessels). `state/useParticleViewStore.ts` holds which container is shown. |

## Verification

- `tests/particleView.test.mjs` (7 tests) covers:
  - the definitions still validate;
  - an undissolved lattice at 1:1, and partial dissolving (16 in solid / 24 free) with a constant total;
  - fully dissolved;
  - temperature speed;
  - bench HCl as H₃O⁺ + Cl⁻ in water;
  - empty and unknown containers;
  - fallback species for a precipitate (lattice) and a gas;
  - checkerboard lattice slots.
- **Browser**, with a real click on **Particle view**:
  - The bench beaker with 60 mL water + 10 mL HCl showed moving H₃O⁺, Cl⁻ and water, plus the description and legend.
  - The salt beaker with 3 of 5 g dissolved (salt state set from JS) showed the alternating Na⁺/Cl⁻ lattice at the bottom, with free ions among the water ("16 in solid · 24 free").

## I13 — One WebGL renderer (10 November 2026)

The checked-in L10 panel still created a second Canvas; I13 implements **option b**, not just a test update. `LaboratoryScene` mounts `ParticleViewRenderer` inside its existing Canvas. An R3F portal owns a separate Three Scene, with an independent orthographic camera at `[0, 0, 5]`, zoom 130, and the existing particle geometry/animation. Portal events are disabled. The lab's event source, OrbitControls, camera shake, scientific state and DOM input routing are unchanged.

The renderer draws that scene into a small multisampled `WebGLRenderTarget`, then uses `readRenderTargetPixelsAsync` to copy it into the panel's **2D** canvas. There is at most one readback in flight, no extra WebGL renderer/context, and no global loop beyond the existing lab loop. The original 1–1.5 DPR range is retained for the particle output independently of adaptive lab DPR. The scene has no lab lights, environment or fog. Every pass restores the previous render target (including cube face/mip), viewport, scissor, clear colour/alpha, auto-clear, tone mapping/exposure and clipping settings before the normal lab render. It explicitly clears its own target, so lab post-processing clear flags cannot leave stale content.

Three applies different colour handling to offscreen targets. A small material output adapter retains the old Canvas's ACES/exposure-1 → sRGB conversion **before blending** into an RGBA8 target. This preserves the existing colours rather than changing their appearance. Browser screenshot samples matched the old headspace `[0,20,33]`, liquid `[0,45,69]`, particle `[78,120,143]` and antialiased edge colours. `lib/particleModel.ts`, particle counts, lattice/physics animation, radii, geometry, palette, reduced-motion pace, legend and live text are unchanged.

Why not the other options:

- **a — drei View:** evaluated against its installed source and [official documentation](https://drei.docs.pmnd.rs/portals/view). Scissoring on the current canvas would still sit behind the panel's opaque/backdrop-blurred DOM. Making a transparent hole or moving the canvas above the panel would change label/overlay stacking, scroll clipping and event routing. The tracked panel is currently `bottom-16 right-3 z-20`; preserving that structure is simpler with a bitmap in the existing DOM panel.
- **c — dispose a separate renderer:** unnecessary because b can share the existing renderer. The main lab owns disposal of its renderer; closing this panel must never dispose or lose the lab context.

The target is released exactly once on close/unmount, after any pending GPU read completes. Reopening creates an owned target, not another context. ResizeObserver is disconnected, R3F disposes the portal's geometry/materials, and a late read cannot paint into a closed panel. Hidden-page rendering follows `usePageVisibility` and the lab's paused frame loop; a read finishing after the document becomes hidden is not painted. Reduced motion still uses the original 30% pace. The panel/close control/legend/live-description markup, position, clipping and z-index stay the same.

This trades a second context for a small GPU-to-CPU pixel copy. A slow readback may deliver fewer particle bitmaps than lab frames; it cannot queue unbounded work. Real mobile hardware still needs profiling. See [TEST_RESULTS.md](TEST_RESULTS.md) for measured FPS, context counts and browser evidence. Three's [WebGLRenderer API](https://threejs.org/docs/pages/WebGLRenderer.html) and [WebGLRenderTarget API](https://threejs.org/docs/pages/WebGLRenderTarget.html) were checked against the installed version.

Verification includes the existing seven `particleView.test.mjs` tests and eight new `particleRenderTarget.test.mjs` tests: colour output, isolation/restoration, one in-flight read, delayed disposal, hidden-page suppression, resize, async failure and synchronous-error cleanup.
