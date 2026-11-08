-- Task T38: Real Egyptian Secondary Chemistry Curriculum Seed
-- Depends on:
--   202611070003_curriculum_management.sql (curriculum_grades, curriculum_terms, curriculum_units, curriculum_lessons, curriculum_lesson_experiments)
--   202611070004_experiment_management.sql (experiment_categories, experiments)
-- Idempotent seed migration (INSERT ... ON CONFLICT DO NOTHING) populating official Egyptian
-- Ministry of Education secondary chemistry curriculum for Grades 1, 2, and 3 Secondary.

-- 1. Secondary Grades (Non-destructive idempotency)
insert into public.curriculum_grades (id, slug, stage, level, title, description, sort_order)
values
  ('grade-secondary-1', 'secondary-1', 'secondary', 1, 'First Secondary Grade', 'Foundational secondary chemistry structure.', 1),
  ('grade-secondary-2', 'secondary-2', 'secondary', 2, 'Second Secondary Grade', 'Intermediate secondary chemistry structure.', 2),
  ('grade-secondary-3', 'secondary-3', 'secondary', 3, 'Third Secondary Grade', 'Advanced secondary chemistry structure.', 3)
on conflict (id) do nothing;

-- 2. Academic Terms (Non-destructive idempotency)
insert into public.curriculum_terms (id, grade_id, slug, term_number, title, description, sort_order)
values
  ('term-secondary-1-1', 'grade-secondary-1', 'term-1', 1, 'First Term', 'Chemistry & Measurement, and Solutions, Colloids, Acids and Bases.', 1),
  ('term-secondary-1-2', 'grade-secondary-1', 'term-2', 2, 'Second Term', 'Thermochemistry, Calorimetry, and Enthalpy Changes.', 2),
  ('term-secondary-2-1', 'grade-secondary-2', 'term-1', 1, 'First Term', 'Atomic Structure, Quantum Principles, and Periodic Trends of Elements.', 1),
  ('term-secondary-2-2', 'grade-secondary-2', 'term-2', 2, 'Second Term', 'Chemical Bonding, Molecular Shapes, and Representative Main Group Elements.', 2),
  ('term-secondary-3-1', 'grade-secondary-3', 'term-1', 1, 'First Term', 'Transition Elements, Qualitative & Quantitative Chemical Analysis, and Equilibrium.', 1),
  ('term-secondary-3-2', 'grade-secondary-3', 'term-2', 2, 'Second Term', 'Electrochemistry, Electrochemical Cells, and Organic Chemistry.', 2)
on conflict (id) do nothing;

-- 3. Curriculum Units (Egyptian Ministry of Education secondary chemistry syllabus)
insert into public.curriculum_units (id, term_id, slug, title, description, sort_order, publication_status)
values
  -- Grade 1 - First Term
  (
    'unit-sec1-t1-u1',
    'term-secondary-1-1',
    'chemistry-the-central-science',
    'Unit 1: Chemistry: The Central Science',
    'Fundamental concepts of chemistry as a central science, laboratory safety, and quantitative apparatus.',
    1,
    'published'
  ),
  (
    'unit-sec1-t1-u3',
    'term-secondary-1-1',
    'solutions-colloids-acids-and-bases',
    'Unit 3: Solutions, Colloids, and Acids & Bases',
    'Properties of mixtures, solubility curves, distinguishing colloids from true solutions, and acid-base neutralization.',
    2,
    'published'
  ),

  -- Grade 1 - Second Term
  (
    'unit-sec1-t2-u4',
    'term-secondary-1-2',
    'thermochemistry',
    'Unit 4: Thermochemistry',
    'Heat energy changes in physical and chemical processes, calorimetry, and standard enthalpy changes.',
    1,
    'published'
  ),

  -- Grade 2 - First Term
  (
    'unit-sec2-t1-u1',
    'term-secondary-2-1',
    'atomic-structure',
    'Unit 1: Atomic Structure',
    'Quantum mechanical atomic model, electronic configurations, and line emission spectra.',
    1,
    'published'
  ),
  (
    'unit-sec2-t1-u2',
    'term-secondary-2-1',
    'periodic-table-and-periodicity',
    'Unit 2: Periodic Table and Periodicity of Properties',
    'Periodic trends across periods and groups: atomic radii, ionization energy, electronegativity, and oxide characteristics.',
    2,
    'published'
  ),

  -- Grade 2 - Second Term
  (
    'unit-sec2-t2-u3',
    'term-secondary-2-2',
    'chemical-bonding-and-molecular-shapes',
    'Unit 3: Chemical Bonding and Molecular Shapes',
    'Ionic, covalent, coordinate, and hydrogen bonding, and their influence on physical properties.',
    1,
    'published'
  ),
  (
    'unit-sec2-t2-u4',
    'term-secondary-2-2',
    'representative-main-group-elements',
    'Unit 4: Representative Main Group Elements',
    'Characteristic chemistry of Group 1A alkali metals and Group 5A p-block elements.',
    2,
    'published'
  ),

  -- Grade 3 - First Term
  (
    'unit-sec3-t1-u1',
    'term-secondary-3-1',
    'transition-elements',
    'Unit 1: Transition Elements',
    'Electronic structure, magnetic properties, colored ions, and catalytic activity of the first transition series.',
    1,
    'published'
  ),
  (
    'unit-sec3-t1-u2',
    'term-secondary-3-1',
    'chemical-analysis',
    'Unit 2: Chemical Analysis',
    'Systematic qualitative identification of inorganic anions and cations, and quantitative volumetric analysis.',
    2,
    'published'
  ),
  (
    'unit-sec3-t1-u3',
    'term-secondary-3-1',
    'chemical-equilibrium',
    'Unit 3: Chemical Equilibrium',
    'Reversible reactions, dynamic equilibrium, equilibrium constants, and Le Chatelier principle.',
    3,
    'published'
  ),

  -- Grade 3 - Second Term
  (
    'unit-sec3-t2-u4',
    'term-secondary-3-2',
    'electrochemistry',
    'Unit 4: Electrochemistry',
    'Redox reactions, standard electrode potentials, galvanic cells, battery technology, and electrolytic cells.',
    1,
    'published'
  ),
  (
    'unit-sec3-t2-u5',
    'term-secondary-3-2',
    'organic-chemistry',
    'Unit 5: Organic Chemistry',
    'Carbon chemistry, hydrocarbons (alkanes, alkenes, alkynes), aromatic compounds, alcohols, and carboxylic acid derivatives.',
    2,
    'published'
  )
