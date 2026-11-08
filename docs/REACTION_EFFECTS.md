# L6 — Reaction Visual Effects

Reactions now show what happens: colour changes, precipitates, gas, flames, smoke, heat, a hydrogen "pop" and dissolving. **Every effect is driven only by engine events.** No component knows about a specific experiment. A new experiment gets its visuals by listing effects in its reaction data (L11).

## Pipeline

```
ReactionRule.effects / DissolutionProcess          (data)
        │  simulateTick (L1 engine)
        ▼
LabEvent { type: 'effect', containerId, effect, intensity, sourceId }
        │  useReactionEffectsStore.ingest(events, definition)
        ▼
ActiveEffect per container + kind  (eases in, holds, fades; explosions are one-shot bursts)
        │  ReactionEffectsLayer (one per Canvas; ticks the store each frame)
        ▼
One component per effect kind, placed by an EffectAnchor resolver
```

| Piece                            | Where                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effect model (pure, unit-tested) | `lib/reactionEffects.ts`: `ingestEffectEvents`, `advanceEffects`, `effectColor`, colour easing (`mixHex`, `approachColor`), the motion budget (`effectMotion`, `PARTICLE_BUDGET`, `particleCount`).                                                                                         |
| Store                            | `state/useReactionEffectsStore.ts`: `ingest`, `tick`, `clear(containerId?)`.                                                                                                                                                                                                                |
| Components                       | `three/effects/reaction/ReactionEffects.tsx`: `ReactionEffectsLayer` plus one component per kind.                                                                                                                                                                                           |
| Anchors                          | `three/effects/reaction/effectAnchors.ts`: `vesselEffectAnchor(modelId, origin, volumeMl)` gives the liquid base, liquid surface, mouth and radii, from the L4 fill model and anchors. `three/benchEffectAnchors.ts` resolves bench items (follows drags and holder snaps).                 |
| Bench wiring                     | `useBenchLiquidsStore.react(dt)` runs `simulateTick` on the bench's definition when it has reactions or processes, and forwards events to the effects store. `BenchLiquidsController` calls it each frame. `LaboratoryScene` mounts `<ReactionEffectsLayer resolve={benchEffectAnchor} />`. |
| Dev demo                         | `/dev/effects` (registered only when `import.meta.env.DEV`): `dev/ReactionEffectsDemo.tsx` with `data/effectsDemoDefinition.ts`, one mass-balanced reaction per effect.                                                                                                                     |

## Effects

| Kind          | Visual                                                                                                                                                                                               | Colour from                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `colorChange` | The liquid body eases to the new engine colour over about 1.5 s (`ProfiledVesselContents`). Streaks of the new colour swirl down through the liquid. Strongly coloured solutions become more opaque. | aqueous/liquid product       |
| `precipitate` | Grains drift down (instanced spheres) and build a settled layer on the floor that grows while the reaction runs.                                                                                     | solid product (white AgCl…)  |
| `gas`         | Bubbles rise from the floor to the surface (instanced), and gas puffs escape from the mouth.                                                                                                         | gas product, else pale       |
| `flame`       | Shader flame (noise flicker, additive, cylindrical billboard) at the mouth, plus a flickering point light.                                                                                           | gas product (sodium yellow…) |
| `smoke`       | Soft grey puffs fill the vessel, then pour out of the mouth and spread.                                                                                                                              | solid product, else grey     |
| `heat`        | A warm glow under the liquid, and faint shimmering air above the mouth.                                                                                                                              | — (orange)                   |
| `explosion`   | One burst: a flash disc, a point-light flash and ballistic sparks, plus a 0.35 s camera shake done with `setViewOffset` (never fights the orbit controls).                                           | —                            |
| `dissolve`    | Coloured streams curl up from the dissolving solid.                                                                                                                                                  | dissolved species            |

Intensity follows the engine's `intensity` (the rate relative to its maximum). Effects fade at kind-specific rates after events stop: a flame vanishes quickly, while a precipitate and smoke linger.

## Performance and motion

- Each effect uses at most two persistent instanced meshes; matrices update in `useFrame`, with no React state writes per frame.
- `PARTICLE_BUDGET` caps instances per kind (at most 70). All eight effects at once stay under 400 instances. The demo with all eight running measured about 46 draw calls and 29k triangles, shown in the demo's header.
- `prefers-reduced-motion` (or the demo's toggle) means 35 % of the particles, no camera shake, a softer flash and a slower flame flicker.

## Adding effects to an experiment (L11)

Add `effects: ['gas', …]` to the `ReactionRule` and give products sensible colours. Clear solvents need a low `opacity` (for example 0.02 for water), because colour is blended by amount × opacity. No component code is needed.

## Verification

- `tests/reactionEffects.test.mjs` (8 tests) covers:
  - the ease-in, hold, fade and removal lifecycle;
  - the precipitate lingering versus the flame;
  - the one-shot explosion;
  - colours taken from products;
  - the demo definition validating, and the engine itself producing all 8 effect kinds;
  - the particle budget and reduced motion;
  - smooth colour convergence;
  - the store.
- **Browser, `/dev/effects`:**
  - "Run all" produced all 8 effects from engine events: red Fe(SCN)₃, white AgCl settling, CO₂ bubbles and escaping gas, a sodium-yellow flame, NH₄Cl smoke, a heat glow (+3 °C), sparks from the H₂ pop, and blue CuSO₄ dissolving.
  - The reduced-motion toggle worked.
- **Browser, lab:** the salt scene renders. Smoke and heat events sent to the bench beaker drew at its position.
