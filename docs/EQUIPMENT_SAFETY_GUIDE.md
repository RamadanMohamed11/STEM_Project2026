# Laboratory Equipment Safety Guide (Task T13)

## Overview

Task T13 implements an interactive, educational **Laboratory Equipment Safety Guide** integrated directly into the Safety section of **STEM Virtual Lab**. The guide introduces secondary school students to 8 essential chemistry tools, their functions, how they are handled safely, and common mistakes to avoid.

## 1. Architectural Structure

```
src/
├── features/
│   └── safety/
│       ├── types/
│       │   └── equipmentGuide.ts         # Type definitions (EquipmentGuideItem, EquipmentCategory)
│       ├── data/
│       │   └── equipmentGuideData.ts     # Authoritative dataset for all 8 tools
│       └── components/
│           ├── EquipmentVisual.tsx       # Lightweight 2D SVG vector illustrations
│           ├── EquipmentCard.tsx         # Card presentation for grid view
│           ├── EquipmentDetailView.tsx   # Detailed view with safe handling & common mistakes
│           └── EquipmentGuideExplorer.tsx # Master explorer with search & category filters
└── pages/
    └── SafetyPage.tsx                    # Integrates Section 05 and top navigation link
```

## 2. Equipment Entries (8 Core Tools)

| Tool | Category | Short Purpose | Material | Key Safety Reminders |
|:---|:---|:---|:---|:---|
| **Beaker** | Glassware | Hold, mix, and roughly estimate liquids | Borosilicate glass | Use beaker tongs when hot; do not use for precise volume readings; inspect for cracks. |
| **Test Tube** | Glassware | Observe small-scale reactions and heat samples | Borosilicate glass | Aim open mouth away from people when heating; use a test tube clamp; do not overfill. |
| **Graduated Cylinder** | Measurement | Measure liquid volumes accurately | Calibrated borosilicate / PP | Read at eye level at the bottom of the meniscus; never heat; keep plastic bumper at the top. |
| **Glass Stirring Rod** | Handling | Stir solutions and guide liquid flow | Solid borosilicate glass | Stir gently without striking glassware; rinse between chemicals; do not use as a thermometer. |
| **Digital Balance** | Measurement | Measure substance mass with high precision | Stainless steel & electronic strain | Always use a weighing boat; press Tare first; never place raw chemicals directly on the pan. |
| **Laboratory Spatula** | Handling | Scoop and dispense solid chemical reagents | Stainless steel / porcelain | Never return excess chemicals to stock bottles; use a clean, dry spatula; tap gently to dispense. |
| **Dropper (Pipette)** | Handling | Transfer small, controlled liquid volumes | Glass & rubber / PE | Hold vertically; never invert or lay flat with liquid; use separate droppers for different chemicals. |
| **Chemical Container** | Storage | Store and protect chemical reagents safely | Borosilicate / HDPE | Read labels twice; place caps upside-down; close immediately; support base when carrying. |

## 3. Interactive Explorer Features

- **Real-Time Search:** Filters tools dynamically by name, purpose, intended use, and common mistakes.
- **Category Filters:** Quick filter chips for *All Equipment*, *Glassware*, *Measurement*, *Handling Tools*, and *Storage & Containers*.
- **Deep Exploration Mode:** Selecting an equipment card expands the focused `EquipmentDetailView` with:
  - Detailed function description.
  - "How It Is Used" practical points.
  - "Safe Handling Practices" with visual badges.
  - "Common Mistakes to Avoid" highlighted with warning badges.
  - Sequential "Previous" and "Next" navigation controls (<kbd>←</kbd> / <kbd>→</kbd>).
  - Keyboard <kbd>Esc</kbd> support to return to the equipment grid.
- **Lightweight Visual Architecture:** Clean, high-contrast SVG vector illustrations in [`EquipmentVisual.tsx`](file:///e:/STEM%20Project/src/features/safety/components/EquipmentVisual.tsx) avoiding heavy redundant 3D/WebGL scenes.

## 4. Verification

- **TypeScript (`tsc -b --pretty`):** Clean compilation, 0 errors.
- **ESLint (`eslint .`):** Clean linting, 0 warnings/errors.
- **Node Test Runner (`npm test`):** 219 passing tests, including dedicated [`tests/equipmentSafetyGuide.test.mjs`](file:///e:/STEM%20Project/tests/equipmentSafetyGuide.test.mjs).
- **Production Build (`npm run build`):** Clean Vite bundle generation in 1.33s.