on conflict (id) do nothing;

-- 4. Curriculum Lessons (Only lessons that include practical experiments)
insert into public.curriculum_lessons (id, unit_id, slug, title, description, sort_order, publication_status)
values
  -- Grade 1 - Term 1
  (
    'lesson-sec1-t1-u1-l1',
    'unit-sec1-t1-u1',
    'chemistry-and-measurement',
    'Lesson 1: Chemistry and Measurement',
    'Practical laboratory tools for volume measurement, mass determination, and pH assessment.',
    1,
    'published'
  ),
  (
    'lesson-sec1-t1-u3-l1',
    'unit-sec1-t1-u3',
    'solutions-and-solubility',
    'Lesson 1: Solutions and Solubility',
    'Formation of homogeneous liquid solutions and factors affecting solubility.',
    1,
    'published'
  ),
  (
    'lesson-sec1-t1-u3-l2',
    'unit-sec1-t1-u3',
    'colloids-and-tyndall-effect',
    'Lesson 2: Colloids and the Tyndall Effect',
    'Distinguishing true solutions from suspensions and colloids using optical light scattering.',
    2,
    'published'
  ),
  (
    'lesson-sec1-t1-u3-l3',
    'unit-sec1-t1-u3',
    'acid-base-indicators-and-titration',
    'Lesson 3: Acid-Base Indicators and Titration',
    'Color transitions of standard indicators and volumetric neutralization of hydrochloric acid with sodium hydroxide.',
    3,
    'published'
  ),

  -- Grade 1 - Term 2
  (
    'lesson-sec1-t2-u4-l1',
    'unit-sec1-t2-u4',
    'heat-of-solution-and-calorimetry',
    'Lesson 1: Heat of Solution and Calorimetry',
    'Measurement of temperature changes during solute dissolution using an insulated calorimeter.',
    1,
    'published'
  ),
  (
    'lesson-sec1-t2-u4-l2',
    'unit-sec1-t2-u4',
    'heat-of-neutralization',
    'Lesson 2: Heat of Neutralization',
    'Quantitative determination of enthalpy change during strong acid-strong base neutralization.',
    2,
    'published'
  ),

  -- Grade 2 - Term 1
  (
    'lesson-sec2-t1-u1-l1',
    'unit-sec2-t1-u1',
    'atomic-emission-spectra-flame-tests',
    'Lesson 1: Atomic Emission Spectra and Flame Tests',
    'Identification of metal cations through their characteristic flame emission colors.',
    1,
    'published'
  ),
  (
    'lesson-sec2-t1-u2-l1',
    'unit-sec2-t1-u2',
    'acidic-and-basic-properties-of-oxides',
    'Lesson 1: Acidic and Basic Properties of Oxides',
    'Chemical behavior of basic metal oxides and acidic non-metal oxides in water.',
    1,
    'published'
  ),
  (
    'lesson-sec2-t1-u2-l2',
    'unit-sec2-t1-u2',
    'chemical-activity-of-halogens',
    'Lesson 2: Chemical Activity of Halogens',
    'Single displacement reactions demonstrating decreasing oxidizing ability down Group 7A.',
    2,
    'published'
  ),

  -- Grade 2 - Term 2
  (
    'lesson-sec2-t2-u3-l1',
    'unit-sec2-t2-u3',
    'electrical-conductivity-of-solutions',
    'Lesson 1: Electrical Conductivity of Solutions',
    'Testing electrolytic dissociation of ionic salts, strong acids, weak acids, and non-electrolytes.',
    1,
    'published'
  ),
  (
    'lesson-sec2-t2-u4-l1',
    'unit-sec2-t2-u4',
    'properties-of-alkali-metals',
    'Lesson 1: Properties of Alkali Metals (Group 1A)',
    'Vigorous reaction of metallic sodium with water and testing the alkaline solution formed.',
    1,
    'published'
  ),
  (
    'lesson-sec2-t2-u4-l2',
    'unit-sec2-t2-u4',
    'nitrogen-compounds-and-ammonia-gas',
    'Lesson 2: Nitrogen Compounds and Ammonia Gas',
    'Laboratory generation of dry ammonia gas and demonstration of its high water solubility via the fountain experiment.',
    2,
    'published'
  ),

  -- Grade 3 - Term 1
  (
    'lesson-sec3-t1-u1-l1',
    'unit-sec3-t1-u1',
    'catalytic-activity-transition-metals',
    'Lesson 1: Catalytic Activity of Transition Metal Compounds',
    'Heterogeneous catalytic decomposition of hydrogen peroxide accelerated by manganese(IV) oxide.',
    1,
    'published'
  ),
  (
    'lesson-sec3-t1-u2-l1',
    'unit-sec3-t1-u2',
    'qualitative-detection-of-anions',
    'Lesson 1: Qualitative Detection of Anions',
    'Confirmatory test tube reactions for carbonate, thiosulfate, sulfite, and halide anions.',
    1,
    'published'
  ),
  (
    'lesson-sec3-t1-u2-l2',
    'unit-sec3-t1-u2',
    'qualitative-detection-of-cations',
    'Lesson 2: Qualitative Detection of Cations',
    'Precipitation and solubility tests for iron(II), iron(III), and aluminum(III) using sodium hydroxide and ammonia.',
    2,
    'published'
  ),
  (
    'lesson-sec3-t1-u2-l3',
    'unit-sec3-t1-u2',
    'quantitative-volumetric-analysis',
    'Lesson 3: Quantitative Volumetric Analysis',
    'Accurate titration of unknown concentration solutions using calibrated burettes and standard solutions.',
    3,
    'published'
  ),
  (
    'lesson-sec3-t1-u3-l1',
    'unit-sec3-t1-u3',
    'le-chateliers-principle-concentration',
    'Lesson 1: Le Chatelier Principle and Concentration Changes',
    'Observing color shifts in the iron(III) chloride and ammonium thiocyanate equilibrium system.',
    1,
    'published'
  ),

  -- Grade 3 - Term 2
  (
    'lesson-sec3-t2-u4-l1',
    'unit-sec3-t2-u4',
    'galvanic-cells-and-cell-potential',
    'Lesson 1: Galvanic Cells and Cell Potential',
    'Assembly of zinc-copper Daniell cell with salt bridge and measurement of electromotive force.',
    1,
    'published'
  ),
  (
    'lesson-sec3-t2-u4-l2',
    'unit-sec3-t2-u4',
    'electrolytic-cells-and-electrolysis',
    'Lesson 2: Electrolytic Cells and Electrolysis',
    'Non-spontaneous chemical changes driven by external direct current through copper(II) chloride solution.',
    2,
    'published'
  ),
  (
    'lesson-sec3-t2-u5-l1',
    'unit-sec3-t2-u5',
    'detection-carbon-hydrogen-organics',
    'Lesson 1: Detection of Carbon and Hydrogen in Organic Compounds',
    'Oxidation of organic matter with copper(II) oxide to detect carbon dioxide and water vapor.',
    1,
    'published'
  ),
  (
    'lesson-sec3-t2-u5-l2',
    'unit-sec3-t2-u5',
    'preparation-ethene-testing-unsaturation',
    'Lesson 2: Preparation of Ethene and Testing Unsaturation',
    'Dehydration of ethanol with concentrated sulfuric acid and Baeyer alkaline potassium permanganate test.',
    2,
    'published'
  ),
  (
    'lesson-sec3-t2-u5-l3',
    'unit-sec3-t2-u5',
    'esters-and-esterification-reaction',
    'Lesson 3: Esters and Esterification Reaction',
    'Reversible condensation between ethanoic acid and ethanol in the presence of concentrated sulfuric acid.',
    3,
    'published'
  )
