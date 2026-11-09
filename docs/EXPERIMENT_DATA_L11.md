# L11 — Declarative Experiment Definitions (Batch 1)

In task L11, new virtual chemistry experiments are added as pure declarative data definitions on top of the generic data-driven chemistry engine (L1) and the visual/spatial systems (L2–L10). No engine code or shader hacks are used.

## Implemented Experiments

All definitions live in `src/features/simulations/data/experiments/` and are validated by `validateExperimentDefinition`:

| Slug | Curriculum ID | Title | Key Chemistry & Physical Processes |
| ---- | ------------- | ----- | ---------------------------------- |
| `sodium-water` | `exp-sodium-water-012` | Reaction of Sodium with Water | $2\text{Na}(s) + 2\text{H}_2\text{O}(l) \rightarrow 2\text{NaOH}(aq) + \text{H}_2(g)\uparrow$. Highly exothermic redox displacement, melting metallic sodium into a darting sphere, releasing hydrogen gas with flame, and producing strongly alkaline NaOH(aq) ($pH \ge 11$). |
| `silver-nitrate-precipitation` | `exp-anions-015` | Detection of Chloride Anions by Silver Nitrate Precipitation | $\text{AgNO}_3(aq) + \text{NaCl}(aq) \rightarrow \text{AgCl}(s)\downarrow + \text{NaNO}_3(aq)$. Instantaneous ionic precipitation forming insoluble curdy white silver chloride precipitate. |
| `calcium-carbonate-hcl` | `exp-oxides-009` | Reaction of Calcium Carbonate with Hydrochloric Acid | $\text{CaCO}_3(s) + 2\text{HCl}(aq) \rightarrow \text{CaCl}_2(aq) + \text{H}_2\text{O}(l) + \text{CO}_2(g)\uparrow$. Rapid effervescence and solid dissolution with escaping gaseous carbon dioxide. |
| `flame-tests` | `exp-flame-tests-008` | Flame Tests for Metal Cations | Thermal excitation in non-luminous Bunsen burner flame ($>500^\circ\text{C}$): golden-yellow for $\text{Na}^+$, lilac/violet for $\text{K}^+$, brick-red for $\text{Ca}^{2+}$, blue-green for $\text{Cu}^{2+}$. |
| `acid-base-titration` | `exp-titration-005` | Acid-Base Neutralization Titration | $\text{HCl}(aq) + \text{NaOH}(aq) \rightarrow \text{NaCl}(aq) + \text{H}_2\text{O}(l)$. Quantitative volumetric titration using phenolphthalein indicator, demonstrating neutral pH transition at equivalence. |
| `copper-sulfate-crystallization` | `exp-heat-dissolution-006` | Dissolution and Crystallization of Copper(II) Sulfate | Temperature-dependent solubility scaling: $20.7\text{ g}/100\text{ mL}$ at $20^\circ\text{C}$ to $53.7\text{ g}/100\text{ mL}$ at $80^\circ\text{C}$ ($+0.55\text{ g}/100\text{ mL}/^\circ\text{C}$). Cooling precipitates excess solute into blue crystals. |

## Data Structure and Validation

Each experiment file exports a `CoreExperimentDefinition`:
- **Mass conservation:** Reaction stoichiometry is calibrated per extent unit to conserve mass within $0.001\%$, satisfying the validator's $1\%$ rule.
- **Particle species:** Ionic and molecular species ($\text{Na}^+$, $\text{Cl}^-$, $\text{OH}^-$, $\text{Ag}^+$, $\text{NO}_3^-$, $\text{Ca}^{2+}$, $\text{CO}_3^{2-}$, $\text{Cu}^{2+}$, $\text{SO}_4^{2-}$, $\text{K}^+$) are integrated with `particleSpecies.ts`, allowing the L10 particle view to render distinct ions and lattices.
- **Guided steps & success criteria:** Steps specify expected transfers, heating, and stirring actions along with declarative completion criteria (`completeWhen`).

## Tests

- `tests/simulationExperimentsL11.test.mjs` runs 7 comprehensive tests:
  1. Validates all 6 definitions against the hand-written schema guards (`validateExperimentDefinition`).
  2. Simulates full guided workflows for all 6 experiments with `transferMaterial` and `simulateTick`, asserting expected products, pH, temperature, effects, and success criteria.
