# Experiment Learning Stages, Videos & Educational Explanations (Task T23)

## Overview

Task T23 implements a structured five-stage educational viewer (`ExperimentLearningStageViewer`) and an accessible HTML5 demonstration video player (`EducationalVideoPlayer`) for the **STEM Virtual Lab** experiment details page. It connects existing verified experiment definitions (`saltDissolutionWorkspace` and `saltExperimentDefinition`) to student-friendly explanations while keeping reading progress strictly independent from live 3D simulation completion.

---

## 1. Architectural Structure

```
src/
└── features/
    └── experiments/
        ├── types/
        │   └── learningStages.ts                    # Typed stage, video, track, and step-mapping models
        ├── data/
        │   └── experimentLearningStages.ts          # Canonical 5-stage dataset & navigation selectors
        └── components/
            ├── EducationalVideoPlayer.tsx           # HTML5 video player + honest "Video Coming Soon" state
            └── ExperimentLearningStageViewer.tsx    # Interactive 5-stage educational viewer
src/pages/
└── ExperimentDetailsPage.tsx                        # Integrated details view with 5-stage walkthrough
```

---

## 2. Five Educational Stages Model

The viewer supports five structured educational stages derived from `saltDissolutionWorkspace.stages`:

| Order | Stage ID | Stage Kind | Canonical Title | Focus for Salt Dissolution (`exp-salt-water-001`) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `equipment` | `equipment` | **Laboratory Equipment** | Identifies the 250 mL beaker, 100 mL graduated cylinder, glass stirring rod, digital balance, spatula, and weighing boat. |
| **2** | `reactants` | `materials` | **Reactants and Chemicals** | Clarifies that water ($\text{H}_2\text{O}$) is the solvent and sodium chloride ($\text{NaCl}$) is the solute—no chemical reaction occurs. |
| **3** | `procedure` | `procedure` | **Experimental Procedures** | Ordered steps: measure 100 mL water, transfer to beaker, weigh 5 g salt in tared boat, add salt, and stir until dissolved. |
| **4** | `measurements` | `measurements` | **Measurements** | Explains eye-level meniscus reading (100 mL) and tared balance weighing (5 g net mass), noting simulation modeling limits. |
| **5** | `observations` | `observations` | **Chemical Reactions and Results** | Explains physical dissolution ($\text{Na}^+$ and $\text{Cl}^-$ ion dispersion in water) without inventing a new chemical compound. |

---

## 3. Separation Between Educational Stages & 3D Simulation Workflow

- **Conceptual Step Mapping (`resolveLinkedSimulationSteps`):** Each educational stage lists the corresponding validated steps in `saltExperimentDefinition` (e.g., *Step 3: Measure 100 mL water*, *Step 5: Scoop and weigh 5 g NaCl*, *Step 7: Stir until no solid remains*) so students see how theory maps to the 3D workbench.
- **Strict State Isolation:** Navigating between the 5 educational stages updates only local component state (`selectedIndex`) and never dispatches events or mutations to `useSaltSimulationStore` or `useLabSceneStore`.
- **Reused Components & Selectors:** Reuses `ExperimentStageNavigation`, `ToolAndMaterialVisual`, `clampGuideStage`, `findInventoryItem`, and `guidePositionPercent`.

---

## 4. Video Support & Honest Missing-Video Handling

### `EducationalVideoPlayer` Capabilities
- **When Video Sources Are Available (`status: 'available'`):**
  - Renders a responsive 16:9 (`aspect-video`) HTML5 `<video>` element with native playback controls (`controls`), `preload="metadata"`, and `playsInline`.
  - Never autoplays (`autoPlay` is omitted).
  - Supports custom `posterUrl`, multiple `<source>` formats (`mp4`, `webm`), and accessible WebVTT `<track kind="captions">` elements.
  - Provides loading status, accessible Play/Pause/Seek controls, and a retryable error fallback alert if media fails to load.
- **When Approved Videos Are Not Yet Available (`status: 'coming-soon'`):**
  - Displays a clear **"Video Coming Soon"** badge and stage-specific description of the upcoming demonstration clip.
  - Keeps all written scientific explanations, ordered steps, and apparatus cards available.
  - Never substitutes unrelated stock footage or autoplay decorative animations.

---

## 5. Planned Experiments & Future Extensions

- **Planned Experiments (`exp-volume-002`, `exp-ph-003`):** `getExperimentLearningStages` returns `undefined`, rendering an honest placeholder message without fabricating unapproved steps or measurements.
- **Future Extension Metadata (`StageExtensionMetadata`):** Each stage includes `reviewStatus`, `illustrationKey`, `keyConcepts`, and `futureAiPromptContext` (`focusTopic` and `scientificGuardrails`) to support future instructor review and AI-assisted explanations without adding live AI API dependencies in this task.
