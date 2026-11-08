import type { CurriculumData, Grade, LessonExperiment, Term, Unit } from '../../../types/curriculum.ts'
import type { Experiment, Lesson } from '../../../types/experiment.ts'
import {
  saltDissolutionLearning,
  liquidVolumeLearning,
  phIndicatorsLearning,
  experimentLearningContentCatalog,
} from '../../experiments/data/experimentLearningContent.ts'

export const egyptianGrades: readonly Grade[] = [
  {
    id: 'grade-secondary-1',
    slug: 'first-secondary',
    title: 'First Secondary Grade',
    order: 1,
    description: 'Foundational secondary chemistry structure.',
  },
  {
    id: 'grade-secondary-2',
    slug: 'second-secondary',
    title: 'Second Secondary Grade',
    order: 2,
    description: 'Intermediate secondary chemistry structure.',
  },
  {
    id: 'grade-secondary-3',
    slug: 'third-secondary',
    title: 'Third Secondary Grade',
    order: 3,
    description: 'Advanced secondary chemistry structure.',
  },
]

export const egyptianTerms: readonly Term[] = [
  {
    id: 'term-secondary-1-1',
    gradeId: 'grade-secondary-1',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
    description: 'Chemistry & Measurement, and Solutions, Colloids, Acids and Bases.',
  },
  {
    id: 'term-secondary-1-2',
    gradeId: 'grade-secondary-1',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
    description: 'Thermochemistry, Calorimetry, and Enthalpy Changes.',
  },
  {
    id: 'term-secondary-2-1',
    gradeId: 'grade-secondary-2',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
    description: 'Atomic Structure, Quantum Principles, and Periodic Trends of Elements.',
  },
  {
    id: 'term-secondary-2-2',
    gradeId: 'grade-secondary-2',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
    description: 'Chemical Bonding, Molecular Shapes, and Representative Main Group Elements.',
  },
  {
    id: 'term-secondary-3-1',
    gradeId: 'grade-secondary-3',
    slug: 'first-term',
    title: 'First Term',
    order: 1,
    description: 'Transition Elements, Qualitative & Quantitative Chemical Analysis, and Equilibrium.',
  },
  {
    id: 'term-secondary-3-2',
    gradeId: 'grade-secondary-3',
    slug: 'second-term',
    title: 'Second Term',
    order: 2,
    description: 'Electrochemistry, Electrochemical Cells, and Organic Chemistry.',
  },
]

