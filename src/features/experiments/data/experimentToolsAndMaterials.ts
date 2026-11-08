import type { ExperimentToolsAndMaterialsData } from '../types/toolsAndMaterials'

/**
 * 1. Dissolving Salt in Water (Grade 1 Term 1)
 */
export const saltDissolutionToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-salt-water-001',
  reviewStatus: 'draft',
  measurementDisclaimer:
    'Quantities reflect educational simulation targets, not certified analytical measurements.',
  tools: [
    {
      id: 'beaker',
      name: 'Beaker',
      visual: 'beaker',
      shortExplanation: 'A flat-bottomed cylindrical glass container with a pouring spout.',
      purpose: 'Holds the water solvent and provides space for adding and stirring the solid salt.',
      specification: '250 mL Borosilicate Glass',
      safetyNote:
        'Inspect for chips or cracks before use. Support by the body and base when handling.',
    },
    {
      id: 'graduated-cylinder',
      name: 'Graduated Cylinder',
      visual: 'graduated-cylinder',
      shortExplanation: 'A tall, narrow glass cylinder marked with calibrated measurement lines.',
      purpose: 'Measures exactly 100 mL of water before transferring it into the reaction beaker.',
      specification: '100 mL Calibrated Glass',
      safetyNote:
        'Always read the bottom of the curved meniscus at eye level on a flat, level surface.',
    },
    {
      id: 'stirring-rod',
      name: 'Glass Stirring Rod',
      visual: 'stirring-rod',
      shortExplanation: 'A solid glass rod with smooth, rounded, fire-polished ends.',
      purpose: 'Helps mix liquids and speeds up the dissolution of solid salt crystals in water.',
      specification: 'Solid Borosilicate Glass',
      safetyNote:
        'Stir gently in circular motions without striking the glass bottom or sides of the beaker.',
    },
    {
      id: 'digital-balance',
      name: 'Digital Balance',
      visual: 'digital-balance',
      shortExplanation: 'An electronic weighing device that displays mass on a digital readout.',
      purpose:
        'Measures the net mass of sodium chloride placed in the tared weighing boat (5.00 g).',
      specification: 'Two-decimal electronic balance (0.01 g precision)',
      safetyNote:
        'Tare the balance with the empty weighing boat before adding crystals; keep the pan dry.',
    },
    {
      id: 'spatula',
      name: 'Laboratory Spatula',
      visual: 'spatula',
      shortExplanation: 'A handheld stainless-steel tool with a flat blade and a shallow scoop.',
      purpose:
        'Transfers small portions of solid sodium chloride cleanly from the reagent bottle into the weighing boat.',
      specification: 'Stainless Steel Scoop Spatula',
      safetyNote:
        'Use only clean, dry spatulas. Never return excess chemical powder to the stock jar.',
    },
    {
      id: 'weighing-boat',
      name: 'Weighing Boat',
      visual: 'weighing-boat',
      shortExplanation: 'A shallow, flexible dish used to hold solid chemical samples on a balance.',
      purpose:
        'Contains the scooped salt crystals during weighing and flexes easily to pour them into the beaker.',
      specification: 'Polystyrene shallow weighing dish',
      safetyNote:
        'Ensure the dish is completely dry before adding powders to avoid sticking or chemical clumps.',
    },
  ],
  materials: [
    {
      id: 'water',
      name: 'Water',
      formula: 'H₂O',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid at room temperature',
      role: 'Solvent',
      purpose: 'Acts as the solvent that disperses and dissolves sodium and chloride ions.',
      stockQuantity: {
        amount: 400,
        unit: 'mL',
        label: 'Stock Supply',
        description: '400 mL supply container on the laboratory bench',
      },
      requiredQuantity: {
        amount: 100,
        unit: 'mL',
        label: 'Experiment Target',
        description: '100 mL measured in the graduated cylinder',
      },
      safetyNotes: [
        'Never drink or taste water from a laboratory container.',
        'Wipe up any water spills immediately to prevent slipping.',
      ],
      isModelEstimated: true,
    },
    {
      id: 'sodium-chloride',
      name: 'Sodium Chloride',
      formula: 'NaCl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline solid (table salt crystals)',
      role: 'Solute',
      purpose:
        'Acts as the solid ionic solute that dissolves into separate sodium (Na⁺) and chloride (Cl⁻) ions.',
      stockQuantity: {
        amount: 100,
        unit: 'g',
        label: 'Stock Supply',
        description: '100 g solid reagent container on the laboratory bench',
      },
      requiredQuantity: {
        amount: 5,
        unit: 'g',
        label: 'Experiment Target',
        description: '5 g weighed on the digital balance',
      },
      safetyNotes: [
        'Do not taste or ingest laboratory-grade chemical reagents.',
        'Keep the container tightly capped when not in use to avoid moisture absorption.',
      ],
      isModelEstimated: true,
    },
  ],
}

/**
 * 2. Measuring Liquid Volume (Grade 1 Term 1)
 */
export const liquidVolumeToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-volume-002',
  reviewStatus: 'draft',
  measurementDisclaimer: 'Volumetric tolerances follow standard Class B educational laboratory glassware.',
  tools: [
    {
      id: 'graduated-cylinder',
      name: 'Graduated Cylinder',
      visual: 'graduated-cylinder',
      shortExplanation: 'Calibrated vertical glass tube with circular scale markings.',
      purpose: 'Measures variable volumes of liquid with precision to 0.5 mL.',
      specification: '100 mL Class B Glass Cylinder',
      safetyNote: 'Keep the rubber bumper ring positioned near the neck to cushion against tipping.',
    },
    {
      id: 'beaker',
      name: 'Beaker',
      visual: 'beaker',
      shortExplanation: 'Wide cylindrical container with graduation marks for rough estimation.',
      purpose: 'Holds stock liquid and demonstrates differences in measurement accuracy.',
      specification: '250 mL Borosilicate Glass',
      safetyNote: 'Beaker volume lines are approximate (±5%); never use for analytical measurements.',
    },
    {
      id: 'pipette',
      name: 'Volumetric Pipette',
      visual: 'graduated-cylinder',
      shortExplanation: 'Narrow glass tube calibrated to deliver a fixed volume.',
      purpose: 'Transfers exact 25.0 mL liquid aliquots with high precision.',
      specification: '25 mL One-Mark Volumetric Pipette',
      safetyNote: 'Always use a rubber pipette filler bulb; never pipette by mouth.',
    },
  ],
  materials: [
    {
      id: 'distilled-water',
      name: 'Distilled Water',
      formula: 'H₂O',
      visual: 'water',
      physicalAppearance: 'Clear, colorless, demineralized liquid',
      role: 'Solvent',
      purpose: 'Provides a clean liquid medium with standard surface tension for meniscus reading.',
      stockQuantity: { amount: 500, unit: 'mL', label: 'Stock Wash Bottle' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Measurement Target' },
      safetyNotes: ['Wipe spills promptly to maintain dry bench surfaces.'],
    },
  ],
}

/**
 * 3. Exploring pH Indicators (Grade 1 Term 1)
 */
