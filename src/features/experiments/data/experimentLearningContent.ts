import type { ExperimentLearningContent } from '@/types/experiment'

/** 1. Dissolving Salt in Water (Grade 1 Term 1) */
export const saltDissolutionLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Explore what happens when salt dissolves in water. A solution is a mixture that is evenly mixed. The salt is still present even when you cannot see solid grains.',
    'During the demonstration, you use virtual tools to measure water volume and salt mass. You then mix the salt with water and observe the amount of solid salt as you stir.',
    'This activity helps you connect measurements with observations. Dissolved salt is spread through the water as tiny particles. Undissolved salt remains as solid grains.',
  ],
  objectives: [
    { id: 'salt-tools', text: 'Identify the main laboratory tools.' },
    { id: 'salt-water-volume', text: 'Measure water volume using the virtual tools.' },
    { id: 'salt-mass', text: 'Measure the mass of salt using the virtual balance.' },
    { id: 'salt-dissolving', text: 'Observe how salt dissolves in water.' },
    {
      id: 'salt-observation',
      text: 'Explain the difference between dissolved and undissolved salt.',
    },
  ],
  modelNote:
    'The measurements come from a simplified computer model. They are not readings from real laboratory equipment.',
}

/** 2. Measuring Liquid Volume (Grade 1 Term 1) */
export const liquidVolumeLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'This activity introduces graduated glassware and volumetric liquid measurement in the chemical laboratory.',
    'The focus is reading the concave meniscus at eye level to eliminate parallax errors and comparing the precision of graduated cylinders, volumetric pipettes, and beakers.',
    'Students develop practical competence in selecting appropriate laboratory glassware for specific analytical tolerances.',
  ],
  objectives: [
    { id: 'volume-scale', text: 'Recognize the volume scale and subdivisions on graduated glassware.' },
    { id: 'volume-meniscus', text: 'Locate and read the bottom of a concave liquid meniscus at eye level.' },
    {
      id: 'volume-reading',
      text: 'Explain why parallax error occurs when a scale is viewed from above or below.',
    },
    {
      id: 'volume-comparison',
      text: 'Compare the measurement accuracy of graduated cylinders versus beakers.',
    },
  ],
}

/** 3. Exploring pH Indicators (Grade 1 Term 1) */
export const phIndicatorsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'This activity investigates how chemical indicators and universal pH strips classify aqueous solutions as acidic, neutral, or basic.',
    'Students examine color transitions across known hydrochloric acid, sodium hydroxide, and pure water standards to construct an observational color reference.',
    'The activity connects observable optical changes with the hydrogen ion concentration scale from pH 0 to 14.',
  ],
  objectives: [
    { id: 'ph-groups', text: 'Classify aqueous solutions into acidic, neutral, and basic domains.' },
    { id: 'ph-colors', text: 'Record indicator color transitions in standard acidic and basic media.' },
    { id: 'ph-scale', text: 'Determine numeric pH values using calibrated universal indicator paper.' },
  ],
}

/** 4. Distinguishing Solutions and Colloids (Grade 1 Term 1) */
export const colloidsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Investigate the optical behavior of true solutions, colloidal dispersions, and coarse suspensions using a focused narrow light beam.',
    'Colloidal particles range in diameter between 1 nm and 1000 nm, which is sufficiently large to scatter visible light in all directions—a phenomenon known as the Tyndall effect.',
    'In contrast, solute particles in true solutions are individual ions or small molecules (under 1 nm) that cannot scatter light waves.',
  ],
  objectives: [
    { id: 'colloid-particles', text: 'Differentiate true solutions from colloids based on dispersed particle size.' },
    { id: 'colloid-tyndall', text: 'Demonstrate and explain the Tyndall light scattering effect experimentally.' },
    { id: 'colloid-filtration', text: 'Predict whether colloidal particles pass through standard laboratory filter paper.' },
    { id: 'colloid-stability', text: 'Explain the visual appearance and thermodynamic stability of colloidal mixtures.' },
  ],
}

