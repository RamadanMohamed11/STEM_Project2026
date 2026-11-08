# L5 — Liquids, Pouring and Volume Readout

Practice equipment on the bench can now hold liquids and pour into one another. The equipment covered is:

- the L4 library vessels;
- practice copies of the salt beaker and graduated cylinder (`beaker~2`…);
- the wash bottle, the HCl bottle and the dropper.

The chemistry runs on the **L1 engine**. The guided salt experiment keeps its own validated workflow, and its chemistry-linked items are untouched.

## How to use it (student)

1. In the inventory, tick **Show all lab equipment** and add, for example, the **wash bottle** (450 mL water) and a **conical flask**.
2. Click the wash bottle, then the flask. The **Practice pour** panel opens and shows both volumes ("450.0 mL / 500 mL").
3. Choose how to pour:
   - **Tilt control:** drag the slider, or use the arrow keys. The bottle moves over the flask and tips. Liquid starts to flow once the tilt reaches the lip: a fuller vessel pours sooner, an emptier one must be tipped further. The flow then rises with the tilt, and the panel shows the angle and mL/s.
   - **Pour 1 mL / Pour 10 mL / Pour [n] mL:** the keyboard-friendly way. It pours exactly that amount, tipping further as the vessel empties, then straightens.
   - **Straighten**, or **Esc**, stops a pour. A hidden tab or leaving the window also straightens the vessel.
   - **Swap direction** reverses the source and the target.
4. A **live readout** floats above the receiving vessel: `poured X mL / total Y mL`, to 0.1 mL, plus the pH when the liquid is acidic. Each new pour counts "poured" from zero, and the readout stays visible for 4 s after the pour stops.
5. **Overflow:** liquid beyond capacity spills. You see:
   - a red readout ("overflow");
   - a warning in the panel ("Test tube overflowed — 0.3 mL spilled on the bench. Pouring stopped.");
   - a fading puddle on the bench.
   - The pour stops on its own.
6. **Dropper:** select a vessel and the dropper, then **Fill dropper (up to 1 mL)**. Then select the dropper and a vessel, and **Add 1 drop (0.05 mL)**. Each drop falls visibly. An empty dropper opens in fill mode; a filled one opens in drop mode.

## Model

| Piece                           | Where                                                                                                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pouring a mixture               | `pourLiquid` in `engine/core/state.ts`. Every liquid and dissolved species leaves in proportion, and settled solids and gases stay behind. Overflow spills and is reported. Source loss = target gain + spill (exact; a full pour leaves no float residue). |
| Bench containers and substances | `lib/benchLiquids.ts`: which ids hold liquid, capacities, flow limits, initial contents, and the substances (water; 1.0 M HCl as one liquid, so the engine's pH model gives pH 0 for the stock and pH 1 for 10 mL in 100 mL).                               |
| Tilt → flow                     | `pourStartAngle(fill) = 0.22 + (1 − fill) × 1.05` rad. `flowRateMlPerS = max × t²`, where `t` rises from 0 to 1 over the next 0.45 rad. The maximum flow comes from the mouth radius (a beaker pours faster than a test tube).                              |
| State and clock                 | `state/useBenchLiquidsStore.ts`, driven by `three/BenchLiquidsController.tsx` (rAF; it syncs containers with the bench).                                                                                                                                    |
| Pose                            | `getPourPose` (`equipmentPose.ts`) accepts dimension overrides. The source lip moves over the receiver centre, above its rim, and allows for a holder's snap height.                                                                                        |
| Visuals                         | `three/BenchPourEffects.tsx`: stream (width follows the flow) with falling droplets, the falling drop, the spill puddle, and the readout (`Html`, `aria-live`).                                                                                             |
| Liquid level                    | The L4 fill model: the liquid follows each vessel's inner shape, and its colour comes from `readColor` (L1).                                                                                                                                                |
| Panel                           | `components/BenchPourPanel.tsx`, shown by `PairInteractionPanel` when both selected items are bench liquid containers.                                                                                                                                      |

## Rules and limits

- Grabbing items and bench undo/redo are paused while a practice pour is tilted. Undo/redo restore layout only, not liquids (as in L3).
- When a vessel leaves the bench (waste bin, removal, restart), its liquid is discarded. When it comes back, it starts with its initial contents only: the HCl bottle is refilled, other vessels are empty.
- The burette and the separating funnel are not pour sources yet (their taps come with L8). The spirit lamp is not a container.
- The catalogue's liquids (water, dilute HCl) are both colourless, so mixtures look clear. The engine's colour blending is verified with a test dye; coloured reagents come with the L11 experiments. pH is the visible chemistry result for now.
- Pouring is a teaching model (volume flow, not fluid simulation). In the browser pane, a hidden page gets no animation frames, so a pour pauses until the page is visible.

## Verification

- `tests/benchLiquids.test.mjs` (8 tests) covers:
  - which items hold liquid (salt items excluded);
  - `pourLiquid` proportional mixture, spill and conservation;
  - the tilt-flow curve and 0.1 mL formatting;
  - "Pour 10 mL" gives exactly 10.0 mL and a new pour counts from zero;
  - free tilt: no flow at low tilt, and no flow after straightening;
  - overflow spills, warns and stops, with conservation;
  - pH 1.0 after 10 mL HCl in 90 mL water;
  - the dropper: fill and single 0.05 mL drops;
  - containers syncing with the bench;
  - the pose lip above and over the receiver.
- **Browser, with real clicks and keys:**
  - The tilt control was dragged to 59°. The wash bottle moved over the flask and poured at 20 mL/s, the stream and readout appeared, and the total stayed 450.0 mL.
  - **Straighten** stopped the flow.
  - **Pour 10 mL** added exactly 10.000 mL.
  - Typing 40 mL into the 25 mL test tube filled it to 25.0, showed the red overflow readout and warning, and stopped the pour; the total stayed 450.
  - HCl → dropper: **Fill dropper** gave "Dropper filled with 1.0 mL".
  - Three **Add 1 drop** clicks into the full tube each spilled with a warning, and the total was conserved.