export const phIndicatorsToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-ph-003',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'test-tube',
      name: 'Test Tube',
      visual: 'graduated-cylinder',
      shortExplanation: 'Cylindrical glass vessel for mixing and observing small reaction volumes.',
      purpose: 'Holds sample solutions for adding indicator drops and observing color transitions.',
      specification: '16 × 150 mm Borosilicate Glass',
      safetyNote: 'Never point the open mouth of a test tube toward yourself or others.',
    },
    {
      id: 'test-tube-rack',
      name: 'Test Tube Rack',
      visual: 'beaker',
      shortExplanation: 'Molded support rack for holding multiple test tubes upright.',
      purpose: 'Organizes acid, base, and neutral test tubes side by side for direct comparison.',
      specification: '6-place Polypropylene Rack',
    },
    {
      id: 'dropper',
      name: 'Medicine Dropper',
      visual: 'graduated-cylinder',
      shortExplanation: 'Glass pipette with rubber squeeze bulb for delivering liquid drops.',
      purpose: 'Adds controlled drops of indicator solution to test samples.',
      specification: 'Glass Dropper with Latex Bulb',
    },
  ],
  materials: [
    {
      id: 'dilute-hcl',
      name: 'Dilute Hydrochloric Acid',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid with faint acidic odor',
      role: 'Reagent',
      purpose: 'Serves as the standard acidic test solution (pH ≈ 1.0).',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Reagent Bottle' },
      requiredQuantity: { amount: 10, unit: 'mL', label: 'Test Aliquot' },
      safetyNotes: ['Avoid contact with skin and eyes; rinse immediately with water if exposed.'],
    },
    {
      id: 'dilute-naoh',
      name: 'Dilute Sodium Hydroxide',
      formula: 'NaOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid with slippery feel',
      role: 'Reagent',
      purpose: 'Serves as the standard basic test solution (pH ≈ 13.0).',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Reagent Bottle' },
      requiredQuantity: { amount: 10, unit: 'mL', label: 'Test Aliquot' },
      safetyNotes: ['Corrosive to eyes and skin; wear chemical splash goggles.'],
    },
    {
      id: 'litmus-solution',
      name: 'Litmus Indicator Solution',
      formula: 'C₇H₇O₄N',
      visual: 'water',
      physicalAppearance: 'Violet-purple aqueous dye solution',
      role: 'Indicator',
      purpose: 'Turns red in acid and blue in alkali to distinguish pH groups.',
      stockQuantity: { amount: 50, unit: 'mL', label: 'Dropper Bottle' },
      requiredQuantity: { amount: 2, unit: 'mL', label: 'Testing Dose' },
      safetyNotes: ['Organic dye; may stain skin and laboratory clothing.'],
    },
  ],
}

/**
 * 4. Distinguishing Solutions and Colloids (Grade 1 Term 1)
 */
export const colloidsToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-colloids-004',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'beaker',
      name: 'Beakers (Set of 2)',
      visual: 'beaker',
      shortExplanation: 'Clear glass beakers for optical transmission observation.',
      purpose: 'Hold the true solution and colloidal dispersion side by side.',
      specification: '150 mL Borosilicate Glass',
      safetyNote: 'Ensure the outer glass walls are wiped completely clean and dry before shining light.',
    },
    {
      id: 'stirring-rod',
      name: 'Glass Stirring Rod',
      visual: 'stirring-rod',
      shortExplanation: 'Solid glass rod for dispersing colloidal matter.',
      purpose: 'Mixes starch powder in warm water to form a uniform colloidal dispersion.',
      specification: '200 mm Glass Rod',
    },
  ],
  materials: [
    {
      id: 'nacl-solution',
      name: 'Sodium Chloride Solution',
      formula: 'NaCl (aq)',
      visual: 'water',
      physicalAppearance: 'Clear, transparent, homogeneous liquid',
      role: 'Solute',
      purpose: 'Represents a true aqueous solution where particle size is below 1 nm.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Prepared Solution' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Observation Cell' },
      safetyNotes: ['Non-hazardous salt solution.'],
    },
    {
      id: 'starch-dispersion',
      name: 'Soluble Starch Dispersion',
      formula: '(C₆H₁₀O₅)n',
      visual: 'water',
      physicalAppearance: 'Translucent, slightly opalescent colloidal liquid',
      role: 'Solute',
      purpose: 'Represents a colloidal system with dispersed particle sizes between 1 and 1000 nm.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Stock Dispersion' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Observation Cell' },
      safetyNotes: ['Non-toxic organic polysaccharide.'],
    },
  ],
}

/**
 * 5. Acid-Base Neutralization Titration (Grade 1 Term 1)
 */
export const titrationToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-titration-005',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'burette',
      name: 'Burette with Stopcock',
      visual: 'graduated-cylinder',
      shortExplanation: 'Precision volumetric glass tube with a PTFE stopcock tap.',
      purpose: 'Delivers standardized hydrochloric acid dropwise into the reaction flask.',
      specification: '50 mL Class A Burette (0.1 mL graduations)',
      safetyNote: 'Ensure the stopcock is firmly seated; check that the tip is full of liquid before starting.',
    },
    {
      id: 'erlenmeyer-flask',
      name: 'Conical (Erlenmeyer) Flask',
      visual: 'beaker',
      shortExplanation: 'Cone-shaped flask with narrow neck designed for swirl mixing without splashing.',
      purpose: 'Contains the measured sodium hydroxide aliquot and indicator during titration.',
      specification: '250 mL Borosilicate Glass',
    },
    {
      id: 'pipette',
      name: 'Volumetric Transfer Pipette',
      visual: 'graduated-cylinder',
      shortExplanation: 'Calibrated glass pipette for delivering a single fixed volume.',
      purpose: 'Measures exactly 10.0 mL of standard sodium hydroxide into the conical flask.',
      specification: '10 mL Class A Pipette',
      safetyNote: 'Use a rubber pipette safety bulb; never draw liquid by mouth.',
    },
  ],
  materials: [
    {
      id: 'std-hcl',
      name: 'Hydrochloric Acid Solution',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Clear, colorless standardized aqueous solution (0.100 M)',
      role: 'Reagent',
      purpose: 'Titrant used to neutralize the alkali solution stoichiometrically.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Titrant Supply' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Burette Fill' },
      safetyNotes: ['Skin and eye irritant. Wear safety goggles and gloves.'],
    },
    {
      id: 'std-naoh',
      name: 'Sodium Hydroxide Solution',
      formula: 'NaOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless standardized alkaline solution (0.100 M)',
      role: 'Reagent',
      purpose: 'Analyte neutralized by the acid titrant in the flask.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Analyte Supply' },
      requiredQuantity: { amount: 10, unit: 'mL', label: 'Sample Pipetted' },
      safetyNotes: ['Corrosive to skin and eyes. Flush immediately with water upon contact.'],
    },
    {
      id: 'phenolphthalein',
      name: 'Phenolphthalein Indicator',
      formula: 'C₂₀H₁₄O₄',
      visual: 'water',
      physicalAppearance: 'Colorless ethanolic indicator solution',
      role: 'Indicator',
      purpose: 'Signals the neutralization endpoint by turning from bright pink to colorless.',
      stockQuantity: { amount: 25, unit: 'mL', label: 'Dropper Bottle' },
      requiredQuantity: { amount: 3, unit: 'drops', label: 'Indicator Dose' },
      safetyNotes: ['Contains ethanol; keep away from open flames.'],
    },
  ],
}

/**
 * 6. Heat of Solution Determination (Grade 1 Term 2)
 */
export const heatDissolutionToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-heat-dissolution-006',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'calorimeter',
      name: 'Coffee-Cup Calorimeter',
      visual: 'beaker',
      shortExplanation: 'Double-walled expanded polystyrene container with an insulating lid.',
      purpose: 'Minimizes heat exchange with the surroundings during salt dissolution.',
      specification: 'Nested Polystyrene Cups with Foam Lid',
    },
    {
      id: 'thermometer',
      name: 'Precision Digital Thermometer',
      visual: 'graduated-cylinder',
      shortExplanation: 'Digital temperature probe measuring to 0.1°C resolution.',
      purpose: 'Records initial water temperature and maximum/minimum temperature after dissolution.',
      specification: '-10°C to +110°C Digital Thermocouple Probe',
      safetyNote: 'Do not use the thermometer as a stirring rod; handle probe gently.',
    },
    {
      id: 'digital-balance',
      name: 'Digital Balance',
      visual: 'digital-balance',
      shortExplanation: 'Two-decimal electronic balance for precise mass measurement.',
      purpose: 'Weighs 8.00 g of solid ammonium nitrate solute.',
      specification: '0.01 g Precision Balance',
    },
  ],
  materials: [
    {
      id: 'ammonium-nitrate',
      name: 'Ammonium Nitrate',
      formula: 'NH₄NO₃',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline solid granules',
      role: 'Solute',
      purpose: 'Dissolves endothermically, absorbing heat from water and lowering temperature.',
      stockQuantity: { amount: 100, unit: 'g', label: 'Solid Reagent' },
      requiredQuantity: { amount: 8, unit: 'g', label: 'Solute Weighed' },
      safetyNotes: ['Strong oxidizer; keep away from organic combustibles and open heat.'],
    },
    {
      id: 'water',
      name: 'Distilled Water',
      formula: 'H₂O',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid at room temperature',
      role: 'Solvent',
      purpose: 'Absorbs heat energy as the crystal lattice breaks apart.',
      stockQuantity: { amount: 500, unit: 'mL', label: 'Water Stock' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Calorimeter Charge' },
      safetyNotes: ['Standard non-hazardous solvent.'],
    },
  ],
}