/** 5. Acid-Base Neutralization Titration (Grade 1 Term 1) */
export const titrationLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Perform a volumetric acid-base neutralization titration using standardized hydrochloric acid and sodium hydroxide.',
    'A burette delivers controlled drops of acid into a conical flask containing base and phenolphthalein indicator until reaching the sharp equivalence endpoint.',
    'Students verify that acid and base react in stoichiometric equivalence to yield neutral aqueous sodium chloride and water.',
  ],
  objectives: [
    { id: 'titration-apparatus', text: 'Assemble and read a calibrated volumetric burette without air bubbles.' },
    { id: 'titration-endpoint', text: 'Identify the permanent single-drop color change at the neutralization endpoint.' },
    { id: 'titration-stoichiometry', text: 'Apply stoichiometric molar ratios to calculate neutralization volumes.' },
    { id: 'titration-safety', text: 'Follow laboratory handling protocols for dilute mineral acids and alkali solutions.' },
  ],
}

/** 6. Heat of Solution Determination (Grade 1 Term 2) */
export const heatDissolutionLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Determine the molar heat of solution using an insulated calorimeter when solid salts dissolve in water.',
    'Dissolution involves breaking solute-solute and solvent-solvent bonds (endothermic) and forming hydrated ion-solvent bonds (exothermic).',
    'Students measure temperature changes to classify ammonium nitrate dissolution as endothermic and sodium hydroxide dissolution as exothermic.',
  ],
  objectives: [
    { id: 'heat-calorimeter', text: 'Operate an insulated calorimeter to measure solution temperature changes.' },
    { id: 'heat-endo-exo', text: 'Classify dissolution processes as endothermic or exothermic based on temperature shifts.' },
    { id: 'heat-calculation', text: 'Calculate enthalpy changes using q = m · c · ΔT and molar quantities.' },
    { id: 'heat-bonds', text: 'Relate observed heat changes to lattice energy and ion hydration energies.' },
  ],
}

/** 7. Heat of Neutralization Measurement (Grade 1 Term 2) */
export const heatNeutralizationLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Measure the standard molar enthalpy of neutralization when equal volumes of strong monoprotic acid and base are mixed.',
    'For any strong acid and strong base, the net ionic reaction is the combination of hydronium and hydroxide ions into liquid water.',
    'Because strong electrolytes are fully dissociated, the standard heat of neutralization has a constant negative value of approximately -57.3 kJ/mol.',
  ],
  objectives: [
    { id: 'neut-net-ionic', text: 'Identify the net ionic reaction common to strong acid-strong base neutralizations.' },
    { id: 'neut-temperature', text: 'Measure peak temperature rise when combining equimolar acid and base solutions.' },
    { id: 'neut-enthalpy', text: 'Calculate the molar heat of neutralization per mole of water produced.' },
  ],
}

/** 8. Flame Test Identification of Alkali Metals (Grade 2 Term 1) */
export const flameTestsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Perform flame tests using a cleaned platinum wire to observe characteristic atomic emission colors of Group 1A and 2A metal cations.',
    'When metal ions absorb thermal energy from the Bunsen flame, outer valence electrons are promoted to higher quantum energy levels.',
    'Upon relaxing back to lower ground levels, the electrons emit electromagnetic radiation at specific wavelengths matching characteristic visible colors.',
  ],
  objectives: [
    { id: 'flame-cleaning', text: 'Clean a platinum wire loop in concentrated hydrochloric acid until flame-neutral.' },
    { id: 'flame-colors', text: 'Identify sodium (golden yellow), potassium (lilac), and calcium (brick red) flame colors.' },
    { id: 'flame-spectra', text: 'Explain flame emission spectra in terms of quantized electronic energy level transitions.' },
    { id: 'flame-cobalt', text: 'Use cobalt blue glass to filter out interfering yellow sodium wavelengths.' },
  ],
}

