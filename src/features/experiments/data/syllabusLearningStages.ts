import type { ExperimentLearningStagesData } from '../types/learningStages.ts'

interface StageParam {
  readonly subtitle: string
  readonly summary: string
  readonly steps: readonly string[]
  readonly scientificExplanation: string
  readonly highlights: readonly string[]
  readonly relatedInventoryIds: readonly string[]
  readonly processClassification?:
    | 'physical-dissolution'
    | 'chemical-reaction'
    | 'measurement-technique'
  readonly processBadgeLabel?: string
}

interface CreateStagesParams {
  readonly experimentId: string
  readonly experimentTitle: string
  readonly reactionClassificationNote: string
  readonly stage1: StageParam
  readonly stage2: StageParam
  readonly stage3: StageParam
  readonly stage4: StageParam
  readonly stage5: StageParam
}

function createSyllabusLearningStages(params: CreateStagesParams): ExperimentLearningStagesData {
  return {
    experimentId: params.experimentId,
    experimentTitle: params.experimentTitle,
    reviewStatus: 'draft',
    reactionClassificationNote: params.reactionClassificationNote,
    simulationSeparationNote:
      'This five-stage learning guide is for reading and preparation. Navigating these stages does not advance or complete steps in the 3D virtual laboratory.',
    stages: [
      {
        id: 'stage-1',
        order: 1,
        kind: 'equipment',
        title: 'Laboratory Equipment',
        categoryLabel: 'Stage 1 · Apparatus & Glassware',
        subtitle: params.stage1.subtitle,
        introduction: params.stage1.summary,
        summary: params.stage1.summary,
        steps: params.stage1.steps,
        scientificExplanation: params.stage1.scientificExplanation,
        note: 'Inspect each piece of apparatus before starting; ensure all glassware is clean and free of cracks.',
        relatedInventoryIds: params.stage1.relatedInventoryIds,
        relatedItems: [],
        linkedSimulationSteps: [],
        highlights: params.stage1.highlights,
        video: {
          status: 'coming-soon',
          title: `${params.experimentTitle}: Apparatus Overview`,
          description: `A video demonstration of the laboratory equipment used in ${params.experimentTitle} is in preparation.`,
          durationLabel: 'Demonstration clip pending',
        },
        extension: {
          reviewStatus: 'draft',
          keyConcepts: ['laboratory apparatus', 'glassware setup', 'experimental safety'],
          futureAiPromptContext: {
            focusTopic: `Selecting and inspecting apparatus for ${params.experimentTitle}`,
            scientificGuardrails: ['Maintain laboratory safety protocols at all times.'],
          },
        },
      },
      {
        id: 'stage-2',
        order: 2,
        kind: 'materials',
        title: 'Reactants and Chemicals',
        categoryLabel: 'Stage 2 · Reactants & Chemicals',
        subtitle: params.stage2.subtitle,
        introduction: params.stage2.summary,
        summary: params.stage2.summary,
        steps: params.stage2.steps,
        scientificExplanation: params.stage2.scientificExplanation,
        note: 'Handle all chemical reagents with appropriate PPE; check container labels twice before dispensing.',
        processClassification: params.stage2.processClassification ?? 'chemical-reaction',
        processBadgeLabel: params.stage2.processBadgeLabel,
        relatedInventoryIds: params.stage2.relatedInventoryIds,
        relatedItems: [],
        linkedSimulationSteps: [],
        highlights: params.stage2.highlights,
        video: {
          status: 'coming-soon',
          title: `${params.experimentTitle}: Reagents & Reactants`,
          description: `A video guide to the chemicals and solutions for ${params.experimentTitle} is in preparation.`,
          durationLabel: 'Demonstration clip pending',
        },
        extension: {
          reviewStatus: 'draft',
          keyConcepts: ['chemical reagents', 'stoichiometry', 'solution properties'],
          futureAiPromptContext: {
            focusTopic: `Chemicals and reagents for ${params.experimentTitle}`,
            scientificGuardrails: ['Adhere strictly to verified concentration and safety standards.'],
          },
        },
      },
      {
        id: 'stage-3',
        order: 3,
        kind: 'procedure',
        title: 'Experimental Procedures',
        categoryLabel: 'Stage 3 · Step-by-Step Method',
        subtitle: params.stage3.subtitle,
        introduction: params.stage3.summary,
        summary: params.stage3.summary,
        steps: params.stage3.steps,
        scientificExplanation: params.stage3.scientificExplanation,
        note: 'Follow the procedural sequence carefully; maintain proper timing and agitation as instructed.',
        relatedInventoryIds: params.stage3.relatedInventoryIds,
        relatedItems: [],
        linkedSimulationSteps: [],
        highlights: params.stage3.highlights,
        video: {
          status: 'coming-soon',
          title: `${params.experimentTitle}: Step-by-Step Procedure`,
          description: `A step-by-step video demonstration of ${params.experimentTitle} is in preparation.`,
          durationLabel: 'Demonstration clip pending',
        },
        extension: {
          reviewStatus: 'draft',
          keyConcepts: ['experimental procedure', 'sequential operations', 'safe manipulation'],
          futureAiPromptContext: {
            focusTopic: `Procedural steps and technique for ${params.experimentTitle}`,
            scientificGuardrails: ['Perform reactions in the prescribed order to prevent hazards.'],
          },
        },
      },
      {
        id: 'stage-4',
        order: 4,
        kind: 'measurements',
        title: 'Measurements',
        categoryLabel: 'Stage 4 · Observations & Measurements',
        subtitle: params.stage4.subtitle,
        introduction: params.stage4.summary,
        summary: params.stage4.summary,
        steps: params.stage4.steps,
        scientificExplanation: params.stage4.scientificExplanation,
        note: 'Record all observations, physical state changes, and quantitative readings immediately.',
        processClassification: params.stage4.processClassification ?? 'measurement-technique',
        processBadgeLabel: params.stage4.processBadgeLabel,
        relatedInventoryIds: params.stage4.relatedInventoryIds,
        relatedItems: [],
        linkedSimulationSteps: [],
        highlights: params.stage4.highlights,
        video: {
          status: 'coming-soon',
          title: `${params.experimentTitle}: Measurement & Data Collection`,
          description: `A video demonstrating measurements and quantitative recording for ${params.experimentTitle} is in preparation.`,
          durationLabel: 'Demonstration clip pending',
        },
        extension: {
          reviewStatus: 'draft',
          keyConcepts: ['measurement accuracy', 'data recording', 'observational precision'],
          futureAiPromptContext: {
            focusTopic: `Accurate measurements and recordings for ${params.experimentTitle}`,
            scientificGuardrails: ['Record raw data honestly without altering observed values.'],
          },
        },
      },
      {
        id: 'stage-5',
        order: 5,
        kind: 'observations',
        title: 'Chemical Reactions and Results',
        categoryLabel: 'Stage 5 · Chemical Reactions & Results',
        subtitle: params.stage5.subtitle,
        introduction: params.stage5.summary,
        summary: params.stage5.summary,
        steps: params.stage5.steps,
        scientificExplanation: params.stage5.scientificExplanation,
        note: 'Draw conclusions by linking visible results to underlying atomic and molecular mechanisms.',
        processClassification: params.stage5.processClassification ?? 'chemical-reaction',
        processBadgeLabel: params.stage5.processBadgeLabel,
        relatedInventoryIds: params.stage5.relatedInventoryIds,
        relatedItems: [],
        linkedSimulationSteps: [],
        highlights: params.stage5.highlights,
        video: {
          status: 'coming-soon',
          title: `${params.experimentTitle}: Results & Scientific Explanation`,
          description: `A video explaining the chemical reaction mechanism and results for ${params.experimentTitle} is in preparation.`,
          durationLabel: 'Demonstration clip pending',
        },
        extension: {
          reviewStatus: 'draft',
          keyConcepts: ['chemical reactions', 'reaction mechanism', 'scientific conclusions'],
          futureAiPromptContext: {
            focusTopic: `Scientific theory and conclusions for ${params.experimentTitle}`,
            scientificGuardrails: ['Ground explanations strictly in verified chemical principles.'],
          },
        },
      },
    ],
  }
}