/**
 * 7. Heat of Neutralization Measurement (Grade 1 Term 2)
 */
export const heatNeutralizationToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-heat-neutralization-007',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'calorimeter',
      name: 'Insulated Calorimeter',
      visual: 'beaker',
      shortExplanation: 'Insulated cup system to capture heat released during acid-base neutralization.',
      purpose: 'Prevents thermal dissipation to the environment during reaction.',
      specification: '250 mL Insulated Cup Assembly',
    },
    {
      id: 'graduated-cylinder',
      name: 'Graduated Cylinders (Pair)',
      visual: 'graduated-cylinder',
      shortExplanation: 'Measuring cylinders for equal volumes of acid and base.',
      purpose: 'Measures 50 mL of 1.0 M HCl and 50 mL of 1.0 M NaOH.',
      specification: '50 mL Glass Cylinders',
    },
    {
      id: 'thermometer',
      name: 'Laboratory Thermometer',
      visual: 'graduated-cylinder',
      shortExplanation: 'Thermometer for monitoring exothermic temperature rise.',
      purpose: 'Measures starting solution temperature and peak neutralization temperature.',
      specification: '0°C to 100°C (0.2°C scale)',
    },
  ],
  materials: [
    {
      id: 'molar-hcl',
      name: 'Hydrochloric Acid (1.0 M)',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Clear, colorless aqueous solution',
      role: 'Reagent',
      purpose: 'Provides 0.05 mol hydronium ions for neutralization.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Stock Acid' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Calorimeter Dose' },
      safetyNotes: ['Corrosive acid; wear goggles and gloves.'],
    },
    {
      id: 'molar-naoh',
      name: 'Sodium Hydroxide (1.0 M)',
      formula: 'NaOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless aqueous solution',
      role: 'Reagent',
      purpose: 'Provides 0.05 mol hydroxide ions to form water exothermically.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Stock Alkali' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Calorimeter Dose' },
      safetyNotes: ['Caustic base; causes skin irritation. Wash hands thoroughly.'],
    },
  ],
}

/**
 * 8. Flame Test Identification of Alkali Metals (Grade 2 Term 1)
 */
export const flameTestsToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-flame-tests-008',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'bunsen-burner',
      name: 'Bunsen Burner',
      visual: 'beaker',
      shortExplanation: 'Gas burner providing an adjustable, non-luminous high-temperature flame.',
      purpose: 'Thermally excites metal valence electrons in the hottest flame zone.',
      specification: 'Standard Natural Gas Burner with Air Collar',
      safetyNote: 'Tie back long hair and ensure gas valves are closed immediately after use.',
    },
    {
      id: 'platinum-wire',
      name: 'Platinum / Nichrome Wire Loop',
      visual: 'spatula',
      shortExplanation: 'Heat-resistant metal wire fused into a glass rod handle.',
      purpose: 'Holds small chemical crystal samples directly in the flame without imparting background color.',
      specification: 'Platinum Wire (0.5 mm diameter) in Glass Holder',
      safetyNote: 'Wire becomes incandescently hot; allow to cool on heatproof mat.',
    },
    {
      id: 'watch-glass',
      name: 'Watch Glass',
      visual: 'weighing-boat',
      shortExplanation: 'Shallow circular concave glass dish.',
      purpose: 'Holds concentrated hydrochloric acid for cleaning the wire loop between tests.',
      specification: '75 mm Borosilicate Watch Glass',
    },
  ],
  materials: [
    {
      id: 'conc-hcl',
      hazards: ['corrosive'],
      name: 'Concentrated Hydrochloric Acid',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Fuming, colorless concentrated acid solution',
      role: 'Reagent',
      purpose: 'Converts metal salts to volatile metal chlorides for clean flame vaporization.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Acid Bottle' },
      requiredQuantity: { amount: 10, unit: 'mL', label: 'Cleaning Dish' },
      safetyNotes: ['Fuming acid; handle strictly in a fume hood or well-ventilated area.'],
    },
    {
      id: 'nacl-salt',
      name: 'Sodium Chloride Salt',
      formula: 'NaCl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline solid',
      role: 'Reagent',
      purpose: 'Yields an intense golden-yellow flame emission at 589 nm.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Salt' },
      requiredQuantity: { amount: 0.1, unit: 'g', label: 'Loop Trace' },
      safetyNotes: ['Non-hazardous analytical salt.'],
    },
    {
      id: 'kcl-salt',
      name: 'Potassium Chloride Salt',
      formula: 'KCl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline powder',
      role: 'Reagent',
      purpose: 'Yields a characteristic faint lilac/violet flame emission.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Salt' },
      requiredQuantity: { amount: 0.1, unit: 'g', label: 'Loop Trace' },
      safetyNotes: ['Non-hazardous analytical salt.'],
    },
  ],
}

/**
 * 9. Periodic Trends in Oxide Behavior (Grade 2 Term 1)
 */
export const oxidesToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-oxides-009',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'combustion-spoon',
      name: 'Deflagrating (Combustion) Spoon',
      visual: 'spatula',
      shortExplanation: 'Long-handled metal spoon with a protective cover plate.',
      purpose: 'Lowers burning solid samples safely into a gas jar of pure oxygen.',
      specification: 'Stainless Steel Spoon with 250 mm Handle',
    },
    {
      id: 'gas-jar',
      name: 'Gas Jar with Glass Cover Plate',
      visual: 'beaker',
      shortExplanation: 'Heavy cylindrical glass jar for collecting and reacting gases.',
      purpose: 'Contains oxygen gas and encloses oxide combustion fumes.',
      specification: '500 mL Heavy Glass Jar',
    },
  ],
  materials: [
    {
      id: 'magnesium-ribbon',
      name: 'Magnesium Ribbon',
      formula: 'Mg',
      visual: 'spatula',
      physicalAppearance: 'Silvery-gray flexible metal strip',
      role: 'Reagent',
      purpose: 'Burns with brilliant white light to form basic magnesium oxide (MgO).',
      stockQuantity: { amount: 20, unit: 'g', label: 'Ribbon Roll' },
      requiredQuantity: { amount: 0.5, unit: 'g', label: 'Combustion Strip' },
      safetyNotes: ['Flammable solid; do not look directly at the intense burning magnesium flame.'],
    },
    {
      id: 'sulfur-powder',
      name: 'Sulfur Powder',
      formula: 'S',
      visual: 'sodium-chloride',
      physicalAppearance: 'Bright yellow fine solid powder',
      role: 'Reagent',
      purpose: 'Burns with blue flame to form acidic sulfur dioxide gas (SO₂).',
      stockQuantity: { amount: 50, unit: 'g', label: 'Powder Bottle' },
      requiredQuantity: { amount: 1.0, unit: 'g', label: 'Spoon Sample' },
      safetyNotes: ['Combustion releases choking sulfur dioxide gas; work in a fume hood.'],
    },
    {
      id: 'litmus-paper',
      name: 'Litmus Test Strips',
      formula: 'C₇H₇O₄N',
      visual: 'weighing-boat',
      physicalAppearance: 'Red and blue absorbent paper strips',
      role: 'Indicator',
      purpose: 'Differentiates basic MgO solution (blue) from acidic SO₂ solution (red).',
      stockQuantity: { amount: 100, unit: 'strips', label: 'Test Book' },
      requiredQuantity: { amount: 4, unit: 'strips', label: 'Testing Set' },
      safetyNotes: ['Standard non-hazardous paper strips.'],
    },
  ],
}