/** 9. Periodic Trends in Oxide Behavior (Grade 2 Term 1) */
export const oxidesLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Investigate the chemical behavior of main group metal and non-metal oxides across Period 3 of the Periodic Table.',
    'Magnesium burns in oxygen to form basic magnesium oxide, which dissolves in water to turn red litmus blue.',
    'Sulfur burns in oxygen to form acidic sulfur dioxide gas, which dissolves in water to turn blue litmus red, demonstrating the periodic trend from basic to acidic oxides.',
  ],
  objectives: [
    { id: 'oxide-combustion', text: 'Synthesize metal and non-metal oxides safely using combustion spoons in oxygen.' },
    { id: 'oxide-classification', text: 'Classify oxides into basic, acidic, and amphoteric categories via aqueous indicator tests.' },
    { id: 'oxide-trends', text: 'Deduce periodic trends in oxide acidity across a horizontal period.' },
  ],
}

/** 10. Halogen Displacement in Aqueous Halides (Grade 2 Term 1) */
export const halogenDisplacementLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Investigate relative oxidizing strengths among halogens (Group 7A) through single-displacement reactions in aqueous salt solutions.',
    'Chlorine water is added to potassium bromide and potassium iodide solutions, liberating elemental bromine and iodine respectively.',
    'An immiscible organic extraction solvent (cyclohexane) isolates free halogens to confirm characteristic orange and violet colors.',
  ],
  objectives: [
    { id: 'halogen-displacement', text: 'Demonstrate that a more reactive halogen displaces a less reactive halide ion.' },
    { id: 'halogen-organic-layer', text: 'Extract and identify free bromine (orange) and iodine (violet) in organic solvent.' },
    { id: 'halogen-activity-series', text: 'Order chlorine, bromine, and iodine in decreasing sequence of oxidizing power.' },
  ],
}

/** 11. Electrical Conductivity of Electrolytes (Grade 2 Term 2) */
export const conductivityLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Test the electrical conductivity of various solid, molten, and aqueous substances using a closed circuit with an indicator lamp.',
    'Strong electrolytes (aqueous NaCl) completely dissociate into mobile ions that conduct current strongly.',
    'Weak electrolytes (acetic acid) partially dissociate to conduct current weakly, while non-electrolytes (sugar solution) contain no mobile ions and do not conduct.',
  ],
  objectives: [
    { id: 'cond-circuit', text: 'Assemble and operate a safe electrolyte testing circuit with carbon electrodes.' },
    { id: 'cond-classification', text: 'Classify substances into strong electrolytes, weak electrolytes, and non-electrolytes.' },
    { id: 'cond-mechanism', text: 'Explain electrical conduction in solutions through the migration of mobile hydrated ions.' },
  ],
}

/** 12. Reaction of Sodium with Water (Grade 2 Term 2) */
export const sodiumWaterLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Observe the vigorous, exothermic chemical reaction between metallic sodium and water behind a safety shield.',
    'Sodium metal melts into a silvery ball that darts across the water surface, liberating flammable hydrogen gas and forming alkaline sodium hydroxide.',
    'Addition of phenolphthalein confirms the presence of hydroxide ions as the solution turns intense pink.',
  ],
  objectives: [
    { id: 'sod-safety', text: 'Apply strict safety protocols when handling water-reactive alkali metals.' },
    { id: 'sod-observations', text: 'Document physical phenomena: melting, rapid movement, hydrogen gas evolution, and flame.' },
    { id: 'sod-alkaline', text: 'Confirm the formation of sodium hydroxide using phenolphthalein indicator.' },
    { id: 'sod-equation', text: 'Write and balance the chemical equation for sodium reacting with water.' },
  ],
}

/** 13. Laboratory Preparation and Fountain Test of Ammonia (Grade 2 Term 2) */
export const ammoniaPrepLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Prepare dry ammonia gas by heating ammonium chloride with slaked lime, drying the gas over quicklime, and collecting it by inverted displacement of air.',
    'The classic ammonia fountain experiment demonstrates both the immense aqueous solubility of ammonia and its alkaline reaction in water.',
    'Water injected into an inverted ammonia flask dissolves the gas instantly, causing an atmospheric pressure surge that drives a vivid blue litmus fountain.',
  ],
  objectives: [
    { id: 'amm-prep', text: 'Assemble apparatus for heating dry solids and collecting less dense gases.' },
    { id: 'amm-drying', text: 'Explain why quicklime (CaO) is used as a drying agent instead of concentrated H₂SO₄.' },
    { id: 'amm-fountain', text: 'Conduct the fountain experiment to demonstrate high solubility and alkalinity.' },
  ],
}

