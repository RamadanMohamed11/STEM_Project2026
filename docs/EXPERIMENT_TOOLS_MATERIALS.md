# Experiment Tools & Materials (Task T21)

## Overview

Task T21 implements structured, accessible, and scientifically accurate **Laboratory Tools** and **Chemical Materials** sections for the **STEM Virtual Lab** experiment details pages. It reuses existing simulation equipment and material definitions, providing clear secondary-school-level explanations, recognizable vector illustrations, and precise distinctions between stock supplies and experiment targets.

---

## 1. Architectural Structure

```
src/
└── features/
    └── experiments/
        ├── types/
        │   └── toolsAndMaterials.ts             # Typed presentation models
        ├── data/
        │   └── experimentToolsAndMaterials.ts   # Canonical dataset & selectors
        └── components/
            ├── ToolAndMaterialVisual.tsx        # High-contrast scientific SVG illustrations
            ├── ExperimentToolsSection.tsx       # "Laboratory Tools" section & responsive grid
            └── ExperimentMaterialsSection.tsx   # "Chemical Materials" section & formula formatting
src/pages/
└── ExperimentDetailsPage.tsx                    # Composed details view with tools & materials
```

---

## 2. Tools & Materials Models

### Separation of Educational Content from 3D Engine

The presentation layer is decoupled from executable 3D simulation mechanics (`saltExperimentDefinition.ts`), maintaining clean separation of concerns while referencing matching entity IDs:

- **Tools Model (`ExperimentToolItem`)**:
  - `id`: Stable identifier matching simulation equipment (`'beaker'`, `'graduated-cylinder'`, `'stirring-rod'`, `'digital-balance'`, `'spatula'`, `'weighing-boat'`).
  - `name`: Human-readable name.
  - `visual`: Illustration key for SVG rendering.
  - `shortExplanation`: Concise physical description of the apparatus.
  - `purpose`: Educational explanation of how the tool is used in this experiment.
  - `specification`: Optional glassware/material specification (e.g. *250 mL Borosilicate Glass*).
  - `safetyNote`: Practical handling precaution for students.

- **Materials Model (`ExperimentMaterialItem`)**:
  - `id`: Stable identifier matching simulation materials (`'water'`, `'sodium-chloride'`).
  - `name`: Chemical/material name.
  - `formula`: Formatted chemical notation (e.g., `H₂O`, `NaCl`).
  - `role`: Chemical function in the experiment (*Solvent*, *Solute*, etc.).
  - `physicalAppearance`: Description of observable state at room temperature.
  - `requiredQuantity`: Target amount required for the activity (e.g., *100 mL*, *5 g*).
  - `stockQuantity`: Bench supply amount (e.g., *400 mL supply bottle*, *100 g reagent jar*).
  - `safetyNotes`: Handling reminders and precautions.

---

## 3. Supported Experiment Configuration (Salt Dissolution)

The data matches `saltExperimentDefinition` exactly:

### Required Laboratory Tools (6 Tools)
1. **Beaker** (`beaker`): 250 mL Borosilicate Glass — Holds water solvent and provides space for stirring.
2. **Graduated Cylinder** (`graduated-cylinder`): 100 mL Calibrated Glass — Measures liquid volume accurately at the meniscus.
3. **Glass Stirring Rod** (`stirring-rod`): Solid Borosilicate Glass — Gently disperses solid crystals without glass impact.
4. **Digital Balance** (`digital-balance`): 0.01 g Precision — Measures net solid mass in a tared weighing boat.
5. **Laboratory Spatula** (`spatula`): Stainless Steel Scoop — Cleanly transfers powder increments from the reagent bottle.
6. **Weighing Boat** (`weighing-boat`): Polystyrene Dish — Holds powder during weighing and flexes for transfer.

### Chemical Materials (2 Materials)
1. **Water** ($H_2O$):
   - Role: *Solvent*
   - Target Required: **100 mL** (graduated cylinder measurement)
   - Stock Supply: **400 mL** (bench bottle)
   - Appearance: Clear, colorless liquid.
2. **Sodium Chloride** ($NaCl$):
   - Role: *Solute*
   - Target Required: **5 g** (digital balance measurement)
   - Stock Supply: **100 g** (reagent supply jar)
   - Appearance: White crystalline solid.

> [!NOTE]
> Quantities are explicitly designated as educational simulation targets rather than calibrated analytical laboratory standards.

---

## 4. Planned Experiments & Honest Empty States

In adherence to Requirement 4, planned experiments (such as *Measuring Liquid Volume* and *Exploring pH Indicators*) do not display fabricated or assumed equipment lists. Instead, `getExperimentToolsAndMaterials` returns `undefined`, triggering clear, honest placeholder states:

- *"Tools and laboratory apparatus for this planned experiment have not been finalized yet."*
- *"Chemical materials and reagents for this planned experiment have not been finalized yet."*

---

## 5. Accessibility & UX Design

- **Semantic Landmarks:** `<section aria-labelledby="experiment-tools-title">` and `<section aria-labelledby="experiment-materials-title">`.
- **Chemical Formulas:** Automatically rendered with proper HTML `<sub>` tags for digits (e.g. `H<sub>2</sub>O`).
- **Responsive Layout:** 1 column on mobile, 2 columns on tablet, 3 columns on desktop for tools; 2 columns on desktop for materials.
- **Strict English Standard:** All copy is in clear, natural secondary-school English with zero Arabic text.
- **Simulation Isolation:** Zero changes to `src/features/simulations/` or 3D engine physics.