/**
 * 10. Halogen Displacement in Aqueous Halides (Grade 2 Term 1)
 */
export const halogenDisplacementToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-halogen-displacement-010',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'test-tube',
      name: 'Test Tubes with Stoppers',
      visual: 'graduated-cylinder',
      shortExplanation: 'Glass tubes fitted with rubber stoppers for vigorous shaking.',
      purpose: 'Allows mixing aqueous halides with chlorine and extracting free halogens into solvent.',
      specification: '20 × 150 mm Rimless Tubes with Neoprene Stoppers',
    },
    {
      id: 'dropper',
      name: 'Pasteur Pipette Dropper',
      visual: 'graduated-cylinder',
      shortExplanation: 'Fine dropper for transferring volatile organic solvents cleanly.',
      purpose: 'Adds 2 mL portions of chlorine water and cyclohexane.',
      specification: 'Glass Dropper Pipette',
    },
  ],
  materials: [
    {
      id: 'chlorine-water',
      hazards: ['toxic-gas'],
      name: 'Chlorine Water',
      formula: 'Cl₂ (aq)',
      visual: 'water',
      physicalAppearance: 'Pale green-yellow aqueous solution with strong chlorine odor',
      role: 'Reagent',
      purpose: 'Acts as the strong oxidizing agent that displaces bromide and iodide ions.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Freshly Prepared Solution' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Reaction Dose' },
      safetyNotes: ['Releases toxic chlorine gas; handle strictly in an operational fume hood.'],
    },
    {
      id: 'potassium-bromide',
      name: 'Potassium Bromide Solution',
      formula: 'KBr',
      visual: 'water',
      physicalAppearance: 'Clear, colorless aqueous solution (0.1 M)',
      role: 'Reagent',
      purpose: 'Source of bromide ions displaced to yield orange free bromine (Br₂).',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Reagent Bottle' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Sample Volume' },
      safetyNotes: ['Avoid ingestion or eye contact.'],
    },
    {
      id: 'cyclohexane',
      hazards: ['flammable'],
      name: 'Cyclohexane (Extraction Solvent)',
      formula: 'C₆H₁₂',
      visual: 'water',
      physicalAppearance: 'Clear, colorless, non-polar organic liquid',
      role: 'Solvent',
      purpose: 'Extracts non-polar halogens into an upper organic layer (Br₂ orange, I₂ violet).',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Solvent Bottle' },
      requiredQuantity: { amount: 4, unit: 'mL', label: 'Extraction Phase' },
      safetyNotes: ['Highly flammable liquid and vapor. Keep away from heat, sparks, and open flame.'],
    },
  ],
}

/**
 * 11. Electrical Conductivity of Electrolytes (Grade 2 Term 2)
 */
export const conductivityToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-conductivity-011',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'conductivity-apparatus',
      name: 'Conductivity Apparatus',
      visual: 'beaker',
      shortExplanation: 'Rigid platform supporting two inert graphite electrodes and a low-wattage indicator lamp.',
      purpose: 'Completes an electrical circuit through test liquid to indicate mobile ion concentration.',
      specification: '6 V DC Circuit with Graphite Electrodes & 6 V Incandescent Bulb',
      safetyNote: 'Disconnect power supply before rinsing or touching electrode surfaces.',
    },
    {
      id: 'beaker',
      name: 'Sample Beakers (Set of 4)',
      visual: 'beaker',
      shortExplanation: 'Small glass containers for holding electrolyte samples.',
      purpose: 'Hold solid salt, salt water, sugar water, and dilute acetic acid for comparison.',
      specification: '100 mL Glass Beakers',
    },
  ],
  materials: [
    {
      id: 'nacl-solution',
      name: 'Aqueous Sodium Chloride',
      formula: 'NaCl (aq)',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid solution',
      role: 'Reagent',
      purpose: 'Demonstrates a strong electrolyte where mobile ions cause bright lamp illumination.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Electrolyte Supply' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Cell Volume' },
      safetyNotes: ['Non-hazardous common salt solution.'],
    },
    {
      id: 'acetic-acid-dilute',
      name: 'Dilute Acetic Acid',
      formula: 'CH₃COOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid with vinegar odor',
      role: 'Reagent',
      purpose: 'Demonstrates a weak electrolyte where partial ionization causes dim lamp glow.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Weak Acid Stock' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Cell Volume' },
      safetyNotes: ['Mild acid; avoid contact with eyes.'],
    },
    {
      id: 'sucrose-solution',
      name: 'Sucrose (Sugar) Solution',
      formula: 'C₁₂H₂₂O₁₁',
      visual: 'water',
      physicalAppearance: 'Clear, colorless, viscous liquid',
      role: 'Reagent',
      purpose: 'Demonstrates a non-electrolyte with neutral molecules and zero current conduction.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Sugar Solution' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Cell Volume' },
      safetyNotes: ['Non-hazardous organic carbohydrate solution.'],
    },
  ],
}

/**
 * 12. Reaction of Sodium with Water (Grade 2 Term 2)
 */
export const sodiumWaterToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-sodium-water-012',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'safety-shield',
      name: 'Polycarbonate Safety Blast Shield',
      visual: 'beaker',
      shortExplanation: 'Transparent shatterproof polycarbonate barrier placed in front of the trough.',
      purpose: 'Protects students and instructor from potential corrosive splashes or sparks.',
      specification: '6 mm Heavy Polycarbonate Bench Shield',
      safetyNote: 'Position shield securely between reaction vessel and all personnel before adding sodium.',
    },
    {
      id: 'beaker',
      name: 'Large Glass Trough / Beaker',
      visual: 'beaker',
      shortExplanation: 'Heavy wide-mouth glass container filled half-full with water.',
      purpose: 'Provides ample surface area for the sodium sphere to dart freely.',
      specification: '1000 mL Heavy-Wall Borosilicate Trough',
    },
    {
      id: 'spatula',
      name: 'Laboratory Forceps / Tweezers',
      visual: 'spatula',
      shortExplanation: 'Stainless steel blunt-ended tweezers for chemical handling.',
      purpose: 'Transfers metallic sodium without any direct skin contact.',
      specification: '150 mm Stainless Steel Forceps',
      safetyNote: 'Never touch sodium metal with bare fingers; moisture on skin causes severe alkali burns.',
    },
  ],
  materials: [
    {
      id: 'sodium-metal',
      name: 'Metallic Sodium',
      formula: 'Na',
      visual: 'sodium-chloride',
      physicalAppearance: 'Soft, silvery-white alkali metal stored under mineral oil',
      role: 'Reagent',
      purpose: 'Reacts violently with water to produce sodium hydroxide and hydrogen gas.',
      stockQuantity: { amount: 25, unit: 'g', label: 'Stored under Kerosene' },
      requiredQuantity: { amount: 0.1, unit: 'g', label: 'Pea-Sized Piece' },
      safetyNotes: ['Water-reactive solid. Catches fire in water. Blot mineral oil dry with filter paper before use.'],
    },
    {
      id: 'distilled-water',
      name: 'Distilled Water',
      formula: 'H₂O',
      visual: 'water',
      physicalAppearance: 'Clear, pure liquid',
      role: 'Reagent',
      purpose: 'Reacts with sodium metal to generate hydrogen gas and hydroxide ions.',
      stockQuantity: { amount: 1000, unit: 'mL', label: 'Water Supply' },
      requiredQuantity: { amount: 500, unit: 'mL', label: 'Trough Volume' },
      safetyNotes: ['Use plenty of water so reaction heat dissipates quickly.'],
    },
    {
      id: 'phenolphthalein',
      name: 'Phenolphthalein Indicator',
      formula: 'C₂₀H₁₄O₄',
      visual: 'water',
      physicalAppearance: 'Colorless indicator solution',
      role: 'Indicator',
      purpose: 'Turns bright magenta-pink to confirm generation of alkaline NaOH solution.',
      stockQuantity: { amount: 25, unit: 'mL', label: 'Dropper Bottle' },
      requiredQuantity: { amount: 5, unit: 'drops', label: 'Trough Addition' },
      safetyNotes: ['Flammable solution.'],
    },
  ],
}