/** 14. Catalytic Decomposition of Hydrogen Peroxide (Grade 3 Term 1) */
export const catalysisLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Study how transition metal catalysts accelerate chemical reaction rates by decomposing aqueous hydrogen peroxide using manganese dioxide powder.',
    'Students collect evolved oxygen gas over timed intervals to measure reaction velocity with and without the catalyst.',
    'Weighing the recovered manganese dioxide confirms that catalysts participate in lowering activation energy without being permanently consumed.',
  ],
  objectives: [
    { id: 'cat-rate', text: 'Measure the rate of oxygen gas evolution over time using a gas syringe or water displacement.' },
    { id: 'cat-definition', text: 'Verify experimentally that a catalyst alters rate without changing its mass or composition.' },
    { id: 'cat-transition-metals', text: 'Explain catalytic activity of transition metals via variable oxidation states and vacant d-orbitals.' },
  ],
}

/** 15. Qualitative Analysis and Confirmatory Tests of Acidic Anions (Grade 3 Term 1) */
export const anionsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Systematically detect and distinguish acidic radicals (carbonate, bicarbonate, sulfite, sulfide, and thiosulfate) using dilute hydrochloric acid.',
    'Evolved gases produce distinct confirmatory reactions: carbon dioxide turns clear limewater turbid, while sulfur dioxide turns acidified potassium dichromate paper green.',
    'Students record diagnostic precipitate colors and gas odors according to classical qualitative inorganic analysis.',
  ],
  objectives: [
    { id: 'anions-main-test', text: 'Perform primary test reactions by adding dilute HCl to unknown solid anion salts.' },
    { id: 'anions-gas-identification', text: 'Identify characteristic evolved gases using limewater and acidified potassium dichromate.' },
    { id: 'anions-confirmatory', text: 'Execute confirmatory silver nitrate and barium chloride precipitation tests.' },
  ],
}

/** 16. Systematic Separation and Confirmation of Basic Radicals (Grade 3 Term 1) */
export const cationsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Identify and confirm transition and main group cations (Cu²⁺, Fe²⁺, Fe³⁺, and Al³⁺) in aqueous solutions using group precipitation reagents.',
    'Addition of sodium hydroxide produces distinct hydroxide precipitates: pale blue Cu(OH)₂, dirty green Fe(OH)₂, reddish-brown Fe(OH)₃, and white gelatinous Al(OH)₃.',
    'Excess reagent differentiates amphoteric aluminum hydroxide (which dissolves to form sodium meta-aluminate) from non-amphoteric transition hydroxides.',
  ],
  objectives: [
    { id: 'cat-precipitates', text: 'Synthesize and identify gelatinous hydroxide precipitates for Cu²⁺, Fe²⁺, Fe³⁺, and Al³⁺.' },
    { id: 'cat-amphoteric', text: 'Demonstrate amphoteric dissolution of aluminum hydroxide in excess strong base.' },
    { id: 'cat-equations', text: 'Formulate ionic precipitation equations for analytical group detection.' },
  ],
}

/** 17. Quantitative Neutralization Titration (Grade 3 Term 1) */
export const volumetricTitrationLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Carry out a quantitative volumetric analysis to determine the exact concentration of an unknown hydrochloric acid solution using standard sodium carbonate.',
    'Students practice analytical techniques: primary standard preparation, volumetric flask filling, meniscus reading, and burette drop calibration.',
    'Titration data is collected to concordancy and evaluated using the volumetric equation (Ma · Va / na = Mb · Vb / nb).',
  ],
  objectives: [
    { id: 'vol-standard', text: 'Prepare an accurate primary standard solution using analytical balance and volumetric flask.' },
    { id: 'vol-concordant', text: 'Perform multiple titration trials to achieve concordant titres within 0.1 mL.' },
    { id: 'vol-calculation', text: 'Calculate the molarity, concentration in g/L, and percentage purity of the analyte.' },
  ],
}