export const egyptianUnits: readonly Unit[] = [
  // Grade 1 - First Term
  {
    id: 'unit-sec1-t1-u1',
    termId: 'term-secondary-1-1',
    slug: 'chemistry-the-central-science',
    title: 'Unit 1: Chemistry: The Central Science',
    order: 1,
    description:
      'Fundamental concepts of chemistry as a central science, laboratory safety, and quantitative apparatus.',
  },
  {
    id: 'unit-sec1-t1-u3',
    termId: 'term-secondary-1-1',
    slug: 'solutions-colloids-acids-and-bases',
    title: 'Unit 3: Solutions, Colloids, and Acids & Bases',
    order: 2,
    description:
      'Properties of mixtures, solubility curves, distinguishing colloids from true solutions, and acid-base neutralization.',
  },

  // Grade 1 - Second Term
  {
    id: 'unit-sec1-t2-u4',
    termId: 'term-secondary-1-2',
    slug: 'thermochemistry',
    title: 'Unit 4: Thermochemistry',
    order: 1,
    description:
      'Heat energy changes in physical and chemical processes, calorimetry, and standard enthalpy changes.',
  },

  // Grade 2 - First Term
  {
    id: 'unit-sec2-t1-u1',
    termId: 'term-secondary-2-1',
    slug: 'atomic-structure',
    title: 'Unit 1: Atomic Structure',
    order: 1,
    description:
      'Quantum mechanical atomic model, electronic configurations, and line emission spectra.',
  },
  {
    id: 'unit-sec2-t1-u2',
    termId: 'term-secondary-2-1',
    slug: 'periodic-table-and-periodicity',
    title: 'Unit 2: Periodic Table and Periodicity of Properties',
    order: 2,
    description:
      'Periodic trends across periods and groups: atomic radii, ionization energy, electronegativity, and oxide characteristics.',
  },

  // Grade 2 - Second Term
  {
    id: 'unit-sec2-t2-u3',
    termId: 'term-secondary-2-2',
    slug: 'chemical-bonding-and-molecular-shapes',
    title: 'Unit 3: Chemical Bonding and Molecular Shapes',
    order: 1,
    description:
      'Ionic, covalent, coordinate, and hydrogen bonding, and their influence on physical properties.',
  },
  {
    id: 'unit-sec2-t2-u4',
    termId: 'term-secondary-2-2',
    slug: 'representative-main-group-elements',
    title: 'Unit 4: Representative Main Group Elements',
    order: 2,
    description:
      'Characteristic chemistry of Group 1A alkali metals and Group 5A p-block elements.',
  },

  // Grade 3 - First Term
  {
    id: 'unit-sec3-t1-u1',
    termId: 'term-secondary-3-1',
    slug: 'transition-elements',
    title: 'Unit 1: Transition Elements',
    order: 1,
    description:
      'Electronic structure, magnetic properties, colored ions, and catalytic activity of the first transition series.',
  },
  {
    id: 'unit-sec3-t1-u2',
    termId: 'term-secondary-3-1',
    slug: 'chemical-analysis',
    title: 'Unit 2: Chemical Analysis',
    order: 2,
    description:
      'Systematic qualitative identification of inorganic anions and cations, and quantitative volumetric analysis.',
  },
  {
    id: 'unit-sec3-t1-u3',
    termId: 'term-secondary-3-1',
    slug: 'chemical-equilibrium',
    title: 'Unit 3: Chemical Equilibrium',
    order: 3,
    description:
      'Reversible reactions, dynamic equilibrium, equilibrium constants, and Le Chatelier principle.',
  },

  // Grade 3 - Second Term
  {
    id: 'unit-sec3-t2-u4',
    termId: 'term-secondary-3-2',
    slug: 'electrochemistry',
    title: 'Unit 4: Electrochemistry',
    order: 1,
    description:
      'Redox reactions, standard electrode potentials, galvanic cells, battery technology, and electrolytic cells.',
  },
  {
    id: 'unit-sec3-t2-u5',
    termId: 'term-secondary-3-2',
    slug: 'organic-chemistry',
    title: 'Unit 5: Organic Chemistry',
    order: 2,
    description:
      'Carbon chemistry, hydrocarbons (alkanes, alkenes, alkynes), aromatic compounds, alcohols, and carboxylic acid derivatives.',
  },
]