/**
 * 13. Laboratory Preparation and Fountain Test of Ammonia (Grade 2 Term 2)
 */
export const ammoniaPrepToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-ammonia-prep-013',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'round-bottom-flask',
      name: 'Round-Bottom Reaction Flask',
      visual: 'beaker',
      shortExplanation: 'Heat-resistant spherical flask for uniform thermal distribution.',
      purpose: 'Contains the dry solid mixture of ammonium chloride and slaked lime during heating.',
      specification: '250 mL Pyrex Round-Bottom Flask',
      safetyNote: 'Clamp flask tilted slightly downward toward the neck to prevent condensed water flowing onto hot glass.',
    },
    {
      id: 'gas-delivery-tube',
      name: 'Drying Tower & Inverted Delivery Tube',
      visual: 'graduated-cylinder',
      shortExplanation: 'Glass U-tube filled with quicklime lumps and inverted collector tube.',
      purpose: 'Dries ammonia gas over CaO and collects dry gas by downward displacement of air.',
      specification: 'Quicklime Glass Drying Column',
    },
  ],
  materials: [
    {
      id: 'ammonium-chloride',
      name: 'Ammonium Chloride',
      formula: 'NH₄Cl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline solid powder',
      role: 'Reagent',
      purpose: 'Provides ammonium ions that release ammonia gas upon heating with alkali.',
      stockQuantity: { amount: 100, unit: 'g', label: 'Dry Solid' },
      requiredQuantity: { amount: 10, unit: 'g', label: 'Reaction Charge' },
      safetyNotes: ['Mild eye and skin irritant.'],
    },
    {
      id: 'calcium-hydroxide',
      name: 'Slaked Lime (Calcium Hydroxide)',
      formula: 'Ca(OH)₂',
      visual: 'sodium-chloride',
      physicalAppearance: 'Fine white alkaline powder',
      role: 'Reagent',
      purpose: 'Reacts with ammonium salt to liberate gaseous ammonia.',
      stockQuantity: { amount: 100, unit: 'g', label: 'Dry Solid' },
      requiredQuantity: { amount: 15, unit: 'g', label: 'Reaction Charge' },
      safetyNotes: ['Caustic alkaline powder; avoid breathing dust.'],
    },
    {
      id: 'calcium-oxide',
      name: 'Quicklime (Calcium Oxide)',
      formula: 'CaO',
      visual: 'sodium-chloride',
      physicalAppearance: 'White porous granules',
      role: 'Reagent',
      purpose: 'Acts as basic drying agent; does not react with alkaline ammonia gas.',
      stockQuantity: { amount: 100, unit: 'g', label: 'Drying Column' },
      requiredQuantity: { amount: 30, unit: 'g', label: 'Tower Pack' },
      safetyNotes: ['Exothermic with water. Keep tightly sealed.'],
    },
  ],
}

/**
 * 14. Catalytic Decomposition of Hydrogen Peroxide (Grade 3 Term 1)
 */
export const catalysisToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-catalysis-014',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'erlenmeyer-flask',
      name: 'Conical Gas Generator Flask',
      visual: 'beaker',
      shortExplanation: 'Conical reaction flask fitted with gas-tight delivery bung.',
      purpose: 'Holds hydrogen peroxide solution where solid manganese dioxide is added.',
      specification: '250 mL Borosilicate Conical Flask',
    },
    {
      id: 'gas-delivery-tube',
      name: 'Gas Syringe / Pneumatic Trough',
      visual: 'graduated-cylinder',
      shortExplanation: 'Calibrated glass gas syringe measuring evolved gas volume over time.',
      purpose: 'Collects and measures the volume of released oxygen gas at 10-second intervals.',
      specification: '100 mL Precision Gas Syringe',
    },
  ],
  materials: [
    {
      id: 'hydrogen-peroxide',
      name: 'Hydrogen Peroxide Solution',
      formula: 'H₂O₂',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid solution (6% w/v, 20 volume)',
      role: 'Reagent',
      purpose: 'Decomposes catalytically into water and molecular oxygen gas.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Peroxide Stock' },
      requiredQuantity: { amount: 25, unit: 'mL', label: 'Flask Charge' },
      safetyNotes: ['Oxidizing liquid; causes skin bleaching and eye irritation.'],
    },
    {
      id: 'manganese-dioxide',
      name: 'Manganese(IV) Oxide',
      formula: 'MnO₂',
      visual: 'sodium-chloride',
      physicalAppearance: 'Fine black insoluble inorganic powder',
      role: 'Catalyst',
      purpose: 'Acts as heterogeneous transition-metal catalyst to accelerate decomposition rate.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Catalyst' },
      requiredQuantity: { amount: 0.5, unit: 'g', label: 'Catalyst Dose' },
      safetyNotes: ['Insoluble black powder; avoid inhalation.'],
    },
  ],
}

/**
 * 15. Qualitative Analysis and Confirmatory Tests of Acidic Anions (Grade 3 Term 1)
 */
export const anionsToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-anions-015',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'test-tube',
      name: 'Hard Glass Test Tubes (Rack of 6)',
      visual: 'graduated-cylinder',
      shortExplanation: 'Set of clean test tubes for parallel anion screening.',
      purpose: 'Hold solid salt samples for acid addition and gas evolution checks.',
      specification: '16 × 150 mm Borosilicate Glass',
    },
    {
      id: 'gas-delivery-tube',
      name: 'Bent Gas Delivery Tube',
      visual: 'graduated-cylinder',
      shortExplanation: 'Glass delivery tube with rubber stopper.',
      purpose: 'Channels evolved CO₂ gas directly into clear limewater without atmospheric dilution.',
      specification: 'Right-Angle Delivery Tube',
    },
  ],
  materials: [
    {
      id: 'sodium-carbonate',
      name: 'Sodium Carbonate Salt',
      formula: 'Na₂CO₃',
      visual: 'sodium-chloride',
      physicalAppearance: 'White anhydrous solid powder',
      role: 'Reagent',
      purpose: 'Evolves carbon dioxide gas with effervescence upon reaction with dilute HCl.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Reagent' },
      requiredQuantity: { amount: 1.0, unit: 'g', label: 'Test Sample' },
      safetyNotes: ['Mildly alkaline salt.'],
    },
    {
      id: 'dilute-hcl',
      name: 'Dilute Hydrochloric Acid',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Clear, colorless mineral acid solution (2.0 M)',
      role: 'Reagent',
      purpose: 'Group reagent for the carbonate, sulfite, and thiosulfate analytical groups.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Group Reagent' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Tube Addition' },
      safetyNotes: ['Corrosive mineral acid; wear protective gloves.'],
    },
    {
      id: 'limewater',
      name: 'Clear Limewater Solution',
      formula: 'Ca(OH)₂ (aq)',
      visual: 'water',
      physicalAppearance: 'Clear, freshly filtered saturated calcium hydroxide solution',
      role: 'Reagent',
      purpose: 'Turns milky turbid when exposed to evolved CO₂ gas due to CaCO₃ precipitation.',
      stockQuantity: { amount: 150, unit: 'mL', label: 'Limewater Stock' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Gas Test Vial' },
      safetyNotes: ['Keep bottle tightly stoppered to prevent absorption of atmospheric CO₂.'],
    },
  ],
}

/**
 * 16. Systematic Separation and Confirmation of Basic Radicals (Grade 3 Term 1)
 */