/** 18. Effect of Concentration on Reversible Chemical Equilibrium (Grade 3 Term 1) */
export const equilibriumLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Investigate the dynamic response of reversible homogeneous equilibria to concentration perturbations using the iron(III)-thiocyanate system.',
    'Mixing yellow FeCl₃ with colorless NH₄SCN establishes an equilibrium containing blood-red Fe(SCN)₃ complex.',
    'Adding excess reactant deepens the red color, while adding ammonium chloride shifts equilibrium in the reverse direction, visually confirming Le Chatelier’s principle.',
  ],
  objectives: [
    { id: 'eq-dynamic', text: 'Describe dynamic chemical equilibrium where forward and reverse rates are equal.' },
    { id: 'eq-le-chatelier', text: 'Predict and explain concentration shift directions using Le Chatelier’s principle.' },
    { id: 'eq-colorimetry', text: 'Relate solution color intensity to equilibrium complex concentration.' },
  ],
}

/** 19. Construction and Voltage Measurement of Daniell Galvanic Cell (Grade 3 Term 2) */
export const daniellCellLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Construct a classical Daniell galvanic cell consisting of zinc and copper half-cells connected by an external circuit and a potassium nitrate salt bridge.',
    'A spontaneous oxidation-reduction reaction occurs: zinc atoms oxidize at the anode, while copper ions reduce onto the cathode.',
    'Students measure the cell electromotive force (EMF) with a high-resistance digital voltmeter to verify the theoretical standard potential of +1.10 V.',
  ],
  objectives: [
    { id: 'dan-assembly', text: 'Assemble half-cells and prime a potassium nitrate salt bridge to maintain electrical neutrality.' },
    { id: 'dan-emf', text: 'Measure standard cell electromotive force (EMF) using a digital voltmeter.' },
    { id: 'dan-half-reactions', text: 'Write oxidation, reduction, and overall cell reactions with IUPAC cell notation.' },
    { id: 'dan-salt-bridge', text: 'Explain the essential role of the salt bridge in completing the circuit and preventing polarization.' },
  ],
}

/** 20. Electrolytic Decomposition of Aqueous Copper Sulfate (Grade 3 Term 2) */
export const electrolysisLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Investigate non-spontaneous electrolytic decomposition by passing direct electric current through aqueous copper(II) sulfate using inert carbon electrodes.',
    'Electrical energy drives reduction of Cu²⁺ ions to metallic copper at the cathode, while water oxidizes at the anode to liberate oxygen gas.',
    'Students analyze the relationship between electrical charge passed and mass of deposited copper in accordance with Faraday’s laws of electrolysis.',
  ],
  objectives: [
    { id: 'elec-cell', text: 'Construct an electrolytic cell with DC power source, ammeter, and electrodes.' },
    { id: 'elec-electrodes', text: 'Distinguish anode (oxidation) and cathode (reduction) reactions in an electrolytic system.' },
    { id: 'elec-faraday', text: 'State and apply Faraday’s first law relating deposit mass to electrical current and time.' },
  ],
}

/** 21. Qualitative Detection of Carbon and Hydrogen in Organic Compounds (Grade 3 Term 2) */
export const organicDetectionLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Demonstrate that carbon and hydrogen are the fundamental constituents of all organic matter by heating a test substance with black copper(II) oxide.',
    'Oxidation converts organic carbon into carbon dioxide and organic hydrogen into water vapor.',
    'Evolved vapors are passed over white anhydrous copper(II) sulfate (which turns blue) and through clear limewater (which turns turbid), confirming hydrogen and carbon.',
  ],
  objectives: [
    { id: 'org-apparatus', text: 'Assemble a hard-glass combustion tube connected to condensation and absorption vessels.' },
    { id: 'org-detection-c', text: 'Confirm the presence of carbon through carbon dioxide formation and limewater turbidity.' },
    { id: 'org-detection-h', text: 'Confirm the presence of hydrogen through water vapor condensation and copper sulfate hydration.' },
    { id: 'org-equations', text: 'Write balanced equations for the oxidation of organic constituents by copper(II) oxide.' },
  ],
}

