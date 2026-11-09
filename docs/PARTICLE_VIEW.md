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
| Panel         | `components/ParticleViewPanel.tsx`: its own small orthographic R3F canvas, one instanced mesh per species, positions in a ref, updated in `useFrame`.              |
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