export const egyptianLessons: readonly Lesson[] = [
  // Grade 1 - Term 1
  {
    id: 'lesson-sec1-t1-u1-l1',
    unitId: 'unit-sec1-t1-u1',
    slug: 'chemistry-and-measurement',
    title: 'Lesson 1: Chemistry and Measurement',
    order: 1,
    description:
      'Practical laboratory tools for volume measurement, mass determination, and pH assessment.',
  },
  {
    id: 'lesson-sec1-t1-u3-l1',
    unitId: 'unit-sec1-t1-u3',
    slug: 'solutions-and-solubility',
    title: 'Lesson 1: Solutions and Solubility',
    order: 1,
    description: 'Formation of homogeneous liquid solutions and factors affecting solubility.',
  },
  {
    id: 'lesson-sec1-t1-u3-l2',
    unitId: 'unit-sec1-t1-u3',
    slug: 'colloids-and-tyndall-effect',
    title: 'Lesson 2: Colloids and the Tyndall Effect',
    order: 2,
    description:
      'Distinguishing true solutions from suspensions and colloids using optical light scattering.',
  },
  {
    id: 'lesson-sec1-t1-u3-l3',
    unitId: 'unit-sec1-t1-u3',
    slug: 'acid-base-indicators-and-titration',
    title: 'Lesson 3: Acid-Base Indicators and Titration',
    order: 3,
    description:
      'Color transitions of standard indicators and volumetric neutralization of hydrochloric acid with sodium hydroxide.',
  },

  // Grade 1 - Term 2
  {
    id: 'lesson-sec1-t2-u4-l1',
    unitId: 'unit-sec1-t2-u4',
    slug: 'heat-of-solution-and-calorimetry',
    title: 'Lesson 1: Heat of Solution and Calorimetry',
    order: 1,
    description:
      'Measurement of temperature changes during solute dissolution using an insulated calorimeter.',
  },
  {
    id: 'lesson-sec1-t2-u4-l2',
    unitId: 'unit-sec1-t2-u4',
    slug: 'heat-of-neutralization',
    title: 'Lesson 2: Heat of Neutralization',
    order: 2,
    description:
      'Quantitative determination of enthalpy change during strong acid-strong base neutralization.',
  },

  // Grade 2 - Term 1
  {
    id: 'lesson-sec2-t1-u1-l1',
    unitId: 'unit-sec2-t1-u1',
    slug: 'atomic-emission-spectra-flame-tests',
    title: 'Lesson 1: Atomic Emission Spectra and Flame Tests',
    order: 1,
    description:
      'Identification of metal cations through their characteristic flame emission colors.',
  },
  {
    id: 'lesson-sec2-t1-u2-l1',
    unitId: 'unit-sec2-t1-u2',
    slug: 'acidic-and-basic-properties-of-oxides',
    title: 'Lesson 1: Acidic and Basic Properties of Oxides',
    order: 1,
    description: 'Chemical behavior of basic metal oxides and acidic non-metal oxides in water.',
  },
  {
    id: 'lesson-sec2-t1-u2-l2',
    unitId: 'unit-sec2-t1-u2',
    slug: 'chemical-activity-of-halogens',
    title: 'Lesson 2: Chemical Activity of Halogens',
    order: 2,
    description:
      'Single displacement reactions demonstrating decreasing oxidizing ability down Group 7A.',
  },

  // Grade 2 - Term 2
  {
    id: 'lesson-sec2-t2-u3-l1',
    unitId: 'unit-sec2-t2-u3',
    slug: 'electrical-conductivity-of-solutions',
    title: 'Lesson 1: Electrical Conductivity of Solutions',
    order: 1,
    description:
      'Testing electrolytic dissociation of ionic salts, strong acids, weak acids, and non-electrolytes.',
  },
  {
    id: 'lesson-sec2-t2-u4-l1',
    unitId: 'unit-sec2-t2-u4',
    slug: 'properties-of-alkali-metals',
    title: 'Lesson 1: Properties of Alkali Metals (Group 1A)',
    order: 1,
    description:
      'Vigorous reaction of metallic sodium with water and testing the alkaline solution formed.',
  },
  {
    id: 'lesson-sec2-t2-u4-l2',
    unitId: 'unit-sec2-t2-u4',
    slug: 'nitrogen-compounds-and-ammonia-gas',
    title: 'Lesson 2: Nitrogen Compounds and Ammonia Gas',
    order: 2,
    description:
      'Laboratory generation of dry ammonia gas and demonstration of its high water solubility via the fountain experiment.',
  },

  // Grade 3 - Term 1
  {
    id: 'lesson-sec3-t1-u1-l1',
    unitId: 'unit-sec3-t1-u1',
    slug: 'catalytic-activity-transition-metals',
    title: 'Lesson 1: Catalytic Activity of Transition Metal Compounds',
    order: 1,
    description:
      'Heterogeneous catalytic decomposition of hydrogen peroxide accelerated by manganese(IV) oxide.',
  },
  {
    id: 'lesson-sec3-t1-u2-l1',
    unitId: 'unit-sec3-t1-u2',
    slug: 'qualitative-detection-of-anions',
    title: 'Lesson 1: Qualitative Detection of Anions',
    order: 1,
    description:
      'Confirmatory test tube reactions for carbonate, thiosulfate, sulfite, and halide anions.',
  },
  {
    id: 'lesson-sec3-t1-u2-l2',
    unitId: 'unit-sec3-t1-u2',
    slug: 'qualitative-detection-of-cations',
    title: 'Lesson 2: Qualitative Detection of Cations',
    order: 2,
    description:
      'Precipitation and solubility tests for iron(II), iron(III), and aluminum(III) using sodium hydroxide and ammonia.',
  },
  {
    id: 'lesson-sec3-t1-u2-l3',
    unitId: 'unit-sec3-t1-u2',
    slug: 'quantitative-volumetric-analysis',
    title: 'Lesson 3: Quantitative Volumetric Analysis',
    order: 3,
    description:
      'Accurate titration of unknown concentration solutions using calibrated burettes and standard solutions.',
  },
  {
    id: 'lesson-sec3-t1-u3-l1',
    unitId: 'unit-sec3-t1-u3',
    slug: 'le-chateliers-principle-concentration',
    title: 'Lesson 1: Le Chatelier Principle and Concentration Changes',
    order: 1,
    description:
      'Observing color shifts in the iron(III) chloride and ammonium thiocyanate equilibrium system.',
  },

  // Grade 3 - Term 2
  {
    id: 'lesson-sec3-t2-u4-l1',
    unitId: 'unit-sec3-t2-u4',
    slug: 'galvanic-cells-and-cell-potential',
    title: 'Lesson 1: Galvanic Cells and Cell Potential',
    order: 1,
    description:
      'Assembly of zinc-copper Daniell cell with salt bridge and measurement of electromotive force.',
  },
  {
    id: 'lesson-sec3-t2-u4-l2',
    unitId: 'unit-sec3-t2-u4',
    slug: 'electrolytic-cells-and-electrolysis',
    title: 'Lesson 2: Electrolytic Cells and Electrolysis',
    order: 2,
    description:
      'Non-spontaneous chemical changes driven by external direct current through copper(II) chloride solution.',
  },
  {
    id: 'lesson-sec3-t2-u5-l1',
    unitId: 'unit-sec3-t2-u5',
    slug: 'detection-carbon-hydrogen-organics',
    title: 'Lesson 1: Detection of Carbon and Hydrogen in Organic Compounds',
    order: 1,
    description:
      'Oxidation of organic matter with copper(II) oxide to detect carbon dioxide and water vapor.',
  },
  {
    id: 'lesson-sec3-t2-u5-l2',
    unitId: 'unit-sec3-t2-u5',
    slug: 'preparation-ethene-testing-unsaturation',
    title: 'Lesson 2: Preparation of Ethene and Testing Unsaturation',
    order: 2,
    description:
      'Dehydration of ethanol with concentrated sulfuric acid and Baeyer alkaline potassium permanganate test.',
  },
  {
    id: 'lesson-sec3-t2-u5-l3',
    unitId: 'unit-sec3-t2-u5',
    slug: 'esters-and-esterification-reaction',
    title: 'Lesson 3: Esters and Esterification Reaction',
    order: 3,
    description:
      'Reversible condensation between ethanoic acid and ethanol in the presence of concentrated sulfuric acid.',
  },
]