/** 22. Laboratory Preparation and Properties of Ethene Gas (Grade 3 Term 2) */
export const ethylenePrepLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Synthesize ethene (ethylene), the simplest alkene, by catalytic dehydration of absolute ethanol with concentrated sulfuric acid at 180°C.',
    'The product gas is washed through sodium hydroxide solution to remove acidic sulfur dioxide contaminants and collected over water.',
    'Students test the unsaturated carbon-carbon double bond by observing rapid decolorization of reddish bromine water in carbon tetrachloride and alkaline potassium permanganate (Baeyer’s test).',
  ],
  objectives: [
    { id: 'eth-prep', text: 'Assemble distillation glassware with thermometer and caustic wash bottle for gas generation.' },
    { id: 'eth-dehydration', text: 'Explain the role of concentrated sulfuric acid as a dehydrating agent at 180°C.' },
    { id: 'eth-bromine-test', text: 'Perform the bromine water addition test to detect alkene unsaturation.' },
    { id: 'eth-baeyer-test', text: 'Conduct Baeyer’s test and explain oxidation to ethylene glycol.' },
  ],
}

/** 23. Synthesis and Odor Detection of an Ester (Grade 3 Term 2) */
export const esterificationLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'Synthesize ethyl acetate ester through reversible condensation between glacial acetic acid and absolute ethanol catalyzed by concentrated sulfuric acid.',
    'The reaction mixture is warmed in a gentle water bath before being poured into sodium carbonate solution to neutralize unreacted acid.',
    'Students detect the characteristic sweet, fruity aroma of the ester product and analyze esterification as a reversible condensation equilibrium.',
  ],
  objectives: [
    { id: 'est-reaction', text: 'Synthesize an ester by heating a carboxylic acid and alcohol with sulfuric acid catalyst.' },
    { id: 'est-neutralization', text: 'Use sodium carbonate solution to quench excess acid and isolate volatile ester aroma.' },
    { id: 'est-mechanism', text: 'Write the esterification equilibrium equation and identify the role of the dehydrating catalyst.' },
    { id: 'est-safety', text: 'Employ safe wafting technique to detect chemical odors without inhalation risk.' },
  ],
}

/** Complete catalog lookup for all 23 Egyptian curriculum experiments. */
export const experimentLearningContentCatalog: Record<string, ExperimentLearningContent> = {
  'exp-salt-water-001': saltDissolutionLearning,
  'exp-volume-002': liquidVolumeLearning,
  'exp-ph-003': phIndicatorsLearning,
  'exp-colloids-004': colloidsLearning,
  'exp-titration-005': titrationLearning,
  'exp-heat-dissolution-006': heatDissolutionLearning,
  'exp-heat-neutralization-007': heatNeutralizationLearning,
  'exp-flame-tests-008': flameTestsLearning,
  'exp-oxides-009': oxidesLearning,
  'exp-halogen-displacement-010': halogenDisplacementLearning,
  'exp-conductivity-011': conductivityLearning,
  'exp-sodium-water-012': sodiumWaterLearning,
  'exp-ammonia-prep-013': ammoniaPrepLearning,
  'exp-catalysis-014': catalysisLearning,
  'exp-anions-015': anionsLearning,
  'exp-cations-016': cationsLearning,
  'exp-volumetric-titration-017': volumetricTitrationLearning,
  'exp-equilibrium-018': equilibriumLearning,
  'exp-daniell-cell-019': daniellCellLearning,
  'exp-electrolysis-020': electrolysisLearning,
  'exp-organic-detection-021': organicDetectionLearning,
  'exp-ethylene-prep-022': ethylenePrepLearning,
  'exp-esterification-023': esterificationLearning,
}

export function getExperimentLearningContent(experimentId: string): ExperimentLearningContent | undefined {
  return experimentLearningContentCatalog[experimentId]
}
