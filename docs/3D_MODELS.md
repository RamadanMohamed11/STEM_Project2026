# L4 — 3D Models Library

Every equipment and chemical id in the catalogue (`equipmentCatalog.ts`) now has a 3D model:

- The 8 salt-experiment items keep their hand-built models (`three/models/*.tsx`).
- The other **52** items come from the **L4 library**: procedural models described as data and rendered by one component.
- There are no downloaded models, textures or images. Labels are drawn locally on a canvas.

## Files (`src/features/simulations/three/models/library/`)

| File               | Role                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `glassware.ts`     | Pure geometry: outline generators, the glass-wall builder and the **fill model**.                                                                                                              |
| `parts.ts`         | The part types, the material keys, and `buildPartGeometry` (shared by the renderer and the tests).                                                                                             |
| `modelSpecs.ts`    | One spec per catalogue id, the snap heights (`TRIPOD_TOP`, `CLAMP_JAW_Y`, `CLAMP_REACH`), and `getVesselFill` / `getModelAnchors`.                                                             |
| `LibraryModel.tsx` | Renders any spec: glass shells (`GlassVesselShell`), solid parts with our own material palette, labels (`SurfaceLabel`), graduations (`VesselMarkings`) and liquid (`ProfiledVesselContents`). |

`sceneConfig.ts` builds `libraryEquipmentRegistry` from the specs. `resolveEquipment` serves both registries, so copies, the waste bin, undo/redo and snapping all work for library items.

## Template: adding a model

1. Add a spec to `specs` in `modelSpecs.ts` and use the catalogue id as its `id`.
   - `label`: short bench name, 24 characters or fewer.
   - `footprintRadius`: collision circle, in metres.
   - `height`: collider height.
   - `maxInstances`: how many copies may be on the bench.
   - `parts`: the model's parts.
2. Build the parts from the vocabulary:
   - `glass`: an outer silhouette. The wall, rim and floor are generated.
   - `lathe`: a solid profile.
   - `cylinder`, `box`, `sphere`, `torus`.
   - `tube`: a curved path, used for wires and bent glass.
   - `label`: flat, or wrapped around a cylinder.
   - `graduations`.
   - Each part can have an `at` / `rot` transform.
3. For a glass vessel, add `vessel: { part, capacityMl, nominalY, contents? }`.
   - `part` is the index of the glass part.
   - `nominalY` is where the capacity line sits.
   - With `vessel` set, the model gets the fill API and anchors automatically.
4. Run `npm test`. `tests/modelLibrary.test.mjs` checks:
   - every catalogue id has a model;
   - fewer than 5,000 triangles per model;
   - no external assets;
   - volumes that round-trip to 0.1 mL;
   - anchors.

**Scale:** models are drawn larger than life, matching the existing models (the 250 mL beaker is 0.78 m tall). Y = 0 is the bench surface and models face +Z.

## Glassware generator and fill API (L4a)

- **Outline generators:** `beakerOutline`, `testTubeOutline`, `erlenmeyerOutline`, `roundBottomOutline`, `cylinderOutline`, `bottleOutline`, `pearOutline`, `watchGlassOutline`.
- `glassWall(outer, wall)` offsets the silhouette inwards along its normals. It returns the closed lathe cross-section (`shell`) and the inner surface (`inner`).
- `createFillModel(inner, capacityMl, nominalY)` computes volumes of revolution, so the liquid height follows the real shape:
  - `heightForVolume`, `volumeAtHeight`, `liquidProfile` (a closed lathe for the liquid body) and `surfaceRadius`;
  - a conical flask fills quickly near its base, and a round flask fills slowly at its widest part;
  - overfilling stops at the rim.
- `getModelAnchors(id)` returns:
  - `mouth`: the centre of the opening;
  - `pourLip`: the rim point on +X;
  - `liquidBase`: the inner floor.
  - L5 (pouring) uses these anchors.
- `ProfiledVesselContents` in `VesselContents.tsx` draws the liquid from the fill model. The spirit lamp and the acid bottle show static contents.

## The models

| Group     | Models                                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vessels   | beaker 100 / 1000 mL, conical flask 250 / 100 mL, round-bottom flask (on a cork ring), three-neck flask, distillation flask, test tube, hard-glass tube, separating funnel (with its own ring stand), gas jar with cover plate, water trough, U-tube, electrolytic cell, watch glass, evaporating dish |
| Measuring | burette (with its own stand), volumetric pipette, thermometer, calorimeter, multimeter, conductivity tester, pH paper with colour chart                                                                                                                                                                |
| Heating   | Bunsen burner, spirit lamp, water bath, combustion spoon, wire gauze, tripod                                                                                                                                                                                                                           |
| Tools     | dropper, wash bottle, test-tube rack, clamp stand, crucible tongs, filter funnel, Liebig condenser, delivery tube, flame-test wire, safety shield, white tile, cobalt glass, wooden splints, filter paper, scalpel, DC power supply, carbon electrodes, connecting wires, sandpaper, light source      |
| Chemicals | HCl reagent bottle (amber glass), NaOH pellet jar, NH₃ gas cylinder. The labels are our own design, with hazard words.                                                                                                                                                                                 |

The largest model is the three-neck flask, at 4,560 triangles.

## In the lab

- In the inventory, tick **Show all lab equipment**. Every catalogue item then shows **Practice item · drag to bench** and can be dragged or added with **+ Add to bench**.
- Library items are practice equipment: they render, collide, snap, copy, undo and go in the waste bin, but they hold no chemistry yet. The 3D lab moves onto the L1 engine in L5.

## Snap points

The L3 rules are now active, and each rule has a height (`elevation` / `elevationByType`):

| Rule                    | Holder → items                                                         | Result                                     |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| `tripod-holds-vessel`   | tripod → beakers, conical flasks, evaporating dish, round-bottom flask | sits on the ring (with room for the gauze) |
| `gauze-on-tripod`       | tripod → wire gauze                                                    | sits on the ring                           |
| `burner-under-tripod`   | tripod → Bunsen burner, spirit lamp                                    | stays on the bench under the ring          |
| `clamp-holds-glassware` | clamp stand → flasks, test tube, hard-glass tube, graduated cylinder   | raised so its neck meets the jaws          |
| `flask-under-burette`   | burette stand → conical flasks, 100 mL beaker                          | on the stand base, under the tip           |
| `rack-holds-test-tube`  | test-tube rack → test tube                                             | first slot                                 |

How snapping works with the mouse:

- While you drag an item, it may pass over a compatible holder.
- Releasing it inside the capture radius snaps it.
- Releasing it over the holder but outside the radius sends it back to the last clear spot. This is part of the same drag, so it adds no undo step.
- The experiment's own chemistry-linked items (the salt beaker, cylinder…) do not snap yet, because pouring into a raised vessel needs L5/L7.

## Verification

- `tests/modelLibrary.test.mjs` (8 tests) covers:
  - catalogue coverage;
  - the triangle budget and no external assets;
  - the glass-wall shape;
  - the fill API (linear cylinder, conical flask, 0.1 mL round-trip, rim clamp, closed liquid body);
  - anchors;
  - the registry and inventory;
  - the real snap rules and heights;
  - store snap, move-together and undo.
- **Browser, with real clicks:**
  - Added a tripod, Bunsen burner, conical and round-bottom flasks, clamp stand, HCl bottle and burette stand from the inventory.
  - A real mouse drag of the conical flask onto the tripod gave "Conical flask 250 mL snapped into place." The flask rests on the ring.
  - The Selected object panel shows the bench name ("Conical flask 250 mL").