on conflict (id) do nothing;

-- 5. Seed Experiments Metadata
-- Preserves existing salt experiment as 'published' and 'demo'.
-- Marks all new secondary curriculum experiments as 'draft' and 'planned'.
insert into public.experiments (
  id,
  slug,
  title,
  short_description,
  category_id,
  difficulty,
  estimated_duration_minutes,
  simulation_status,
  simulation_id,
  illustration,
  content_review_status,
  publication_status,
  about_paragraphs,
  learning_objectives,
  required_tools,
  required_materials,
  safety_metadata,
  safety_review_status,
  sort_order
)
values
  -- 4. Colloids and Tyndall Effect
  (
    'exp-colloids-004',
    'distinguishing-solutions-and-colloids',
    'Distinguishing Solutions and Colloids',
    'Use a concentrated light beam to observe the Tyndall effect and distinguish a colloidal dispersion from a true aqueous solution.',
    'chemistry',
    'beginner',
    15,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Colloids contain dispersed particles that are larger than simple solute molecules but too small to settle by gravity.",
      "When a focused beam of light passes through a colloidal mixture, the particles scatter light, making the path visible (the Tyndall effect). True solutions do not scatter light."
    ]'::jsonb,
    '[
      {"id": "colloid-identify", "text": "Distinguish between true solutions, colloids, and suspensions."},
      {"id": "colloid-tyndall", "text": "Demonstrate light scattering by colloidal particles using the Tyndall effect."}
    ]'::jsonb,
    '["Beaker", "Glass Stirring Rod", "Laser Pointer / Light Beam Source"]'::jsonb,
    '["Water (H₂O)", "Sodium Chloride (NaCl)", "Starch Solution / Dilute Milk"]'::jsonb,
    '{
      "level": "none",
      "requiresSupervision": false,
      "note": "Non-hazardous aqueous solutions; avoid pointing concentrated light beam directly into eyes.",
      "recommendedPpe": ["Safety glasses"]
    }'::jsonb,
    'draft',
    4
  ),

  -- 5. Acid-Base Titration
  (
    'exp-titration-005',
    'acid-base-neutralization-titration',
    'Acid-Base Neutralization Titration',
    'Neutralize dilute hydrochloric acid with standard sodium hydroxide solution using phenolphthalein indicator.',
    'chemistry',
    'intermediate',
    25,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Titration is a quantitative analytical method to determine the unknown concentration of an acid or base.",
      "A standard solution of base is slowly added from a burette to a known volume of acid until the indicator changes color permanently at the equivalence point."
    ]'::jsonb,
    '[
      {"id": "titration-burette", "text": "Set up and operate a burette with stopcock control."},
      {"id": "titration-endpoint", "text": "Detect the neutralization endpoint with phenolphthalein indicator color change."}
    ]'::jsonb,
    '["Burette", "Burette Clamp & Stand", "Erlenmeyer Flask", "Graduated Pipette", "Funnel"]'::jsonb,
    '["Hydrochloric Acid (HCl)", "Sodium Hydroxide (NaOH)", "Phenolphthalein Indicator"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Dilute hydrochloric acid and sodium hydroxide can irritate skin and eyes. Wear chemical splash goggles and disposable gloves.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    5
  ),

  -- 6. Heat of Solution Calorimeter
  (
    'exp-heat-dissolution-006',
    'measuring-heat-of-solution-calorimeter',
    'Measuring Heat of Solution in a Calorimeter',
    'Measure temperature changes when dissolving ammonium nitrate and sodium hydroxide in water using an insulated coffee-cup calorimeter.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'salt-dissolution',
    'draft',
    'draft',
    '[
      "Dissolution of a solid solute involves both endothermic lattice breaking and exothermic hydration.",
      "An insulated calorimeter captures heat changes without significant exchange with the environment, allowing calculation of standard heat of solution."
    ]'::jsonb,
    '[
      {"id": "calorimetry-setup", "text": "Assemble a constant-pressure coffee-cup calorimeter."},
      {"id": "calorimetry-delta-t", "text": "Record initial and final temperatures to calculate enthalpy of dissolution."}
    ]'::jsonb,
    '["Coffee-Cup Calorimeter", "Digital Thermometer", "Digital Balance", "Glass Stirring Rod", "Weighing Boat"]'::jsonb,
    '["Water (H₂O)", "Ammonium Nitrate (NH₄NO₃)", "Sodium Hydroxide (NaOH)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Solid sodium hydroxide pellets are caustic and strongly exothermic upon hydration. Never touch with bare hands; use a clean dry spatula.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    6
  ),

  -- 7. Heat of Neutralization
  (
    'exp-heat-neutralization-007',
    'determination-heat-of-neutralization',
    'Determination of the Heat of Neutralization',
    'Determine the standard molar enthalpy of neutralization by mixing equimolar solutions of hydrochloric acid and sodium hydroxide.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "The reaction between strong acids and strong bases involves the formation of water from hydrogen ions and hydroxide ions.",
      "For all strong acid-strong base pairs, the standard heat of neutralization has a nearly constant value of approximately -57.3 kJ/mol."
    ]'::jsonb,
    '[
      {"id": "neutralization-temp", "text": "Measure maximum temperature elevation during strong acid-base reaction."},
      {"id": "neutralization-calc", "text": "Calculate enthalpy of neutralization per mole of water produced."}
    ]'::jsonb,
    '["Calorimeter", "Digital Thermometer", "Graduated Cylinders (2x 50 mL)", "Beaker"]'::jsonb,
    '["Hydrochloric Acid (HCl 1.0 M)", "Sodium Hydroxide (NaOH 1.0 M)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Rapid mixing causes an immediate temperature rise. Add acid slowly to base with continuous stirring while wearing eye protection.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    7
  ),

  -- 8. Flame Tests
  (
    'exp-flame-tests-008',
    'flame-emission-tests-metal-cations',
    'Flame Emission Tests for Metal Cations',
    'Observe distinctive flame emission colors produced by salts of sodium, potassium, calcium, and copper in a Bunsen burner flame.',
    'chemistry',
    'beginner',
    20,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "When metal ions are heated in a hot flame, their electrons absorb thermal energy and excite to higher quantum energy levels.",
      "As electrons return to lower energy states, they emit electromagnetic radiation with specific wavelengths characteristic of the element."
    ]'::jsonb,
    '[
      {"id": "flame-excitation", "text": "Demonstrate the atomic emission principle using a Bunsen burner flame."},
      {"id": "flame-identification", "text": "Identify metal cations (Na⁺, K⁺, Ca²⁺, Cu²⁺) by characteristic flame colors."}
    ]'::jsonb,
    '["Bunsen Burner", "Platinum / Nichrome Wire Loop", "Watch Glass", "Cobalt Glass Plate"]'::jsonb,
    '["Concentrated Hydrochloric Acid (HCl)", "Sodium Chloride (NaCl)", "Potassium Chloride (KCl)", "Calcium Chloride (CaCl₂)", "Copper(II) Sulfate (CuSO₄)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Open flame and concentrated hydrochloric acid wire-cleaning solution present thermal and vapor hazards. Tie back hair and wear heat-resistant protection.",
      "recommendedPpe": ["Safety glasses", "Heat-resistant apron", "Nitrile gloves"]
    }'::jsonb,
    'draft',
    8
  ),

  -- 9. Acidity and Basicity of Oxides
  (
    'exp-oxides-009',
    'acidity-and-basicity-of-element-oxides',
    'Acidity and Basicity of Element Oxides',
    'Compare the chemical behavior of magnesium oxide and carbon dioxide in water using litmus and universal indicator.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Metal oxides generally form basic anhydrides that produce hydroxide ions in aqueous solution.",
      "Non-metal oxides dissolve in water to produce acidic solutions containing hydrogen ions."
    ]'::jsonb,
    '[
      {"id": "oxide-nature", "text": "Classify element oxides into basic, acidic, and amphoteric categories."},
      {"id": "oxide-indicator", "text": "Verify basicity of MgO and acidity of CO₂ using litmus indicators."}
    ]'::jsonb,
    '["Gas Collecting Jar", "Deflagrating Spoon", "Crucible Tongs", "Bunsen Burner", "Beaker"]'::jsonb,
    '["Magnesium Ribbon (Mg)", "Charcoal / Carbon (C)", "Water (H₂O)", "Litmus Solution"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Burning magnesium ribbon produces an intense ultraviolet emission; never look directly at the flame. Use crucible tongs.",
      "recommendedPpe": ["Safety goggles with UV attenuation", "Heat-resistant tongs"]
    }'::jsonb,
    'draft',
    9
  ),

  -- 10. Halogen Displacement
  (
    'exp-halogen-displacement-010',
    'halogen-displacement-reactions',
    'Halogen Displacement Reactions',
    'React chlorine water with aqueous potassium bromide and potassium iodide to verify the relative oxidizing strength of halogens.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "The reactivity of Group 7A halogens decreases down the group as atomic radius increases and electron affinity decreases.",
      "A more electronegative halogen displaces a less electronegative halogen from its halide salt solution."
    ]'::jsonb,
    '[
      {"id": "halogen-redox", "text": "Explain halogen displacement in terms of oxidation-reduction potentials."},
      {"id": "halogen-color", "text": "Observe liberated bromine (orange) and iodine (violet in organic solvent)."}
    ]'::jsonb,
    '["Test Tubes and Rack", "Dropping Pipettes", "Fume Hood", "Stoppered Vials"]'::jsonb,
    '["Chlorine Water (Cl₂ aq)", "Potassium Bromide (KBr aq)", "Potassium Iodide (KI aq)", "Carbon Tetrachloride / Hexane"]'::jsonb,
    '{
      "level": "high",
      "requiresSupervision": true,
      "note": "Chlorine water emits toxic, suffocating chlorine gas. Prepare and dispense exclusively inside an operating laboratory fume hood.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Fume hood ventilation"]
    }'::jsonb,
    'draft',
    10
  ),

  -- 11. Electrical Conductivity
  (
    'exp-conductivity-011',
    'electrical-conductivity-aqueous-solutions',
    'Electrical Conductivity of Aqueous Solutions',
    'Test electrical conductivity of aqueous sodium chloride, hydrochloric acid, acetic acid, and sugar solutions using a conductivity apparatus.',
    'chemistry',
    'beginner',
    15,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Substances that dissociate into free ions in aqueous solution conduct electric current and are termed electrolytes.",
      "Strong electrolytes dissociate completely, weak electrolytes dissociate partially, and non-electrolytes produce no free ions."
    ]'::jsonb,
    '[
      {"id": "conductivity-meter", "text": "Use a conductivity apparatus with lamp bulb indicator."},
      {"id": "electrolyte-rank", "text": "Classify compounds as strong electrolytes, weak electrolytes, or non-electrolytes."}
    ]'::jsonb,
    '["Conductivity Apparatus (Electrodes + Lamp/Buzzer)", "DC Power Source (6V-9V)", "Beakers (4x 100 mL)", "Wash Bottle"]'::jsonb,
    '["Sodium Chloride (NaCl aq)", "Hydrochloric Acid (HCl aq)", "Acetic Acid (CH₃COOH aq)", "Sucrose Solution (Sugar aq)", "Distilled Water"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Low-voltage DC circuit; disconnect power before rinsing electrodes between solutions to prevent mild shock and cross-contamination.",
      "recommendedPpe": ["Safety glasses", "Dry rubber-insulated gloves"]
    }'::jsonb,
    'draft',
    11
  ),

  -- 12. Sodium with Water
  (
    'exp-sodium-water-012',
    'reaction-of-sodium-with-water',
    'Reaction of Sodium with Water',
    'Place a rice-grain sized piece of metallic sodium in water to observe vigorous hydrogen gas evolution and alkaline solution formation.',
    'chemistry',
    'advanced',
    15,
    'planned',
    null,
    'salt-dissolution',
    'draft',
    'draft',
    '[
      "Alkali metals possess a single valence electron and very low ionization energies, reacting rapidly and exothermically with water.",
      "Sodium reduces water to hydrogen gas and forms a strongly alkaline solution of sodium hydroxide."
    ]'::jsonb,
    '[
      {"id": "sodium-vigorous", "text": "Describe the physical and chemical observations of alkali metal reaction with water."},
      {"id": "sodium-alkaline", "text": "Test the resulting solution with phenolphthalein to confirm alkaline hydroxide formation."}
    ]'::jsonb,
    '["Large Glass Trough / Deep Beaker", "Protective Blast Shield", "Laboratory Tweezers", "Filter Paper", "Scalpel"]'::jsonb,
    '["Metallic Sodium (stored under kerosene)", "Distilled Water", "Phenolphthalein Indicator"]'::jsonb,
    '{
      "level": "high",
      "requiresSupervision": true,
      "note": "Metallic sodium reacts violently with water and can ignite spontaneously. Use only a tiny piece with a safety shield in place.",
      "recommendedPpe": ["Full face shield", "Heavy duty gloves", "Transparent blast shield"]
    }'::jsonb,
    'draft',
    12
  ),

  -- 13. Ammonia Preparation & Fountain
  (
    'exp-ammonia-prep-013',
    'preparation-ammonia-gas-fountain-experiment',
    'Preparation of Ammonia Gas and Fountain Experiment',
    'Prepare ammonia gas by heating ammonium chloride with slaked lime, then demonstrate its high solubility with the ammonia fountain experiment.',
    'chemistry',
    'advanced',
    25,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Ammonia gas is synthesized by heating an ammonium salt with a solid metal hydroxide.",
      "Because ammonia is extremely soluble in water and forms basic ammonium hydroxide, an inverted flask with water creates a rapid partial vacuum producing a red-to-blue fountain."
    ]'::jsonb,
    '[
      {"id": "ammonia-prep", "text": "Assemble the glass heating and upward gas delivery train for dry ammonia."},
      {"id": "ammonia-fountain", "text": "Perform the ammonia fountain experiment demonstrating high gas solubility."}
    ]'::jsonb,
    '["Round-bottom Flask", "Delivery Tube", "Drying Tower (CaO)", "Inverted Round Flask with Dropper & Jet", "Water Trough"]'::jsonb,
    '["Ammonium Chloride (NH₄Cl)", "Slaked Lime (Ca(OH)₂)", "Quicklime (CaO drying agent)", "Red Litmus Solution"]'::jsonb,
    '{
      "level": "high",
      "requiresSupervision": true,
      "note": "Ammonia is a pungent, toxic, and respiratory-irritant gas. Ensure gas-tight glassware joints and conduct inside a chemical fume hood.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Fume hood ventilation"]
    }'::jsonb,
    'draft',
    13
  ),

  -- 14. Catalytic Decomposition H2O2
  (
    'exp-catalysis-014',
    'catalytic-decomposition-hydrogen-peroxide',
    'Catalytic Decomposition of Hydrogen Peroxide',
    'Accelerate the decomposition of hydrogen peroxide into water and oxygen gas using manganese(IV) oxide catalyst and test with a glowing splint.',
    'chemistry',
    'intermediate',
    15,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Transition metals and their oxides act as effective heterogeneous catalysts due to partially filled d-orbitals that provide low-energy pathways.",
      "Solid manganese(IV) oxide accelerates the decomposition of hydrogen peroxide into oxygen and water without being consumed."
    ]'::jsonb,
    '[
      {"id": "catalysis-rate", "text": "Demonstrate how a catalyst lowers activation energy and increases reaction rate."},
      {"id": "catalysis-oxygen", "text": "Confirm oxygen gas production using the glowing wooden splint test."}
    ]'::jsonb,
    '["Conical Flask", "Graduated Cylinder", "Spatula", "Wooden Splints", "Gas Lighter"]'::jsonb,
    '["Hydrogen Peroxide Solution (H₂O₂ 10-20%)", "Manganese(IV) Oxide (MnO₂ powder)", "Distilled Water"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Concentrated hydrogen peroxide is a strong oxidizing agent that can cause skin burns. Manganese dioxide catalyzes rapid, vigorous effervescence.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    14
  ),

  -- 15. Qualitative Detection of Anions
  (
    'exp-anions-015',
    'identification-of-acid-radicals-anions',
    'Identification of Acid Radicals (Anions)',
    'Identify carbonate, thiosulfate, and chloride salts by observing gas evolution and precipitation with dilute hydrochloric acid and silver nitrate.',
    'chemistry',
    'intermediate',
    25,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Chemical analysis of salts begins with treating solid samples with dilute hydrochloric acid to liberate characteristic gases.",
      "Confirmatory tests using silver nitrate produce distinct precipitates that differ in color and solubility in aqueous ammonia."
    ]'::jsonb,
    '[
      {"id": "anion-main-test", "text": "Execute the main HCl detection group test for carbonate, sulfite, and thiosulfate."},
      {"id": "anion-confirmatory", "text": "Perform confirmatory precipitation tests using silver nitrate reagent."}
    ]'::jsonb,
    '["Test Tubes and Rack", "Delivery Tube", "Limewater Vial", "Droppers", "Spirit Lamp"]'::jsonb,
    '["Sodium Carbonate (Na₂CO₃)", "Sodium Thiosulfate (Na₂S₂O₃)", "Sodium Chloride (NaCl)", "Dilute Hydrochloric Acid (HCl)", "Silver Nitrate (AgNO₃)", "Limewater (Ca(OH)₂)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Reactions produce choking sulfur dioxide gas and silver nitrate stains skin indelibly. Perform in a well-ventilated laboratory.",
      "recommendedPpe": ["Safety glasses", "Nitrile gloves", "Fume hood / ventilation"]
    }'::jsonb,
    'draft',
    15
  ),

  -- 16. Qualitative Detection of Cations
  (
    'exp-cations-016',
    'identification-of-basic-radicals-cations',
    'Identification of Basic Radicals (Cations)',
    'Distinguish iron(II), iron(III), and aluminum cations through characteristic hydroxide precipitates and their solubility in excess sodium hydroxide.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Basic radicals (cations) are classified into analytical groups based on the solubility product of their insoluble salts.",
      "The third analytical group cations precipitate as hydroxides: white-gelatinous Al(OH)₃ dissolves in excess NaOH, greenish-white Fe(OH)₂ oxidizes to reddish-brown, and Fe(OH)₃ precipitates directly as reddish-brown gelatinous mass."
    ]'::jsonb,
    '[
      {"id": "cation-reagents", "text": "Use sodium hydroxide and ammonium hydroxide group reagents systematically."},
      {"id": "cation-amphoteric", "text": "Demonstrate the amphoteric nature of aluminum hydroxide by dissolution in excess base."}
    ]'::jsonb,
    '["Test Tubes and Rack", "Graduated Droppers", "Glass Stirring Rod"]'::jsonb,
    '["Iron(II) Sulfate (FeSO₄)", "Iron(III) Chloride (FeCl₃)", "Aluminum Chloride (AlCl₃)", "Sodium Hydroxide Solution (NaOH)", "Ammonium Hydroxide Solution (NH₄OH)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Sodium hydroxide reagent is caustic and damaging to cornea tissue. Wear splash-proof eye protection during addition and dropwise mixing.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    16
  ),

  -- 17. Volumetric Titration with Methyl Orange
  (
    'exp-volumetric-titration-017',
    'neutralization-titration-methyl-orange',
    'Neutralization Titration using Methyl Orange',
    'Standardize a hydrochloric acid solution of unknown concentration against standard sodium carbonate solution using methyl orange indicator.',
    'chemistry',
    'intermediate',
    30,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Quantitative volumetric analysis measures the exact volume of a standard reagent required to react completely with an analyte.",
      "Methyl orange changes sharply from yellow to orange-red in acidic medium, indicating the complete stoichiometric neutralization of sodium carbonate."
    ]'::jsonb,
    '[
      {"id": "titration-stoichiometry", "text": "Apply volumetric stoichiometry to calculate unknown acid molarity."},
      {"id": "titration-reproducibility", "text": "Perform concordant titration trials within 0.1 mL precision."}
    ]'::jsonb,
    '["Precision Burette (50 mL)", "Burette Stand & Clamp", "Volumetric Pipette (25 mL)", "Conical Flasks (3x 250 mL)", "Small Funnel"]'::jsonb,
    '["Standard Sodium Carbonate (Na₂CO₃ 0.1 M)", "Hydrochloric Acid (HCl unknown)", "Methyl Orange Indicator Solution", "Distilled Water"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Secure the burette clamp firmly and fill using a small funnel below eye level to prevent facial acid splashes.",
      "recommendedPpe": ["Safety goggles", "Laboratory apron"]
    }'::jsonb,
    'draft',
    17
  ),

  -- 18. Le Chatelier Equilibrium
  (
    'exp-equilibrium-018',
    'chemical-equilibrium-le-chatelier',
    'Chemical Equilibrium and Le Chatelier Principle',
    'Demonstrate dynamic equilibrium shifts by perturbing the reversible reaction between iron(III) chloride and ammonium thiocyanate.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'ph-indicators',
    'draft',
    'draft',
    '[
      "Dynamic chemical equilibrium occurs when forward and reverse reaction rates become equal in a closed system.",
      "According to Le Chatelier principle, adding extra reactant or product causes the equilibrium position to shift in the direction that relieves the applied stress."
    ]'::jsonb,
    '[
      {"id": "equilibrium-shift", "text": "Observe reversible color intensity shifts between light yellow and deep blood-red."},
      {"id": "equilibrium-law", "text": "Connect macroscopic color changes to the law of mass action."}
    ]'::jsonb,
    '["Beakers (100 mL)", "Matched Test Tubes (4x)", "Graduated Cylinder", "Glass Stirring Rod"]'::jsonb,
    '["Iron(III) Chloride (FeCl₃ aq)", "Ammonium Thiocyanate (NH₄SCN aq)", "Ammonium Chloride (NH₄Cl solid)", "Distilled Water"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Ammonium thiocyanate and iron(III) chloride solutions are mildly toxic; avoid skin contact and ingestion.",
      "recommendedPpe": ["Safety glasses", "Nitrile gloves"]
    }'::jsonb,
    'draft',
    18
  ),

  -- 19. Daniell Galvanic Cell
  (
    'exp-daniell-cell-019',
    'constructing-daniell-galvanic-cell',
    'Constructing a Daniell Galvanic Cell',
    'Assemble a zinc-copper Daniell cell with a potassium nitrate salt bridge and measure its open-circuit potential with a digital voltmeter.',
    'chemistry',
    'intermediate',
    25,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Galvanic cells convert chemical energy into electrical energy through spontaneous oxidation-reduction reactions.",
      "The zinc anode oxidizes and loses electrons, while copper ions at the cathode gain electrons and deposit as copper metal, producing a standard EMF of 1.10 V."
    ]'::jsonb,
    '[
      {"id": "daniell-assembly", "text": "Construct half-cells with metallic electrodes and aqueous electrolyte solutions."},
      {"id": "daniell-salt-bridge", "text": "Demonstrate the role of the U-tube salt bridge in maintaining electrical neutrality."}
    ]'::jsonb,
    '["Two 150 mL Beakers", "U-tube Salt Bridge (KNO₃ in agar)", "Zinc Plate Electrode", "Copper Plate Electrode", "Digital Voltmeter & Leads"]'::jsonb,
    '["Zinc Sulfate Solution (ZnSO₄ 1.0 M)", "Copper(II) Sulfate Solution (CuSO₄ 1.0 M)", "Potassium Nitrate (KNO₃)"]'::jsonb,
    '{
      "level": "low",
      "requiresSupervision": true,
      "note": "Copper(II) sulfate and zinc sulfate solutions are hazardous to aquatic organisms; collect heavy metal wastes in dedicated containers.",
      "recommendedPpe": ["Safety glasses", "Nitrile gloves"]
    }'::jsonb,
    'draft',
    19
  ),

  -- 20. Electrolysis of Copper(II) Chloride
  (
    'exp-electrolysis-020',
    'electrolysis-copper-chloride-solution',
    'Electrolysis of Copper(II) Chloride Solution',
    'Electrolyze aqueous copper(II) chloride using carbon electrodes to observe copper metal deposition at the cathode and chlorine gas evolution at the anode.',
    'chemistry',
    'advanced',
    25,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Electrolytic cells use external electrical energy to force non-spontaneous oxidation-reduction reactions to occur.",
      "Copper cations migrate to the negative cathode and reduce to copper metal, while chloride anions migrate to the positive anode and oxidize to chlorine gas."
    ]'::jsonb,
    '[
      {"id": "electrolysis-principles", "text": "Distinguish between galvanic and electrolytic cell mechanisms."},
      {"id": "electrolysis-products", "text": "Identify anode and cathode chemical products through visual inspection and starch-iodide paper."}
    ]'::jsonb,
    '["Electrolytic Cell / U-tube", "Graphite Rod Electrodes (2x)", "Variable DC Power Supply (6-12V)", "Connecting Wires & Alligator Clips", "Starch-Iodide Paper"]'::jsonb,
    '["Copper(II) Chloride Solution (CuCl₂ 1.0 M)", "Distilled Water"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Toxic chlorine gas is liberated at the anode during electrolysis. Run the apparatus in a fume hood and disconnect current immediately when done.",
      "recommendedPpe": ["Chemical splash goggles", "Nitrile gloves", "Fume hood ventilation"]
    }'::jsonb,
    'draft',
    20
  ),

  -- 21. Detection of C and H in Organics
  (
    'exp-organic-detection-021',
    'detection-carbon-hydrogen-organic-matter',
    'Detection of Carbon and Hydrogen in Organic Matter',
    'Heat organic material with black copper(II) oxide to confirm carbon via limewater turbidity and hydrogen via anhydrous copper(II) sulfate.',
    'chemistry',
    'intermediate',
    20,
    'planned',
    null,
    'salt-dissolution',
    'draft',
    'draft',
    '[
      "All organic compounds contain carbon and hydrogen as fundamental constituent elements.",
      "Heating organic material with copper(II) oxide oxidizes carbon to carbon dioxide gas (turbid limewater) and hydrogen to water vapor (turns anhydrous white CuSO₄ blue)."
    ]'::jsonb,
    '[
      {"id": "organic-carbon", "text": "Detect carbon dioxide through the formation of calcium carbonate precipitate in limewater."},
      {"id": "organic-hydrogen", "text": "Detect water of oxidation using color transition of anhydrous copper(II) sulfate."}
    ]'::jsonb,
    '["Hard Glass Boiling Tube with Clamp", "Delivery Tube", "Bunsen Burner", "Test Tube Holder", "Test Tube with Limewater"]'::jsonb,
    '["Organic Material (shredded paper, sugar, or leather)", "Black Copper(II) Oxide (CuO powder)", "Anhydrous Copper(II) Sulfate (white CuSO₄)", "Clear Limewater (Ca(OH)₂)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Strong heating of borosilicate combustion tubes requires clamped test tube holders; point the open mouth away from students.",
      "recommendedPpe": ["Safety goggles", "Heat-resistant gloves", "Laboratory coat"]
    }'::jsonb,
    'draft',
    21
  ),

  -- 22. Preparation of Ethene & Baeyer Test
  (
    'exp-ethylene-prep-022',
    'preparation-ethene-baeyers-test',
    'Preparation of Ethene and Baeyer Test',
    'Prepare ethene gas by catalytic dehydration of ethanol at 180°C and test its double bond unsaturation using alkaline potassium permanganate.',
    'chemistry',
    'advanced',
    30,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Alkenes are unsaturated hydrocarbons containing a carbon-carbon double bond, synthesized by acid-catalyzed dehydration of alcohols.",
      "Ethene decolorizes purple alkaline potassium permanganate solution (Baeyer test), forming colorless ethylene glycol and brown MnO₂ precipitate."
    ]'::jsonb,
    '[
      {"id": "ethene-synthesis", "text": "Assemble the laboratory dehydration train with thermometer at 180°C and gas washing bottle."},
      {"id": "baeyer-unsaturation", "text": "Demonstrate alkene unsaturation through the disappearance of KMnO₄ purple color."}
    ]'::jsonb,
    '["Round-bottom Flask (250 mL)", "High-range Thermometer (0-200°C)", "Bunsen Burner & Wire Gauze", "Gas Washing Bottle (with NaOH aq)", "Pneumatic Trough & Gas Jars"]'::jsonb,
    '["Absolute Ethanol (C₂H₅OH)", "Concentrated Sulfuric Acid (H₂SO₄)", "Sodium Hydroxide Solution (NaOH aq)", "Potassium Permanganate Solution (KMnO₄ in Na₂CO₃)"]'::jsonb,
    '{
      "level": "high",
      "requiresSupervision": true,
      "note": "Hot concentrated sulfuric acid at 180°C is extremely corrosive and can cause severe chemical burns. Ethene gas is flammable. Work strictly in a fume hood.",
      "recommendedPpe": ["Full face shield", "Chemical splash apron", "Heavy butyl rubber gloves", "Fume hood"]
    }'::jsonb,
    'draft',
    22
  ),

  -- 23. Esterification Reaction
  (
    'exp-esterification-023',
    'synthesis-ethyl-acetate-ester',
    'Synthesis of Ethyl Acetate Ester',
    'React glacial acetic acid with ethanol in a warm water bath with concentrated sulfuric acid catalyst to synthesize fragrant ethyl acetate.',
    'chemistry',
    'intermediate',
    25,
    'planned',
    null,
    'liquid-volume',
    'draft',
    'draft',
    '[
      "Esterification is a reversible condensation reaction between a carboxylic acid and an alcohol in the presence of a strong acid catalyst.",
      "Concentrated sulfuric acid removes water to drive equilibrium forward according to Le Chatelier principle, yielding fruity ethyl acetate."
    ]'::jsonb,
    '[
      {"id": "ester-condensation", "text": "Carry out acid-catalyzed ester condensation in a controlled warm water bath."},
      {"id": "ester-organoleptic", "text": "Isolate the ester layer and verify pleasant fruity fragrance with safe wafting technique."}
    ]'::jsonb,
    '["Boiling Tube with One-hole Stopper & Air Condenser", "Water Bath Beaker (400 mL) & Tripod", "Graduated Droppers", "Thermometer", "Spirit Lamp"]'::jsonb,
    '["Glacial Acetic Acid (CH₃COOH)", "Absolute Ethanol (C₂H₅OH)", "Concentrated Sulfuric Acid (H₂SO₄)", "Sodium Carbonate Solution (Na₂CO₃ aq)"]'::jsonb,
    '{
      "level": "medium",
      "requiresSupervision": true,
      "note": "Glacial acetic acid produces irritating fumes and ethanol is highly flammable. Heat using an indirect water bath; never use an open burner flame.",
      "recommendedPpe": ["Safety glasses", "Nitrile gloves", "Indirect warm water bath"]
    }'::jsonb,
    'draft',
    23
  )
