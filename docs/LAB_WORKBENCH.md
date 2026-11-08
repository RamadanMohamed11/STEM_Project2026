# L3 — Free-Form Workbench

The bench now behaves like an open lab bench. Students can place several copies of an item, move, rotate and remove items, use a waste bin, undo or redo their last 20 layout changes, and reset the layout. All of this extends the existing scene store, placement controller and drag hook; there is no parallel system.

## Features

| Feature | How |
| ------- | --- |
| **Copies of an item** | Inventory **+ Add another** (or drag the card again). Limits per type (`maxInstances`): beaker ×3, graduated cylinder ×3, weighing boat ×3, spatula ×2, stirring rod ×2, balance, water container and NaCl jar ×1. |
| **Add without a mouse** | Inventory **+ Add to bench** places the item at the first free valid spot (`addToBench`). |
| **Select / move / rotate** | Click, drag, the toolbar's ⟲ ⟳ buttons, or the `[` / `]` keys (22.5° steps). |
| **Remove** | The toolbar 🗑 button, the **Delete** key, or dragging onto the **waste bin** in the bench's front-right corner. The pointer decides, and the bin ring brightens while dragging. Extra copies are deleted; the experiment's original items return to the inventory. |
| **Undo / redo** | Toolbar buttons with the action named ("Undo: Move Beaker"), **Ctrl/⌘+Z** and **Ctrl/⌘+Shift+Z** or **Ctrl+Y**. The last 20 actions are kept. |
| **Reset bench** | A toolbar button with confirmation. It restores the starting layout, can be undone, and leaves the chemistry unchanged. |
| **Snap points** | Data rules (`SNAP_RULES` in `three/benchLayout.ts`): tripod holds a vessel, a burner goes under the tripod, and a clamp stand holds glassware. A released item within the capture radius locks to the snap point. It may overlap its holder, moves with it, and is unsnapped by dragging it away. |
| **Collisions** | Existing footprint checks and Rapier colliders apply to every copy. The waste-bin corner is kept clear. |

### Undo and redo details

- Undo and redo restore **bench layout only**: placements, positions, rotations and contacts. They never change chemistry.
- They are disabled while a transfer, effect, placement preview or drag is in progress.
- A whole drag is one history entry; a click without movement adds none.
- Dropping an item in the bin is one entry, and undoing it returns the item to where the drag started.
- Restarting the experiment clears the history.

### Snap points

The snap holder types (tripod, clamp stand, burner) arrive with the L4 3D models. Until then the rules are inert, because no holder can be on the bench. The logic is fully tested with fixture rules and wired into the drag and move code.

### Copies and the chemistry

- The first copy of a type keeps its canonical id (`beaker`). That copy is linked to the salt chemistry and the guided workflow.
- Extra copies (`beaker~2`, `beaker~3`) are empty practice equipment. They render, collide and move, but transfers between a copy and other items are not offered. Generic per-copy chemistry comes when the 3D lab moves fully onto the L1 engine (L5).

## Performance

Measured with Playwright in a real (non-headless) Chromium, on this machine's integrated **Intel UHD Graphics** (D3D11), at 1280 × 720:

| Scene | Before adaptive quality | With adaptive quality |
| ----- | ----------------------- | --------------------- |
| Default bench (2 items) | 54 fps | 54 fps (resolution 1.0) |
| 15 items, idle | 42 fps | **49–50 fps** (settles at 0.875) |
| 15 items, orbiting the camera continuously | 43–44 fps | **49 fps** |

- 15 items use 216 draw calls and 58k triangles.
- Profiling showed the lab is **fill-rate bound**: rendering at 0.75 resolution gave 58 fps, while turning off shadow updates gained only about 4 fps.
- `AdaptiveRenderQuality` (drei `PerformanceMonitor`) therefore steps the render resolution through 1.5 → 1.25 → 1 → 0.875 → 0.75, capped at the device ratio. It steps down only when the frame rate falls below 53 fps, and back up above 59. Geometry and simulation are unchanged.
- The bench fits 15 of the 16 possible items; the last one reports "No free space remains on the workbench."

## Files

- `three/sceneConfig.ts`: `maxInstances`, `resolveEquipment`, `nextInstanceId`, `instanceTypeId`, `isExtraInstance` and `instancesOnBench`. All by-id registry lookups now go through `resolveEquipment`.
- `state/useLabSceneStore.ts`: `past` / `future` history, `addToBench`, `dropInWasteBin`, `undo`, `redo`, `resetBench`, `snapTo`, drag history via `dragStart`, and snapped children that follow their holder.
- `three/benchLayout.ts`: snap rules and matching, and the waste-bin geometry.
- `three/movement.ts`: `validatePlacement` / `constrainDragMovement` accept the ids allowed to overlap (snapped pairs) and keep the bin corner clear.
- `three/useEquipmentManipulation.ts`: the bin and snap handling when a drag ends. `three/PlacementController.tsx`: inventory drags place the next free copy.
- `three/WasteBinMarker.tsx`, `three/AdaptiveRenderQuality.tsx`, `three/renderQuality.ts`, `components/BenchToolbar.tsx`; plus the Add buttons in `components/LabInventoryPanel.tsx`.

## Verification

- `tests/benchWorkbench.test.mjs` (10 tests) covers:
  - instance ids and limits;
  - add-to-bench and removing copies;
  - 15 items fitting with no overlap;
  - undo/redo across place, move, rotate, remove and reset, including clearing redo;
  - the 20-entry history limit and blocking during placement;
  - one history entry per drag;
  - the waste bin (corner kept clear, drop, single undo);
  - snap rules (radius, rotation, occupancy, overlap, child follows holder, unsnapping on drag);
  - the toolbar rendering;
  - the adaptive-quality steps.
- Full suite: 424 pass. Typecheck, lint and build pass.
- Browser, with real clicks and keys:
  - **+ Add another** placed Beaker 2, which exists in the 3D scene (7 meshes) with the waste bin.
  - Rotate, then Undo (button), then Redo (Ctrl+Shift+Z) all worked.
  - **Delete** removed the copy and **Ctrl+Z** brought it back.
  - Selecting Beaker 2 with Water showed no errors.
- A layout bug found while testing was fixed: the new Add button overflowed and was covered by the next card row.
- **Real-mouse Playwright check:**
  - A real click on "Add another Beaker" placed Beaker 2 at (−1.05, 0).
  - A mouse drag across the bench onto the bin removed it ("Beaker 2 put in the waste bin"; the Undo button read "Undo: Remove Beaker 2").
  - Ctrl+Z restored it at (−1.05, 0).
- **Full experiment regression** (`tests/browserSmartTransfers.py`): the selection and reset cases passed, and the whole workflow completed with all science checks passing. Only the known flaky stream-render timing checks failed (5; the pre-L3 code fails 3–5 of the same checks).