export const cationsToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-cations-016',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'test-tube',
      name: 'Precipitation Test Tubes (Set of 4)',
      visual: 'graduated-cylinder',
      shortExplanation: 'Clear test tubes for observing gelatinous precipitate colors.',
      purpose: 'Hold aqueous cation solutions during dropwise reagent addition.',
      specification: '15 × 125 mm Tubes',
    },
    {
      id: 'dropper',
      name: 'Dropper Pipettes',
      visual: 'graduated-cylinder',
      shortExplanation: 'Calibrated dropper pipettes for controlled alkali delivery.',
      purpose: 'Delivers drops of NaOH to record initial precipitation and excess solubility.',
      specification: 'Fine-Tip Droppers',
    },
  ],
  materials: [
    {
      id: 'copper-sulfate',
      name: 'Copper(II) Sulfate Solution',
      formula: 'CuSO₄',
      visual: 'water',
      physicalAppearance: 'Clear sky-blue aqueous solution',
      role: 'Reagent',
      purpose: 'Yields a pale blue precipitate of Cu(OH)₂ insoluble in excess NaOH.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Cation Stock' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Test Tube Aliquot' },
      safetyNotes: ['Harmful if swallowed; toxic to aquatic life.'],
    },
    {
      id: 'iron-iii-chloride',
      name: 'Iron(III) Chloride Solution',
      formula: 'FeCl₃',
      visual: 'water',
      physicalAppearance: 'Yellow-brown aqueous solution',
      role: 'Reagent',
      purpose: 'Yields a reddish-brown gelatinous precipitate of Fe(OH)₃.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Cation Stock' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Test Tube Aliquot' },
      safetyNotes: ['Corrosive to metals and skin.'],
    },
    {
      id: 'aluminum-sulfate',
      name: 'Aluminum Sulfate Solution',
      formula: 'Al₂(SO₄)₃',
      visual: 'water',
      physicalAppearance: 'Clear, colorless aqueous solution',
      role: 'Reagent',
      purpose: 'Yields a white gelatinous precipitate of Al(OH)₃ that dissolves in excess NaOH.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Cation Stock' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Test Tube Aliquot' },
      safetyNotes: ['Mildly acidic solution.'],
    },
    {
      id: 'sodium-hydroxide-sol',
      name: 'Sodium Hydroxide Solution (2.0 M)',
      formula: 'NaOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless caustic solution',
      role: 'Reagent',
      purpose: 'Precipitating group reagent for analytical Group III cations.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Reagent Supply' },
      requiredQuantity: { amount: 15, unit: 'mL', label: 'Precipitation Dose' },
      safetyNotes: ['Caustic base; causes severe chemical burns on prolonged contact.'],
    },
  ],
}

/**
 * 17. Quantitative Neutralization Titration (Grade 3 Term 1)
 */
export const volumetricTitrationToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-volumetric-titration-017',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'burette',
      name: 'Class A Precision Burette',
      visual: 'graduated-cylinder',
      shortExplanation: 'Calibrated analytical burette with fine needle control.',
      purpose: 'Measures exact volume of unknown hydrochloric acid required for neutralization.',
      specification: '50 mL ± 0.05 mL Tolerance Burette',
    },
    {
      id: 'pipette',
      name: 'Volumetric Transfer Pipette',
      visual: 'graduated-cylinder',
      shortExplanation: 'Single-volume precision glass pipette.',
      purpose: 'Dispenses exactly 25.0 mL of primary standard sodium carbonate solution.',
      specification: '25 mL Class A Volumetric Pipette',
    },
    {
      id: 'erlenmeyer-flask',
      name: 'Titration Conical Flask',
      visual: 'beaker',
      shortExplanation: 'Wide base conical flask on a white glazed tile.',
      purpose: 'Reaction vessel for swirl mixing without drop splashing.',
      specification: '250 mL Conical Flask with White Tile',
    },
  ],
  materials: [
    {
      id: 'std-na2co3',
      name: 'Standard Sodium Carbonate Solution',
      formula: 'Na₂CO₃',
      visual: 'water',
      physicalAppearance: 'Clear, standardized primary solution (0.050 M)',
      role: 'Reagent',
      purpose: 'Primary standard base of certified concentration.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Primary Standard' },
      requiredQuantity: { amount: 25, unit: 'mL', label: 'Titration Flask' },
      safetyNotes: ['Stable primary standard solution.'],
    },
    {
      id: 'unknown-hcl',
      name: 'Hydrochloric Acid of Unknown Concentration',
      formula: 'HCl',
      visual: 'water',
      physicalAppearance: 'Clear, colorless aqueous analyte',
      role: 'Reagent',
      purpose: 'Analyte whose molarity is quantitatively determined.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Analyte Sample' },
      requiredQuantity: { amount: 50, unit: 'mL', label: 'Burette Charge' },
      safetyNotes: ['Corrosive mineral acid.'],
    },
    {
      id: 'methyl-orange',
      name: 'Methyl Orange Indicator',
      formula: 'C₁₄H₁₄N₃NaO₃S',
      visual: 'water',
      physicalAppearance: 'Orange aqueous indicator solution',
      role: 'Indicator',
      purpose: 'Turns from yellow to distinct orange-red at equivalence point (pH 3.1–4.4).',
      stockQuantity: { amount: 25, unit: 'mL', label: 'Indicator Dropper' },
      requiredQuantity: { amount: 3, unit: 'drops', label: 'Flask Addition' },
      safetyNotes: ['Azo dye indicator.'],
    },
  ],
}

/**
 * 18. Effect of Concentration on Reversible Chemical Equilibrium (Grade 3 Term 1)
 */
export const equilibriumToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-equilibrium-018',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'test-tube',
      name: 'Matched Colorimeter Tubes (Set of 4)',
      visual: 'graduated-cylinder',
      shortExplanation: 'Uniform diameter glass tubes for direct optical comparison.',
      purpose: 'Contain equilibrium mixtures at different reactant concentrations.',
      specification: 'Matched 18 × 150 mm Tubes',
    },
    {
      id: 'dropper',
      name: 'Graduated Droppers',
      visual: 'graduated-cylinder',
      shortExplanation: 'Droppers for precise addition of reactant solutions.',
      purpose: 'Perturbs equilibrium by adding excess Fe³⁺ or SCN⁻ ions.',
      specification: '1 mL Droppers',
    },
  ],
  materials: [
    {
      id: 'iron-chloride-eq',
      name: 'Iron(III) Chloride Solution',
      formula: 'FeCl₃',
      visual: 'water',
      physicalAppearance: 'Pale yellow clear solution (0.1 M)',
      role: 'Reagent',
      purpose: 'Provides iron(III) ions that react to form blood-red thiocyanate complex.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Stock Reagent' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Equilibrium Base' },
      safetyNotes: ['Stains glassware and skin.'],
    },
    {
      id: 'ammonium-thiocyanate',
      name: 'Ammonium Thiocyanate Solution',
      formula: 'NH₄SCN',
      visual: 'water',
      physicalAppearance: 'Clear, colorless solution (0.1 M)',
      role: 'Reagent',
      purpose: 'Provides thiocyanate ligand ions to establish dynamic reversible equilibrium.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Stock Reagent' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Equilibrium Base' },
      safetyNotes: ['Harmful if swallowed.'],
    },
    {
      id: 'ammonium-chloride-solid',
      name: 'Solid Ammonium Chloride',
      formula: 'NH₄Cl',
      visual: 'sodium-chloride',
      physicalAppearance: 'White crystalline powder',
      role: 'Reagent',
      purpose: 'Increases product concentration to shift equilibrium in the reverse direction.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Salt' },
      requiredQuantity: { amount: 1.0, unit: 'g', label: 'Shift Addition' },
      safetyNotes: ['Non-toxic analytical salt.'],
    },
  ],
}

/**
 * 19. Construction and Voltage Measurement of Daniell Galvanic Cell (Grade 3 Term 2)
 */
