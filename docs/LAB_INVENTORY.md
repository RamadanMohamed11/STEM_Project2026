# L2 — Lab Inventory (categories, search, A–Z)

The lab inventory panel was redesigned to work like a real lab supply cabinet. The design is our own; the reference video was used only for the general idea.

## What students see

- **Category rail.** It runs down the left side on desktop and becomes a horizontal row at the top of a bottom sheet on phones. The categories are All, Reaction vessels, Assistive devices (tools), Measuring, Heating, Solid chemicals, Liquid chemicals and Gas chemicals. Each shows an icon, a short label and a count. The counts follow the current search and letter, so a category shows how many items a click on it would give.
- **Search** matches an item's name, a chemical formula, its id and its catalogue aliases. Subscripts count as plain digits: `h2o` finds **Water (H₂O)** and `nacl` finds **Sodium chloride (NaCl)**. Several words must all match.
- **A–Z index.** Letters with no matching item are disabled. Clicking the active letter clears it.
- Category, search and letter **combine**. The panel shows "N items" and a **Clear filters** button.
- **Item cards** are laid out in two columns. Each card shows a 3D-style preview, the name, the formula (for chemicals, taken from the L1 engine definition) and a status: _Drag to bench_, _Click bench to place_ or _On workbench · grab to move_.
- The **ⓘ button** on a card opens that item's catalogue note inside the panel, below the grid: use, how to handle it, and safety (from T42 `equipmentCatalog`).
- **Show all lab equipment** (guided mode) adds the rest of the catalogue, such as burners, burettes and flasks, as greyed-out cards marked "Not used in this experiment". Their notes still open, so students can learn about the equipment.

## Behaviour kept from before

- Clicking an item card still starts placement ("Click bench to place"), and dragging a card onto the bench still places it. The drag type is still `application/x-stem-lab-equipment`.
- Dragging and clicking are disabled during a material transfer.
- The panel keeps its accessible name "Lab inventory" and the "Collapse inventory" button. The first button containing an item's name is still that item's card. The Playwright scripts rely on all three, and a test checks the last one.
- The panel now stays mounted while collapsed (using `hidden`), so the category, search and letter filters survive closing and reopening it.

## Deviation from the plan

The plan said "click card → tool note". Clicking a card already **starts placement**, which students and the browser acceptance scripts depend on. So the note opens from a separate ⓘ button instead.

The keyboard "Add to bench" (automatic placement without the mouse) belongs to **L3**, together with free placement. In L2 the card buttons are keyboard-focusable and start placement exactly as a click does.

## Free mode

`buildInventoryEntries({ mode: 'free' })` lists the whole catalogue, with every category enabled. Items without a 3D model are marked "3D model coming soon". The lab uses `mode: 'guided'` until L9 adds the free-mode switch. Only the salt experiment's 8 items have 3D models today; L4 adds the rest.

## Files

- `src/features/simulations/lib/inventoryBrowser.ts` (pure): `INVENTORY_CATEGORIES`, `buildInventoryEntries`, `filterInventory`, `countByCategory`, `availableLetters`, `normalizeSearch` and `firstLetter`.
- `src/features/simulations/components/LabInventoryPanel.tsx`: the panel. It replaces the inline list that was in `LaboratoryLayout.tsx`.
- The older, unused `InventoryPanel.tsx` / `InventoryItem.tsx` were left untouched.

## Verification

- `tests/inventoryBrowser.test.mjs` (5 tests) covers:
  - category mapping and formulas;
  - search by name, formula, alias and subscript;
  - combined filters, counts and letters;
  - catalogue items in guided and free mode;
  - rendering: the rail and its counts, the labelled search, disabled letters, the formula cards, the note buttons, hidden when collapsed, no dragging during a transfer, and the first-button contract.
- Full suite: 414 pass. Typecheck, lint and build pass.
- Browser at 1280 px, with real clicks and typing:
  - **Measuring** shows the graduated cylinder and the balance.
  - Typing `h2o` finds Water (H₂O).
  - The Water note shows the catalogue text.
  - Clicking the card starts placement (`placement.id = water`) and the card reads "Click bench to place".
- Browser at 375 × 812:
  - The panel is a 351 × 503 bottom sheet with a horizontal rail and 2 card columns.
  - Rail buttons are 44 px tall.
  - The page does not scroll sideways.

Playwright (`tests/browserSmartTransfers.py`, real mouse): every tool was placed through the new inventory cards, and the "inventory preview is valid" and "inventory mouse placement" checks passed. The full workflow completed, the selection and reset cases passed, and all science checks passed. The only failures were the 3 known, pre-existing flaky stream-render timing checks (see KNOWN_ISSUES).