const rawEgyptianExperiments: readonly Experiment[] = [
  // 1. Existing playable salt dissolution experiment (Grade 1 Term 1, Unit 3, Lesson 1)
  {
    id: 'exp-salt-water-001',
    slug: 'dissolving-salt-in-water',
    title: 'Dissolving Salt in Water',
    shortDescription:
      'Observe how sodium chloride disperses in water and distinguish a homogeneous solution from undissolved solid.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 10,
    status: 'demo',
    illustration: 'salt-dissolution',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Wear suitable eye protection as instructed, handle glassware carefully, never taste substances, and clean up water spills.',
      recommendedPpe: ['Eye protection as directed by the instructor'],
    },
    learning: saltDissolutionLearning,
  },

  // 2. Liquid volume (Grade 1 Term 1, Unit 1, Lesson 1)
  {
    id: 'exp-volume-002',
    slug: 'measuring-liquid-volume',
    title: 'Measuring Liquid Volume',
    shortDescription:
      'Introduce the use of graduated glassware and reading the liquid meniscus at eye level.',
    categoryId: 'measurement',
    difficulty: 'beginner',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Handle laboratory glassware carefully and report damaged equipment.',
      recommendedPpe: ['Eye protection'],
    },
    learning: liquidVolumeLearning,
  },

  // 3. pH Indicators (Grade 1 Term 1, Unit 1, Lesson 1)
  {
    id: 'exp-ph-003',
    slug: 'exploring-ph-indicators',
    title: 'Exploring pH Indicators',
    shortDescription:
      'Explore how indicator colors and pH paper classify aqueous samples as acidic, neutral, or basic.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Handle dilute acidic and basic indicator test solutions with care.',
      recommendedPpe: ['Eye protection', 'Laboratory coat'],
    },
    learning: phIndicatorsLearning,
  },

  // 4. Colloids and Tyndall Effect (Grade 1 Term 1, Unit 3, Lesson 2)
  {
    id: 'exp-colloids-004',
    slug: 'distinguishing-solutions-and-colloids',
    title: 'Distinguishing Solutions and Colloids',
    shortDescription:
      'Use a concentrated light beam to observe the Tyndall effect and distinguish a colloidal dispersion from a true aqueous solution.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'none',
      requiresSupervision: false,
      note: 'Non-hazardous aqueous solutions and light beam observation; do not look directly into high-intensity optical beam sources.',
      recommendedPpe: ['Standard lab safety glasses'],
    },
  },

  // 5. Titration (Grade 1 Term 1, Unit 3, Lesson 3)
  {
    id: 'exp-titration-005',
    slug: 'acid-base-neutralization-titration',
    title: 'Acid-Base Neutralization Titration',
    shortDescription:
      'Neutralize dilute hydrochloric acid with standard sodium hydroxide solution using phenolphthalein indicator.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Dilute hydrochloric acid and sodium hydroxide can irritate skin and eyes. Wear chemical splash goggles and disposable gloves.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Laboratory coat'],
    },
  },

  // 6. Heat of Solution Calorimetry (Grade 1 Term 2, Unit 4, Lesson 1)
  {
    id: 'exp-heat-dissolution-006',
    slug: 'measuring-heat-of-solution-calorimeter',
    title: 'Measuring Heat of Solution in a Calorimeter',
    shortDescription:
      'Measure temperature changes when dissolving ammonium nitrate and sodium hydroxide in water using an insulated coffee-cup calorimeter.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'salt-dissolution',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Solid sodium hydroxide pellets are caustic and strongly exothermic upon hydration. Never touch with bare hands; use a clean dry spatula.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Laboratory coat'],
    },
  },

  // 7. Heat of Neutralization (Grade 1 Term 2, Unit 4, Lesson 2)
  {
    id: 'exp-heat-neutralization-007',
    slug: 'determination-heat-of-neutralization',
    title: 'Determination of the Heat of Neutralization',
    shortDescription:
      'Determine the standard molar enthalpy of neutralization by mixing equimolar solutions of hydrochloric acid and sodium hydroxide.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Rapid mixing causes an immediate temperature rise. Add acid slowly to base with continuous stirring while wearing eye protection.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Laboratory coat'],
    },
  },

  // 8. Flame Tests (Grade 2 Term 1, Unit 1, Lesson 1)
  {
    id: 'exp-flame-tests-008',
    slug: 'flame-emission-tests-metal-cations',
    title: 'Flame Emission Tests for Metal Cations',
    shortDescription:
      'Observe distinctive flame emission colors produced by salts of sodium, potassium, calcium, and copper in a Bunsen burner flame.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Open flame and concentrated hydrochloric acid wire-cleaning solution present thermal and vapor hazards. Tie back hair and wear heat-resistant protection.',
      recommendedPpe: ['Safety glasses', 'Heat-resistant apron', 'Nitrile gloves'],
    },
  },

  // 9. Element Oxides (Grade 2 Term 1, Unit 2, Lesson 1)
  {
    id: 'exp-oxides-009',
    slug: 'acidity-and-basicity-of-element-oxides',
    title: 'Acidity and Basicity of Element Oxides',
    shortDescription:
      'Compare the chemical behavior of magnesium oxide and carbon dioxide in water using litmus and universal indicator.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Burning magnesium ribbon produces an intense ultraviolet emission; never look directly at the flame. Use crucible tongs.',
      recommendedPpe: ['Safety goggles with UV attenuation', 'Heat-resistant tongs'],
    },
  },

  // 10. Halogen Displacement (Grade 2 Term 1, Unit 2, Lesson 2)
  {
    id: 'exp-halogen-displacement-010',
    slug: 'halogen-displacement-reactions',
    title: 'Halogen Displacement Reactions',
    shortDescription:
      'React chlorine water with aqueous potassium bromide and potassium iodide to verify the relative oxidizing strength of halogens.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'high',
      requiresSupervision: true,
      note: 'Chlorine water emits toxic, suffocating chlorine gas. Prepare and dispense exclusively inside an operating laboratory fume hood.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Fume hood ventilation'],
    },
  },

  // 11. Electrical Conductivity (Grade 2 Term 2, Unit 3, Lesson 1)
  {
    id: 'exp-conductivity-011',
    slug: 'electrical-conductivity-aqueous-solutions',
    title: 'Electrical Conductivity of Aqueous Solutions',
    shortDescription:
      'Test electrical conductivity of aqueous sodium chloride, hydrochloric acid, acetic acid, and sugar solutions using a conductivity apparatus.',
    categoryId: 'chemistry',
    difficulty: 'beginner',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Low-voltage DC circuit; disconnect power before rinsing electrodes between solutions to prevent mild shock and cross-contamination.',
      recommendedPpe: ['Safety glasses', 'Dry rubber-insulated gloves'],
    },
  },

  // 12. Sodium with Water (Grade 2 Term 2, Unit 4, Lesson 1)
  {
    id: 'exp-sodium-water-012',
    slug: 'reaction-of-sodium-with-water',
    title: 'Reaction of Sodium with Water',
    shortDescription:
      'Place a rice-grain sized piece of metallic sodium in water to observe vigorous hydrogen gas evolution and alkaline solution formation.',
    categoryId: 'chemistry',
    difficulty: 'advanced',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'salt-dissolution',
    safety: {
      level: 'high',
      requiresSupervision: true,
      note: 'Metallic sodium reacts violently with water and can ignite spontaneously. Use only a tiny piece with a safety shield in place.',
      recommendedPpe: ['Full face shield', 'Heavy duty gloves', 'Transparent blast shield'],
    },
  },

  // 13. Ammonia Preparation & Fountain (Grade 2 Term 2, Unit 4, Lesson 2)
  {
    id: 'exp-ammonia-prep-013',
    slug: 'preparation-ammonia-gas-fountain-experiment',
    title: 'Preparation of Ammonia Gas and Fountain Experiment',
    shortDescription:
      'Prepare ammonia gas by heating ammonium chloride with slaked lime, then demonstrate its high solubility with the ammonia fountain experiment.',
    categoryId: 'chemistry',
    difficulty: 'advanced',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'high',
      requiresSupervision: true,
      note: 'Ammonia is a pungent, toxic, and respiratory-irritant gas. Ensure gas-tight glassware joints and conduct inside a chemical fume hood.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Fume hood ventilation'],
    },
  },

  // 14. Catalytic Decomposition H2O2 (Grade 3 Term 1, Unit 1, Lesson 1)
  {
    id: 'exp-catalysis-014',
    slug: 'catalytic-decomposition-hydrogen-peroxide',
    title: 'Catalytic Decomposition of Hydrogen Peroxide',
    shortDescription:
      'Accelerate the decomposition of hydrogen peroxide into water and oxygen gas using manganese(IV) oxide catalyst and test with a glowing splint.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 15,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Concentrated hydrogen peroxide is a strong oxidizing agent that can cause skin burns. Manganese dioxide catalyzes rapid, vigorous effervescence.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Laboratory coat'],
    },
  },

  // 15. Qualitative Detection of Anions (Grade 3 Term 1, Unit 2, Lesson 1)
  {
    id: 'exp-anions-015',
    slug: 'identification-of-acid-radicals-anions',
    title: 'Identification of Acid Radicals (Anions)',
    shortDescription:
      'Identify carbonate, thiosulfate, and chloride salts by observing gas evolution and precipitation with dilute hydrochloric acid and silver nitrate.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Reactions produce choking sulfur dioxide gas and silver nitrate stains skin indelibly. Perform in a well-ventilated laboratory.',
      recommendedPpe: ['Safety glasses', 'Nitrile gloves', 'Fume hood / ventilation'],
    },
  },

  // 16. Qualitative Detection of Cations (Grade 3 Term 1, Unit 2, Lesson 2)
  {
    id: 'exp-cations-016',
    slug: 'identification-of-basic-radicals-cations',
    title: 'Identification of Basic Radicals (Cations)',
    shortDescription:
      'Distinguish iron(II), iron(III), and aluminum cations through characteristic hydroxide precipitates and their solubility in excess sodium hydroxide.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Sodium hydroxide reagent is caustic and damaging to cornea tissue. Wear splash-proof eye protection during addition and dropwise mixing.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Laboratory coat'],
    },
  },

  // 17. Neutralization Titration with Methyl Orange (Grade 3 Term 1, Unit 2, Lesson 3)
  {
    id: 'exp-volumetric-titration-017',
    slug: 'neutralization-titration-methyl-orange',
    title: 'Neutralization Titration using Methyl Orange',
    shortDescription:
      'Standardize a hydrochloric acid solution of unknown concentration against standard sodium carbonate solution using methyl orange indicator.',
    categoryId: 'measurement',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 30,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Secure the burette clamp firmly and fill using a small funnel below eye level to prevent facial acid splashes.',
      recommendedPpe: ['Safety goggles', 'Laboratory apron'],
    },
  },

  // 18. Le Chatelier Equilibrium (Grade 3 Term 1, Unit 3, Lesson 1)
  {
    id: 'exp-equilibrium-018',
    slug: 'chemical-equilibrium-le-chatelier',
    title: 'Chemical Equilibrium and Le Chatelier Principle',
    shortDescription:
      'Demonstrate dynamic equilibrium shifts by perturbing the reversible reaction between iron(III) chloride and ammonium thiocyanate.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'ph-indicators',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Ammonium thiocyanate and iron(III) chloride solutions are mildly toxic; avoid skin contact and ingestion.',
      recommendedPpe: ['Safety glasses', 'Nitrile gloves'],
    },
  },

  // 19. Daniell Galvanic Cell (Grade 3 Term 2, Unit 4, Lesson 1)
  {
    id: 'exp-daniell-cell-019',
    slug: 'constructing-daniell-galvanic-cell',
    title: 'Constructing a Daniell Galvanic Cell',
    shortDescription:
      'Assemble a zinc-copper Daniell cell with a potassium nitrate salt bridge and measure its open-circuit potential with a digital voltmeter.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'low',
      requiresSupervision: true,
      note: 'Copper(II) sulfate and zinc sulfate solutions are hazardous to aquatic organisms; collect heavy metal wastes in dedicated containers.',
      recommendedPpe: ['Safety glasses', 'Nitrile gloves'],
    },
  },

  // 20. Electrolysis of Copper(II) Chloride (Grade 3 Term 2, Unit 4, Lesson 2)
  {
    id: 'exp-electrolysis-020',
    slug: 'electrolysis-copper-chloride-solution',
    title: 'Electrolysis of Copper(II) Chloride Solution',
    shortDescription:
      'Electrolyze aqueous copper(II) chloride using carbon electrodes to observe copper metal deposition at the cathode and chlorine gas evolution at the anode.',
    categoryId: 'chemistry',
    difficulty: 'advanced',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Toxic chlorine gas is liberated at the anode during electrolysis. Run the apparatus in a fume hood and disconnect current immediately when done.',
      recommendedPpe: ['Chemical splash goggles', 'Nitrile gloves', 'Fume hood ventilation'],
    },
  },

  // 21. Detection of C and H in Organics (Grade 3 Term 2, Unit 5, Lesson 1)
  {
    id: 'exp-organic-detection-021',
    slug: 'detection-carbon-hydrogen-organic-matter',
    title: 'Detection of Carbon and Hydrogen in Organic Matter',
    shortDescription:
      'Heat organic material with black copper(II) oxide to confirm carbon via limewater turbidity and hydrogen via anhydrous copper(II) sulfate.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 20,
    status: 'planned',
    illustration: 'salt-dissolution',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Strong heating of borosilicate combustion tubes requires clamped test tube holders; point the open mouth away from students.',
      recommendedPpe: ['Safety goggles', 'Heat-resistant gloves', 'Laboratory coat'],
    },
  },

  // 22. Preparation of Ethene & Baeyer Test (Grade 3 Term 2, Unit 5, Lesson 2)
  {
    id: 'exp-ethylene-prep-022',
    slug: 'preparation-ethene-baeyers-test',
    title: 'Preparation of Ethene and Baeyer Test',
    shortDescription:
      'Prepare ethene gas by catalytic dehydration of ethanol at 180°C and test its double bond unsaturation using alkaline potassium permanganate.',
    categoryId: 'chemistry',
    difficulty: 'advanced',
    estimatedDurationMinutes: 30,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'high',
      requiresSupervision: true,
      note: 'Hot concentrated sulfuric acid at 180°C is extremely corrosive and can cause severe chemical burns. Ethene gas is flammable. Work strictly in a fume hood.',
      recommendedPpe: ['Full face shield', 'Chemical splash apron', 'Heavy butyl rubber gloves', 'Fume hood'],
    },
  },

  // 23. Esterification Reaction (Grade 3 Term 2, Unit 5, Lesson 3)
  {
    id: 'exp-esterification-023',
    slug: 'synthesis-ethyl-acetate-ester',
    title: 'Synthesis of Ethyl Acetate Ester',
    shortDescription:
      'React glacial acetic acid with ethanol in a warm water bath with concentrated sulfuric acid catalyst to synthesize fragrant ethyl acetate.',
    categoryId: 'chemistry',
    difficulty: 'intermediate',
    estimatedDurationMinutes: 25,
    status: 'planned',
    illustration: 'liquid-volume',
    safety: {
      level: 'medium',
      requiresSupervision: true,
      note: 'Glacial acetic acid produces irritating fumes and ethanol is highly flammable. Heat using an indirect water bath; never use an open burner flame.',
      recommendedPpe: ['Safety glasses', 'Nitrile gloves', 'Indirect warm water bath'],
    },
  },
]

