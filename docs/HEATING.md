# L7 — Heating & Temperature

Practice vessels on the bench can be heated over a flame. The engine models the temperature, boiling and cooling, and hot equipment cannot be picked up.

## How to use it (student)

1. In the inventory (**Show all lab equipment**), add a **tripod**, a **Bunsen burner** (or spirit lamp), a vessel (for example a **100 mL beaker**) and the **wash bottle**.
2. Drag the burner under the tripod, and the vessel onto it. Both snap into place (L3).
3. Pour some water into the vessel (L5).
4. Select the burner and press **Light Bunsen burner**. A flame appears on the burner, and the panel says what it is heating.
5. The vessel warms up. A tag above it shows `64 °C · heating`, and the vessel's panel (select it) shows the temperature to 0.1 °C. Smaller volumes heat faster.
6. At 100 °C the water **boils**: the temperature holds at the boiling point, bubbles rise, steam leaves the mouth, a glow shows under the vessel, the tag reads `100 °C · boiling`, and the volume falls as the water boils away.
7. **Turn off** the burner. The vessel cools towards room temperature (22 °C).
8. **Hot surfaces:** trying to drag, rotate or remove a lit burner, a tripod over a lit flame, or a vessel at 50 °C or more shows the T41 **Hot Surface** warning with its precautions, and the item stays put.

## I2 — Safe undo and redo (10 November 2026)

Undo and redo now use the same `checkHotTouch` path as direct handling. Before changing the history pointer, they check every moved/removed/rotated item, changed snap contact, affected liquid vessel and moved snapped child. A vessel at or above `HOT_TOUCH_C` (50°C), a lit burner or a tripod over a lit flame blocks the action, shows `HotTouchWarning` and records the same `recordHotTouch` mistake. Nothing in the layout, liquids or history stacks changes when blocked. Let the item cool and turn off the flame before retrying.

Practice-liquid history restores affected vessels' contents and temperature for a removal or pour. Layout-only undo/redo keeps their current temperature and does not rewind passive cooling. Unrelated containers and burner setups are preserved. If restoring a layout changes/removes the vessel above a lit burner, the history action calls the existing `setLit(..., false)` path. Redo never ignites a burner automatically; use the existing Light control after checking the restored setup.

Node coverage is in `tests/benchLiquidHistory.test.mjs`, including the 50°C threshold, unchanged history pointers on blocked undo/redo, hot placed/restored vessels, snapped children, lit burner/tripod checks, and safe extinguishing without automatic relighting. Chemistry, heating rates, safety-rule definitions and the guided salt workflow are unchanged.

I2 browser verification: at **375px and 1440px**, a real Light action followed by Undo showed the existing Hot Surface warning and left the history stacks unchanged. Turn off → Undo succeeded; Redo restored the burner unlit. The 50°C vessel threshold and holder/child cases were verified by Node tests, not fabricated browser temperature readings. Screenshots and the browser report are listed in LIQUIDS_POURING.md. At 375px, Bench controls can cover part of a hot-surface alert, and simultaneous goggles/hot-surface alerts can also overlap; this existing overlay layout was not redesigned in I2.

## Model

| Piece                                      | Where                                                                                                                                                                                                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heat sources, heating rate, hot-touch rule | `lib/benchHeating.ts`. Bunsen 1.6 °C/s and spirit lamp 0.8 °C/s per 100 mL of liquid; the heat is spread over at least 15 mL. `burnerUnder` follows the snap relationships (burner → tripod ← vessel). `HOT_TOUCH_C = 50`.                                                                         |
| Temperature, boiling, cooling              | L1 engine (`simulateTick`). Heating comes in as `heatingCPerSecond`. A liquid is held at its boiling point (water 100 °C, dilute HCl 100.5 °C), and the evaporation processes (0.25 mL/s) boil it away. Newton cooling runs at 2 %/s towards 22 °C.                                                |
| State                                      | `useBenchLiquidsStore`: `lit`, `setLit`, `react(dt, relationships)`, `checkHotTouch`, `hotTouch`. `BenchLiquidsController` calls `react` each frame. It skips the engine when nothing is heated, warm or reacting.                                                                                 |
| Visuals                                    | `three/BenchHeatingEffects.tsx`: burner flames (the shared flame shader from L6, blue for Bunsen and orange for the spirit lamp, with a point light) and temperature tags. Boiling bubbles, steam and the glow are the L6 `gas` and `heat` effects: the engine's `evaporated` events become `gas`. |
| Panels                                     | `components/BenchHeatingPanel.tsx`: `BurnerPanel`, `BenchVesselInfo` (volume and temperature) and `HotTouchWarning`. The practice-pour panel also shows °C when a vessel is warm.                                                                                                                  |
| Blocking                                   | `useEquipmentManipulation` (pointer-down), `BenchToolbar` (rotate/remove/keys), and `useLabSceneStore` (undo/redo hot-item guard before moving the history pointer).                                                                                                                               |
| Temperature-dependent reactions            | L1 `ReactionConditions.minTemperatureC` / `maxTemperatureC` / `requiresHeating`. They work with bench heating unchanged; see the test.                                                                                                                                                             |

## Verification

- `tests/benchHeating.test.mjs` (4 tests) covers:
  - snap-chain detection and heating rates by volume and source;
  - an unlit burner does nothing;
  - 60 mL of water heats at about 3.2 °C/s, is held at 100 °C and boils away;
  - the boiling effect, and cooling when the burner is off;
  - the hot-touch rules and warning;
  - removing a lit burner puts it out;
  - a 60 °C reaction runs only after heating.
- **Browser**, with real clicks and a real drag:
  - **Light Bunsen burner** lit the flame, and 60 mL heated to 64 °C ("64 °C · heating").
  - The water boiled at 100 °C with the glow, bubbles and steam, and the volume fell from 60 to 54.9 mL.
  - Dragging the boiling beaker showed the Hot Surface warning, the beaker did not move, and the camera did not orbit.
  - **Turn off** stopped the boiling, and the beaker cooled to 57 °C in 40 s.
