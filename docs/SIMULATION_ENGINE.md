# L1 — Generic Data-Driven Chemistry Engine

The virtual lab's chemistry now runs on a generic engine in `src/features/simulations/engine/core/`. An experiment is described as **data**: substances, containers, physical processes, reactions, guided steps and success criteria. The engine runs any such definition without experiment-specific code. The existing salt-dissolution experiment is the first definition on the engine and plays the same as before (see "Salt on the core engine").

## Files

| File | Purpose |
| ---- | ------- |
| `engine/core/types.ts` | Data model: `SubstanceDefinition`, `ContainerDefinition`, `DissolutionProcess`, `EvaporationProcess`, `ReactionRule`, `ChemistryDefinition`, `LabState`, `TickConditions`, `LabEvent`, `EngineResult` |
| `engine/core/state.ts` | `createInitialLabState`, `transferMaterial` (with overflow handling), and the readers `readVolumeMl`, `readMassG`, `readTemperatureC`, `readPh`, `readColor` |
| `engine/core/tick.ts` | `simulateTick(definition, state, dtSeconds, conditions)`, `saturationLimitG`, `solubilityAt`, `reactionConditionsMet` |
| `engine/core/definition.ts` | `CoreExperimentDefinition` schema, `Criterion` and `evaluateCriteria`, and the runtime validators `validateChemistryDefinition` / `validateExperimentDefinition` |
| `data/saltCoreDefinition.ts` | The salt experiment as data |
| `engine/saltExperiment.ts` | Salt adapter: the legacy `SaltExperimentState` used by the UI is a projection of the core state |
| `lib/simulationRegistry.ts` | Registry: a map of `{ core, workflow }` entries, validated once at load |

All engine code is pure TypeScript with no React, Three.js or store imports. Every function returns new objects and never mutates its input.

## Model

- **Units:** liquids are tracked in **mL**; solids, aqueous (dissolved) species and gases in **g**. Mass readings convert liquids with `densityGPerMl` (default 1).
- **Substances:**
  - Required fields: `id`, `name`, `formula`, `state` (`solid | liquid | aqueous | gas`) and `color` (`#rrggbb`).
  - Optional fields: `opacity`, `densityGPerMl`, `molarMassGPerMol`, `boilingPointC`, `acidBase` and `hazards` (ids from `features/safety/data/hazards.ts`).
  - A dissolved form is a separate `aqueous` substance, for example `sodium-chloride` and `sodium-chloride-aq`.
- **Containers:**
  - `capacity` is in mL for vessels or g for solid tools such as a spatula or weighing boat.
  - `accepts` lists the physical states the container can hold.
  - `open` decides whether gases escape.
  - `initialContents` and `initialTemperatureC` are optional. Container ids normally equal the inventory ids, so the 3D scene can render them.
- **`transferMaterial`:**
  - It moves one substance between containers and returns error codes: `UNKNOWN_CONTAINER`, `UNKNOWN_SUBSTANCE`, `SAME_CONTAINER`, `INVALID_AMOUNT`, `INSUFFICIENT_AMOUNT`, `NOT_ACCEPTED` and `CAPACITY_EXCEEDED`.
  - With `onOverflow: 'spill'` it fills the target to capacity and reports an `overflow` event; the default is `'reject'`.
- **`simulateTick`** is deterministic and runs in this order:
  1. **Temperature.** Heating adds `heatingCPerSecond × dt`. Without heating, the container cools toward ambient by `coolingPerSecond`. A liquid at its boiling point holds that temperature.
  2. **Processes**, in definition order:
     - *Dissolution*: `min(room, solid, rate × dt)`. Here `room = solvent mL × solubility(T) / 100 − dissolved`, and solubility changes by `solubilityPerDegreeC` away from 20 °C. Stirring uses `rateGPerSecondStirred`. Unstirred dissolving uses `rateGPerSecondUnstirred`, which defaults to 0. When a solution holds more than its limit (after cooling or evaporation), the excess crystallises immediately and raises a `precipitate` effect.
     - *Evaporation*: while heated at the boiling point, `rateMlPerSecond × dt`.
  3. **Reactions**, in definition order and per container:
     - The conditions are a temperature range, stirring, heating and catalysts present.
     - `extent = min(rate × dt, min(available / reactant amount))`. Reactants are consumed and products created per extent unit.
     - The optional `temperatureChangeCPer100Ml` heats or cools the contents.
     - The reaction emits `reacted`, plus `effect` events (with intensity) and `hazard` events.
  4. **Gas release.** Gases leave open containers and raise `gas-released` events.
- **pH** is a teaching model: strong acids and bases are fully dissociated in the container's liquid volume. The result is clamped to 0–14, and it is `null` without liquid.
- **Events** (`LabEvent`) are what renderers will react to in L5, L6 and L10: `transferred`, `overflow`, `dissolved`, `saturated`, `evaporated`, `reacted`, `effect` (`colorChange | precipitate | gas | flame | smoke | heat | explosion | dissolve`), `gas-released` and `hazard`.

## Adding an experiment as data (for L11)