export const egyptianExperiments: readonly Experiment[] = rawEgyptianExperiments.map((exp) => ({
  ...exp,
  learning: experimentLearningContentCatalog[exp.id] ?? exp.learning,
}))

export const egyptianLessonExperiments: readonly LessonExperiment[] = [
  // Grade 1 Term 1 - Unit 1 Lesson 1
  { lessonId: 'lesson-sec1-t1-u1-l1', experimentId: 'exp-volume-002', order: 1 },
  { lessonId: 'lesson-sec1-t1-u1-l1', experimentId: 'exp-ph-003', order: 2 },

  // Grade 1 Term 1 - Unit 3 Lesson 1
  { lessonId: 'lesson-sec1-t1-u3-l1', experimentId: 'exp-salt-water-001', order: 1 },

  // Grade 1 Term 1 - Unit 3 Lesson 2
  { lessonId: 'lesson-sec1-t1-u3-l2', experimentId: 'exp-colloids-004', order: 1 },

  // Grade 1 Term 1 - Unit 3 Lesson 3
  { lessonId: 'lesson-sec1-t1-u3-l3', experimentId: 'exp-titration-005', order: 1 },

  // Grade 1 Term 2 - Unit 4 Lesson 1
  { lessonId: 'lesson-sec1-t2-u4-l1', experimentId: 'exp-heat-dissolution-006', order: 1 },

  // Grade 1 Term 2 - Unit 4 Lesson 2
  { lessonId: 'lesson-sec1-t2-u4-l2', experimentId: 'exp-heat-neutralization-007', order: 1 },

  // Grade 2 Term 1 - Unit 1 Lesson 1
  { lessonId: 'lesson-sec2-t1-u1-l1', experimentId: 'exp-flame-tests-008', order: 1 },

  // Grade 2 Term 1 - Unit 2 Lesson 1
  { lessonId: 'lesson-sec2-t1-u2-l1', experimentId: 'exp-oxides-009', order: 1 },

  // Grade 2 Term 1 - Unit 2 Lesson 2
  { lessonId: 'lesson-sec2-t1-u2-l2', experimentId: 'exp-halogen-displacement-010', order: 1 },

  // Grade 2 Term 2 - Unit 3 Lesson 1
  { lessonId: 'lesson-sec2-t2-u3-l1', experimentId: 'exp-conductivity-011', order: 1 },

  // Grade 2 Term 2 - Unit 4 Lesson 1
  { lessonId: 'lesson-sec2-t2-u4-l1', experimentId: 'exp-sodium-water-012', order: 1 },

  // Grade 2 Term 2 - Unit 4 Lesson 2
  { lessonId: 'lesson-sec2-t2-u4-l2', experimentId: 'exp-ammonia-prep-013', order: 1 },

  // Grade 3 Term 1 - Unit 1 Lesson 1
  { lessonId: 'lesson-sec3-t1-u1-l1', experimentId: 'exp-catalysis-014', order: 1 },

  // Grade 3 Term 1 - Unit 2 Lesson 1
  { lessonId: 'lesson-sec3-t1-u2-l1', experimentId: 'exp-anions-015', order: 1 },

  // Grade 3 Term 1 - Unit 2 Lesson 2
  { lessonId: 'lesson-sec3-t1-u2-l2', experimentId: 'exp-cations-016', order: 1 },

  // Grade 3 Term 1 - Unit 2 Lesson 3
  { lessonId: 'lesson-sec3-t1-u2-l3', experimentId: 'exp-volumetric-titration-017', order: 1 },

  // Grade 3 Term 1 - Unit 3 Lesson 1
  { lessonId: 'lesson-sec3-t1-u3-l1', experimentId: 'exp-equilibrium-018', order: 1 },

  // Grade 3 Term 2 - Unit 4 Lesson 1
  { lessonId: 'lesson-sec3-t2-u4-l1', experimentId: 'exp-daniell-cell-019', order: 1 },

  // Grade 3 Term 2 - Unit 4 Lesson 2
  { lessonId: 'lesson-sec3-t2-u4-l2', experimentId: 'exp-electrolysis-020', order: 1 },

  // Grade 3 Term 2 - Unit 5 Lesson 1
  { lessonId: 'lesson-sec3-t2-u5-l1', experimentId: 'exp-organic-detection-021', order: 1 },

  // Grade 3 Term 2 - Unit 5 Lesson 2
  { lessonId: 'lesson-sec3-t2-u5-l2', experimentId: 'exp-ethylene-prep-022', order: 1 },

  // Grade 3 Term 2 - Unit 5 Lesson 3
  { lessonId: 'lesson-sec3-t2-u5-l3', experimentId: 'exp-esterification-023', order: 1 },
]

export const egyptianCurriculum: CurriculumData = {
  id: 'curriculum-egyptian-secondary-chemistry',
  title: 'Egyptian Secondary Chemistry Curriculum',
  description:
    'Official Egyptian Ministry of Education secondary chemistry curriculum structure for Grades 1, 2, and 3 Secondary.',
  contentStatus: 'reviewed',
  grades: egyptianGrades,
  terms: egyptianTerms,
  units: egyptianUnits,
  lessons: egyptianLessons,
  experiments: egyptianExperiments,
  lessonExperiments: egyptianLessonExperiments,
}