export const daniellCellToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-daniell-cell-019',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'voltmeter',
      name: 'Digital Voltmeter with Clip Leads',
      visual: 'digital-balance',
      shortExplanation: 'High-impedance digital multimeter measuring DC potential difference.',
      purpose: 'Measures cell electromotive force without drawing significant current.',
      specification: 'Digital DC Voltmeter (0.001 V resolution)',
    },
    {
      id: 'u-tube-cell',
      name: 'U-Tube Salt Bridge Assembly',
      visual: 'graduated-cylinder',
      shortExplanation: 'Inverted U-shaped glass tube filled with agar gel and KNO₃ electrolyte.',
      purpose: 'Permits ion migration between half-cells while preventing solution intermixing.',
      specification: '15 mm Diameter Glass U-Tube with Porous Plugs',
    },
    {
      id: 'beaker',
      name: 'Half-Cell Beakers (Pair)',
      visual: 'beaker',
      shortExplanation: 'Beakers holding the respective metal electrode and sulfate solution.',
      purpose: 'Hold the zinc and copper half-cell systems.',
      specification: '250 mL Borosilicate Beakers',
    },
  ],
  materials: [
    {
      id: 'zinc-electrode',
      name: 'Zinc Metal Plate & Solution',
      formula: 'Zn / ZnSO₄',
      visual: 'water',
      physicalAppearance: 'Polished zinc metal strip immersed in 1.0 M ZnSO₄ solution',
      role: 'Reagent',
      purpose: 'Acts as the anode where spontaneous oxidation occurs: Zn → Zn²⁺ + 2e⁻.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Anode Half-Cell' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Beaker Charge' },
      safetyNotes: ['Clean metal surface with emery paper before assembly.'],
    },
    {
      id: 'copper-electrode',
      name: 'Copper Metal Plate & Solution',
      formula: 'Cu / CuSO₄',
      visual: 'water',
      physicalAppearance: 'Clean copper metal strip immersed in 1.0 M CuSO₄ solution',
      role: 'Reagent',
      purpose: 'Acts as the cathode where reduction occurs: Cu²⁺ + 2e⁻ → Cu.',
      stockQuantity: { amount: 200, unit: 'mL', label: 'Cathode Half-Cell' },
      requiredQuantity: { amount: 100, unit: 'mL', label: 'Beaker Charge' },
      safetyNotes: ['Avoid skin contact with copper sulfate solution.'],
    },
    {
      id: 'potassium-nitrate-bridge',
      name: 'Potassium Nitrate Electrolyte',
      formula: 'KNO₃',
      visual: 'sodium-chloride',
      physicalAppearance: 'Agar-solidified saturated potassium nitrate gel',
      role: 'Reagent',
      purpose: 'Maintains electrical neutrality by migrating K⁺ and NO₃⁻ ions.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Bridge Electrolyte' },
      requiredQuantity: { amount: 20, unit: 'mL', label: 'U-Tube Fill' },
      safetyNotes: ['Oxidizing salt.'],
    },
  ],
}

/**
 * 20. Electrolytic Decomposition of Aqueous Copper Sulfate (Grade 3 Term 2)
 */
export const electrolysisToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-electrolysis-020',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'electrolytic-cell',
      name: 'Electrolytic Cell Tank & Power Supply',
      visual: 'beaker',
      shortExplanation: 'Glass cell with DC power unit (0–12 V) and ammeter.',
      purpose: 'Supplies direct electric current to drive non-spontaneous redox decomposition.',
      specification: 'Variable DC Power Unit (0–6 V, 2 A) with Analog Ammeter',
    },
    {
      id: 'digital-balance',
      name: 'Analytical Balance',
      visual: 'digital-balance',
      shortExplanation: 'High-precision balance for weighing cathode before and after electrolysis.',
      purpose: 'Measures exact mass increase of deposited copper.',
      specification: '0.001 g Analytical Balance',
    },
  ],
  materials: [
    {
      id: 'copper-sulfate-electrolyte',
      name: 'Copper(II) Sulfate Electrolyte',
      formula: 'CuSO₄',
      visual: 'water',
      physicalAppearance: 'Deep blue aqueous solution with dilute sulfuric acid (1.0 M)',
      role: 'Reagent',
      purpose: 'Source of Cu²⁺ ions reduced onto the cathode.',
      stockQuantity: { amount: 300, unit: 'mL', label: 'Bath Solution' },
      requiredQuantity: { amount: 150, unit: 'mL', label: 'Cell Volume' },
      safetyNotes: ['Acidified copper sulfate is corrosive; wear protective gloves.'],
    },
    {
      id: 'copper-cathode',
      name: 'Copper Cathode Strip',
      formula: 'Cu',
      visual: 'spatula',
      physicalAppearance: 'Pre-weighed clean copper metal foil',
      role: 'Reagent',
      purpose: 'Negative electrode where copper ions receive electrons and deposit.',
      stockQuantity: { amount: 5, unit: 'strips', label: 'Electrodes' },
      requiredQuantity: { amount: 1, unit: 'strip', label: 'Working Cathode' },
      safetyNotes: ['Rinse with propanone and dry before final weighing.'],
    },
  ],
}

/**
 * 21. Qualitative Detection of Carbon and Hydrogen in Organic Compounds (Grade 3 Term 2)
 */
export const organicDetectionToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-organic-detection-021',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'hard-glass-tube',
      name: 'Hard Glass Combustion Tube with Clamp',
      visual: 'graduated-cylinder',
      shortExplanation: 'Thick-walled borosilicate tube capable of withstanding direct burner flame.',
      purpose: 'Contains the mixture of organic substance and black copper(II) oxide during heating.',
      specification: 'Ignition Tube with Heat-Resistant Clamp',
      safetyNote: 'Ensure tube is completely dry; thermal shock can shatter cold damp glass.',
    },
    {
      id: 'gas-delivery-tube',
      name: 'Delivery Tube with Absorption Bulbs',
      visual: 'graduated-cylinder',
      shortExplanation: 'Bent delivery tube leading into a limewater test vial.',
      purpose: 'Passes combustion vapors over anhydrous CuSO₄ then bubbles gas into limewater.',
      specification: 'Custom Bent Glass Tube with One-Hole Rubber Stopper',
    },
    {
      id: 'bunsen-burner',
      name: 'Bunsen Burner',
      visual: 'beaker',
      shortExplanation: 'High-temperature gas burner for decomposing organic matrix.',
      purpose: 'Provides direct heat to initiate oxidation by copper(II) oxide.',
      specification: 'Laboratory Burner',
    },
  ],
  materials: [
    {
      id: 'copper-ii-oxide',
      name: 'Copper(II) Oxide Powder',
      formula: 'CuO',
      visual: 'sodium-chloride',
      physicalAppearance: 'Fine black inorganic powder',
      role: 'Reagent',
      purpose: 'Acts as oxidizing agent that converts organic C into CO₂ and H into H₂O.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Solid Reagent' },
      requiredQuantity: { amount: 3.0, unit: 'g', label: 'Tube Charge' },
      safetyNotes: ['Harmful if swallowed; toxic to aquatic life.'],
    },
    {
      id: 'anhydrous-cuse4',
      name: 'Anhydrous Copper(II) Sulfate',
      formula: 'CuSO₄',
      visual: 'sodium-chloride',
      physicalAppearance: 'Pure white hygroscopic anhydrous powder',
      role: 'Reagent',
      purpose: 'Turns blue upon absorbing water vapor to confirm presence of hydrogen.',
      stockQuantity: { amount: 50, unit: 'g', label: 'Desiccated Powder' },
      requiredQuantity: { amount: 0.5, unit: 'g', label: 'Neck Lining' },
      safetyNotes: ['Hygroscopic; keep tightly sealed in desiccator until use.'],
    },
    {
      id: 'limewater-organic',
      name: 'Limewater Solution',
      formula: 'Ca(OH)₂ (aq)',
      visual: 'water',
      physicalAppearance: 'Clear, freshly filtered aqueous solution',
      role: 'Reagent',
      purpose: 'Turns milky turbid when reacting with evolved CO₂ to confirm presence of carbon.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Limewater' },
      requiredQuantity: { amount: 10, unit: 'mL', label: 'Detector Vial' },
      safetyNotes: ['Mild alkaline solution.'],
    },
  ],
}

/**
 * 22. Laboratory Preparation and Properties of Ethene Gas (Grade 3 Term 2)
 */