// -----------------------------------------------------------------------------
// 2. Measuring Liquid Volume (Grade 1 Term 1)
// -----------------------------------------------------------------------------
export const liquidVolumeLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-volume-002',
  experimentTitle: 'Measuring Liquid Volume',
  reactionClassificationNote:
    'Liquid volume measurement using graduated laboratory glassware is a physical quantitative observation technique, not a chemical reaction.',
  stage1: {
    subtitle: 'Selecting graduated cylinders, beakers, pipettes, and wash bottles',
    summary:
      'Identify calibrated laboratory glassware including the graduated cylinder, beaker, volumetric pipette, and wash bottle. Each apparatus offers different volumetric precision.',
    steps: [
      'Inspect the graduated cylinder for clear milliliter scale divisions and an intact rubber bumper ring.',
      'Check that the beaker graduation marks are labeled as approximate volumes.',
      'Examine the volumetric pipette and verify its single calibration fill mark.',
    ],
    scientificExplanation:
      'Narrow vertical columns in graduated cylinders yield high volumetric sensitivity per millimeter of height. Wide beakers have large cross-sectional areas where slight height variations correspond to significant volume errors.',
    highlights: [
      'Graduated Cylinder — Primary apparatus for measuring liquid volume (±0.5 mL).',
      'Beaker — Storage and mixing vessel; graduations are approximate (±5%).',
      'Volumetric Pipette — Fixed-volume transfer instrument with high analytical tolerance.',
    ],
    relatedInventoryIds: ['graduated-cylinder', 'beaker', 'pipette', 'wash-bottle'],
  },
  stage2: {
    subtitle: 'Distilled water as a pure reference fluid for volumetric calibration',
    summary:
      'Distilled water (H₂O) serves as the standard calibration liquid. Its known surface tension against borosilicate glass produces a classic concave meniscus.',
    steps: [
      'Use 100 mL of room-temperature distilled water from a clean wash bottle.',
      'Confirm that the liquid is free of bubbles and suspended particulate matter.',
    ],
    scientificExplanation:
      'Polar water molecules form hydrogen bonds with silicate oxygen atoms on glass surfaces (adhesion), pulling the liquid boundary upward while cohesive forces maintain surface continuity, creating a curved concave meniscus.',
    highlights: [
      'Distilled Water (H₂O) — Demineralized solvent providing standard surface tension.',
      'Quantity: 100 mL target volume in a 100 mL cylinder.',
    ],
    relatedInventoryIds: ['distilled-water'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Pure Reference Fluid',
  },
  stage3: {
    subtitle: 'Pouring, aligning eye level, and reading the bottom of the meniscus',
    summary:
      'Follow standard analytical protocol: pour liquid slowly into the cylinder, bring eye level horizontally flush with the liquid surface, and align the bottom of the concave curve with the target line.',
    steps: [
      'Place the 100 mL graduated cylinder on a level, stable workbench.',
      'Pour distilled water from the wash bottle until the liquid level nears the 100 mL graduation mark.',
      'Lower your gaze until your line of sight is strictly horizontal with the liquid boundary.',
      'Add water dropwise until the lowest central tangent of the curved meniscus rests precisely on the 100 mL line.',
      'Transfer the liquid into a 250 mL beaker to contrast scale markings.',
    ],
    scientificExplanation:
      'Viewing the meniscus from above projects the liquid boundary downward onto a lower mark; viewing from below projects it upward onto a higher mark. Only horizontal alignment eliminates parallax optical distortion.',
    highlights: [
      'Step 1: Place cylinder on a level surface.',
      'Step 2: Fill near target volume.',
      'Step 3: Align eye horizontally with meniscus.',
      'Step 4: Read lowest point of the concave curve.',
    ],
    relatedInventoryIds: ['graduated-cylinder', 'wash-bottle', 'beaker'],
  },
  stage4: {
    subtitle: 'Quantifying meniscus curvature and identifying parallax reading deviations',
    summary:
      'Compare readings taken from eye level versus elevated and depressed angles. Record the quantitative discrepancy to understand measurement uncertainty in volumetric analysis.',
    steps: [
      'Record the eye-level reading: exactly 100.0 mL.',
      'Observe from an elevated angle (30° above horizontal) and record the apparent volume (approx. 98.5 mL).',
      'Observe from a depressed angle (30° below horizontal) and record the apparent volume (approx. 101.5 mL).',
      'Calculate the parallax deviation: |apparent - true| = 1.5 mL.',
    ],
    scientificExplanation:
      'Graduation lines etched on the outer circumference of glassware form an optical angle with the internal liquid surface when viewed off-axis, introducing systematic reading bias.',
    highlights: [
      'Eye-level true reading: 100.0 mL (accurate).',
      'High angle parallax error: underestimates volume (-1.5 mL).',
      'Low angle parallax error: overestimates volume (+1.5 mL).',
    ],
    relatedInventoryIds: ['graduated-cylinder', 'distilled-water'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Parallax Analysis',
  },
  stage5: {
    subtitle: 'Evaluating volumetric glassware tolerances and scientific conclusions',
    summary:
      'Confirm that the bottom of the concave meniscus at eye level provides true volumetric measurement. Conclude that graduated cylinders provide suitable precision for laboratory solutions while beakers are strictly for holding fluids.',
    steps: [
      'Compare the 100 mL volume transferred into the beaker against the beaker’s 100 mL mark.',
      'Note the ±5% deviation visible on the wider vessel.',
      'Conclude that graduated cylinders and pipettes are mandatory for quantitative volumetric preparation.',
    ],
    scientificExplanation:
      'Glassware tolerance depends on internal bore diameter. Cylinders have narrow internal diameters (uncertainty ±0.5 mL), while volumetric pipettes narrow further at the neck (uncertainty ±0.05 mL). Beakers lack certified tolerances and should never be used for stoichiometry.',
    highlights: [
      'Observed Result: Accurate, repeatable 100.0 mL measurement achieved at eye level.',
      'Scientific Conclusion: Surface adhesion creates concave meniscus; reading bottom eliminates error.',
      'Equipment Rule: Use cylinders/pipettes for measurement, beakers only for mixing/holding.',
    ],
    relatedInventoryIds: ['graduated-cylinder', 'beaker', 'pipette', 'distilled-water'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Volumetric Verification',
  },
})

// -----------------------------------------------------------------------------
// 3. Exploring pH Indicators (Grade 1 Term 1)
// -----------------------------------------------------------------------------
export const phIndicatorsLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-ph-003',
  experimentTitle: 'Exploring pH Indicators',
  reactionClassificationNote:
    'Acid-base indicator color transitions are proton-transfer equilibria where weak organic acids (HIn) dissociate into conjugate bases (In⁻) with distinct absorption spectra: HIn + H₂O ⇌ In⁻ + H₃O⁺.',
  stage1: {
    subtitle: 'Preparing test tubes, rack, droppers, and spotting watch glass',
    summary:
      'Organize clean test tubes in a rack to test acidic, neutral, and alkaline test solutions against chemical liquid indicators and universal pH test strips.',
    steps: [
      'Label three rows of test tubes: Acid (HCl), Neutral (H₂O), and Base (NaOH).',
      'Ensure droppers are clean and dedicated to specific reagents to prevent cross-contamination.',
      'Place a strip of universal pH paper on a dry watch glass.',
    ],
    scientificExplanation:
      'Clean glassware ensures residual acidic or alkaline tap water minerals do not shift the delicate proton equilibrium of weak indicator dye molecules.',
    highlights: [
      'Test Tube Rack — Organizes systematic comparison across pH ranges.',
      'Precision Droppers — Dispense uniform 1-drop volumes of indicator dye.',
      'Watch Glass — Provides inert surface for universal pH paper testing.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'dropper', 'watch-glass'],
  },
  stage2: {
    subtitle: 'Acids, alkalis, neutral water, and indicator dye solutions',
    summary:
      'Prepare 0.1 M hydrochloric acid (acidic, pH ~1), distilled water (neutral, pH ~7), and 0.1 M sodium hydroxide (alkaline, pH ~13), along with litmus, methyl orange, and phenolphthalein solutions.',
    steps: [
      'Dispense 5 mL of 0.1 M HCl into the acid series.',
      'Dispense 5 mL of distilled water into the neutral series.',
      'Dispense 5 mL of 0.1 M NaOH into the alkaline series.',
      'Prepare dropper bottles of litmus, methyl orange, and phenolphthalein indicators.',
    ],
    scientificExplanation:
      '0.1 M HCl fully ionizes to yield [H₃O⁺] = 10⁻¹ M (pH 1). 0.1 M NaOH fully dissociates to yield [OH⁻] = 10⁻¹ M and [H₃O⁺] = 10⁻¹³ M (pH 13). Pure water self-ionizes to [H₃O⁺] = 10⁻⁷ M (pH 7).',
    highlights: [
      'Acid: 0.1 M HCl (pH ~1).',
      'Neutral: Distilled H₂O (pH 7).',
      'Base: 0.1 M NaOH (pH ~13).',
      'Dyes: Litmus, methyl orange, and phenolphthalein.',
    ],
    relatedInventoryIds: [
      'dilute-hydrochloric-acid',
      'dilute-sodium-hydroxide',
      'distilled-water',
      'litmus-solution',
      'methyl-orange',
      'phenolphthalein',
      'universal-ph-paper',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Indicator Dyes',
  },
  stage3: {
    subtitle: 'Systematic dropwise addition and color comparison',
    summary:
      'Add 2 drops of each indicator dye to corresponding acid, neutral, and alkali samples; then apply sample drops to universal pH paper and compare to the standard color chart.',
    steps: [
      'Add 2 drops of litmus solution to tube 1A (acid), tube 1B (neutral), and tube 1C (base); mix gently.',
      'Add 2 drops of methyl orange to tube 2A (acid), tube 2B (neutral), and tube 2C (base); mix gently.',
      'Add 2 drops of phenolphthalein to tube 3A (acid), tube 3B (neutral), and tube 3C (base); mix gently.',
      'Touch a clean glass rod to each solution and spot onto universal pH paper strips.',
      'Record the resulting colors against a white background.',
    ],
    scientificExplanation:
      'Excess H₃O⁺ shifts indicator equilibrium to the protonated HIn form; excess OH⁻ removes protons, shifting equilibrium to the deprotonated In⁻ conjugate form with altered electronic resonance and visible light absorption.',
    highlights: [
      'Step 1: Test litmus in acid, neutral, base.',
      'Step 2: Test methyl orange in acid, neutral, base.',
      'Step 3: Test phenolphthalein in acid, neutral, base.',
      'Step 4: Verify numerical pH using universal test strips.',
    ],
    relatedInventoryIds: ['test-tube', 'dropper', 'universal-ph-paper'],
  },
  stage4: {
    subtitle: 'Recording indicator transition colors and universal pH numbers',
    summary:
      'Construct a comprehensive indicator color matrix correlating observed hues with solution acidity, neutrality, and basicity.',
    steps: [
      'Record litmus colors: Red in acid (pH < 5.0), Purple in neutral (pH 7.0), Blue in base (pH > 8.0).',
      'Record methyl orange colors: Red in acid (pH < 3.1), Orange in neutral, Yellow in base (pH > 4.4).',
      'Record phenolphthalein colors: Colorless in acid and neutral (pH < 8.2), Magenta/Pink in base (pH > 10.0).',
      'Record universal paper color matching: Red (pH 1), Green (pH 7), Dark Violet (pH 13).',
    ],
    scientificExplanation:
      'Single indicators change color over narrow pKa transition ranges (pKa ± 1). Universal indicator mixes multiple dyes to provide continuous chromatic graduation across the full 1–14 scale.',
    highlights: [
      'Litmus: Red (acid) · Purple (neutral) · Blue (base).',
      'Methyl Orange: Red (acid) · Yellow (base).',
      'Phenolphthalein: Colorless (acid/neutral) · Pink (base).',
      'Universal Paper: 1 (red) · 7 (green) · 13 (violet).',
    ],
    relatedInventoryIds: ['litmus-solution', 'methyl-orange', 'phenolphthalein', 'universal-ph-paper'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Color Matrix',
  },
  stage5: {
    subtitle: 'Correlating proton concentration with molecular indicator equilibrium',
    summary:
      'Indicators reliably identify the acidic, basic, or neutral nature of aqueous solutions. Phenolphthalein is optimal for detecting strong bases, while universal indicator provides estimated numerical pH.',
    steps: [
      'Confirm that [H₃O⁺] > [OH⁻] produces the protonated color form for all tested indicators.',
      'Confirm that [OH⁻] > [H₃O⁺] produces the deprotonated conjugate base color form.',
      'Formulate general rules for selecting indicators based on equivalence point pH.',
    ],
    scientificExplanation:
      'Indicator equilibrium: HIn(aq) + H₂O(l) ⇌ In⁻(aq) + H₃O⁺(aq). In acid, high [H₃O⁺] suppresses dissociation by Le Chatelier’s principle (HIn dominates). In base, OH⁻ consumes H₃O⁺, driving dissociation into In⁻.',
    highlights: [
      'Equilibrium Equation: HIn + H₂O ⇌ In⁻ + H₃O⁺.',
      'Scientific Conclusion: Indicators change color due to reversible structural changes upon proton transfer.',
      'Practical Rule: Phenolphthalein distinguishes bases from acids/neutral, but cannot distinguish neutral from acid.',
    ],
    relatedInventoryIds: [
      'dilute-hydrochloric-acid',
      'dilute-sodium-hydroxide',
      'litmus-solution',
      'phenolphthalein',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Equilibrium Results',
  },
})

// -----------------------------------------------------------------------------
// 4. Distinguishing Solutions and Colloids (Grade 1 Term 1)
// -----------------------------------------------------------------------------
export const colloidsLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-colloids-004',
  experimentTitle: 'Distinguishing Solutions and Colloids',
  reactionClassificationNote:
    'Light scattering by colloidal particles (Tyndall effect) is an optical physical phenomenon caused by particle diameters between 1 nm and 1000 nm, not a chemical change.',
  stage1: {
    subtitle: 'Beakers, narrow optical beam source, and observation screen',
    summary:
      'Assemble transparent beakers and a collimated narrow flashlight or laser pointer against a dark viewing background to observe light propagation.',
    steps: [
      'Clean two 250 mL glass beakers thoroughly to ensure glass walls are free of dust or smudges.',
      'Set up a collimated flashlight and a dark observation screen behind the beakers.',
    ],
    scientificExplanation:
      'Optical scattering tests require clean optical pathways. Dust or scratches on glassware scatter light artificially, interfering with Tyndall effect observation.',
    highlights: [
      'Beakers — Flat, clear vessels allowing horizontal beam passage.',
      'Collimated Light Source — Emits a concentrated, narrow light beam.',
      'Dark Screen — Maximizes contrast for viewing scattered light.',
    ],
    relatedInventoryIds: ['beaker', 'flashlight', 'stirring-rod'],
  },
  stage2: {
    subtitle: 'True aqueous solution versus colloidal starch suspension',
    summary:
      'Prepare true solution of sodium chloride in water and a colloidal dispersion of soluble starch in warm water.',
    steps: [
      'Dissolve 5 g of NaCl in 100 mL of water (true solution with particle diameter < 1 nm).',
      'Disperse 1 g of starch in 100 mL of hot water and cool to room temperature (colloid with particles 1–1000 nm).',
    ],
    scientificExplanation:
      'In true solutions, individual hydrated Na⁺ and Cl⁻ ions (<1 nm) are much smaller than visible light wavelengths (400–700 nm). In colloids, starch macromolecules (1–1000 nm) approach the wavelength of light.',
    highlights: [
      'True Solution: Aqueous NaCl (< 1 nm particles, homogeneous).',
      'Colloid: Starch dispersion (1–1000 nm particles, heterogeneous micro-dispersion).',
    ],
    relatedInventoryIds: ['sodium-chloride-solution', 'starch-colloid-solution', 'distilled-water'],
    processClassification: 'physical-dissolution',
    processBadgeLabel: 'Particle Comparison',
  },
  stage3: {
    subtitle: 'Transmitting narrow light beams through both liquid samples',
    summary:
      'Direct the horizontal light beam through the salt solution and observe from a 90° angle; then direct the beam through the starch colloid and compare.',
    steps: [
      'Position the beaker of aqueous NaCl in the beam path; view the liquid from the side at 90°.',
      'Observe whether any illuminated path is visible inside the salt solution.',
      'Position the beaker of starch colloid in the beam path; view from 90°.',
      'Observe the illuminated cone or path of light visible through the liquid.',
    ],
    scientificExplanation:
      'When light encounters particles roughly comparable in size to its wavelength, Rayleigh and Mie scattering redirect photon trajectories in all directions, illuminating the beam path to a perpendicular observer.',
    highlights: [
      'Step 1: Direct light through true solution; view from side.',
      'Step 2: Note lack of beam visibility in true solution.',
      'Step 3: Direct light through colloidal dispersion; view from side.',
      'Step 4: Observe the glowing Tyndall beam cone in the colloid.',
    ],
    relatedInventoryIds: ['beaker', 'flashlight'],
  },
  stage4: {
    subtitle: 'Recording beam visibility and light path characteristics',
    summary:
      'Record visual observations of beam transmission, sideway scattering intensity, and mixture clarity.',
    steps: [
      'True solution observation: The liquid appears completely dark from the side; the light beam is invisible within the liquid.',
      'Colloid observation: A bright, distinct, illuminated track (Tyndall cone) shines clearly through the liquid.',
      'Filtration test: Both mixtures pass through standard filter paper without leaving residue on the paper.',
    ],
    scientificExplanation:
      'Colloidal particles are small enough to pass through cellulose pores of filter paper (distinguishing them from suspensions) but large enough to scatter visible photons (distinguishing them from true solutions).',
    highlights: [
      'True Solution: No Tyndall effect (invisible path).',
      'Colloid: Pronounced Tyndall effect (bright illuminated beam path).',
      'Filterability: Both pass through filter paper unchanged.',
    ],
    relatedInventoryIds: ['sodium-chloride-solution', 'starch-colloid-solution'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Optical Data',
  },
  stage5: {
    subtitle: 'Classifying mixtures by dispersed particle diameter',
    summary:
      'Conclude that the Tyndall effect is a definitive diagnostic tool to differentiate true solutions from colloids without chemical alteration.',
    steps: [
      'Confirm that true solutions contain dispersed ions or small molecules (< 1 nm) that do not scatter light.',
      'Confirm that colloids contain intermediate particles (1–1000 nm) that scatter visible light.',
      'Identify everyday colloids (fog, milk, mayonnaise) based on the same scattering principle.',
    ],
    scientificExplanation:
      'Physical classification: True solutions (particles < 1 nm) do not scatter light and are optically clear. Colloids (particles 1–1000 nm) exhibit the Tyndall effect. Suspensions (particles > 1000 nm) settle under gravity and are retained by filter paper.',
    highlights: [
      'Diagnostic Test: Tyndall effect definitively identifies colloidal dispersions.',
      'Scientific Conclusion: Particle diameter dictates whether light scattering occurs.',
      'Physical Classification: < 1 nm (solution) · 1–1000 nm (colloid) · > 1000 nm (suspension).',
    ],
    relatedInventoryIds: ['sodium-chloride-solution', 'starch-colloid-solution'],
    processClassification: 'physical-dissolution',
    processBadgeLabel: 'Tyndall Verification',
  },
})

// -----------------------------------------------------------------------------
// 5. Acid-Base Neutralization Titration (Grade 1 Term 1)
// -----------------------------------------------------------------------------
export const titrationLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-titration-005',
  experimentTitle: 'Acid-Base Neutralization Titration',
  reactionClassificationNote:
    'Neutralization is a stoichiometric proton-transfer reaction: HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) (net ionic: H₃O⁺ + OH⁻ → 2H₂O), yielding a neutral salt solution at equivalence.',
  stage1: {
    subtitle: 'Assembling the burette, clamp stand, volumetric pipette, and conical flask',
    summary:
      'Set up a 50 mL class B glass burette held vertically by a clamp stand over a white tile, with a 20.0 mL pipette and 250 mL Erlenmeyer flask.',
    steps: [
      'Check burette stopcock for smooth operation and grease-free liquid seal.',
      'Clamp the burette perfectly vertical to prevent meniscus distortion.',
      'Place a clean white ceramic tile on the stand base directly below the flask.',
    ],
    scientificExplanation:
      'A white background reflects diffuse light through the conical flask, making the first subtle color change of phenolphthalein (colorless to faint pink) instantly noticeable.',
    highlights: [
      'Burette (50 mL) — Delivers variable titrant volume with 0.1 mL precision.',
      'Pipette (20 mL) — Delivers precise fixed analyte volume.',
      'Erlenmeyer Flask — Conical shape prevents liquid splashing during vigorous swirling.',
      'White Tile — Enhances visual contrast at the titration end point.',
    ],
    relatedInventoryIds: ['burette', 'clamp-stand', 'erlenmeyer-flask', 'pipette', 'white-tile'],
  },
  stage2: {
    subtitle: 'Standard sodium hydroxide titrant and hydrochloric acid analyte',
    summary:
      'The burette is filled with standardized 0.10 M NaOH; the flask contains 20.0 mL of unknown HCl with 2 drops of phenolphthalein indicator.',
    steps: [
      'Rinse burette with distilled water, then with standardized 0.10 M NaOH solution.',
      'Fill burette and purge air bubble trapped in the jet tip.',
      'Pipette 20.0 mL of HCl into the flask and add 2 drops of phenolphthalein indicator.',
    ],
    scientificExplanation:
      'Rinsing with titrant prevents dilution by leftover rinse water droplets. Purging the air bubble ensures every millimeter dropped from the scale represents delivered liquid, not filling the tip.',
    highlights: [
      'Titrant: Standardized 0.10 M NaOH (in burette).',
      'Analyte: 20.0 mL HCl of unknown molarity (in flask).',
      'Indicator: Phenolphthalein (2 drops).',
    ],
    relatedInventoryIds: [
      'standard-sodium-hydroxide',
      'hydrochloric-acid-solution',
      'phenolphthalein-indicator',
      'distilled-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Neutralization Reagents',
  },
  stage3: {
    subtitle: 'Controlled titrant delivery, continuous swirling, and end-point detection',
    summary:
      'Titrate standard NaOH into HCl with constant manual swirling until a single drop imparts a permanent faint pink tint persisting for 30 seconds.',
    steps: [
      'Record the initial burette reading (V₁ = 0.00 mL) at the bottom of the meniscus.',
      'Operate the stopcock with the left hand while continuously swirling the flask with the right hand.',
      'Add NaOH rapidly initially, then dropwise as pink flashes take longer to dissipate.',
      'Rinse flask inner walls with distilled water near the expected end point.',
      'Stop titrant addition when one drop produces a faint, permanent pink coloration.',
      'Record the final burette reading (V₂).',
    ],
    scientificExplanation:
      'Continuous swirling ensures immediate molecular mixing so local hydroxide excess does not trigger premature end-point detection before full bulk neutralization.',
    highlights: [
      'Step 1: Record initial burette reading V₁.',
      'Step 2: Add titrant with continuous swirling.',
      'Step 3: Slow to dropwise addition near end point.',
      'Step 4: Stop at first permanent faint pink color; record V₂.',
    ],
    relatedInventoryIds: ['burette', 'erlenmeyer-flask', 'white-tile'],
  },
  stage4: {
    subtitle: 'Recording titrant volume and calculating analyte concentration',
    summary:
      'Determine net titrant volume consumed (V_titrant = V₂ - V₁) and calculate the unknown hydrochloric acid molarity using stoichiometric equivalence.',
    steps: [
      'Record final volume V₂ = 20.00 mL; calculate consumed volume V = 20.00 mL.',
      'Apply stoichiometry: n(HCl) = n(NaOH) because stoichiometric ratio is 1:1.',
      'Calculate: M(HCl) = [M(NaOH) × V(NaOH)] / V(HCl) = (0.10 M × 20.00 mL) / 20.00 mL = 0.10 M.',
    ],
    scientificExplanation:
      'At the stoichiometric equivalence point, moles of H₃O⁺ from HCl exactly equal moles of OH⁻ from NaOH: M_a × V_a / n_a = M_b × V_b / n_b.',
    highlights: [
      'Delivered Volume: V = 20.00 mL standard NaOH.',
      'Calculated Molarity: M(HCl) = 0.100 M.',
      'Concordancy: Repeat titrations should agree within ±0.1 mL.',
    ],
    relatedInventoryIds: ['burette', 'erlenmeyer-flask'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Titration Analysis',
  },
  stage5: {
    subtitle: 'Chemical reaction stoichiometry and proton neutralization mechanism',
    summary:
      'Strong acid and strong base neutralize completely to form sodium chloride and water. Phenolphthalein marks the equivalence point accurately at pH 7–9.',
    steps: [
      'Write the balanced molecular equation: HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l).',
      'Write the net ionic equation: H⁺(aq) + OH⁻(aq) → H₂O(l).',
      'Explain that Na⁺ and Cl⁻ are spectator ions that do not hydrolyze, yielding a neutral final solution (pH = 7.0).',
    ],
    scientificExplanation:
      'Because both acid and base are strong electrolytes, the solution at equivalence contains only Na⁺ and Cl⁻ in water. The pH curve rises steeply from 3 to 11 through equivalence, making phenolphthalein (pKa ~9.3) an accurate indicator.',
    highlights: [
      'Balanced Equation: HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l).',
      'Net Ionic Equation: H⁺(aq) + OH⁻(aq) → H₂O(l).',
      'Scientific Conclusion: Neutralization transfers protons quantitatively from acid to base.',
      'Safety: Neutralize waste before disposal; wash accidental skin contact immediately.',
    ],
    relatedInventoryIds: ['standard-sodium-hydroxide', 'hydrochloric-acid-solution'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Neutralization Complete',
  },
})

// Export the remaining experiments via subsequent helper calls in this file

// -----------------------------------------------------------------------------
// 6. Measuring Heat of Solution in a Calorimeter (Grade 1 Term 2)
// -----------------------------------------------------------------------------
export const heatDissolutionLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-heat-dissolution-006',
  experimentTitle: 'Measuring Heat of Solution in a Calorimeter',
  reactionClassificationNote:
    'Enthalpy of solution (ΔH_sol) represents the net thermal energy exchanged during dissolution: ΔH_sol = ΔH_lattice (endothermic, bond breaking) + ΔH_hydration (exothermic, ion-dipole attraction).',
  stage1: {
    subtitle: 'Calorimeter vessel, precision thermometer, cylinder, and balance',
    summary:
      'Set up an insulated coffee-cup calorimeter, precision laboratory thermometer (0.1°C), 100 mL graduated cylinder, and digital balance for measuring temperature changes.',
    steps: [
      'Check that the polystyrene calorimeter lid fits snugly to prevent convective heat loss.',
      'Mount the thermometer through the lid stopper so its bulb is suspended centrally without touching the bottom or walls.',
      'Tare a weighing boat on the digital balance.',
    ],
    scientificExplanation:
      'Polystyrene foam provides an adiabatic boundary with low thermal conductivity and negligible calorimeter heat capacity, ensuring heat released or absorbed transfers almost entirely to the aqueous solvent.',
    highlights: [
      'Calorimeter — Insulated reaction cup minimizing heat exchange with surroundings.',
      'Thermometer — Calibrated to 0.1°C for detecting subtle thermal changes.',
      'Graduated Cylinder — Measures exact 100 mL water solvent volume.',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer', 'graduated-cylinder', 'digital-balance', 'spatula'],
  },
  stage2: {
    subtitle: 'Solvent water and solid crystalline solutes (NaOH and NH₄NO₃)',
    summary:
      'Measure 100 mL of distilled water and weigh 4.0 g samples of sodium hydroxide pellets (exothermic dissolution) and ammonium nitrate crystals (endothermic dissolution).',
    steps: [
      'Measure 100 mL of distilled water at thermal equilibrium with the laboratory.',
      'Weigh 4.0 g of solid sodium hydroxide pellets using a clean, dry spatula.',
      'Weigh 4.0 g of solid ammonium nitrate crystals.',
    ],
    scientificExplanation:
      'Solid NaOH dissolves with massive heat release because ion hydration energy greatly exceeds crystal lattice energy. Conversely, NH₄NO₃ absorbs heat because crystal lattice dissociation energy exceeds ion hydration energy.',
    highlights: [
      'Solvent: 100 mL distilled water (mass m = 100 g, c = 4.18 J/g·°C).',
      'Exothermic Solute: 4.0 g NaOH pellets (ΔH_sol < 0).',
      'Endothermic Solute: 4.0 g NH₄NO₃ crystals (ΔH_sol > 0).',
    ],
    relatedInventoryIds: [
      'distilled-water',
      'sodium-hydroxide-pellets',
      'ammonium-nitrate-crystals',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Calorimetric Solutes',
  },
  stage3: {
    subtitle: 'Solute addition, gentle continuous stirring, and peak temperature tracking',
    summary:
      'Transfer water to the calorimeter, record baseline temperature T₁, add the solid solute, seal immediately, stir gently, and track temperature until the maximum or minimum peak is reached.',
    steps: [
      'Pour 100 mL of water into the calorimeter and record initial temperature T₁.',
      'Add 4.0 g of NaOH pellets, replace lid immediately, and stir continuously with the glass stirrer.',
      'Record temperature every 15 seconds until the peak temperature T₂ is attained.',
      'Rinse calorimeter thoroughly, dry completely, and repeat procedure using 4.0 g of NH₄NO₃.',
    ],
    scientificExplanation:
      'Continuous stirring prevents local solute saturation and accelerates dissolution kinetics, ensuring peak temperature is reached before ambient heat exchange occurs.',
    highlights: [
      'Step 1: Record baseline water temperature T₁.',
      'Step 2: Add solid and seal calorimeter immediately.',
      'Step 3: Stir gently until temperature reaches maximum or minimum.',
      'Step 4: Record extreme temperature T₂.',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer', 'spatula'],
  },
  stage4: {
    subtitle: 'Calculating heat exchanged (q) and molar enthalpy of solution (ΔH_sol)',
    summary:
      'Use q = mcΔT and ΔH_sol = -q/n to quantify molar enthalpy of solution for both compounds.',
    steps: [
      'For NaOH: T₁ = 22.0°C, T₂ = 32.5°C; ΔT = +10.5°C; q = 100 g × 4.18 J/g·°C × 10.5°C = +4389 J = +4.39 kJ.',
      'Calculate moles: n(NaOH) = 4.0 g / 40.0 g/mol = 0.10 mol; ΔH_sol = -q/n = -43.9 kJ/mol (exothermic).',
      'For NH₄NO₃: T₁ = 22.0°C, T₂ = 15.8°C; ΔT = -6.2°C; q = 100 g × 4.18 J/g·°C × (-6.2°C) = -2592 J = -2.59 kJ.',
      'Calculate moles: n(NH₄NO₃) = 4.0 g / 80.0 g/mol = 0.050 mol; ΔH_sol = -q/n = +51.8 kJ/mol (endothermic).',
    ],
    scientificExplanation:
      'The law of conservation of energy dictates q_solution + q_reaction = 0. When the water temperature rises (ΔT > 0), the dissolution process released energy (ΔH < 0).',
    highlights: [
      'NaOH Enthalpy: ΔT = +10.5°C · ΔH_sol ≈ -43.9 kJ/mol (exothermic).',
      'NH₄NO₃ Enthalpy: ΔT = -6.2°C · ΔH_sol ≈ +51.8 kJ/mol (endothermic).',
      'Formula: q = mcΔT and ΔH = -q / n.',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Enthalpy Calculation',
  },
  stage5: {
    subtitle: 'Thermochemical equations and lattice versus hydration energy balance',
    summary:
      'Dissolving NaOH releases thermal energy into the solvent, while dissolving NH₄NO₃ absorbs thermal energy from the solvent. This confirms thermochemical principles.',
    steps: [
      'Write thermochemical equation for NaOH: NaOH(s) → Na⁺(aq) + OH⁻(aq), ΔH_sol = -43.9 kJ/mol.',
      'Write thermochemical equation for NH₄NO₃: NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq), ΔH_sol = +51.8 kJ/mol.',
      'Explain that ΔH_sol depends on competition between endothermic lattice dissociation and exothermic hydration.',
    ],
    scientificExplanation:
      'In NaOH, small Na⁺ and OH⁻ ions possess strong electrostatic attraction to water dipoles, releasing large hydration enthalpy (|ΔH_hyd| > ΔH_lattice). In NH₄NO₃, polyatomic ions have lower charge density, so lattice energy exceeds hydration energy.',
    highlights: [
      'Exothermic Equation: NaOH(s) → Na⁺(aq) + OH⁻(aq), ΔH = -43.9 kJ/mol.',
      'Endothermic Equation: NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq), ΔH = +51.8 kJ/mol.',
      'Safety: Solid NaOH is caustic and corrosive; avoid skin contact and rinse spills immediately.',
    ],
    relatedInventoryIds: [
      'distilled-water',
      'sodium-hydroxide-pellets',
      'ammonium-nitrate-crystals',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Thermochemical Results',
  },
})

// -----------------------------------------------------------------------------
// 7. Determination of the Heat of Neutralization (Grade 1 Term 2)
// -----------------------------------------------------------------------------
export const heatNeutralizationLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-heat-neutralization-007',
  experimentTitle: 'Determination of the Heat of Neutralization',
  reactionClassificationNote:
    'The standard molar enthalpy of neutralization (ΔH_neut) between any strong monoprotic acid and strong alkali in dilute aqueous solution is a fundamental thermodynamic constant: H⁺(aq) + OH⁻(aq) → H₂O(l), ΔH° = -57.3 kJ/mol.',
  stage1: {
    subtitle: 'Double-walled insulated calorimeter, thermometer, and measuring cylinders',
    summary:
      'Assemble a double-cup polystyrene calorimeter, sensitive laboratory thermometer (0.1°C), and two 50 mL graduated cylinders for dispensing equimolar acid and base solutions.',
    steps: [
      'Assemble nested coffee cups inside a 250 mL beaker for structural stability.',
      'Insert thermometer through the lid stopper at an angle that allows free movement of a glass stirrer.',
      'Label two 50 mL graduated cylinders: Acid (HCl) and Base (NaOH).',
    ],
    scientificExplanation:
      'Nested polystyrene cups reduce thermal conduction through vessel walls, while double lids reduce convective heat transfer to surrounding air during rapid neutralization.',
    highlights: [
      'Double-cup Calorimeter — Traps heat generated by instantaneous neutralization.',
      'Precision Thermometer — Monitors rapid temperature rise to 0.1°C resolution.',
      'Dual Cylinders — Accurately measures equal 50.0 mL reactant volumes.',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer', 'graduated-cylinder', 'beaker'],
  },
  stage2: {
    subtitle: 'Equimolar standardized hydrochloric acid and sodium hydroxide solutions',
    summary:
      'Use exactly 50.0 mL of 1.0 M HCl and 50.0 mL of 1.0 M NaOH. Both solutions must be at identical ambient temperatures before mixing.',
    steps: [
      'Measure 50.0 mL of 1.0 M HCl into the calorimeter cup.',
      'Measure 50.0 mL of 1.0 M NaOH into a separate clean beaker.',
      'Confirm that both solutions have stabilized at the same initial temperature (T₁).',
    ],
    scientificExplanation:
      'Equal 50.0 mL volumes of 1.0 M solutions contain exactly 0.050 moles of H⁺ and 0.050 moles of OH⁻, guaranteeing 100% stoichiometric reaction with no limiting reactant deficit.',
    highlights: [
      'Acid: 50.0 mL 1.0 M HCl (0.050 mol H⁺).',
      'Base: 50.0 mL 1.0 M NaOH (0.050 mol OH⁻).',
      'Total Mixture Volume: 100.0 mL (total mass m = 100.0 g).',
    ],
    relatedInventoryIds: ['hydrochloric-acid-1m', 'sodium-hydroxide-1m', 'distilled-water'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Equimolar Reactants',
  },
  stage3: {
    subtitle: 'Rapid liquid addition, immediate sealing, and temperature monitoring',
    summary:
      'Pour the sodium hydroxide solution rapidly into the hydrochloric acid in the calorimeter, seal the lid immediately, stir continuously, and record the maximum temperature.',
    steps: [
      'Record the stable initial temperature T₁ (e.g., 21.0°C).',
      'Add the 50.0 mL of NaOH into the calorimeter in one smooth pour to minimize heat loss.',
      'Seat the lid immediately and stir steadily with the insulated stirring loop.',
      'Observe the rapid mercury/liquid rise and record the highest steady temperature T₂.',
    ],
    scientificExplanation:
      'Proton transfer occurs virtually instantaneously upon contact. Fast pouring and immediate sealing ensure the peak temperature represents the total reaction heat before dissipation.',
    highlights: [
      'Step 1: Record initial temperature T₁.',
      'Step 2: Pour NaOH into calorimeter in one quick addition.',
      'Step 3: Seal lid immediately and stir steadily.',
      'Step 4: Record maximum temperature reached T₂.',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer'],
  },
  stage4: {
    subtitle: 'Quantifying heat liberated and calculating molar heat of neutralization',
    summary:
      'Calculate total heat produced (q) and determine molar enthalpy of neutralization: ΔH_neut = -q / n_water.',
    steps: [
      'Calculate temperature change: T₁ = 21.0°C, T₂ = 27.8°C; ΔT = +6.8°C.',
      'Calculate heat released: q = m × c × ΔT = 100 g × 4.18 J/g·°C × 6.8°C = 2842 J = 2.84 kJ.',
      'Calculate moles of water formed: n = M × V = 1.0 mol/L × 0.050 L = 0.050 mol.',
      'Calculate molar enthalpy: ΔH_neut = -q / n = -2.84 kJ / 0.050 mol = -56.8 kJ/mol.',
    ],
    scientificExplanation:
      'Experimental molar values closely approach the theoretical -57.3 kJ/mol; small differences arise from slight calorimeter heat capacity and trace thermal exchange during pouring.',
    highlights: [
      'Temperature Rise: ΔT = +6.8°C.',
      'Heat Released: q = 2.84 kJ.',
      'Molar Enthalpy: ΔH_neut = -56.8 kJ/mol (theoretical: -57.3 kJ/mol).',
    ],
    relatedInventoryIds: ['calorimeter', 'thermometer'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Enthalpy Constant',
  },
  stage5: {
    subtitle: 'Thermochemical conclusion and universal net ionic reaction',
    summary:
      'The molar heat of neutralization between any strong acid and strong base is approximately -57.3 kJ/mol because the reaction is always the formation of one mole of water from hydrated hydronium and hydroxide ions.',
    steps: [
      'Write the molecular equation: HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l), ΔH° = -57.3 kJ/mol.',
      'Write the net ionic equation: H⁺(aq) + OH⁻(aq) → H₂O(l), ΔH° = -57.3 kJ/mol.',
      'Conclude that spectator ions (Na⁺, Cl⁻) do not contribute to heat changes in dilute solution.',
    ],
    scientificExplanation:
      'Because all strong acids and bases are completely dissociated in water, the actual chemical transformation in any strong-strong neutralization is identical: H⁺(aq) + OH⁻(aq) → H₂O(l). Thus, ΔH is constant regardless of the specific strong acid or base used.',
    highlights: [
      'Thermochemical Equation: H⁺(aq) + OH⁻(aq) → H₂O(l), ΔH° = -57.3 kJ/mol.',
      'Universal Principle: Strong acid-base neutralization always yields ~ -57.3 kJ per mole of water.',
      'Safety: Rapid exothermic mixing causes temperature spikes; wear eye protection and gloves.',
    ],
    relatedInventoryIds: ['hydrochloric-acid-1m', 'sodium-hydroxide-1m'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Constant ΔH Proved',
  },
})

// -----------------------------------------------------------------------------
// 8. Flame Emission Tests for Metal Cations (Grade 2 Term 1)
// -----------------------------------------------------------------------------
export const flameTestsLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-flame-tests-008',
  experimentTitle: 'Flame Emission Tests for Metal Cations',
  reactionClassificationNote:
    'Atomic flame emission is a physical quantum spectroscopic process: thermal excitation promotes valence electrons to higher atomic orbitals (ground → excited), and relaxation back emits discrete photon energies (ΔE = hν = hc/λ) in the visible spectrum.',
  stage1: {
    subtitle: 'Bunsen burner, inert platinum wire loop, watch glass, and cobalt glass',
    summary:
      'Set up a Bunsen burner with a non-luminous blue flame, clean platinum wire mounted in a glass rod, concentrated HCl cleaning solution in a watch glass, and blue cobalt glass.',
    steps: [
      'Adjust Bunsen burner air collar to obtain a roaring non-luminous blue flame with a distinct inner cone.',
      'Clean platinum wire loop by dipping in concentrated HCl and holding in the hottest flame zone until no color is imparted.',
      'Inspect blue cobalt glass filter to ensure it is clean and scratch-free.',
    ],
    scientificExplanation:
      'A non-luminous blue flame provides high thermal energy (~1500°C) with minimal background visible emission, allowing faint cation emission spectra to be observed without masking.',
    highlights: [
      'Bunsen Burner — Non-luminous flame provides clean thermal excitation.',
      'Platinum Wire — Chemically inert and non-volatile at burner temperatures.',
      'Cobalt Glass — Absorbs intense 589 nm yellow sodium emission to reveal violet potassium flame.',
    ],
    relatedInventoryIds: ['bunsen-burner', 'platinum-wire', 'watch-glass', 'cobalt-glass'],
  },
  stage2: {
    subtitle: 'Metal chloride salt samples and concentrated hydrochloric acid',
    summary:
      'Test chloride salts of sodium (NaCl), potassium (KCl), calcium (CaCl₂), and copper(II) (CuSO₄/CuCl₂), using concentrated HCl to convert salts into volatile metal chlorides.',
    steps: [
      'Place small separate heaps of NaCl, KCl, CaCl₂, and copper salt on a compartmentalized watch glass.',
      'Moisten samples with a drop of concentrated HCl to convert them into volatile chloride salts.',
    ],
    scientificExplanation:
      'Metal chlorides have lower boiling points and higher volatility in the flame than sulfates, nitrates, or oxides, accelerating atomic vapor formation and electron excitation.',
    highlights: [
      'Volatilization Reagent: Concentrated HCl converts salts into volatile metal chlorides.',
      'Sodium (Na⁺): White crystalline salt.',
      'Potassium (K⁺): White crystalline salt.',
      'Calcium (Ca²⁺): White solid.',
      'Copper (Cu²⁺): Blue crystalline salt.',
    ],
    relatedInventoryIds: [
      'concentrated-hydrochloric-acid',
      'sodium-chloride-sample',
      'potassium-chloride-sample',
      'calcium-chloride-sample',
      'copper-sulfate-sample',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Excitation Samples',
  },
  stage3: {
    subtitle: 'Flame introduction, flame coloration observation, and wire cleaning cycle',
    summary:
      'Dip cleaned platinum loop into acid, touch sample crystals, introduce into the outer mantle of the flame, observe characteristic emission color, and thoroughly clean the loop between samples.',
    steps: [
      'Dip loop into concentrated HCl, touch crystals of sodium chloride, and insert into the flame edge.',
      'Observe the persistent, blinding golden-yellow flame coloration.',
      'Clean the loop in HCl and flame until clean; repeat with potassium chloride, viewing through cobalt glass.',
      'Repeat with calcium chloride, observing the transient brick-red flame.',
      'Repeat with copper salt, observing the characteristic bluish-green flame.',
    ],
    scientificExplanation:
      'Thermal energy vaporizes and dissociates salts into gaseous atoms. Heat promotes valence electrons to higher energy states. Photons are emitted within nanoseconds as electrons cascade down.',
    highlights: [
      'Step 1: Clean platinum wire until flame imparts no yellow tint.',
      'Step 2: Pick up trace salt crystals on moistened loop.',
      'Step 3: Hold in lower outer zone of non-luminous flame.',
      'Step 4: View potassium flame through blue cobalt glass.',
    ],
    relatedInventoryIds: ['bunsen-burner', 'platinum-wire', 'cobalt-glass'],
  },
  stage4: {
    subtitle: 'Correlating observed flame colors with emission wavelengths',
    summary:
      'Record observed flame hues and match them to discrete electronic emission transitions across the visible spectrum.',
    steps: [
      'Record Sodium (Na⁺): Intense golden-yellow flame (doublet emission at 589.0 nm and 589.6 nm).',
      'Record Potassium (K⁺): Pale violet/lilac flame (766.5 nm and 769.9 nm), obscured by yellow sodium trace without cobalt glass.',
      'Record Calcium (Ca²⁺): Characteristic brick-red flame (orange-red band around 622 nm).',
      'Record Copper (Cu²⁺): Distinctive bright bluish-green flame (green band around 510–550 nm).',
    ],
    scientificExplanation:
      'Each element possesses a unique nuclear charge and orbital energy hierarchy. Energy differences between excited and ground orbitals produce unique quantized spectral signatures.',
    highlights: [
      'Sodium (Na⁺): Golden-yellow flame (589 nm).',
      'Potassium (K⁺): Pale violet / lilac flame (viewed through cobalt glass).',
      'Calcium (Ca²⁺): Brick-red flame.',
      'Copper (Cu²⁺): Vivid bluish-green flame.',
    ],
    relatedInventoryIds: ['platinum-wire', 'bunsen-burner', 'cobalt-glass'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Spectral Data',
  },
  stage5: {
    subtitle: 'Quantum electron transition principles and cation identification',
    summary:
      'Flame tests serve as rapid qualitative diagnostics for identifying alkali and alkaline earth cations based on quantized electron transitions.',
    steps: [
      'Relate observed photon color to quantum transition energy: ΔE = E_excited - E_ground = hν = hc / λ.',
      'Explain why sodium trace contamination masks other elements and how cobalt glass filters 589 nm yellow light.',
      'Conclude that atomic emission spectra are unique elemental fingerprints.',
    ],
    scientificExplanation:
      'Energy quantization dictates that electrons occupy fixed principal and azimuthal quantum orbitals. When thermal energy promotes an electron from 3s to 3p (in Na), its return emits a photon of exact energy corresponding to 589 nm yellow light.',
    highlights: [
      'Quantum Relationship: ΔE = hν = hc / λ.',
      'Cobalt Glass Principle: Absorbs 589 nm yellow sodium photons to reveal faint 766 nm violet potassium emission.',
      'Safety: Concentrated HCl gives off choking fumes; flame presents severe burn hazards.',
    ],
    relatedInventoryIds: [
      'sodium-chloride-sample',
      'potassium-chloride-sample',
      'calcium-chloride-sample',
      'copper-sulfate-sample',
    ],
    processClassification: 'physical-dissolution',
    processBadgeLabel: 'Atomic Emission Proved',
  },
})

// -----------------------------------------------------------------------------
// 9. Acidity and Basicity of Element Oxides (Grade 2 Term 1)
// -----------------------------------------------------------------------------
export const oxidesLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-oxides-009',
  experimentTitle: 'Acidity and Basicity of Element Oxides',
  reactionClassificationNote:
    'Oxides exhibit periodic acid-base behavior: metallic oxides are basic anhydrides forming hydroxides in water (MgO + H₂O → Mg(OH)₂), while non-metallic oxides are acidic anhydrides forming oxyacids (CO₂ + H₂O ⇌ H₂CO₃).',
  stage1: {
    subtitle: 'Combustion spoon, gas jars with glass covers, crucible tongs, and burner',
    summary:
      'Assemble deflagrating combustion spoon, gas collection jars with greased cover plates, crucible tongs, and Bunsen burner for burning elements in air and testing combustion products.',
    steps: [
      'Check that gas jars are dry and have flat ground-glass covers.',
      'Clean crucible tongs for gripping magnesium ribbon securely.',
      'Line combustion spoon with fine sand to protect spoon metal when burning charcoal.',
    ],
    scientificExplanation:
      'Burning non-metals generates gaseous oxides (CO₂) that must be trapped in a covered jar with water to dissolve and hydrolyze into acid before gas escapes into the room.',
    highlights: [
      'Gas Jar with Cover — Captures gaseous non-metal oxides for dissolution.',
      'Crucible Tongs — Safely grips burning magnesium ribbon at arm’s length.',
      'Combustion Spoon — Holds burning solid charcoal inside the closed gas jar.',
    ],
    relatedInventoryIds: ['crucible-tongs', 'bunsen-burner', 'combustion-spoon', 'gas-jar'],
  },
  stage2: {
    subtitle: 'Metallic magnesium ribbon, non-metallic charcoal powder, and indicators',
    summary:
      'Burn magnesium ribbon (representative Period 3 metal) and charcoal powder (Period 2 non-metal), then test aqueous solutions with litmus solution.',
    steps: [
      'Cut a 5 cm strip of magnesium ribbon and scrape with sandpaper to remove protective oxide coating.',
      'Weigh 1 g of charcoal powder into the combustion spoon.',
      'Prepare dropper bottle of neutral purple litmus solution and distilled water wash bottle.',
    ],
    scientificExplanation:
      'Magnesium easily oxidizes: 2Mg + O₂ → 2MgO (ionic solid with high lattice energy). Carbon oxidizes: C + O₂ → CO₂ (covalent molecular gas).',
    highlights: [
      'Metal: Magnesium ribbon (Mg, silvery reactive metal).',
      'Non-metal: Activated charcoal powder (C, black solid).',
      'Indicator: Litmus solution (purple in neutral water).',
    ],
    relatedInventoryIds: [
      'magnesium-ribbon',
      'charcoal-powder',
      'distilled-water',
      'litmus-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Oxidation Reactants',
  },
  stage3: {
    subtitle: 'Combustion in air, aqueous dissolution, and litmus testing',
    summary:
      'Ignite magnesium ribbon and dissolve white ash in water; ignite charcoal in spoon, lower into gas jar, add water, shake vigorously, and test both solutions with litmus.',
    steps: [
      'Hold magnesium ribbon with crucible tongs in burner flame; observe blinding white light; collect white MgO ash.',
      'Transfer white MgO powder into a test tube containing 10 mL of distilled water; shake and add 3 drops of litmus.',
      'Heat charcoal in combustion spoon until red-hot; lower into gas jar and cover loosely.',
      'When combustion ceases, add 15 mL of distilled water, seal with glass cover, and shake vigorously.',
      'Add 3 drops of litmus solution into the carbon dioxide solution.',
    ],
    scientificExplanation:
      'Magnesium oxide reacts with water to form magnesium hydroxide: MgO + H₂O → Mg(OH)₂ (alkaline, [OH⁻] > [H⁺]). Carbon dioxide hydrolyzes to carbonic acid: CO₂ + H₂O ⇌ H₂CO₃ (acidic, [H⁺] > [OH⁻]).',
    highlights: [
      'Step 1: Ignite magnesium ribbon using crucible tongs.',
      'Step 2: Collect white MgO ash and dissolve in water.',
      'Step 3: Burn charcoal in covered gas jar to trap CO₂ gas.',
      'Step 4: Add water, shake, and test both with litmus indicator.',
    ],
    relatedInventoryIds: ['crucible-tongs', 'combustion-spoon', 'gas-jar', 'bunsen-burner'],
  },
  stage4: {
    subtitle: 'Recording litmus color shifts for basic and acidic oxides',
    summary:
      'Record indicator color changes confirming basic character for magnesium oxide and acidic character for carbon dioxide.',
    steps: [
      'Record magnesium oxide solution: Litmus turns from purple to bright blue (pH ~9–10).',
      'Record carbon dioxide solution: Litmus turns from purple to distinct red (pH ~4–5).',
      'Neutral water control: Litmus remains purple (pH = 7.0).',
    ],
    scientificExplanation:
      'Mg(OH)₂ provides hydroxide ions that deprotonate litmus dye into its blue conjugate base. Carbonic acid (H₂CO₃) releases protons that protonate litmus dye into its red conjugate acid form.',
    highlights: [
      'MgO in Water: Litmus turns blue (Basic Oxide / Base Anhydride).',
      'CO₂ in Water: Litmus turns red (Acidic Oxide / Acid Anhydride).',
      'Periodic Property: Basicity decreases and acidity increases across a period.',
    ],
    relatedInventoryIds: ['magnesium-ribbon', 'charcoal-powder', 'litmus-solution'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Indicator Results',
  },
  stage5: {
    subtitle: 'Periodic law of oxides and balanced chemical equations',
    summary:
      'Demonstrate that metal oxides form alkaline solutions (basic oxides) while non-metal oxides form acidic solutions (acidic oxides), confirming periodic trends.',
    steps: [
      'Write magnesium combustion: 2Mg(s) + O₂(g) → 2MgO(s).',
      'Write magnesium oxide hydrolysis: MgO(s) + H₂O(l) → Mg(OH)₂(aq).',
      'Write carbon combustion: C(s) + O₂(g) → CO₂(g).',
      'Write carbon dioxide hydration: CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq).',
    ],
    scientificExplanation:
      'Metals have low electronegativity and easily lose electrons, forming ionic oxides with high O²⁻ basicity. Non-metals have high electronegativity, forming covalent oxides where polarized central atoms attract water to release H⁺.',
    highlights: [
      'Magnesium Equations: 2Mg + O₂ → 2MgO; MgO + H₂O → Mg(OH)₂.',
      'Carbon Equations: C + O₂ → CO₂; CO₂ + H₂O ⇌ H₂CO₃.',
      'Safety: Never look directly at burning magnesium (UV radiation hazard); use tongs.',
    ],
    relatedInventoryIds: ['magnesium-ribbon', 'charcoal-powder', 'litmus-solution'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Periodic Trend Proved',
  },
})

// -----------------------------------------------------------------------------
// 10. Halogen Displacement Reactions (Grade 2 Term 1)
// -----------------------------------------------------------------------------
export const halogenDisplacementLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-halogen-displacement-010',
  experimentTitle: 'Halogen Displacement Reactions',
  reactionClassificationNote:
    'Halogen displacement is a redox reaction governed by standard reduction potentials: a more electronegative halogen with higher reduction potential oxidizes halide ions of a lower halogen: Cl₂ + 2X⁻ → 2Cl⁻ + X₂ (where X = Br, I).',
  stage1: {
    subtitle: 'Fume hood setup, test tubes, rack, droppers, and organic extraction layer',
    summary:
      'Assemble borosilicate test tubes in a rack inside an operating fume hood, with dedicated droppers for chlorine water and immiscible cyclohexane extraction solvent.',
    steps: [
      'Verify that the fume hood exhaust fan is running before dispensing halogen reagents.',
      'Arrange three clean test tubes labeled: Control, Bromide (KBr), and Iodide (KI).',
      'Prepare dropper bottles for aqueous halide salts, chlorine water, and cyclohexane.',
    ],
    scientificExplanation:
      'Halogens are non-polar diatomic molecules that are far more soluble in non-polar organic solvents (cyclohexane) than in water. Adding cyclohexane concentrates liberated halogens into an upper layer with vivid, unmistakable diagnostic colors.',
    highlights: [
      'Fume Hood — Eliminates inhalation risk from volatile, toxic chlorine gas.',
      'Test Tube Rack — Allows simultaneous visual comparison of displacement stages.',
      'Cyclohexane — Non-polar extraction solvent separating liberated halogens.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'dropper'],
  },
  stage2: {
    subtitle: 'Chlorine water oxidizing agent, potassium bromide, and potassium iodide',
    summary:
      'Prepare freshly saturated chlorine water (pale greenish-yellow), 0.1 M potassium bromide (colorless), 0.1 M potassium iodide (colorless), and cyclohexane.',
    steps: [
      'Dispense 2.0 mL of 0.1 M KBr into tube 1.',
      'Dispense 2.0 mL of 0.1 M KI into tube 2.',
      'Verify that both halide salt solutions are clear and colorless.',
      'Check that freshly prepared chlorine water has a distinct pale green-yellow tint.',
    ],
    scientificExplanation:
      'Halide ions (Br⁻, I⁻) have complete octets and are colorless in solution. Free elemental halogens (Br₂, I₂) absorb visible light due to electronic transitions between molecular orbitals.',
    highlights: [
      'Oxidizing Agent: Chlorine water (Cl₂ in H₂O, E°_red = +1.36 V).',
      'Bromide: 0.1 M KBr (colorless, E°_red of Br₂ = +1.07 V).',
      'Iodide: 0.1 M KI (colorless, E°_red of I₂ = +0.54 V).',
    ],
    relatedInventoryIds: [
      'chlorine-water',
      'potassium-bromide-solution',
      'potassium-iodide-solution',
      'cyclohexane-extractant',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Redox Couples',
  },
  stage3: {
    subtitle: 'Dropwise chlorine water addition, shaking, and cyclohexane layer extraction',
    summary:
      'Add chlorine water dropwise to KBr and KI solutions; observe immediate aqueous color shifts; add cyclohexane and shake to extract and concentrate liberated halogens.',
    steps: [
      'Add 1.0 mL of chlorine water to the KBr tube; swirl gently; observe the appearance of an orange/red-brown aqueous color.',
      'Add 1.0 mL of chlorine water to the KI tube; swirl gently; observe the appearance of a dark reddish-brown aqueous color.',
      'Add 1.0 mL of cyclohexane to each test tube.',
      'Stopper the tubes and shake vigorously for 10 seconds, then allow the immiscible layers to separate.',
      'Observe the color of the upper cyclohexane layer in both tubes.',
    ],
    scientificExplanation:
      'Chlorine oxidizes Br⁻ to Br₂ (orange) and I⁻ to I₂ (brown). Because halogens are non-polar molecules, they partition preferentially into the upper cyclohexane layer according to their partition coefficients.',
    highlights: [
      'Step 1: Add chlorine water to potassium bromide solution.',
      'Step 2: Add chlorine water to potassium iodide solution.',
      'Step 3: Add cyclohexane organic extractant to both tubes.',
      'Step 4: Shake and observe upper organic layer colors.',
    ],
    relatedInventoryIds: ['test-tube', 'dropper'],
  },
  stage4: {
    subtitle: 'Recording organic layer diagnostic colors and redox potentials',
    summary:
      'Record diagnostic organic layer colors: orange/red for elemental bromine and brilliant violet/purple for elemental iodine.',
    steps: [
      'Record KBr + Cl₂ reaction: Aqueous phase turns orange-yellow; upper cyclohexane layer turns intense orange-red (confirms elemental Br₂).',
      'Record KI + Cl₂ reaction: Aqueous phase turns brown; upper cyclohexane layer turns deep purple / violet (confirms elemental I₂).',
      'Compare standard reduction potentials: E°(Cl₂/Cl⁻) = +1.36 V > E°(Br₂/Br⁻) = +1.07 V > E°(I₂/I⁻) = +0.54 V.',
    ],
    scientificExplanation:
      'Iodine dissolves in cyclohexane with a purple/violet hue corresponding to uncomplexed I₂ molecules. Bromine dissolves with an orange hue. This eliminates ambiguity from dark aqueous mixtures.',
    highlights: [
      'Bromine Extraction: Upper organic layer turns bright orange-red (Br₂ liberated).',
      'Iodine Extraction: Upper organic layer turns vivid violet/purple (I₂ liberated).',
      'Redox Ranking: Cl₂ displaces both Br⁻ and I⁻.',
    ],
    relatedInventoryIds: ['chlorine-water', 'potassium-bromide-solution', 'potassium-iodide-solution'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Organic Layer Data',
  },
  stage5: {
    subtitle: 'Redox displacement equations and Group 7A periodic reactivity trend',
    summary:
      'Conclude that chlorine is a stronger oxidizing agent than bromine and iodine. Halogen oxidizing power decreases down Group 7A as atomic radius increases.',
    steps: [
      'Write molecular equation for bromide displacement: Cl₂(aq) + 2KBr(aq) → 2KCl(aq) + Br₂(aq).',
      'Write ionic equation: Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂ (Cl is reduced, Br⁻ is oxidized).',
      'Write molecular equation for iodide displacement: Cl₂(aq) + 2KI(aq) → 2KCl(aq) + I₂(aq).',
      'Write ionic equation: Cl₂ + 2I⁻ → 2Cl⁻ + I₂ (Cl is reduced, I⁻ is oxidized).',
      'Establish Group 7A oxidizing order: F₂ > Cl₂ > Br₂ > I₂.',
    ],
    scientificExplanation:
      'Down Group 7A, atomic radius increases and valence electrons are further from the nucleus, shielded by inner shells. Electronegativity and electron affinity decrease, lowering the reduction potential and ability to gain electrons.',
    highlights: [
      'Bromide Reaction: Cl₂(aq) + 2KBr(aq) → 2KCl(aq) + Br₂(aq).',
      'Iodide Reaction: Cl₂(aq) + 2KI(aq) → 2KCl(aq) + I₂(aq).',
      'Scientific Trend: Oxidizing power decreases down Group 7A: Cl₂ > Br₂ > I₂.',
      'Safety: Toxic chlorine vapor; perform strictly inside an operational fume hood.',
    ],
    relatedInventoryIds: [
      'chlorine-water',
      'potassium-bromide-solution',
      'potassium-iodide-solution',
      'cyclohexane-extractant',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Redox Trend Proved',
  },
})

// -----------------------------------------------------------------------------
// 11. Electrical Conductivity of Aqueous Solutions (Grade 2 Term 2)
// -----------------------------------------------------------------------------
export const conductivityLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-conductivity-011',
  experimentTitle: 'Electrical Conductivity of Aqueous Solutions',
  reactionClassificationNote:
    'Electrolytic conduction in aqueous solution depends on the presence and concentration of freely mobile hydrated ions produced by ionic dissociation or covalent ionization.',
  stage1: {
    subtitle: 'Conductivity testing apparatus, inert carbon electrodes, bulb, and wash bottle',
    summary:
      'Set up a low-voltage DC conductivity apparatus featuring inert carbon/platinum electrodes, incandescent indicator bulb, 250 mL beaker, and distilled water wash bottle.',
    steps: [
      'Inspect electrodes for clean surfaces free of salt crusts or oxidation films.',
      'Check that the circuit switch is in the OFF position before immersing electrodes.',
      'Prepare a distilled water wash bottle and waste beaker for rinsing electrodes between tests.',
    ],
    scientificExplanation:
      'Inert electrodes do not react chemically with test electrolytes, ensuring observed bulb glow reflects solution conductivity rather than galvanic electrode reactions.',
    highlights: [
      'Conductivity Apparatus — Low-voltage DC circuit with indicator lamp.',
      'Inert Electrodes — Provide physical contact interface with aqueous ions.',
      'Wash Bottle — Prevents cross-contamination between successive solutions.',
    ],
    relatedInventoryIds: ['conductivity-apparatus', 'beaker', 'wash-bottle'],
  },
  stage2: {
    subtitle: 'Strong electrolytes, weak electrolytes, and non-electrolytes',
    summary:
      'Prepare 0.1 M sodium chloride (strong ionic electrolyte), 0.1 M hydrochloric acid (strong covalent electrolyte), pure glacial acetic acid (covalent non-electrolyte), dilute acetic acid (weak electrolyte), and sucrose solution (non-electrolyte).',
    steps: [
      'Dispense 50 mL of 0.1 M NaCl solution into beaker 1.',
      'Dispense 50 mL of 0.1 M HCl solution into beaker 2.',
      'Dispense 50 mL of pure glacial acetic acid (100% CH₃COOH) into beaker 3.',
      'Dispense 50 mL of 0.1 M dilute acetic acid into beaker 4.',
      'Dispense 50 mL of 5% sucrose solution into beaker 5; prepare distilled water as control.',
    ],
    scientificExplanation:
      'Strong electrolytes dissociate completely (α ≈ 1), providing high ion density. Weak electrolytes dissociate partially (α ≪ 1), providing low ion density. Non-electrolytes dissolve as neutral intact molecules without producing ions.',
    highlights: [
      'Strong Electrolytes: 0.1 M NaCl and 0.1 M HCl (complete ionization).',
      'Weak Electrolyte: Dilute CH₃COOH (partial reversible ionization).',
      'Non-electrolytes: Glacial CH₃COOH, sucrose solution, and pure H₂O (no free ions).',
    ],
    relatedInventoryIds: [
      'sodium-chloride-solution',
      'hydrochloric-acid-solution',
      'glacial-acetic-acid',
      'dilute-acetic-acid',
      'sucrose-solution',
      'distilled-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Electrolyte Series',
  },
  stage3: {
    subtitle: 'Immersion of electrodes, circuit activation, and rinsing protocol',
    summary:
      'Immerse electrodes into each solution sequentially, turn on power, observe bulb luminosity, disconnect power, rinse thoroughly with distilled water, and repeat.',
    steps: [
      'Test distilled water: Immerse electrodes, switch on; observe bulb.',
      'Test 0.1 M NaCl: Immerse electrodes, switch on; observe intense bulb glow.',
      'Switch off, rinse electrodes thoroughly with distilled water spray, test 0.1 M HCl; observe intense glow.',
      'Rinse and test pure glacial acetic acid; observe bulb remains completely unlit.',
      'Add 50 mL of distilled water to the glacial acetic acid, stir, and test again; observe bulb begins to glow dimly.',
      'Rinse and test sucrose solution; observe bulb remains unlit.',
    ],
    scientificExplanation:
      'Electric current in liquid solutions is carried by the physical migration of hydrated cations to the cathode and anions to the anode. The magnitude of current (and bulb brightness) is proportional to ion concentration.',
    highlights: [
      'Step 1: Test distilled water control.',
      'Step 2: Test strong electrolytes (bright glow).',
      'Step 3: Test glacial versus diluted acetic acid (Ostwald dilution law).',
      'Step 4: Test molecular sucrose solution (unlit).',
    ],
    relatedInventoryIds: ['conductivity-apparatus', 'beaker', 'wash-bottle'],
  },
  stage4: {
    subtitle: 'Categorizing bulb luminosity and degree of ionization (α)',
    summary:
      'Record bulb brightness levels and correlate with the degree of ionization (α) across all tested substances.',
    steps: [
      'Record NaCl: Very bright bulb glow → Strong electrolyte (α = 1, fully dissociated into Na⁺ + Cl⁻).',
      'Record HCl: Very bright bulb glow → Strong electrolyte (α = 1, fully ionized into H₃O⁺ + Cl⁻).',
      'Record Glacial Acetic Acid: Bulb unlit → Non-conducting (undissociated covalent molecules).',
      'Record Dilute Acetic Acid: Dim bulb glow, increasing upon further dilution → Weak electrolyte (α ≪ 1, CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺).',
      'Record Sucrose & Distilled Water: Bulb unlit → Non-electrolytes (negligible ion concentrations).',
    ],
    scientificExplanation:
      'Ostwald’s Dilution Law states that for weak electrolytes, the degree of dissociation α increases as solution concentration decreases: α = √(K_a / C). Dilution forces more covalent acid molecules to ionize.',
    highlights: [
      'Strong Electrolyte: Intense bulb glow (high mobile ion concentration).',
      'Weak Electrolyte: Faint bulb glow; brightness increases with dilution.',
      'Non-Electrolyte: Complete absence of bulb illumination.',
    ],
    relatedInventoryIds: ['conductivity-apparatus', 'sodium-chloride-solution', 'dilute-acetic-acid'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Conductivity Table',
  },
  stage5: {
    subtitle: 'Ionization mechanisms and classification of chemical solutions',
    summary:
      'Conclude that electrical conductivity in liquids requires mobile charge carriers (ions). Distinguish ionic dissociation from covalent ionization and non-electrolytic dissolution.',
    steps: [
      'Write NaCl dissociation: NaCl(s) → Na⁺(aq) + Cl⁻(aq).',
      'Write HCl ionization: HCl(g) + H₂O(l) → H₃O⁺(aq) + Cl⁻(aq).',
      'Write acetic acid equilibrium: CH₃COOH(aq) + H₂O(l) ⇌ CH₃COO⁻(aq) + H₃O⁺(aq).',
      'Explain that sucrose dissolves via hydrogen bonding without forming ions: C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq).',
    ],
    scientificExplanation:
      'Metallic conduction involves mobile delocalized electrons in a crystal lattice. Electrolytic conduction requires mobile hydrated ions in solution. Without mobile ions, solutions are non-conductors regardless of dissolved solute mass.',
    highlights: [
      'Dissociation Equation: NaCl(s) → Na⁺(aq) + Cl⁻(aq).',
      'Weak Ionization: CH₃COOH(aq) + H₂O(l) ⇌ CH₃COO⁻(aq) + H₃O⁺(aq).',
      'Safety: Disconnect power before rinsing electrodes to avoid electrical shock.',
    ],
    relatedInventoryIds: [
      'sodium-chloride-solution',
      'hydrochloric-acid-solution',
      'dilute-acetic-acid',
      'sucrose-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Electrolyte Theory Proved',
  },
})

// -----------------------------------------------------------------------------
// 12. Reaction of Sodium with Water (Grade 2 Term 2)
// -----------------------------------------------------------------------------
export const sodiumWaterLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-sodium-water-012',
  experimentTitle: 'Reaction of Sodium with Water',
  reactionClassificationNote:
    'Vigorous single displacement redox reaction: highly electropositive metallic sodium reduces protons in water to elemental hydrogen gas while being oxidized to caustic sodium hydroxide: 2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑, ΔH < 0.',
  stage1: {
    subtitle: 'Heavy blast shield, stainless steel scalpel, tongs, filter paper, and water trough',
    summary:
      'Set up an acrylic blast shield between student and trough, scalpel for cutting sodium under paraffin oil, dry filter paper, crucible tongs, and pneumatic water trough.',
    steps: [
      'Position the transparent safety shield securely across the front of the demonstration area.',
      'Inspect crucible tongs to ensure firm, non-slip grip on soft metal samples.',
      'Prepare dry filter paper on a ceramic tile for blotting protective paraffin oil from sodium.',
    ],
    scientificExplanation:
      'Metallic sodium has a low melting point (97.8°C) and violent reaction enthalpy. An acrylic shield protects observers from caustic aerosol droplets and potential explosive spattering.',
    highlights: [
      'Safety Shield — Shields observers against exothermic spattering.',
      'Crucible Tongs — Ensures hands never come within direct reach of reacting metal.',
      'Filter Paper — Removes flammable mineral oil before water contact.',
    ],
    relatedInventoryIds: ['safety-shield', 'crucible-tongs', 'knife', 'filter-paper', 'trough', 'test-tube'],
  },
  stage2: {
    subtitle: 'Paraffin-stored metallic sodium, distilled water, and phenolphthalein',
    summary:
      'Use laboratory-grade sodium metal stored under inert paraffin oil, a large volume of room-temperature distilled water in the trough, and phenolphthalein indicator.',
    steps: [
      'Retrieve a piece of sodium metal from under paraffin oil using crucible tongs.',
      'Cut a tiny piece no larger than a grain of rice (approx. 2 mm diameter, ~0.05 g).',
      'Blot the cut piece thoroughly on dry filter paper to remove oil.',
      'Add 3 drops of phenolphthalein indicator to the water trough.',
    ],
    scientificExplanation:
      'Using a grain-of-rice sized sample ensures heat generated is absorbed safely by the large water reservoir, preventing sudden gas explosion from rapid hydrogen ignition.',
    highlights: [
      'Alkali Metal: Sodium (Na, soft silvery metal, density 0.97 g/cm³).',
      'Size Constraint: Strict rice-grain limit (~0.05 g) to prevent explosion.',
      'Indicator: Phenolphthalein (detects caustic hydroxide formation).',
    ],
    relatedInventoryIds: ['metallic-sodium', 'distilled-water', 'phenolphthalein-indicator'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Alkali Metal Reagents',
  },
  stage3: {
    subtitle: 'Introduction of sodium, observation from behind shield, and hydrogen gas test',
    summary:
      'Use tongs to place the sodium grain into the center of the water trough behind the safety shield; observe rapid molten sphere movement and test evolved hydrogen with a glowing/lit splint.',
    steps: [
      'Lower the blotted sodium piece onto the water surface using tongs and step behind the shield.',
      'Observe the metal melting into a shiny silvery sphere that floats and darts vigorously across the water surface.',
      'Notice the rapid evolution of gas propelling the sphere with a hissing sound.',
      'Observe a trail of deep magenta/pink color spreading through the water as phenolphthalein turns.',
      'Invert a test tube over the reacting sphere to collect gas, then test tube mouth with a lit splint to hear a sharp pop.',
    ],
    scientificExplanation:
      'Sodium is less dense than water (0.97 g/cm³) and floats. The intense reaction enthalpy rapidly exceeds sodium’s melting point (97.8°C), melting it into a sphere that minimizes surface tension while jetting hydrogen gas.',
    highlights: [
      'Step 1: Place rice-grain sodium piece into water behind shield.',
      'Step 2: Observe molten sphere skating across the water.',
      'Step 3: Track magenta phenolphthalein trail (NaOH formation).',
      'Step 4: Test evolved gas with lit splint (sharp pop confirms H₂).',
    ],
    relatedInventoryIds: ['safety-shield', 'crucible-tongs', 'trough', 'test-tube'],
  },
  stage4: {
    subtitle: 'Recording physical and chemical phenomena during reaction',
    summary:
      'Record physical state changes, gas evolution, acoustic and visual effects, and alkaline indicator transitions.',
    steps: [
      'Record physical observation: Solid sodium melts into a liquid sphere, demonstrating reaction temperature > 98°C.',
      'Record kinematic observation: Rapid, random darting across water propelled by asymmetric hydrogen gas discharge.',
      'Record acoustic observation: Continuous audible hissing sound from rapid gas liberation.',
      'Record indicator observation: Water immediately turns bright magenta/pink, confirming formation of strong alkali (NaOH, pH > 12).',
      'Record gas combustion: Collected gas burns with a characteristic sharp "pop" sound, confirming hydrogen (H₂).',
    ],
    scientificExplanation:
      'Strongly exothermic enthalpy: ΔH° = -368 kJ/2 mol Na. The temperature rise can occasionally ignite evolved hydrogen, producing an orange-yellow sodium-colored flame.',
    highlights: [
      'Molten Sphere: Confirms exothermic temperature exceeds 97.8°C.',
      'Indicator Shift: Colorless → Deep Pink confirms NaOH base formation.',
      'Combustion Pop: 2H₂ + O₂ → 2H₂O confirms pure hydrogen gas.',
    ],
    relatedInventoryIds: ['metallic-sodium', 'phenolphthalein-indicator', 'trough'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Reaction Record',
  },
  stage5: {
    subtitle: 'Redox mechanism, balanced chemical equation, and safety conclusions',
    summary:
      'Demonstrate that alkali metals react vigorously with water, reducing protons to hydrogen gas and forming caustic alkali solutions. Enforce laboratory safety protocols.',
    steps: [
      'Write the balanced molecular equation: 2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑.',
      'Write the net ionic redox equation: 2Na(s) + 2H₂O(l) → 2Na⁺(aq) + 2OH⁻(aq) + H₂(g)↑.',
      'Identify oxidation half-reaction: Na → Na⁺ + e⁻ (sodium is oxidized, reducing agent).',
      'Identify reduction half-reaction: 2H₂O + 2e⁻ → H₂ + 2OH⁻ (water protons reduced, oxidizing agent).',
    ],
    scientificExplanation:
      'Sodium has a single valence electron (3s¹) with low first ionization energy (+496 kJ/mol) and a standard oxidation potential of +2.71 V, making it one of the most powerful reducing agents in chemistry.',
    highlights: [
      'Balanced Equation: 2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)↑.',
      'Redox Roles: Na is oxidized (reducing agent); H₂O is reduced (oxidizing agent).',
      'Safety: High explosion hazard; never handle sodium with bare hands; work strictly behind safety shields.',
    ],
    relatedInventoryIds: ['metallic-sodium', 'distilled-water', 'phenolphthalein-indicator'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Redox Reaction Proved',
  },
})

// -----------------------------------------------------------------------------
// 13. Preparation of Ammonia Gas and Fountain Experiment (Grade 2 Term 2)
// -----------------------------------------------------------------------------
export const ammoniaPrepLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-ammonia-prep-013',
  experimentTitle: 'Preparation of Ammonia Gas and Fountain Experiment',
  reactionClassificationNote:
    'Thermal base displacement reaction: heating an ammonium salt with a strong base displaces volatile basic ammonia gas: 2NH₄Cl(s) + Ca(OH)₂(s) → CaCl₂(s) + 2H₂O(g) + 2NH₃(g)↑. The fountain experiment demonstrates ammonia’s extreme water solubility and basicity.',
  stage1: {
    subtitle: 'Hard glass delivery apparatus, drying tower, collection flask, and fountain jet',
    summary:
      'Assemble a borosilicate test tube clamped sloping downward, Bunsen burner, drying tower packed with quicklime (CaO), inverted round-bottom collection flask, and fountain dropper jet assembly.',
    steps: [
      'Clamp the hard glass reaction tube slanting slightly downward towards its mouth.',
      'Pack the vertical drying tower with fresh lumps of calcium oxide (CaO).',
      'Set up an inverted, completely dry round-bottom flask on a ring stand.',
      'Assemble the fountain flask with a two-hole rubber stopper carrying a glass jet nozzle and a water-filled dropper.',
    ],
    scientificExplanation:
      'The reaction tube must slope downward so water vapor condensed near the neck cannot run back onto the hot base, which would shatter the hot borosilicate glass.',
    highlights: [
      'Hard Glass Reaction Tube — Slopes downward to prevent thermal shock from condensation.',
      'CaO Drying Tower — Basic drying agent that dries NH₃ without reacting.',
      'Inverted Flask — Collects ammonia by downward displacement of air (density NH₃ < air).',
      'Fountain Jet Assembly — Demonstrates vacuum creation upon instant dissolution.',
    ],
    relatedInventoryIds: [
      'hard-glass-tube',
      'bunsen-burner',
      'clamp-stand',
      'gas-delivery-tube',
      'round-bottom-flask',
      'dropper',
      'trough',
    ],
  },
  stage2: {
    subtitle: 'Ammonium chloride, slaked lime, quicklime drying lumps, and red litmus',
    summary:
      'Dry ammonium chloride (NH₄Cl), slaked lime (Ca(OH)₂), lumps of calcium oxide drying agent (CaO), distilled water, and red litmus solution.',
    steps: [
      'Grind 10 g of dry NH₄Cl and 15 g of dry Ca(OH)₂ together in a mortar.',
      'Transfer the powdery mixture into the reaction tube.',
      'Place fresh quicklime (CaO) lumps in the drying U-tube.',
      'Fill the fountain reservoir trough with distilled water tinted red with litmus solution.',
    ],
    scientificExplanation:
      'Ammonia cannot be dried using concentrated H₂SO₄ or anhydrous CaCl₂ because it forms ammonium sulfate (2NH₃ + H₂SO₄ → (NH₄)₂SO₄) or complex adducts (CaCl₂·8NH₃). Quicklime (CaO) is a basic oxide and dries NH₃ without reaction.',
    highlights: [
      'Reactants: NH₄Cl (ammonium salt) + Ca(OH)₂ (slaked lime).',
      'Drying Agent: Calcium oxide (CaO, basic drying agent).',
      'Reservoir: Water containing acidic red litmus indicator.',
    ],
    relatedInventoryIds: [
      'ammonium-chloride-solid',
      'slaked-lime-calcium-hydroxide',
      'calcium-oxide-drying-agent',
      'red-litmus-solution',
      'distilled-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Ammonia Synthesis',
  },
  stage3: {
    subtitle: 'Heating reaction mixture, gas collection, and fountain initiation',
    summary:
      'Heat the solid mixture gently; pass evolved gas through the CaO tower; collect dry NH₃ in the inverted flask; assemble the fountain apparatus; squeeze the dropper to trigger the water fountain.',
    steps: [
      'Heat the reaction tube gently and uniformly along its length using a luminous burner flame.',
      'Collect ammonia in the inverted dry flask until moist red litmus paper held at the mouth turns blue immediately.',
      'Seal the filled flask with the stopper assembly containing the water-loaded dropper and jet nozzle.',
      'Invert the flask over the water trough so the lower end of the jet tube is submerged in red litmus water.',
      'Squeeze the dropper bulb to inject a single drop of water into the flask, then open the tube pinch clamp.',
    ],
    scientificExplanation:
      'One volume of water dissolves approximately 700 volumes of ammonia gas at room temperature. Injecting a single water drop dissolves virtually all ammonia in the flask within milliseconds, creating an immediate partial vacuum.',
    highlights: [
      'Step 1: Heat dry NH₄Cl + Ca(OH)₂ mixture gently.',
      'Step 2: Dry gas through CaO tower and collect by downward displacement of air.',
      'Step 3: Test flask fullness with moist red litmus (turns blue).',
      'Step 4: Squeeze dropper into flask to launch the spectacular fountain.',
    ],
    relatedInventoryIds: ['hard-glass-tube', 'bunsen-burner', 'round-bottom-flask', 'dropper', 'trough'],
  },
  stage4: {
    subtitle: 'Recording fountain vacuum dynamics and dramatic color transition',
    summary:
      'Observe the rapid rush of water into the vacuum and record the instantaneous color change of red litmus turning royal blue.',
    steps: [
      'Record fountain creation: External atmospheric pressure pushes water up the tube, ejecting a vigorous fountain spraying the top of the flask.',
      'Record color change: The incoming water, initially red from acidic litmus, instantly turns deep royal blue upon spraying into the ammonia environment.',
      'Record volume displaced: The flask fills almost completely with blue liquid, demonstrating high gas dissolution.',
    ],
    scientificExplanation:
      'Atmospheric pressure (1 atm ≈ 101.3 kPa) pressing on the open trough exceeds the near-zero internal flask pressure, forcing liquid up the nozzle at high velocity. Dissolved NH₃ forms basic OH⁻: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻, turning litmus blue.',
    highlights: [
      'High Velocity Jet: Vacuum pulls water upward in a continuous fountain.',
      'Color Transformation: Acidic Red Litmus → Alkaline Royal Blue.',
      'Dissolution Ratio: Over 700 mL of NH₃ dissolves in just 1 mL of H₂O.',
    ],
    relatedInventoryIds: ['round-bottom-flask', 'red-litmus-solution', 'trough'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Fountain Dynamics',
  },
  stage5: {
    subtitle: 'Chemical preparation equations and alkaline fountain mechanism',
    summary:
      'Thermal reaction of ammonium salt with a base synthesizes ammonia gas. The fountain experiment conclusively demonstrates high aqueous solubility and basicity.',
    steps: [
      'Write the preparation reaction: 2NH₄Cl(s) + Ca(OH)₂(s) → CaCl₂(s) + 2H₂O(l) + 2NH₃(g)↑.',
      'Write the water dissolution reaction: NH₃(g) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq).',
      'Explain why ammonia cannot be collected over water (high solubility) and why it must be collected downward (lighter than air).',
    ],
    scientificExplanation:
      'Ammonia is a pyramidal polar molecule with a lone pair on nitrogen (sp³ hybridized). It forms extensive hydrogen bonds with water molecules, accounting for its extraordinary solubility and Lewis/Brønsted-Lowry basicity.',
    highlights: [
      'Preparation Equation: 2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2H₂O + 2NH₃↑.',
      'Alkaline Hydrolysis: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻.',
      'Safety: Ammonia is a choking, toxic respiratory irritant; work strictly in a fume hood.',
    ],
    relatedInventoryIds: [
      'ammonium-chloride-solid',
      'slaked-lime-calcium-hydroxide',
      'red-litmus-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Ammonia Synthesis Proved',
  },
})

// -----------------------------------------------------------------------------
// 14. Catalytic Decomposition of Hydrogen Peroxide (Grade 3 Term 1)
// -----------------------------------------------------------------------------
export const catalysisLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-catalysis-014',
  experimentTitle: 'Catalytic Decomposition of Hydrogen Peroxide',
  reactionClassificationNote:
    'Heterogeneous catalytic disproportionation: black manganese(IV) oxide accelerates the exothermic decomposition of hydrogen peroxide into water and molecular oxygen: 2H₂O₂(aq) → 2H₂O(l) + O₂(g)↑ (catalyzed by MnO₂(s)), lowering activation energy without being consumed.',
  stage1: {
    subtitle: 'Conical flask, measuring cylinder, spatula, wooden splint, and gas delivery tube',
    summary:
      'Assemble a 250 mL Erlenmeyer flask, 50 mL graduated cylinder, laboratory spatula, wooden splints, and gas delivery tube to measure reaction kinetics and test oxygen evolution.',
    steps: [
      'Inspect the Erlenmeyer flask for cleanliness and dry interior.',
      'Measure 25 mL of 3% hydrogen peroxide solution in the graduated cylinder.',
      'Prepare long wooden splints and a lighter for the glowing splint oxygen test.',
    ],
    scientificExplanation:
      'Conical flasks provide a wide base with a narrow neck, containing vigorous effervescence and aerosol spray while funneling evolved oxygen gas past the testing zone.',
    highlights: [
      'Erlenmeyer Flask — Safely contains effervescence and concentrates evolved gas.',
      'Graduated Cylinder — Measures exact 25.0 mL H₂O₂ reactant volume.',
      'Wooden Splint — Qualitative test instrument for detecting molecular oxygen.',
    ],
    relatedInventoryIds: ['erlenmeyer-flask', 'graduated-cylinder', 'spatula', 'wooden-splint'],
  },
  stage2: {
    subtitle: 'Hydrogen peroxide solution and manganese(IV) oxide catalyst powder',
    summary:
      'Use 25 mL of 3% aqueous hydrogen peroxide (colorless liquid) and 0.5 g of black manganese(IV) oxide powder (insoluble solid catalyst).',
    steps: [
      'Dispense 25 mL of stabilized 3% (10 volume) H₂O₂ into the conical flask.',
      'Weigh 0.50 g of black MnO₂ powder on a tared weighing dish.',
      'Observe the uncatalyzed hydrogen peroxide for 1 minute to establish baseline stability.',
    ],
    scientificExplanation:
      'Hydrogen peroxide decomposition is thermodynamically spontaneous (ΔG° < 0) but kinetically sluggish at room temperature due to high activation energy (E_a ≈ 75 kJ/mol). MnO₂ provides an alternate catalytic pathway reducing E_a to ~58 kJ/mol.',
    highlights: [
      'Reactant: 25 mL 3% H₂O₂ (clear, colorless aqueous solution).',
      'Catalyst: 0.50 g MnO₂ (black insoluble powder).',
      'Baseline: Negligible spontaneous bubbling before catalyst addition.',
    ],
    relatedInventoryIds: ['hydrogen-peroxide-solution', 'manganese-dioxide-powder'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Catalytic System',
  },
  stage3: {
    subtitle: 'Catalyst addition, effervescence observation, and glowing splint test',
    summary:
      'Add MnO₂ powder into the flask; observe immediate rapid effervescence; ignite a wooden splint, blow out the flame to leave a glowing red ember, and insert it into the flask neck.',
    steps: [
      'Note the clear, calm liquid in the flask.',
      'Add 0.5 g of black MnO₂ powder using the spatula in one addition.',
      'Observe instantaneous vigorous boiling-like effervescence and cloud of warm water vapor.',
      'Light a wooden splint, blow out the flame to leave a glowing red ember at the tip.',
      'Lower the glowing splint into the neck of the flask without touching the liquid.',
      'Observe the glowing splint immediately burst into bright flame.',
    ],
    scientificExplanation:
      'Rapid catalytic decomposition floods the flask neck with pure oxygen gas (>95% O₂). High oxygen concentration dramatically accelerates the combustion rate of wood charcoal, causing the ember to relight.',
    highlights: [
      'Step 1: Observe stable H₂O₂ prior to catalyst addition.',
      'Step 2: Add black MnO₂ powder to trigger immediate effervescence.',
      'Step 3: Prepare glowing wooden splint (ember).',
      'Step 4: Lower into flask neck; glowing splint bursts into flame.',
    ],
    relatedInventoryIds: ['erlenmeyer-flask', 'spatula', 'wooden-splint'],
  },
  stage4: {
    subtitle: 'Recording reaction rate acceleration and catalyst recovery mass',
    summary:
      'Record gas evolution rate and verify that the black manganese dioxide powder remains chemically unchanged and can be recovered by filtration.',
    steps: [
      'Record reaction speed: Rate increases by more than 10,000-fold upon MnO₂ addition.',
      'Record temperature: Mixture temperature rises from 22°C to ~38°C (exothermic reaction).',
      'Record glowing splint test: Ember bursts into flame repeatedly as long as effervescence continues.',
      'Filter the reaction mixture through pre-weighed filter paper; wash with water, dry, and re-weigh.',
      'Record recovered mass: Exactly 0.50 g of black MnO₂ is recovered, proving it is not consumed.',
    ],
    scientificExplanation:
      'A true catalyst accelerates reaction velocity by offering an alternative pathway with lower activation energy, without undergoing permanent chemical change or stoichiometric consumption.',
    highlights: [
      'Rate Acceleration: Instantaneous bubbling vs imperceptible uncatalyzed rate.',
      'Positive Oxygen Test: Glowing splint rekindles with an audible whoosh.',
      'Mass Conservation: 100% of MnO₂ mass recovered after reaction.',
    ],
    relatedInventoryIds: ['erlenmeyer-flask', 'manganese-dioxide-powder', 'wooden-splint'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Kinetic Data',
  },
  stage5: {
    subtitle: 'Disproportionation mechanism, chemical equation, and catalyst definition',
    summary:
      'Manganese(IV) oxide catalyzes the disproportionation of hydrogen peroxide into water and oxygen gas. The catalyst alters reaction kinetics without affecting equilibrium or being consumed.',
    steps: [
      'Write the catalyzed reaction equation: 2H₂O₂(aq) → 2H₂O(l) + O₂(g)↑ (over MnO₂ catalyst).',
      'Explain disproportionation: Oxygen in H₂O₂ has oxidation state -1; it is simultaneously oxidized to 0 (in O₂) and reduced to -2 (in H₂O).',
      'Conclude that catalysts increase the rate of reaction by lowering activation energy.',
    ],
    scientificExplanation:
      'Cyclic redox mechanism: MnO₂ briefly reacts with H₂O₂ to form transient manganese intermediates and water, which then rapidly react with a second H₂O₂ molecule to regenerate MnO₂ and release O₂.',
    highlights: [
      'Catalytic Equation: 2H₂O₂(aq) → 2H₂O(l) + O₂(g)↑ (catalyzed by MnO₂).',
      'Redox Mechanism: Disproportionation of oxygen from -1 to 0 (oxidation) and -2 (reduction).',
      'Safety: 3% H₂O₂ can bleach skin; exothermic reaction warms the flask.',
    ],
    relatedInventoryIds: ['hydrogen-peroxide-solution', 'manganese-dioxide-powder'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Catalytic Cycle Proved',
  },
})

// -----------------------------------------------------------------------------
// 15. Identification of Acid Radicals (Anions) (Grade 3 Term 1)
// -----------------------------------------------------------------------------
export const anionsLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-anions-015',
  experimentTitle: 'Identification of Acid Radicals (Anions)',
  reactionClassificationNote:
    'Qualitative inorganic analysis: selective displacement and precipitation reactions identify carbonate (CO₃²⁻), thiosulfate (S₂O₃²⁻), and chloride (Cl⁻) anions using dilute hydrochloric acid and silver nitrate.',
  stage1: {
    subtitle: 'Test tubes, rack, droppers, delivery tube, and clear limewater receiver',
    summary:
      'Set up borosilicate test tubes in a rack, angled gas delivery tube, precision droppers, and a receiver tube containing fresh, clear limewater (Ca(OH)₂).',
    steps: [
      'Label test tubes: Carbonate (CO₃²⁻), Thiosulfate (S₂O₃²⁻), and Chloride (Cl⁻).',
      'Prepare a delivery tube with an airtight rubber stopper to transfer evolved gas into limewater.',
      'Check that clear limewater is completely transparent without surface carbonate crust.',
    ],
    scientificExplanation:
      'Clear limewater must be protected from atmospheric CO₂. Fresh preparation ensures immediate turbidity when exposed to gas evolved from carbonate salts.',
    highlights: [
      'Test Tube Rack — Supports parallel qualitative analytical tests.',
      'Gas Delivery Tube — Conveys evolved gas into limewater for confirmation.',
      'Clear Limewater — Diagnostic reagent for detecting carbon dioxide gas.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'dropper', 'gas-delivery-tube'],
  },
  stage2: {
    subtitle: 'Dry solid salts, dilute HCl acid, silver nitrate, and ammonia solution',
    summary:
      'Solid sodium carbonate (Na₂CO₃), sodium thiosulfate (Na₂S₂O₃), sodium chloride (NaCl), dilute HCl, silver nitrate solution (AgNO₃), and ammonium hydroxide (NH₄OH).',
    steps: [
      'Dispense 0.5 g of solid Na₂CO₃ into tube 1.',
      'Dispense 0.5 g of solid Na₂S₂O₃ into tube 2.',
      'Prepare 2 mL of 0.1 M NaCl solution in tube 3.',
      'Prepare dropper bottles of dilute HCl (2 M) and 0.1 M AgNO₃ solution.',
    ],
    scientificExplanation:
      'Hydrochloric acid is stronger and less volatile than carbonic acid (H₂CO₃) and thiosulfuric acid (H₂S₂O₃), allowing it to displace their gaseous anhydrides (CO₂, SO₂) quantitatively.',
    highlights: [
      'Carbonate Salt: Na₂CO₃ (white solid, decomposes to CO₂ with acid).',
      'Thiosulfate Salt: Na₂S₂O₃ (white crystalline solid, yields SO₂ and colloidal S).',
      'Chloride Salt: NaCl (forms insoluble AgCl precipitate with AgNO₃).',
    ],
    relatedInventoryIds: [
      'sodium-carbonate-solid',
      'sodium-thiosulfate-solid',
      'sodium-chloride-solid',
      'dilute-hydrochloric-acid',
      'silver-nitrate-solution',
      'limewater-solution',
      'ammonium-hydroxide-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Analytical Anions',
  },
  stage3: {
    subtitle: 'Acid addition, gas bubbling through limewater, and silver precipitation',
    summary:
      'Add dilute HCl to carbonate and pass gas into limewater; add HCl to thiosulfate and observe sulfur suspension and choking gas; add AgNO₃ to chloride and test precipitate solubility in ammonia.',
    steps: [
      'Carbonate Test: Add 2 mL of dilute HCl to Na₂CO₃; insert delivery tube immediately; bubble gas into clear limewater for 30 seconds.',
      'Thiosulfate Test: Add 2 mL of dilute HCl to Na₂S₂O₃; observe gradual yellow colloidal turbidity and waft choking SO₂ odor.',
      'Chloride Test: Add 1 mL of AgNO₃ solution to 2 mL of NaCl solution; observe curdy white precipitate; add 2 mL of NH₄OH and shake.',
    ],
    scientificExplanation:
      'Carbonate effervesces CO₂ which forms insoluble CaCO₃ in limewater. Thiosulfate decomposes to SO₂ gas and colloidal elemental sulfur. Chloride precipitates as AgCl, which redissolves in ammonia by forming a diamminesilver(I) complex.',
    highlights: [
      'Step 1: Test carbonate with HCl; bubble gas into limewater.',
      'Step 2: Test thiosulfate with HCl; observe yellow sulfur precipitate.',
      'Step 3: Test chloride with AgNO₃; form curdy white precipitate.',
      'Step 4: Confirm AgCl dissolves completely in aqueous ammonia.',
    ],
    relatedInventoryIds: ['test-tube', 'dropper', 'gas-delivery-tube'],
  },
  stage4: {
    subtitle: 'Recording precipitate colors, odors, and complex solubility',
    summary:
      'Construct a diagnostic qualitative analysis matrix recording observed precipitate colors, gas identification, and confirmatory tests.',
    steps: [
      'Record Carbonate: Vigorous effervescence of colorless, odorless gas; limewater turns milky/turbid due to insoluble CaCO₃.',
      'Record Thiosulfate: Choking pungent odor of burning sulfur (SO₂); solution turns milky yellow due to suspended elemental sulfur (S).',
      'Record Chloride: Immediate curdy white precipitate of AgCl; turns violet upon exposure to light; completely dissolves in excess NH₄OH to form clear solution.',
    ],
    scientificExplanation:
      'Turbidity in limewater: CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O. Excess CO₂ redissolves turbidity by forming soluble calcium bicarbonate: CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂.',
    highlights: [
      'CO₃²⁻: Brisk effervescence; limewater turns turbid (CaCO₃↓).',
      'S₂O₃²⁻: Choking SO₂ gas + pale yellow sulfur suspension (S↓).',
      'Cl⁻: Curdy white precipitate (AgCl↓), soluble in excess NH₄OH.',
    ],
    relatedInventoryIds: [
      'sodium-carbonate-solid',
      'sodium-thiosulfate-solid',
      'silver-nitrate-solution',
      'limewater-solution',
    ],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Analytical Observations',
  },
  stage5: {
    subtitle: 'Systematic chemical equations and analytical separation theory',
    summary:
      'Confirm the identity of carbonate, thiosulfate, and chloride anions through displacement and precipitation reactions according to the Egyptian secondary chemistry syllabus.',
    steps: [
      'Write carbonate reactions: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑; CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.',
      'Write thiosulfate reaction: Na₂S₂O₃ + 2HCl → 2NaCl + H₂O + SO₂↑ + S↓.',
      'Write chloride precipitation: NaCl + AgNO₃ → AgCl↓ + NaNO₃.',
      'Write silver chloride dissolution in ammonia: AgCl(s) + 2NH₃(aq) → [Ag(NH₃)₂]⁺(aq) + Cl⁻(aq).',
    ],
    scientificExplanation:
      'Anions are systematically classified by their acid stability. Dilute HCl displaces anions of weaker, more volatile acids (CO₃²⁻, S₂O₃²⁻). Stable halides require precipitation with silver ions to yield insoluble salts of characteristic K_sp.',
    highlights: [
      'Carbonate Equations: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑; CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.',
      'Thiosulfate Equation: Na₂S₂O₃ + 2HCl → 2NaCl + H₂O + SO₂↑ + S↓.',
      'Chloride Equations: NaCl + AgNO₃ → AgCl↓ + NaNO₃; AgCl + 2NH₃ → [Ag(NH₃)₂]Cl.',
      'Safety: SO₂ is toxic; silver nitrate stains skin indelibly; wear gloves and goggles.',
    ],
    relatedInventoryIds: [
      'sodium-carbonate-solid',
      'sodium-thiosulfate-solid',
      'sodium-chloride-solid',
      'silver-nitrate-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Anion Identification Proved',
  },
})

// -----------------------------------------------------------------------------
// 16. Identification of Basic Radicals (Cations) (Grade 3 Term 1)
// -----------------------------------------------------------------------------
export const cationsLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-cations-016',
  experimentTitle: 'Identification of Basic Radicals (Cations)',
  reactionClassificationNote:
    'Qualitative inorganic analysis: differential hydroxide precipitation and amphoteric complexation distinguish iron(II) (Fe²⁺), iron(III) (Fe³⁺), and aluminum (Al³⁺) cations using sodium hydroxide.',
  stage1: {
    subtitle: 'Test tubes, test tube rack, and calibrated dropwise dispensing droppers',
    summary:
      'Arrange three clean borosilicate test tubes in a rack with dedicated droppers for salt solutions and caustic sodium hydroxide precipitating reagent.',
    steps: [
      'Label three test tubes: Iron(II) (Fe²⁺), Iron(III) (Fe³⁺), and Aluminum (Al³⁺).',
      'Clean droppers with distilled water to ensure no iron or hydroxide residues contaminate tests.',
      'Keep a waste beaker ready for safe collection of heavy metal hydroxide precipitates.',
    ],
    scientificExplanation:
      'Dropwise reagent addition is essential in qualitative analysis because amphoteric hydroxides precipitate with initial hydroxide additions but redissolve when excess reagent is added.',
    highlights: [
      'Test Tube Rack — Organizes side-by-side color comparison of transition metal hydroxides.',
      'Precision Droppers — Deliver dropwise NaOH to observe precipitate formation and dissolution.',
      'Waste Container — Collects heavy metal precipitates for environmentally safe disposal.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'dropper'],
  },
  stage2: {
    subtitle: 'Iron(II) sulfate, iron(III) chloride, aluminum chloride, and sodium hydroxide',
    summary:
      'Use 0.1 M freshly prepared iron(II) sulfate (pale green), 0.1 M iron(III) chloride (yellow-brown), 0.1 M aluminum chloride (colorless), and 2.0 M sodium hydroxide solution.',
    steps: [
      'Dispense 2.0 mL of FeSO₄ solution into tube 1.',
      'Dispense 2.0 mL of FeCl₃ solution into tube 2.',
      'Dispense 2.0 mL of AlCl₃ solution into tube 3.',
      'Prepare dropper bottle of 2.0 M sodium hydroxide solution.',
    ],
    scientificExplanation:
      'Freshly prepared FeSO₄ is essential because dissolved atmospheric oxygen gradually oxidizes Fe²⁺ to Fe³⁺. Aluminum forms a colorless aqueous solution containing hydrated [Al(H₂O)₆]³⁺ ions.',
    highlights: [
      'Iron(II): FeSO₄ (pale green solution, easily oxidized).',
      'Iron(III): FeCl₃ (yellow-brown solution).',
      'Aluminum: AlCl₃ (clear colorless solution).',
      'Precipitating Reagent: 2.0 M NaOH (caustic alkali).',
    ],
    relatedInventoryIds: [
      'iron-ii-sulfate-solution',
      'iron-iii-chloride-solution',
      'aluminum-chloride-solution',
      'sodium-hydroxide-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Cation Reagents',
  },
  stage3: {
    subtitle: 'Dropwise sodium hydroxide addition, color observation, and excess reagent test',
    summary:
      'Add sodium hydroxide solution dropwise to each cation sample; observe initial precipitate colors; add excess NaOH and observe whether the precipitate dissolves.',
    steps: [
      'To tube 1 (Fe²⁺): Add 3 drops of NaOH; observe dirty green precipitate; add excess NaOH (2 mL); observe precipitate remains insoluble.',
      'To tube 2 (Fe³⁺): Add 3 drops of NaOH; observe reddish-brown gelatinous precipitate; add excess NaOH (2 mL); observe precipitate remains insoluble.',
      'To tube 3 (Al³⁺): Add 3 drops of NaOH; observe white gelatinous precipitate; add excess NaOH (2 mL) with shaking; observe precipitate dissolves completely to a clear colorless solution.',
    ],
    scientificExplanation:
      'Fe(OH)₂ and Fe(OH)₃ are basic hydroxides insoluble in excess hydroxide. Al(OH)₃ is amphoteric: it reacts with excess OH⁻ acting as a Lewis acid to form the soluble tetrahydroxoaluminate complex ion [Al(OH)₄]⁻ (sodium meta-aluminate, NaAlO₂).',
    highlights: [
      'Step 1: Add NaOH dropwise to Fe²⁺ (dirty green ppt, insoluble in excess).',
      'Step 2: Add NaOH dropwise to Fe³⁺ (reddish-brown ppt, insoluble in excess).',
      'Step 3: Add NaOH dropwise to Al³⁺ (white ppt).',
      'Step 4: Add excess NaOH to Al³⁺; observe precipitate dissolves completely.',
    ],
    relatedInventoryIds: ['test-tube', 'dropper'],
  },
  stage4: {
    subtitle: 'Recording characteristic precipitate colors and amphoteric solubility',
    summary:
      'Record distinctive precipitate colors, aerial oxidation behavior, and differential solubility in excess sodium hydroxide.',
    steps: [
      'Record Iron(II): Fe²⁺ + 2OH⁻ → Fe(OH)₂↓ (dirty green precipitate, insoluble in excess NaOH; surface turns brown over time as it oxidizes in air to Fe(OH)₃).',
      'Record Iron(III): Fe³⁺ + 3OH⁻ → Fe(OH)₃↓ (reddish-brown gelatinous precipitate, insoluble in excess NaOH).',
      'Record Aluminum: Al³⁺ + 3OH⁻ → Al(OH)₃↓ (gelatinous white precipitate); in excess NaOH: Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻ (dissolves to clear solution).',
    ],
    scientificExplanation:
      'Transition metal cations form colored precipitates due to d-d electronic transitions in coordinated ligand fields. Al³⁺ has an empty d shell and forms a colorless/white precipitate.',
    highlights: [
      'Fe²⁺ Result: Dirty green precipitate, insoluble in excess NaOH.',
      'Fe³⁺ Result: Reddish-brown gelatinous precipitate, insoluble in excess NaOH.',
      'Al³⁺ Result: White gelatinous precipitate, dissolves in excess NaOH (amphoteric).',
    ],
    relatedInventoryIds: [
      'iron-ii-sulfate-solution',
      'iron-iii-chloride-solution',
      'aluminum-chloride-solution',
      'sodium-hydroxide-solution',
    ],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Cation Matrix',
  },
  stage5: {
    subtitle: 'Ionic precipitation equations and amphoteric complexation mechanisms',
    summary:
      'Distinguish iron(II), iron(III), and aluminum cations through characteristic hydroxide precipitation and amphoteric behavior, confirming Egyptian syllabus qualitative analytical rules.',
    steps: [
      'Write Fe²⁺ precipitation: FeSO₄(aq) + 2NaOH(aq) → Fe(OH)₂↓(dirty green) + Na₂SO₄(aq).',
      'Write Fe³⁺ precipitation: FeCl₃(aq) + 3NaOH(aq) → Fe(OH)₃↓(reddish-brown) + 3NaCl(aq).',
      'Write Al³⁺ precipitation: AlCl₃(aq) + 3NaOH(aq) → Al(OH)₃↓(white) + 3NaCl(aq).',
      'Write Al(OH)₃ amphoteric dissolution: Al(OH)₃(s) + NaOH(aq) → NaAlO₂(aq) + 2H₂O(l) (or Na[Al(OH)₄]).',
    ],
    scientificExplanation:
      'Aluminum hydroxide behaves as an acid in the presence of strong base: Al(OH)₃ + OH⁻ ⇌ [Al(OH)₄]⁻. Its small cation radius and high +3 charge polarize bonded water molecules, allowing proton release to form oxyanions.',
    highlights: [
      'Iron(II) Equation: Fe²⁺ + 2OH⁻ → Fe(OH)₂↓ (dirty green).',
      'Iron(III) Equation: Fe³⁺ + 3OH⁻ → Fe(OH)₃↓ (reddish-brown).',
      'Aluminum Equations: Al³⁺ + 3OH⁻ → Al(OH)₃↓; Al(OH)₃ + OH⁻ → [Al(OH)₄]⁻ (soluble).',
      'Safety: 2.0 M NaOH is corrosive to eyes and skin; wear chemical splash goggles.',
    ],
    relatedInventoryIds: [
      'iron-ii-sulfate-solution',
      'iron-iii-chloride-solution',
      'aluminum-chloride-solution',
      'sodium-hydroxide-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Cation Identification Proved',
  },
})

// -----------------------------------------------------------------------------
// 17. Neutralization Titration using Methyl Orange (Grade 3 Term 1)
// -----------------------------------------------------------------------------
export const volumetricTitrationLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-volumetric-titration-017',
  experimentTitle: 'Neutralization Titration using Methyl Orange',
  reactionClassificationNote:
    'Quantitative volumetric analysis: standardization of hydrochloric acid against primary standard sodium carbonate using methyl orange indicator: Na₂CO₃(aq) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)↑.',
  stage1: {
    subtitle: 'Precision burette, clamp stand, volumetric pipette, and white tile',
    summary:
      'Assemble a 50 mL class A burette held vertically by a clamp stand over a white ceramic tile, 25.0 mL volumetric pipette with suction bulb, and 250 mL conical flask.',
    steps: [
      'Rinse burette with distilled water, then with the hydrochloric acid of unknown concentration.',
      'Check burette stopcock for smooth liquid flow without leakage.',
      'Rinse pipette with the standard 0.10 M sodium carbonate solution.',
    ],
    scientificExplanation:
      'Using a primary standard (anhydrous Na₂CO₃) provides high molecular weight, high purity (>99.9%), and air stability, serving as the quantitative reference benchmark for acid standardization.',
    highlights: [
      'Burette — Measures variable acid titrant volume with 0.05 mL accuracy.',
      'Volumetric Pipette — Delivers exactly 25.0 mL of primary standard base.',
      'White Tile — Enhances color transition visibility from yellow to faint orange.',
    ],
    relatedInventoryIds: ['burette', 'clamp-stand', 'pipette', 'erlenmeyer-flask', 'white-tile'],
  },
  stage2: {
    subtitle: 'Primary standard sodium carbonate and hydrochloric acid of unknown concentration',
    summary:
      'Standard 0.100 M sodium carbonate solution (primary standard base), hydrochloric acid of unknown concentration (acid analyte/titrant), methyl orange indicator, and distilled water.',
    steps: [
      'Fill burette with unknown HCl solution; remove air bubble from tip; adjust meniscus to 0.00 mL.',
      'Pipette 25.0 mL of 0.100 M Na₂CO₃ solution into the conical flask.',
      'Add 2 drops of methyl orange indicator; observe the clear yellow color in alkaline carbonate solution.',
    ],
    scientificExplanation:
      'Sodium carbonate is the salt of a strong base (NaOH) and a weak acid (H₂CO₃), creating an alkaline initial solution (pH ~11.5). At complete neutralization, dissolved CO₂ creates a weakly acidic medium (pH ~4.0), matching methyl orange’s transition range (pH 3.1–4.4).',
    highlights: [
      'Primary Standard: 25.0 mL 0.100 M Na₂CO₃ (in flask).',
      'Unknown Titrant: HCl of unknown molarity (in burette).',
      'Indicator: Methyl orange (yellow in base, red in acid, orange at end point).',
    ],
    relatedInventoryIds: [
      'standard-sodium-carbonate-0-1m',
      'hydrochloric-acid-unknown',
      'methyl-orange-indicator',
      'distilled-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Standard Solutions',
  },
  stage3: {
    subtitle: 'Dropwise acid titration, continuous swirling, and orange end point',
    summary:
      'Titrate HCl into the sodium carbonate solution with constant swirling until the yellow solution transitions to an orange end point persisting for 30 seconds.',
    steps: [
      'Record initial burette volume V₁ = 0.00 mL.',
      'Run HCl into the flask with continuous swirling; observe transient red flashes that disappear upon swirling.',
      'Slow addition to dropwise when the yellow color becomes paler.',
      'Add split drops until the solution turns from pure yellow to a distinct faint orange/salmon tint.',
      'Record final burette volume V₂; repeat to achieve concordant titers within ±0.1 mL.',
    ],
    scientificExplanation:
      'Neutralization proceeds in two stages: CO₃²⁻ + H⁺ → HCO₃⁻ (pH 8.3, colorless with phenolphthalein), then HCO₃⁻ + H⁺ → H₂CO₃ → H₂O + CO₂ (pH 3.8, orange with methyl orange). Methyl orange detects complete stoichiometric neutralization.',
    highlights: [
      'Step 1: Record initial burette reading V₁.',
      'Step 2: Titrate HCl with continuous flask swirling.',
      'Step 3: Slow to dropwise near end point.',
      'Step 4: Stop at first permanent faint orange color; record V₂.',
    ],
    relatedInventoryIds: ['burette', 'erlenmeyer-flask', 'white-tile'],
  },
  stage4: {
    subtitle: 'Calculating acid molarity using stoichiometric equivalence',
    summary:
      'Apply the volumetric formula (M_a × V_a) / n_a = (M_b × V_b) / n_b to calculate the exact molar concentration of hydrochloric acid.',
    steps: [
      'Record concordant titer volumes: V_a = 25.00 mL of HCl.',
      'Identify stoichiometric coefficients from balanced equation: n_a = 2 (for HCl), n_b = 1 (for Na₂CO₃).',
      'Apply formula: (M_a × 25.00 mL) / 2 = (0.100 M × 25.00 mL) / 1.',
      'Solve for M_a: M_a = (2 × 0.100 M × 25.00 mL) / 25.00 mL = 0.200 M HCl.',
    ],
    scientificExplanation:
      'Because each carbonate ion reacts with two hydronium ions (1:2 stoichiometry), the molarity of the monoprotic acid is double the base molarity for equal volumes.',
    highlights: [
      'Titer Volume: V_a = 25.00 mL HCl.',
      'Stoichiometric Ratio: 2 moles HCl per 1 mole Na₂CO₃ (n_a = 2, n_b = 1).',
      'Standardized Molarity: M(HCl) = 0.200 M.',
    ],
    relatedInventoryIds: ['burette', 'erlenmeyer-flask'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Volumetric Law',
  },
  stage5: {
    subtitle: 'Stoichiometric equations, indicator theory, and analytical conclusions',
    summary:
      'Standardization against primary standard sodium carbonate accurately determines acid molarity. Methyl orange is the correct indicator for strong acid / weak base titrations.',
    steps: [
      'Write the balanced overall equation: Na₂CO₃(aq) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)↑.',
      'Write the net ionic equation: CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)↑.',
      'Explain why phenolphthalein is unsuitable: it changes at HCO₃⁻ stage (half neutralization) instead of complete neutralization.',
    ],
    scientificExplanation:
      'At the equivalence point, the solution contains dissolved CO₂ (carbonic acid), giving pH ~3.8–4.0. Phenolphthalein changes color at pH 8.2–10.0 (incomplete reaction). Methyl orange (pH 3.1–4.4) changes precisely when all carbonate is converted to CO₂.',
    highlights: [
      'Overall Equation: Na₂CO₃(aq) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)↑.',
      'Net Ionic: CO₃²⁻ + 2H⁺ → H₂O + CO₂↑.',
      'Indicator Rule: Use methyl orange for strong acid vs weak base titrations.',
      'Safety: Wear safety goggles; rinse acid splashes immediately with copious water.',
    ],
    relatedInventoryIds: [
      'standard-sodium-carbonate-0-1m',
      'hydrochloric-acid-unknown',
      'methyl-orange-indicator',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Standardization Proved',
  },
})

// -----------------------------------------------------------------------------
// 18. Chemical Equilibrium and Le Chatelier Principle (Grade 3 Term 1)
// -----------------------------------------------------------------------------
export const equilibriumLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-equilibrium-018',
  experimentTitle: 'Chemical Equilibrium and Le Chatelier Principle',
  reactionClassificationNote:
    'Homogeneous dynamic chemical equilibrium: reversible complexation between pale yellow iron(III) and colorless thiocyanate forms blood-red iron(III) thiocyanate: FeCl₃(aq) + 3NH₄SCN(aq) ⇌ Fe(SCN)₃(aq) + 3NH₄Cl(aq). Perturbations shift equilibrium in accordance with Le Chatelier’s principle.',
  stage1: {
    subtitle: 'Color comparison test tubes, rack, calibrated droppers, and mixing beaker',
    summary:
      'Arrange four identical glass test tubes in a rack with a white background screen, 100 mL mixing beaker, and precision droppers for perturbing the equilibrium mixture.',
    steps: [
      'Number four clean test tubes: Tube 1 (Control), Tube 2 (+Fe³⁺), Tube 3 (+SCN⁻), and Tube 4 (+NH₄Cl).',
      'Set up a white card behind the rack for uniform optical depth comparison.',
      'Check that droppers deliver uniform droplet volumes.',
    ],
    scientificExplanation:
      'Identical test tube diameters and uniform liquid volumes ensure that observed color intensity differences directly reflect equilibrium complex concentration ([Fe(SCN)₃]) rather than variable optical path lengths (Beer-Lambert law: A = εcl).',
    highlights: [
      'Four Matched Tubes — Ensures identical optical path length for color comparison.',
      'Tube 1 (Control) — Serves as visual baseline for forward and reverse shifts.',
      'White Card — Enhances color depth discrimination between shades of red.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'dropper', 'beaker'],
  },
  stage2: {
    subtitle: 'Iron(III) chloride, ammonium thiocyanate, solid ammonium chloride, and water',
    summary:
      'Dilute 0.01 M iron(III) chloride (FeCl₃, pale yellow), 0.01 M ammonium thiocyanate (NH₄SCN, colorless), solid ammonium chloride (NH₄Cl), and distilled water.',
    steps: [
      'Mix 10 mL of 0.01 M FeCl₃ and 10 mL of 0.01 M NH₄SCN in a 100 mL beaker; observe immediate formation of a blood-red solution.',
      'Add 20 mL of distilled water to dilute the mixture to a moderate translucent red hue.',
      'Distribute exactly 10 mL of this equilibrium mixture into each of the four test tubes.',
    ],
    scientificExplanation:
      'Combining Fe³⁺ and SCN⁻ establishes dynamic equilibrium: Fe³⁺ + 3SCN⁻ ⇌ Fe(SCN)₃. The rate of the forward complexation reaction equals the rate of the reverse dissociation reaction.',
    highlights: [
      'Reactant 1: FeCl₃ (source of Fe³⁺ ions, pale yellow).',
      'Reactant 2: NH₄SCN (source of SCN⁻ ions, colorless).',
      'Product: Fe(SCN)₃ (iron(III) thiocyanate complex, blood-red).',
      'Perturbation Salt: Solid NH₄Cl (source of NH₄⁺ and Cl⁻ product ions).',
    ],
    relatedInventoryIds: [
      'iron-iii-chloride-solution',
      'ammonium-thiocyanate-solution',
      'ammonium-chloride-solid',
      'distilled-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Equilibrium Mixture',
  },
  stage3: {
    subtitle: 'Perturbing equilibrium by changing reactant and product concentrations',
    summary:
      'Keep tube 1 as control; add FeCl₃ to tube 2; add NH₄SCN to tube 3; add solid NH₄Cl to tube 4; mix and compare color depths.',
    steps: [
      'Leave Tube 1 untouched as the reference equilibrium control.',
      'Add 5 drops of 0.1 M FeCl₃ to Tube 2; mix gently; observe color change.',
      'Add 5 drops of 0.1 M NH₄SCN to Tube 3; mix gently; observe color change.',
      'Add 1 spatula tip of solid NH₄Cl crystals to Tube 4; shake until dissolved; observe color change.',
      'Compare tubes 2, 3, and 4 simultaneously against control tube 1.',
    ],
    scientificExplanation:
      'According to Le Chatelier’s principle, if a stress (concentration change) is applied to a system at equilibrium, the system shifts in the direction that relieves that stress.',
    highlights: [
      'Step 1: Reserve Tube 1 as unperturbed equilibrium control.',
      'Step 2: Add reactant Fe³⁺ to Tube 2 (forward shift).',
      'Step 3: Add reactant SCN⁻ to Tube 3 (forward shift).',
      'Step 4: Add product NH₄Cl to Tube 4 (reverse shift).',
    ],
    relatedInventoryIds: ['test-tube', 'dropper', 'beaker'],
  },
  stage4: {
    subtitle: 'Recording color shifts and equilibrium direction',
    summary:
      'Record observed color intensities and correlate with forward and reverse equilibrium shifts.',
    steps: [
      'Record Tube 2 (+Fe³⁺): Color becomes substantially deeper blood-red than control → Forward shift (→) producing more Fe(SCN)₃.',
      'Record Tube 3 (+SCN⁻): Color becomes substantially deeper blood-red than control → Forward shift (→) producing more Fe(SCN)₃.',
      'Record Tube 4 (+NH₄Cl): Blood-red color fades noticeably to pale orange-yellow → Reverse shift (←) consuming Fe(SCN)₃.',
    ],
    scientificExplanation:
      'Adding Fe³⁺ or SCN⁻ increases the reaction quotient Q < K_c, driving net forward reaction. Adding NH₄Cl introduces common Cl⁻ product ions, causing Q > K_c and driving net reverse dissociation.',
    highlights: [
      'Adding Reactant (Fe³⁺ or SCN⁻): Deeper red (forward shift →).',
      'Adding Product (NH₄Cl): Fades to pale yellow (reverse shift ←).',
      'Dynamic Equilibrium: System responds to counteract imposed concentration changes.',
    ],
    relatedInventoryIds: [
      'iron-iii-chloride-solution',
      'ammonium-thiocyanate-solution',
      'ammonium-chloride-solid',
    ],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Color Shift Data',
  },
  stage5: {
    subtitle: 'Equilibrium law, mathematical expression, and Le Chatelier principle',
    summary:
      'Confirm Le Chatelier’s principle for concentration changes in reversible homogeneous systems, satisfying the Egyptian secondary chemistry curriculum.',
    steps: [
      'Write the balanced equilibrium equation: FeCl₃(aq) + 3NH₄SCN(aq) ⇌ Fe(SCN)₃(aq) + 3NH₄Cl(aq).',
      'Write the net ionic equilibrium: Fe³⁺(aq) + 3SCN⁻(aq) ⇌ Fe(SCN)₃(aq).',
      'Write the equilibrium constant expression: K_c = [Fe(SCN)₃] / ([Fe³⁺] × [SCN⁻]³).',
      'Conclude that K_c remains constant at constant temperature regardless of individual concentration changes.',
    ],
    scientificExplanation:
      'When [Fe³⁺] increases, the denominator of Q increases, so Q < K_c. The system shifts forward until Q equals K_c again, restoring equilibrium with a higher concentration of blood-red Fe(SCN)₃.',
    highlights: [
      'Reversible Equation: FeCl₃(aq) + 3NH₄SCN(aq) ⇌ Fe(SCN)₃(aq) + 3NH₄Cl(aq).',
      'Net Ionic: Fe³⁺(aq, yellow) + 3SCN⁻(aq, colorless) ⇌ Fe(SCN)₃(aq, blood-red).',
      'Equilibrium Constant: K_c = [Fe(SCN)₃] / ([Fe³⁺][SCN⁻]³).',
      'Safety: Thiocyanate solutions are mildly toxic; avoid ingestion and contact with skin.',
    ],
    relatedInventoryIds: [
      'iron-iii-chloride-solution',
      'ammonium-thiocyanate-solution',
      'ammonium-chloride-solid',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Le Chatelier Proved',
  },
})

// -----------------------------------------------------------------------------
// 19. Constructing a Daniell Galvanic Cell (Grade 3 Term 2)
// -----------------------------------------------------------------------------
export const daniellCellLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-daniell-cell-019',
  experimentTitle: 'Constructing a Daniell Galvanic Cell',
  reactionClassificationNote:
    'Spontaneous galvanic redox reaction: spontaneous electron transfer from zinc to copper generates continuous electric current: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), yielding standard electromotive force E°_cell = +1.10 V.',
  stage1: {
    subtitle: 'Half-cell beakers, digital voltmeter, connecting wires, sandpaper, and U-tube',
    summary:
      'Assemble two 150 mL beakers, digital high-impedance voltmeter, insulated copper wire leads with alligator clips, fine sandpaper, and a glass U-tube salt bridge.',
    steps: [
      'Clean zinc and copper metal plates with fine sandpaper to strip surface oxide films.',
      'Check digital voltmeter calibration and set to DC millivolts/volts scale.',
      'Prepare the U-tube salt bridge containing agar gel saturated with 1.0 M KNO₃.',
    ],
    scientificExplanation:
      'Oxide coatings on electrode metals act as electrical insulators, creating false overpotentials. Sandpaper polishing exposes pure crystalline metal for uninhibited charge transfer.',
    highlights: [
      'Beakers — Contain separate anode and cathode half-cell electrolytes.',
      'Digital Voltmeter — High-impedance meter measuring open-circuit cell EMF.',
      'Salt Bridge — Completes internal electric circuit by ion migration without bulk mixing.',
    ],
    relatedInventoryIds: ['beaker', 'voltmeter', 'connecting-wires', 'sandpaper', 'u-tube-cell'],
  },
  stage2: {
    subtitle: 'Zinc anode, copper cathode, zinc sulfate, copper sulfate, and potassium nitrate',
    summary:
      'Use zinc plate anode immersed in 1.0 M ZnSO₄, copper plate cathode immersed in 1.0 M CuSO₄, and a U-tube filled with potassium nitrate (KNO₃) electrolyte.',
    steps: [
      'Dispense 100 mL of 1.0 M ZnSO₄ into the anode beaker; immerse the zinc plate.',
      'Dispense 100 mL of 1.0 M CuSO₄ into the cathode beaker; immerse the copper plate.',
      'Confirm that the U-tube salt bridge is filled with clear potassium nitrate agar gel.',
    ],
    scientificExplanation:
      'Standard cell conditions require 1.0 M solute concentrations and 25°C (298 K). Under these conditions, standard half-cell reduction potentials are E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V.',
    highlights: [
      'Anode Half-cell: Zn plate in 1.0 M ZnSO₄ (E°_ox = +0.76 V, negative pole).',
      'Cathode Half-cell: Cu plate in 1.0 M CuSO₄ (E°_red = +0.34 V, positive pole).',
      'Salt Bridge: 1.0 M KNO₃ in agar gel (inert, non-interfering ions).',
    ],
    relatedInventoryIds: [
      'zinc-plate-anode',
      'copper-plate-cathode',
      'zinc-sulfate-solution-1m',
      'copper-sulfate-solution-1m',
      'potassium-nitrate-salt-bridge',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Galvanic Components',
  },
  stage3: {
    subtitle: 'Connecting electrodes, inserting salt bridge, and measuring cell voltage',
    summary:
      'Invert the salt bridge into both beakers, connect zinc plate to negative terminal of voltmeter and copper to positive terminal, and read the open-circuit cell voltage.',
    steps: [
      'Place the two half-cell beakers side-by-side.',
      'Invert the KNO₃ salt bridge so one arm rests in the ZnSO₄ solution and the other in the CuSO₄ solution.',
      'Connect the black wire clip from the voltmeter COM (-) terminal to the zinc plate.',
      'Connect the red wire clip from the voltmeter V (+) terminal to the copper plate.',
      'Observe the digital voltage reading display.',
      'Lift the salt bridge out of the beakers and observe the voltmeter display.',
      'Re-insert the salt bridge and verify voltage recovery.',
    ],
    scientificExplanation:
      'Electrons flow spontaneously through the external circuit from the negative zinc anode to the positive copper cathode. The salt bridge allows NO₃⁻ anions to migrate into the anode half-cell and K⁺ cations into the cathode half-cell, preventing charge buildup.',
    highlights: [
      'Step 1: Place half-cells together and insert salt bridge.',
      'Step 2: Connect zinc to negative COM terminal.',
      'Step 3: Connect copper to positive V terminal.',
      'Step 4: Record voltage (~1.10 V); lift salt bridge to prove current ceases.',
    ],
    relatedInventoryIds: ['beaker', 'voltmeter', 'connecting-wires', 'u-tube-cell'],
  },
  stage4: {
    subtitle: 'Recording cell voltage and verifying salt bridge necessity',
    summary:
      'Record stable cell potential, electron flow direction, electrode mass changes, and voltage drop upon salt bridge removal.',
    steps: [
      'Record cell potential: Voltmeter reads +1.10 V under standard conditions.',
      'Record circuit interruption: Removing salt bridge causes reading to drop immediately to 0.00 V.',
      'Record electrode changes: Over prolonged operation, zinc anode loses mass (Zn → Zn²⁺ + 2e⁻) while copper cathode gains mass with reddish copper plating (Cu²⁺ + 2e⁻ → Cu).',
      'Record solution color: Anode solution remains colorless; cathode solution blue color gradually fades as Cu²⁺ ions are consumed.',
    ],
    scientificExplanation:
      'Without a salt bridge, accumulation of positive Zn²⁺ ions around the anode and depletion of Cu²⁺ (leaving excess SO₄²⁻) around the cathode sets up opposing junction potentials that halt electron flow within microseconds.',
    highlights: [
      'Standard Cell EMF: E°_cell = +1.10 V.',
      'Anode Process: Zinc dissolves; mass decreases (Zn → Zn²⁺ + 2e⁻).',
      'Cathode Process: Copper deposits; mass increases (Cu²⁺ + 2e⁻ → Cu).',
      'Salt Bridge Role: Maintains electrical neutrality by ion migration.',
    ],
    relatedInventoryIds: ['voltmeter', 'zinc-plate-anode', 'copper-plate-cathode', 'u-tube-cell'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Galvanic Data',
  },
  stage5: {
    subtitle: 'Electrochemical cell equations, cell diagram notation, and EMF calculation',
    summary:
      'The Daniell cell converts spontaneous chemical redox energy into electrical energy, generating a standard potential of +1.10 V in accordance with the electrochemical series.',
    steps: [
      'Write anode oxidation half-reaction: Zn(s) → Zn²⁺(aq) + 2e⁻, E°_ox = +0.76 V.',
      'Write cathode reduction half-reaction: Cu²⁺(aq) + 2e⁻ → Cu(s), E°_red = +0.34 V.',
      'Write overall cell reaction: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s).',
      'Calculate standard EMF: E°_cell = E°_ox(anode) + E°_red(cathode) = 0.76 V + 0.34 V = +1.10 V.',
      'Write standard cell notation: Zn(s) | Zn²⁺(1M) || Cu²⁺(1M) | Cu(s).',
    ],
    scientificExplanation:
      'Zinc has a higher oxidation potential than copper in the electrochemical series. Spontaneous electron transfer is harnessed externally by physically separating the half-reactions and connecting them via a conductive wire and salt bridge.',
    highlights: [
      'Anode Reaction: Zn(s) → Zn²⁺(aq) + 2e⁻ (oxidation, negative pole).',
      'Cathode Reaction: Cu²⁺(aq) + 2e⁻ → Cu(s) (reduction, positive pole).',
      'Overall Cell Reaction: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), E°_cell = +1.10 V.',
      'Cell Notation: Zn(s) | Zn²⁺(1M) || Cu²⁺(1M) | Cu(s).',
    ],
    relatedInventoryIds: [
      'zinc-plate-anode',
      'copper-plate-cathode',
      'zinc-sulfate-solution-1m',
      'copper-sulfate-solution-1m',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Daniell Cell Proved',
  },
})

// -----------------------------------------------------------------------------
// 20. Electrolysis of Copper(II) Chloride Solution (Grade 3 Term 2)
// -----------------------------------------------------------------------------
export const electrolysisLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-electrolysis-020',
  experimentTitle: 'Electrolysis of Copper(II) Chloride Solution',
  reactionClassificationNote:
    'Non-spontaneous electrochemical decomposition: external electrical energy drives endothermic redox reactions: CuCl₂(aq) → Cu(s) + Cl₂(g)↑ (cathodic reduction of Cu²⁺ and anodic oxidation of Cl⁻), ΔG° > 0.',
  stage1: {
    subtitle: 'Electrolytic U-tube cell, DC power supply, carbon graphite electrodes, and wires',
    summary:
      'Set up a glass U-tube electrolytic cell, variable DC power supply (6–12 V), two inert graphite electrodes held in rubber bungs, connecting wires, and starch-iodide test paper.',
    steps: [
      'Secure the glass U-tube cell vertically in a clamp stand inside a fume hood.',
      'Insert graphite rods into rubber stoppers with central holes so electrode tips extend 4 cm into the cell arms.',
      'Connect alligator leads from the DC power supply to the electrodes (black to negative cathode, red to positive anode).',
    ],
    scientificExplanation:
      'Graphite is chemically inert and electrically conductive, allowing electron transfer without reacting with corrosive chlorine gas evolved at the anode.',
    highlights: [
      'Electrolytic Cell — U-tube separates cathodic and anodic products.',
      'DC Power Supply — Provides electrical energy to drive non-spontaneous reactions.',
      'Inert Graphite Electrodes — Resist chemical attack by chlorine gas.',
    ],
    relatedInventoryIds: ['electrolytic-cell', 'dc-power-supply', 'carbon-electrodes', 'connecting-wires'],
  },
  stage2: {
    subtitle: 'Aqueous copper(II) chloride electrolyte and moist starch-iodide paper',
    summary:
      'Use 0.5 M copper(II) chloride solution (blue-green aqueous electrolyte) and strips of moist starch-iodide paper for chlorine gas detection.',
    steps: [
      'Pour 0.5 M CuCl₂ solution into the U-tube until liquid level reaches 2 cm below the arm rims.',
      'Confirm that the solution is clear and blue-green.',
      'Moisten a strip of potassium iodide-starch paper with distilled water and hold near the anode bung.',
    ],
    scientificExplanation:
      'CuCl₂ dissociates completely into hydrated Cu²⁺ cations and Cl⁻ anions. Water molecules are also present (H⁺ and OH⁻ from H₂O autoionization), but Cu²⁺ and Cl⁻ discharge preferentially due to lower discharge potentials.',
    highlights: [
      'Electrolyte: 0.5 M CuCl₂ (blue-green, contains Cu²⁺ and Cl⁻ ions).',
      'Test Paper: Moist starch-iodide paper (detects chlorine by turning blue-black).',
      'Fume Hood Requirement: Mandatory due to hazardous chlorine gas evolution.',
    ],
    relatedInventoryIds: ['copper-ii-chloride-solution', 'starch-iodide-paper', 'distilled-water'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Electrolytic System',
  },
  stage3: {
    subtitle: 'Applying DC voltage, observing electrode reactions, and gas testing',
    summary:
      'Apply 6 V DC across electrodes; observe rapid gas bubbling at the positive anode and reddish-brown metal deposition at the negative cathode; test anode gas with starch-iodide paper.',
    steps: [
      'Switch on the DC power supply and adjust potential to 6.0 V.',
      'Observe the negative electrode (cathode): gas does not evolve; a reddish-brown coating forms on the graphite surface.',
      'Observe the positive electrode (anode): vigorous effervescence of tiny gas bubbles occurs; a choking bleach odor is detected.',
      'Hold moist starch-iodide paper above the anode outlet; observe the paper turn dark blue-black.',
      'After 5 minutes, turn off power supply, disconnect electrodes, and inspect the deposited copper layer.',
    ],
    scientificExplanation:
      'At the cathode, Cu²⁺ has a higher reduction potential (+0.34 V) than H⁺ (-0.83 V in neutral water), so copper deposits preferentially. At the anode, high chloride concentration results in Cl⁻ oxidation (+1.36 V) over water oxidation (+1.23 V with high overpotential).',
    highlights: [
      'Step 1: Apply 6 V DC across graphite electrodes.',
      'Step 2: Observe reddish-brown copper metal plating the cathode.',
      'Step 3: Observe chlorine gas bubbling vigorously at the anode.',
      'Step 4: Confirm chlorine using moist starch-iodide paper (turns blue-black).',
    ],
    relatedInventoryIds: ['electrolytic-cell', 'dc-power-supply', 'carbon-electrodes'],
  },
  stage4: {
    subtitle: 'Recording cathodic deposit, anodic gas characteristics, and electrolyte fading',
    summary:
      'Record physical evidence of non-spontaneous electrochemical decomposition and verify Faraday’s principles.',
    steps: [
      'Record Cathode (-): Graphite surface becomes heavily coated with salmon-pink / reddish-brown metallic copper metal: Cu²⁺ + 2e⁻ → Cu(s).',
      'Record Anode (+): Continuous evolution of greenish-yellow gas with pungent, suffocating odor; bleaches blue litmus and turns starch-iodide paper blue-black: 2Cl⁻ → Cl₂(g) + 2e⁻.',
      'Record Electrolyte: The intense blue-green color of the solution gradually fades as Cu²⁺ ions are removed from solution.',
    ],
    scientificExplanation:
      'Chlorine oxidizes iodide in the test paper: Cl₂ + 2I⁻ → 2Cl⁻ + I₂. Liberated elemental iodine complexes with amylose helical coils in starch to produce an intense blue-black starch-polyiodide complex.',
    highlights: [
      'Cathodic Product: Reddish-brown metallic copper (Cu↓).',
      'Anodic Product: Toxic, choking chlorine gas (Cl₂↑).',
      'Diagnostic Test: Starch-iodide paper turns blue-black (confirms Cl₂).',
      'Solution Color: Blue-green fades as Cu²⁺ concentration decreases.',
    ],
    relatedInventoryIds: ['electrolytic-cell', 'carbon-electrodes', 'starch-iodide-paper'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Electrolysis Data',
  },
  stage5: {
    subtitle: 'Electrochemical decomposition equations and energy transformation',
    summary:
      'Electrolysis converts electrical energy into chemical energy to decompose copper(II) chloride into elemental copper and chlorine gas, proving electrolytic cell principles.',
    steps: [
      'Write cathode reduction half-reaction: Cu²⁺(aq) + 2e⁻ → Cu(s) (reduction at negative pole).',
      'Write anode oxidation half-reaction: 2Cl⁻(aq) → Cl₂(g)↑ + 2e⁻ (oxidation at positive pole).',
      'Write overall decomposition equation: CuCl₂(aq) → Cu(s) + Cl₂(g)↑.',
      'Conclude that electrical energy forces electrons from anode to cathode against spontaneous potential.',
    ],
    scientificExplanation:
      'In electrolytic cells, the anode is positive (connected to the positive power supply terminal) where oxidation occurs, and the cathode is negative where reduction occurs. This is the opposite of galvanic cell polarity conventions.',
    highlights: [
      'Cathode Reaction: Cu²⁺(aq) + 2e⁻ → Cu(s) (negative electrode, reduction).',
      'Anode Reaction: 2Cl⁻(aq) → Cl₂(g)↑ + 2e⁻ (positive electrode, oxidation).',
      'Overall Equation: CuCl₂(aq) → Cu(s) + Cl₂(g)↑.',
      'Safety: Highly toxic chlorine gas; perform exclusively in an operating fume hood.',
    ],
    relatedInventoryIds: ['electrolytic-cell', 'copper-ii-chloride-solution', 'carbon-electrodes'],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Electrolysis Proved',
  },
})

// -----------------------------------------------------------------------------
// 21. Detection of Carbon and Hydrogen in Organic Matter (Grade 3 Term 2)
// -----------------------------------------------------------------------------
export const organicDetectionLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-organic-detection-021',
  experimentTitle: 'Detection of Carbon and Hydrogen in Organic Matter',
  reactionClassificationNote:
    'High-temperature redox oxidation: heating organic matter with black copper(II) oxide oxidizes carbon to carbon dioxide (detected via limewater turbidity) and hydrogen to water vapor (detected via anhydrous copper sulfate hydration).',
  stage1: {
    subtitle: 'Hard glass combustion tube, delivery tube with bulb, burner, and test tube',
    summary:
      'Assemble a borosilicate combustion tube clamped horizontally on a stand, Bunsen burner with fish-tail spreader, glass delivery tube featuring a central bulb, and a receiver test tube.',
    steps: [
      'Inspect the hard glass combustion tube for thermal durability and cleanliness.',
      'Check that the delivery tube bulb is dry to receive anhydrous copper(II) sulfate.',
      'Set up the receiver test tube containing clear limewater.',
    ],
    scientificExplanation:
      'The central bulb in the delivery tube allows water vapor to condense onto anhydrous copper sulfate before gas bubbles through the limewater, ensuring distinct, separate detection of hydrogen and carbon.',
    highlights: [
      'Combustion Tube — Borosilicate tube withstands direct Bunsen burner flame.',
      'Delivery Tube Bulb — Houses anhydrous CuSO₄ to intercept water vapor.',
      'Limewater Receiver — Captures carbon dioxide to form insoluble calcium carbonate.',
    ],
    relatedInventoryIds: ['hard-glass-tube', 'bunsen-burner', 'clamp-stand', 'gas-delivery-tube', 'test-tube'],
  },
  stage2: {
    subtitle: 'Organic matter sample, black copper(II) oxide, anhydrous CuSO₄, and limewater',
    summary:
      'Organic material (dry starch, leather, or candle wax), powdered black copper(II) oxide (CuO), white anhydrous copper(II) sulfate powder, and freshly prepared clear limewater (Ca(OH)₂).',
    steps: [
      'Grind 1.0 g of dry organic matter (e.g. starch or paraffin wax) with 3.0 g of black CuO in a dry mortar.',
      'Transfer the black mixture into the combustion tube.',
      'Place 0.5 g of white anhydrous CuSO₄ into the bulb of the delivery tube.',
      'Fill the receiver test tube with 10 mL of clear limewater.',
    ],
    scientificExplanation:
      'Copper(II) oxide acts as a solid oxidizing agent. At high temperatures, CuO donates lattice oxygen to carbon and hydrogen atoms in the organic compound, reducing black CuO to reddish copper metal.',
    highlights: [
      'Organic Sample: Contains carbon and hydrogen in covalent bonds.',
      'Oxidizing Agent: Black CuO powder (readily reduced to metallic Cu).',
      'Hydrogen Detector: White anhydrous CuSO₄ (turns blue when hydrated).',
      'Carbon Detector: Clear limewater (turns milky with CO₂).',
    ],
    relatedInventoryIds: [
      'organic-matter-sample',
      'copper-ii-oxide-black',
      'anhydrous-copper-sulfate-white',
      'clear-limewater',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Organic Analysis',
  },
  stage3: {
    subtitle: 'Strong heating, water condensation, and gas delivery through limewater',
    summary:
      'Heat the combustion tube strongly with a Bunsen burner; observe condensation and color change in the bulb; observe gas bubbling through limewater.',
    steps: [
      'Heat the mixture in the combustion tube strongly and continuously, moving the burner flame back and forth.',
      'Observe moisture droplets condensing in the delivery tube and encountering the white CuSO₄.',
      'Observe gas bubbling through the clear limewater in the receiver tube.',
      'Continue heating until white CuSO₄ turns bright blue and limewater turns turbid.',
      'Remove delivery tube from limewater before removing burner to prevent suck-back.',
    ],
    scientificExplanation:
      'Removing the delivery tube from limewater before extinguishing the burner prevents cool atmospheric pressure from drawing cold limewater back into the hot combustion tube, which would shatter the glass.',
    highlights: [
      'Step 1: Heat organic matter + CuO mixture strongly.',
      'Step 2: Observe water vapor condensing onto anhydrous CuSO₄.',
      'Step 3: Observe evolved gas bubbling through clear limewater.',
      'Step 4: Disconnect delivery tube before extinguishing flame (prevents suck-back).',
    ],
    relatedInventoryIds: ['hard-glass-tube', 'bunsen-burner', 'gas-delivery-tube', 'test-tube'],
  },
  stage4: {
    subtitle: 'Recording copper sulfate hydration and limewater turbidity',
    summary:
      'Record diagnostic color transformations confirming the presence of hydrogen and carbon in the organic compound.',
    steps: [
      'Record Hydrogen Detection: White anhydrous CuSO₄ powder turns bright royal blue in the delivery bulb, confirming water vapor (H₂O) formation.',
      'Record Carbon Detection: Clear limewater turns milky/turbid, confirming carbon dioxide (CO₂) gas evolution.',
      'Record CuO Reduction: Black CuO in the combustion tube turns reddish-brown from deposited metallic copper (Cu).',
    ],
    scientificExplanation:
      'White anhydrous CuSO₄ absorbs 5 molecules of water to form blue copper(II) sulfate pentahydrate: CuSO₄ + 5H₂O → CuSO₄·5H₂O. CO₂ precipitates insoluble calcium carbonate: CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.',
    highlights: [
      'Hydrogen Confirmed: White anhydrous CuSO₄ → Bright blue hydrated CuSO₄·5H₂O.',
      'Carbon Confirmed: Clear limewater → Milky turbid suspension of CaCO₃.',
      'Oxidant Reduced: Black CuO → Reddish metallic copper.',
    ],
    relatedInventoryIds: [
      'anhydrous-copper-sulfate-white',
      'clear-limewater',
      'copper-ii-oxide-black',
    ],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Detection Results',
  },
  stage5: {
    subtitle: 'Redox combustion equations and fundamental organic chemistry conclusion',
    summary:
      'Oxidation with copper(II) oxide conclusively confirms that organic compounds contain carbon and hydrogen as their fundamental structural elements.',
    steps: [
      'Write carbon oxidation reaction: C(organic) + 2CuO(s) → 2Cu(s) + CO₂(g)↑.',
      'Write limewater confirmation: CO₂(g) + Ca(OH)₂(aq) → CaCO₃(s)↓ + H₂O(l).',
      'Write hydrogen oxidation reaction: 2H(organic) + CuO(s) → Cu(s) + H₂O(g)↑.',
      'Write copper sulfate hydration: CuSO₄(s, white) + 5H₂O(g) → CuSO₄·5H₂O(s, blue).',
    ],
    scientificExplanation:
      'Organic compounds are hydrocarbons or hydrocarbon derivatives. High-temperature thermal cracking in the presence of an oxygen donor forces all covalent carbon into CO₂ and all covalent hydrogen into H₂O.',
    highlights: [
      'Carbon Equations: C + 2CuO → 2Cu + CO₂↑; CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.',
      'Hydrogen Equations: 2H + CuO → Cu + H₂O↑; CuSO₄ + 5H₂O → CuSO₄·5H₂O.',
      'Scientific Conclusion: Carbon and hydrogen are essential constituent elements of all organic matter.',
      'Safety: Hot glassware hazard; prevent liquid suck-back by removing tube before turning off flame.',
    ],
    relatedInventoryIds: [
      'organic-matter-sample',
      'copper-ii-oxide-black',
      'anhydrous-copper-sulfate-white',
      'clear-limewater',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Organic Proof Established',
  },
})

// -----------------------------------------------------------------------------
// 22. Preparation of Ethene and Baeyer Test (Grade 3 Term 2)
// -----------------------------------------------------------------------------
export const ethylenePrepLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-ethylene-prep-022',
  experimentTitle: 'Preparation of Ethene and Baeyer Test',
  reactionClassificationNote:
    'Catalytic dehydration of alcohol to alkene and unsaturation addition tests: concentrated sulfuric acid dehydrates ethanol at 180°C to ethene: C₂H₅OH → C₂H₄ + H₂O. Ethene decolorizes bromine water and alkaline KMnO₄ (Baeyer’s test: CH₂=CH₂ + H₂O + [O] → CH₂OH-CH₂OH).',
  stage1: {
    subtitle: 'Distillation flask, thermometer (200°C), delivery tubes, wash bottle, and trough',
    summary:
      'Assemble a 250 mL round-bottom flask clamped to a stand, thermometer dipping into liquid, Bunsen burner, wash bottle containing NaOH solution, and pneumatic trough for gas collection over water.',
    steps: [
      'Position thermometer so its bulb is completely immersed in the liquid mixture inside the flask.',
      'Connect delivery tube from the flask to an intermediate wash bottle filled with 20% NaOH solution.',
      'Set up pneumatic water trough with inverted gas jars filled with water.',
    ],
    scientificExplanation:
      'The intermediate wash bottle containing sodium hydroxide removes sulfur dioxide (SO₂) and carbon dioxide (CO₂) acid impurities produced by side reactions, ensuring pure ethene enters the collection jars.',
    highlights: [
      'Round-bottom Flask — Accommodates boiling chips and concentrated acid heating.',
      'Thermometer (200°C) — Critical for maintaining temperature at exactly 180°C.',
      'NaOH Wash Bottle — Absorbs acidic SO₂ and CO₂ gas impurities.',
      'Pneumatic Trough — Collects ethene over water (ethene is virtually insoluble in water).',
    ],
    relatedInventoryIds: [
      'round-bottom-flask',
      'bunsen-burner',
      'thermometer',
      'gas-delivery-tube',
      'gas-jar',
      'trough',
      'wash-bottle',
    ],
  },
  stage2: {
    subtitle: 'Ethanol, concentrated sulfuric acid, NaOH wash solution, Baeyer reagent, bromine water',
    summary:
      'Absolute ethanol (C₂H₅OH), concentrated sulfuric acid (H₂SO₄, 98%), 20% NaOH solution, alkaline potassium permanganate (Baeyer’s reagent), and bromine dissolved in carbon tetrachloride or water.',
    steps: [
      'Carefully add 30 mL of concentrated H₂SO₄ to 10 mL of absolute ethanol with continuous cooling and swirling (1:3 volume ratio).',
      'Add 2–3 broken porcelain boiling chips to promote smooth, non-bumping boiling.',
      'Prepare test tubes containing alkaline KMnO₄ solution and bromine water.',
    ],
    scientificExplanation:
      'Dehydration proceeds in two temperature-dependent steps: at 80°C, ethyl hydrogen sulfate forms (C₂H₅OH + H₂SO₄ → C₂H₅OSO₃H + H₂O); at 180°C, ethyl hydrogen sulfate undergoes thermal elimination to ethene (C₂H₅OSO₃H → C₂H₄ + H₂SO₄).',
    highlights: [
      'Reactants: Ethanol + excess concentrated H₂SO₄ (1:3 ratio).',
      'Temperature Target: Exactly 180°C for elimination to ethene.',
      'Reagents: Alkaline KMnO₄ (Baeyer test) and red-brown bromine water.',
    ],
    relatedInventoryIds: [
      'absolute-ethanol',
      'concentrated-sulfuric-acid',
      'sodium-hydroxide-solution',
      'alkaline-potassium-permanganate',
      'bromine-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Alkene Synthesis System',
  },
  stage3: {
    subtitle: 'Controlled heating to 180°C, gas collection, and unsaturation tests',
    summary:
      'Heat the acid mixture to 180°C; pass evolved gas through NaOH; collect gas jars of ethene; bubble ethene through alkaline KMnO₄ and bromine water.',
    steps: [
      'Heat the flask steadily until the thermometer reaches 180°C; observe continuous gas evolution.',
      'Discard the first jar of gas (air displaced from apparatus).',
      'Collect two gas jars of pure ethene gas by downward displacement of water in the trough.',
      'Bubble ethene gas into a test tube containing 5 mL of purple alkaline KMnO₄; observe color change.',
      'Bubble ethene gas into a test tube containing 5 mL of red-brown bromine water; observe color change.',
    ],
    scientificExplanation:
      'Ethene possesses a planar carbon-carbon double bond consisting of one strong sigma (σ) bond and one exposed, high-electron-density pi (π) bond. Electrophiles (Br⁺, KMnO₄) readily attack and break the weak pi bond via addition reactions.',
    highlights: [
      'Step 1: Heat acid-alcohol mixture steadily to 180°C.',
      'Step 2: Wash gas through NaOH and collect over water.',
      'Step 3: Bubble ethene into purple alkaline KMnO₄ (Baeyer test).',
      'Step 4: Bubble ethene into red-brown bromine water.',
    ],
    relatedInventoryIds: ['round-bottom-flask', 'bunsen-burner', 'thermometer', 'trough'],
  },
  stage4: {
    subtitle: 'Recording decolorization of purple permanganate and red bromine water',
    summary:
      'Record rapid discharge of purple KMnO₄ with brown MnO₂ precipitate, and complete decolorization of red-brown bromine water.',
    steps: [
      'Record Baeyer Test: Purple alkaline KMnO₄ is rapidly discharged to colorless, with formation of a dark brown precipitate of manganese dioxide (MnO₂).',
      'Record Bromine Water Test: Reddish-brown bromine water turns completely clear and colorless without requiring light.',
      'Combustion Test: A jar of ethene burns with a luminous, slightly smoky flame in air, producing CO₂ and H₂O.',
    ],
    scientificExplanation:
      'Bromine undergoes electrophilic addition across the double bond to form colorless 1,2-dibromoethane: CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br. Alkaline KMnO₄ oxidizes the alkene to ethylene glycol (1,2-ethanediol) while manganese is reduced from Mn(+7, purple) to Mn(+4, brown MnO₂).',
    highlights: [
      'Baeyer Result: Purple color disappears; dark brown MnO₂ precipitate forms.',
      'Bromine Result: Red-brown bromine color disappears completely (addition product formed).',
      'Diagnostic Sign: Rapid addition without light confirms unsaturated double bond (C=C).',
    ],
    relatedInventoryIds: [
      'alkaline-potassium-permanganate',
      'bromine-water',
      'gas-jar',
    ],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Unsaturation Data',
  },
  stage5: {
    subtitle: 'Elimination and addition mechanisms, balanced equations, and conclusions',
    summary:
      'Catalytic dehydration of ethanol at 180°C produces ethene. Decolorization of bromine water and alkaline KMnO₄ conclusively proves the presence of an aliphatic carbon-carbon double bond.',
    steps: [
      'Write overall dehydration: C₂H₅OH → C₂H₄↑ + H₂O (conc. H₂SO₄ at 180°C).',
      'Write step 1 (ester formation at 80°C): C₂H₅OH + H₂SO₄ → C₂H₅OSO₃H + H₂O.',
      'Write step 2 (thermal elimination at 180°C): C₂H₅OSO₃H → C₂H₄↑ + H₂SO₄.',
      'Write bromine addition: CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br (1,2-dibromoethane).',
      'Write Baeyer oxidation: CH₂=CH₂ + H₂O + [O] → CH₂OH-CH₂OH (ethylene glycol / 1,2-ethanediol).',
    ],
    scientificExplanation:
      'Concentrated H₂SO₄ is a powerful dehydrating agent that extracts water molecules. The Baeyer test is an oxidative addition reaction diagnostic for alkenes and alkynes, distinguishing them from unreactive saturated alkanes.',
    highlights: [
      'Dehydration Equation: C₂H₅OH → C₂H₄ + H₂O (conc. H₂SO₄, 180°C).',
      'Bromine Addition: CH₂=CH₂ + Br₂ → CH₂Br-CH₂Br (colorless).',
      'Baeyer Equation: CH₂=CH₂ + H₂O + [O] → CH₂OH-CH₂OH (ethylene glycol).',
      'Safety: Hot concentrated H₂SO₄ is corrosive; ethene is flammable; work strictly in a fume hood.',
    ],
    relatedInventoryIds: [
      'absolute-ethanol',
      'concentrated-sulfuric-acid',
      'alkaline-potassium-permanganate',
      'bromine-water',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Alkene Synthesis Proved',
  },
})

// -----------------------------------------------------------------------------
// 23. Synthesis of Ethyl Acetate Ester (Grade 3 Term 2)
// -----------------------------------------------------------------------------
export const esterificationLearningStages = createSyllabusLearningStages({
  experimentId: 'exp-esterification-023',
  experimentTitle: 'Synthesis of Ethyl Acetate Ester',
  reactionClassificationNote:
    'Fischer esterification equilibrium: acid-catalyzed reversible condensation between a carboxylic acid and an alcohol forming an ester and water: CH₃COOH(l) + C₂H₅OH(l) ⇌ CH₃COOC₂H₅(l) + H₂O(l) (catalyzed by conc. H₂SO₄).',
  stage1: {
    subtitle: 'Reaction test tubes, rack, water bath, 250 mL beaker, and droppers',
    summary:
      'Set up clean, dry borosilicate test tubes in a rack, thermostatically controlled water bath (60–70°C), 250 mL quench beaker, and precision droppers.',
    steps: [
      'Check that reaction test tubes are completely dry, as water shifts esterification equilibrium backward.',
      'Heat the water bath until it reaches a stable 60–70°C.',
      'Prepare a 250 mL beaker containing 50 mL of dilute sodium carbonate solution.',
    ],
    scientificExplanation:
      'Direct open burner heating must never be used with volatile, highly flammable ethanol and esters. An indirect water bath ensures uniform temperature control below the boiling point of ethanol (78°C).',
    highlights: [
      'Dry Test Tubes — Moisture-free glassware prevents reverse ester hydrolysis.',
      'Water Bath (60–70°C) — Provides safe, flame-free thermal activation.',
      'Sodium Carbonate Beaker — Neutralizes unreacted acids and separates volatile ester aroma.',
    ],
    relatedInventoryIds: ['test-tube', 'test-tube-rack', 'water-bath', 'beaker', 'dropper'],
  },
  stage2: {
    subtitle: 'Glacial acetic acid, absolute ethanol, conc. sulfuric acid, and sodium carbonate',
    summary:
      'Glacial acetic acid (CH₃COOH, 100%), absolute ethanol (C₂H₅OH, 99.8%), concentrated sulfuric acid catalyst (H₂SO₄, 98%), and 1.0 M sodium carbonate solution (Na₂CO₃).',
    steps: [
      'Measure 2.0 mL of glacial acetic acid into a dry test tube.',
      'Add 2.0 mL of absolute ethanol.',
      'Carefully add 3 drops of concentrated sulfuric acid down the inner wall of the test tube.',
      'Swirl gently to mix the homogeneous liquid layers.',
    ],
    scientificExplanation:
      'Concentrated H₂SO₄ serves two vital functions: as a Brønsted acid catalyst that protonates the carbonyl oxygen (accelerating nucleophilic attack by ethanol), and as a dehydrating agent that absorbs water, shifting equilibrium forward.',
    highlights: [
      'Carboxylic Acid: 2.0 mL glacial acetic acid (sharp vinegar odor).',
      'Alcohol: 2.0 mL absolute ethanol (sweet alcoholic odor).',
      'Catalyst: 3 drops conc. H₂SO₄ (acid catalyst and dehydrating agent).',
      'Quench Base: Dilute Na₂CO₃ solution (neutralizes excess acids).',
    ],
    relatedInventoryIds: [
      'glacial-acetic-acid',
      'absolute-ethanol',
      'concentrated-sulfuric-acid',
      'sodium-carbonate-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Esterification Reagents',
  },
  stage3: {
    subtitle: 'Water bath warming, acid neutralization, and aroma wafting technique',
    summary:
      'Warm the tube in a water bath at 60–70°C for 10 minutes; pour contents into sodium carbonate solution; use hand-wafting technique to detect the fruity ester odor.',
    steps: [
      'Immerse the reaction tube in the 60–70°C water bath for 10 minutes.',
      'Observe gentle refluxing on the upper walls of the tube.',
      'Remove the tube and allow to cool slightly.',
      'Pour the reaction mixture slowly into the beaker containing 50 mL of sodium carbonate solution.',
      'Observe brisk effervescence as excess unreacted acetic and sulfuric acids are neutralized.',
      'Hold the beaker 20 cm from your nose and gently waft vapors toward your face using your cupped hand.',
    ],
    scientificExplanation:
      'Sodium carbonate reacts with excess acetic and sulfuric acids to form soluble sodium salts and CO₂ gas: 2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂↑. This removes pungent acid odors, leaving pure volatile ethyl acetate.',
    highlights: [
      'Step 1: Heat reactants in water bath at 60–70°C for 10 minutes.',
      'Step 2: Pour into sodium carbonate solution to quench excess acid.',
      'Step 3: Observe effervescence and separation of an oily surface layer.',
      'Step 4: Use safe wafting gesture to detect characteristic sweet, fruity aroma.',
    ],
    relatedInventoryIds: ['test-tube', 'water-bath', 'beaker', 'dropper'],
  },
  stage4: {
    subtitle: 'Recording phase separation, effervescence, and fruity aroma profile',
    summary:
      'Record brisk carbon dioxide effervescence upon quenching, separation of an immiscible ester surface layer, and distinct sweet fruity fragrance.',
    steps: [
      'Record Neutralization Effervescence: Immediate bubbling of CO₂ confirms presence of excess acid neutralized by Na₂CO₃.',
      'Record Phase Separation: An oily, clear layer of ethyl acetate floats on top of the denser aqueous salt solution (density ~0.90 g/cm³).',
      'Record Olfactory Detection: Wafting reveals a pleasant, sweet, pear/apple-like fruity aroma distinctly different from pungent starting materials.',
    ],
    scientificExplanation:
      'Ethyl acetate has limited water solubility (~8 g/100 mL) and lower density than water (0.90 g/cm³), causing it to separate as a distinct upper organic layer that volatilizes readily to produce the characteristic aroma.',
    highlights: [
      'Immiscible Layer: Clear ester floats on top of aqueous solution.',
      'Aroma Profile: Sweet, pleasant fruity fragrance (pear drops / apples).',
      'Odor Transformation: Sharp vinegar + alcohol odors → Fragrant fruit ester.',
    ],
    relatedInventoryIds: ['test-tube', 'beaker', 'sodium-carbonate-solution'],
    processClassification: 'measurement-technique',
    processBadgeLabel: 'Esterification Results',
  },
  stage5: {
    subtitle: 'Esterification equilibrium equation, Le Chatelier optimization, and conclusions',
    summary:
      'Fischer esterification produces ethyl acetate ester and water in a reversible equilibrium. Concentrated sulfuric acid drives equilibrium forward, confirming organic condensation principles.',
    steps: [
      'Write the reversible esterification equation: CH₃COOH(l) + C₂H₅OH(l) ⇌ CH₃COOC₂H₅(l) + H₂O(l) (over conc. H₂SO₄, Δ).',
      'Identify functional groups: Carboxylic acid group (-COOH) + alcohol hydroxyl group (-OH) → Ester link (-COO-) + water.',
      'Explain Le Chatelier shift: Concentrated H₂SO₄ absorbs byproduct water, shifting equilibrium forward to maximize ester yield.',
      'Explain mechanism: The OH group is removed from the carboxylic acid and H is removed from the alcohol to form water (confirmed by oxygen-18 isotope tracing).',
    ],
    scientificExplanation:
      'Isotopic labeling with ¹⁸O proves that the ester alkoxy oxygen originates from the alcohol (C₂H₅¹⁸OH), confirming nucleophilic acyl substitution: the carboxylic acid loses -OH and the alcohol loses -H.',
    highlights: [
      'Esterification Equation: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O.',
      'Role of H₂SO₄: Catalyst (speeds reaction) and dehydrating agent (drives equilibrium).',
      'Safety: Never smell chemicals directly from container mouths; always waft vapors gently.',
    ],
    relatedInventoryIds: [
      'glacial-acetic-acid',
      'absolute-ethanol',
      'concentrated-sulfuric-acid',
      'sodium-carbonate-solution',
    ],
    processClassification: 'chemical-reaction',
    processBadgeLabel: 'Esterification Proved',
  },
})

// Complete list of all 22 syllabus learning stages
export const allSyllabusLearningStages: readonly ExperimentLearningStagesData[] = [
  liquidVolumeLearningStages,
  phIndicatorsLearningStages,
  colloidsLearningStages,
  titrationLearningStages,
  heatDissolutionLearningStages,
  heatNeutralizationLearningStages,
  flameTestsLearningStages,
  oxidesLearningStages,
  halogenDisplacementLearningStages,
  conductivityLearningStages,
  sodiumWaterLearningStages,
  ammoniaPrepLearningStages,
  catalysisLearningStages,
  anionsLearningStages,
  cationsLearningStages,
  volumetricTitrationLearningStages,
  equilibriumLearningStages,
  daniellCellLearningStages,
  electrolysisLearningStages,
  organicDetectionLearningStages,
  ethylenePrepLearningStages,
  esterificationLearningStages,
]