on conflict (id) do nothing;

-- 6. Link Curriculum Lessons to Experiments
insert into public.curriculum_lesson_experiments (lesson_id, experiment_id, sort_order, is_primary)
values
  -- Grade 1 Term 1
  ('lesson-sec1-t1-u1-l1', 'exp-volume-002', 1, true),
  ('lesson-sec1-t1-u1-l1', 'exp-ph-003', 2, false),
  ('lesson-sec1-t1-u3-l1', 'exp-salt-water-001', 1, true),
  ('lesson-sec1-t1-u3-l2', 'exp-colloids-004', 1, true),
  ('lesson-sec1-t1-u3-l3', 'exp-titration-005', 1, true),

  -- Grade 1 Term 2
  ('lesson-sec1-t2-u4-l1', 'exp-heat-dissolution-006', 1, true),
  ('lesson-sec1-t2-u4-l2', 'exp-heat-neutralization-007', 1, true),

  -- Grade 2 Term 1
  ('lesson-sec2-t1-u1-l1', 'exp-flame-tests-008', 1, true),
  ('lesson-sec2-t1-u2-l1', 'exp-oxides-009', 1, true),
  ('lesson-sec2-t1-u2-l2', 'exp-halogen-displacement-010', 1, true),

  -- Grade 2 Term 2
  ('lesson-sec2-t2-u3-l1', 'exp-conductivity-011', 1, true),
  ('lesson-sec2-t2-u4-l1', 'exp-sodium-water-012', 1, true),
  ('lesson-sec2-t2-u4-l2', 'exp-ammonia-prep-013', 1, true),

  -- Grade 3 Term 1
  ('lesson-sec3-t1-u1-l1', 'exp-catalysis-014', 1, true),
  ('lesson-sec3-t1-u2-l1', 'exp-anions-015', 1, true),
  ('lesson-sec3-t1-u2-l2', 'exp-cations-016', 1, true),
  ('lesson-sec3-t1-u2-l3', 'exp-volumetric-titration-017', 1, true),
  ('lesson-sec3-t1-u3-l1', 'exp-equilibrium-018', 1, true),

  -- Grade 3 Term 2
  ('lesson-sec3-t2-u4-l1', 'exp-daniell-cell-019', 1, true),
  ('lesson-sec3-t2-u4-l2', 'exp-electrolysis-020', 1, true),
  ('lesson-sec3-t2-u5-l1', 'exp-organic-detection-021', 1, true),
  ('lesson-sec3-t2-u5-l2', 'exp-ethylene-prep-022', 1, true),
  ('lesson-sec3-t2-u5-l3', 'exp-esterification-023', 1, true)
on conflict (lesson_id, experiment_id) do nothing;