export const ethylenePrepToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-ethylene-prep-022',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'round-bottom-flask',
      name: 'Distillation Generating Flask with Thermometer',
      visual: 'beaker',
      shortExplanation: 'Heavy round-bottom flask fitted with thermometer dipping into reaction liquid.',
      purpose: 'Contains ethanol and concentrated H₂SO₄ heated precisely at 180°C.',
      specification: '250 mL Two-Neck Flask with 0–250°C Thermometer',
      safetyNote: 'Maintain temperature strictly between 170°C and 180°C to avoid ether formation at 140°C.',
    },
    {
      id: 'wash-bottle',
      name: 'Gas Washing Bottle',
      visual: 'beaker',
      shortExplanation: 'Dreschel wash bottle containing sodium hydroxide solution.',
      purpose: 'Absorbs acidic sulfur dioxide and carbon dioxide impurities from ethene stream.',
      specification: '250 mL Glass Wash Bottle',
    },
    {
      id: 'gas-delivery-tube',
      name: 'Pneumatic Trough & Gas Collection Jars',
      visual: 'graduated-cylinder',
      shortExplanation: 'Water trough with beehive shelf and inverted gas jars.',
      purpose: 'Collects ethene gas over water by downward displacement.',
      specification: 'Beehive Shelf with 250 mL Gas Jars',
    },
  ],
  materials: [
    {
      id: 'ethanol-prep',
      name: 'Absolute Ethanol',
      formula: 'C₂H₅OH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless, volatile liquid with characteristic alcohol odor',
      role: 'Reagent',
      purpose: 'Dehydrated by concentrated acid to generate ethene gas.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Absolute Alcohol' },
      requiredQuantity: { amount: 30, unit: 'mL', label: 'Flask Charge' },
      safetyNotes: ['Highly flammable liquid. Keep away from ignition sources.'],
    },
    {
      id: 'conc-h2so4-prep',
      name: 'Concentrated Sulfuric Acid',
      formula: 'H₂SO₄',
      visual: 'water',
      physicalAppearance: 'Dense, oily, colorless liquid (98% w/w)',
      role: 'Catalyst',
      purpose: 'Dehydrating agent that removes elements of water from ethanol at 180°C.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Concentrated Acid' },
      requiredQuantity: { amount: 60, unit: 'mL', label: 'Flask Charge' },
      safetyNotes: ['Extremely corrosive; causes severe skin burns and eye damage. Add acid slowly to alcohol with cooling.'],
    },
    {
      id: 'bromine-water',
      name: 'Bromine Water in Carbon Tetrachloride',
      formula: 'Br₂',
      visual: 'water',
      physicalAppearance: 'Reddish-brown non-polar solution',
      role: 'Reagent',
      purpose: 'Decolorizes completely as bromine adds across the unsaturated C=C double bond.',
      stockQuantity: { amount: 50, unit: 'mL', label: 'Bromine Solution' },
      requiredQuantity: { amount: 5, unit: 'mL', label: 'Test Jar' },
      safetyNotes: ['Toxic and corrosive vapors; perform test strictly in a fume hood.'],
    },
  ],
}

/**
 * 23. Synthesis and Odor Detection of an Ester (Grade 3 Term 2)
 */
export const esterificationToolsAndMaterials: ExperimentToolsAndMaterialsData = {
  experimentId: 'exp-esterification-023',
  reviewStatus: 'draft',
  tools: [
    {
      id: 'water-bath',
      name: 'Indirect Electric Water Bath',
      visual: 'beaker',
      shortExplanation: 'Water bath container maintained between 60°C and 70°C.',
      purpose: 'Safely heats flammable alcohol and acid mixture without an open burner flame.',
      specification: 'Constant-Temperature Laboratory Water Bath',
      safetyNote: 'Never use an open flame to heat alcohol mixtures.',
    },
    {
      id: 'test-tube',
      name: 'Reaction Test Tube with Beaker',
      visual: 'graduated-cylinder',
      shortExplanation: 'Boiling tube placed into warm water bath, then decanted into beaker.',
      purpose: 'Hosts esterification condensation, then decants into sodium carbonate for odor inspection.',
      specification: '25 × 150 mm Hard Glass Tube and 250 mL Beaker',
    },
    {
      id: 'dropper',
      name: 'Pasteur Pipette Droppers',
      visual: 'graduated-cylinder',
      shortExplanation: 'Chemical droppers for measured reactant addition.',
      purpose: 'Adds concentrated sulfuric acid catalyst dropwise.',
      specification: 'Glass Droppers',
    },
  ],
  materials: [
    {
      id: 'glacial-acetic-acid',
      name: 'Glacial Acetic Acid',
      formula: 'CH₃COOH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless liquid with pungent, penetrating vinegar odor',
      role: 'Reagent',
      purpose: 'Carboxylic acid reactant that condenses with ethanol to form ethyl acetate.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Glacial Acid' },
      requiredQuantity: { amount: 3, unit: 'mL', label: 'Reaction Tube' },
      safetyNotes: ['Corrosive and combustible liquid; produces strongly irritating vapors.'],
    },
    {
      id: 'ethanol-ester',
      name: 'Absolute Ethanol',
      formula: 'C₂H₅OH',
      visual: 'water',
      physicalAppearance: 'Clear, colorless, volatile liquid',
      role: 'Reagent',
      purpose: 'Alcohol reactant providing the ethyl group of the ester product.',
      stockQuantity: { amount: 100, unit: 'mL', label: 'Absolute Ethanol' },
      requiredQuantity: { amount: 3, unit: 'mL', label: 'Reaction Tube' },
      safetyNotes: ['Highly flammable liquid and vapor.'],
    },
    {
      id: 'conc-h2so4-ester',
      name: 'Concentrated Sulfuric Acid',
      formula: 'H₂SO₄',
      visual: 'water',
      physicalAppearance: 'Dense, oily liquid',
      role: 'Catalyst',
      purpose: 'Catalyzes esterification and absorbs water of condensation to shift equilibrium forward.',
      stockQuantity: { amount: 50, unit: 'mL', label: 'Catalyst Bottle' },
      requiredQuantity: { amount: 1, unit: 'mL', label: 'Catalytic Drops' },
      safetyNotes: ['Causes severe chemical burns. Handle with extreme care.'],
    },
    {
      id: 'na2co3-quench',
      name: 'Sodium Carbonate Solution',
      formula: 'Na₂CO₃',
      visual: 'water',
      physicalAppearance: 'Clear aqueous quenching solution (1.0 M)',
      role: 'Reagent',
      purpose: 'Neutralizes excess unreacted acetic and sulfuric acids so the fruity ester smell is pure.',
      stockQuantity: { amount: 250, unit: 'mL', label: 'Quench Solution' },
      requiredQuantity: { amount: 25, unit: 'mL', label: 'Quench Beaker' },
      safetyNotes: ['Releases harmless carbon dioxide effervescence upon acid addition.'],
    },
  ],
}

/** Complete catalog of tools and materials for all 23 Egyptian curriculum experiments. */
export const experimentToolsAndMaterialsCatalog: readonly ExperimentToolsAndMaterialsData[] = [
  saltDissolutionToolsAndMaterials,
  liquidVolumeToolsAndMaterials,
  phIndicatorsToolsAndMaterials,
  colloidsToolsAndMaterials,
  titrationToolsAndMaterials,
  heatDissolutionToolsAndMaterials,
  heatNeutralizationToolsAndMaterials,
  flameTestsToolsAndMaterials,
  oxidesToolsAndMaterials,
  halogenDisplacementToolsAndMaterials,
  conductivityToolsAndMaterials,
  sodiumWaterToolsAndMaterials,
  ammoniaPrepToolsAndMaterials,
  catalysisToolsAndMaterials,
  anionsToolsAndMaterials,
  cationsToolsAndMaterials,
  volumetricTitrationToolsAndMaterials,
  equilibriumToolsAndMaterials,
  daniellCellToolsAndMaterials,
  electrolysisToolsAndMaterials,
  organicDetectionToolsAndMaterials,
  ethylenePrepToolsAndMaterials,
  esterificationToolsAndMaterials,
]

/**
 * Returns structured tools and materials data for an experiment if available.
 */
export function getExperimentToolsAndMaterials(
  experimentId: string,
): ExperimentToolsAndMaterialsData | undefined {
  return experimentToolsAndMaterialsCatalog.find((item) => item.experimentId === experimentId)
}