1. Write `src/features/simulations/data/experiments/<slug>.ts` exporting a `CoreExperimentDefinition`:
   - `chemistry`: the substances (reuse existing ones where possible), containers, processes and reactions.
   - **Reaction amounts are per extent unit and must conserve mass within 1%.** Using 0.01 mol per unit, written in grams, is convenient.
   - `allowedEquipment` and `allowedSubstances`.
   - `guidedSteps`: an expected action and `completeWhen` criteria.
   - `successCriteria` and `hazards`.
2. Run `validateExperimentDefinition(def)` in a test; it must return `[]`. The validator checks:
   - ids and duplicates;
   - unknown substances and containers;
   - initial contents against capacity and accepted states;
   - solvent and dissolved-species types;
   - effects;
   - mass conservation;
   - criteria operators and values;
   - guided-step references.
3. Add a test that plays the guided steps with `transferMaterial` and `simulateTick`, and asserts each step's `completeWhen` and the `successCriteria`. `tests/coreChemistryEngine.test.mjs` has an example for salt, and fixture precipitation, gas, neutralisation and temperature-gated reactions.
4. Register it in `lib/simulationRegistry.ts`.

Until the generic lab UI exists (L2–L9), a registration also needs a workflow definition and a supported UI adapter. Today the only supported adapter is `'salt-dissolution'`. The registry refuses any entry that has validation issues, mismatched ids or no UI adapter (`registryIssues`).

## Salt on the core engine

- `data/saltCoreDefinition.ts` describes the experiment as data:
  - **Substances:** water, NaCl and NaCl(aq).
  - **Containers:** the water container (500 mL), graduated cylinder (100 mL), beaker (250 mL), NaCl jar (100 g), spatula (5 g) and weighing boat (25 g).
  - **Dissolution:** 35.9 g/100 mL at a rate of 4 g per 1.5 s, only while stirred.
  - **Success:** 100 mL of water and 5 g of NaCl(aq) in the beaker, with 0 g of solid left.
- `engine/saltExperiment.ts` keeps its public API, so the UI, workflow, results and progress are unchanged. Each command still checks its legacy preconditions with the same student messages. The material change then runs through `transferMaterial`, or `simulateTick` with `stirring: ['beaker']`. The resulting events are applied to the salt state.
- All constants come from the data: capacities, initial stock, solubility and stirring rate.

### Equivalence evidence

- The 394 tests that existed before L1 pass unchanged.
- A one-off differential fuzz test compared the old engine with the new adapter over 3,000 random runs and 180,000 commands. It is not committed, because it needs a copy of the removed code.
  - Every accept or reject decision, every integer, every effect and every message template was identical.
  - Fractional masses differed by at most 1.8 × 10⁻¹⁵ g. The core computes `rate × (ms / 1000)` where the old code computed `(rate × ms) / 1000`.
  - In 61 of the 29,467 accepted commands, a value fell exactly on a `.xx5` boundary, so the last displayed decimal of a stirring message changed, for example "0.60 g" to "0.59 g".
- `tests/coreChemistryEngine.test.mjs` asserts that the salt state round-trips through the core state within 1 × 10⁻¹² for a full run, and that the core success criteria hold at the end.

## Tests and coverage

`tests/coreChemistryEngine.test.mjs` has 15 tests. They cover:

- validation and the registry;
- transfers and overflow;
- dissolution, saturation and stirring;
- temperature-dependent solubility and crystallisation on cooling;
- boiling and evaporation;
- precipitation with a limiting reagent and mass conservation;
- gas production in open and closed containers;
- temperature-gated reactions;
- pH, colour, readers and criteria;
- determinism and invalid time steps;
- salt on the core engine.

Coverage of `engine/core/**`: 99.8 % of lines, 95 % of functions and 82 % of branches. By file, `tick.ts` has 91 % branch coverage, `state.ts` 87 % and `definition.ts` (the validator's error branches) 72 %.

## Not in L1

- No 3D, UI or layout changes, and no new playable experiments. The fixture reactions exist only in tests.
- The 3D lab still uses the salt workflow and live-pour code (`materialTransfers.ts`). Live tilt-pouring updates the salt state directly. L5 moves pouring onto `transferMaterial`.
- Guided steps in `CoreExperimentDefinition` are data only for now. L9 connects them to the guide UI.

## Browser verification

`python tests/browserSmartTransfers.py` (Playwright, real mouse) was run on the L1 code and on the pre-L1 commit (`0951632`, in a separate worktree):

| Case | Pre-L1 | L1 |
| ---- | ------ | -- |
| Selection, click/grab, pointer cancel | pass (45/45) | pass (45/45) |
| Full decimal UI workflow: 13 transfers, weighing, salt into the beaker | completed; 4 visual timing checks failed | completed; 5 visual timing checks failed |
| Reset mid-operation with stale-tick protection | pass (16/16) | pass (16/16) |

- In both runs, every science check passed, including the exact delivered quantities and the cancelled partial delivery.
- The only failures are the non-fatal render-timing checks "no stream outside transfer flow" and "animated stream". These failed before L1 as well, are flaky (they vary between runs), and come from the 3D stream renderer, which L1 does not touch.
