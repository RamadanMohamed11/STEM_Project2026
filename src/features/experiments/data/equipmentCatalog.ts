import type { ToolVisualKey, ExperimentToolItem } from '../types/toolsAndMaterials.ts'

export type EquipmentCategory =
  | 'reaction-vessel'
  | 'assistive-device'
  | 'measuring'
  | 'heating'
  | 'solid-chemical'
  | 'liquid-chemical'
  | 'gas-chemical'

export interface EquipmentCatalogItem {
  readonly id: string
  readonly name: string
  readonly category: EquipmentCategory
  readonly use: string
  readonly handling: string
  readonly safetyNote: string
  readonly imageKey: string
  readonly specification?: string
  readonly aliases?: readonly string[]
}

export const equipmentCatalog: readonly EquipmentCatalogItem[] = [
  // ---------------------------------------------------------------------------
  // Glassware & Reaction Vessels
  // ---------------------------------------------------------------------------
  {
    id: 'beaker',
    name: 'Beaker (250 mL)',
    category: 'reaction-vessel',
    use: 'Holds, mixes, and roughly estimates liquid volumes, and provides a wide vessel for dissolving solids.',
    handling:
      'Grip the body with your whole hand or use beaker tongs when hot. Place on heat-resistant mats and stir gently with a glass rod without tapping the bottom.',
    safetyNote:
      'Beaker graduation lines are rough approximations (±5% error); never use for precise volumetric titration. Inspect for rim chips and thermal fractures before heating.',
    imageKey: 'beaker',
    specification: '250 mL Borosilicate Glass (Graduated)',
    aliases: ['beaker-250', 'glass-beaker'],
  },
  {
    id: 'beaker-100',
    name: 'Beaker (100 mL)',
    category: 'reaction-vessel',
    use: 'Holds small liquid samples and prepares compact solution volumes for micro-titration or drop tests.',
    handling:
      'Pick up using fingers near the middle or small beaker tongs. Pour steadily using the spout to prevent drips.',
    safetyNote:
      'Do not boil dry; sudden thermal shock can fracture borosilicate glass.',
    imageKey: 'beaker',
    specification: '100 mL Borosilicate Glass',
  },
  {
    id: 'beaker-1000',
    name: 'Beaker (1000 mL)',
    category: 'reaction-vessel',
    use: 'Contains large volumes of solvent, water baths, and bulk neutralization waste.',
    handling:
      'Support the heavy base with both hands when filled; never carry by the glass rim alone.',
    safetyNote:
      'Large volume creates substantial thermal mass when hot; use heavy-duty heat-resistant gloves.',
    imageKey: 'beaker',
    specification: '1000 mL Heavy Duty Glass',
  },
  {
    id: 'erlenmeyer-flask',
    name: 'Erlenmeyer Flask (250 mL)',
    category: 'reaction-vessel',
    use: 'Contains solutions during titration and vigorous swirl mixing without risk of liquid spillage.',
    handling:
      'Hold by the narrow neck and swirl gently using smooth circular wrist motions. Keep tilted slightly away from your face.',
    safetyNote:
      'Ensure the flask mouth remains open when heating unless equipped with a gas delivery adapter.',
    imageKey: 'beaker',
    specification: '250 mL Conical Flask (Narrow Neck)',
    aliases: ['conical-flask', 'erlenmeyer-flask-250'],
  },
  {
    id: 'erlenmeyer-flask-100',
    name: 'Erlenmeyer Flask (100 mL)',
    category: 'reaction-vessel',
    use: 'Receives precise titration aliquots and carries out small-scale acid-base neutralization reactions.',
    handling:
      'Swirl continuously with one hand while operating the burette stopcock with the other.',
    safetyNote:
      'Inspect neck and base for micro-cracks before mounting on hotplates or wire gauze.',
    imageKey: 'beaker',
    specification: '100 mL Borosilicate Glass',
  },
  {
    id: 'round-bottom-flask',
    name: 'Round-Bottom Flask (250 mL)',
    category: 'reaction-vessel',
    use: 'Distributes heat uniformly for organic synthesis, boiling mixtures, and gas preparation (such as ethene).',
    handling:
      'Always support with a cork ring or clamp securely to a retort stand; never place directly onto a flat benchtop.',
    safetyNote:
      'Add boiling chips before heating to prevent sudden explosive boiling (bumping).',
    imageKey: 'beaker',
    specification: '250 mL Single Neck Round Bottom (24/40 Joint)',
  },
  {
    id: 'three-neck-flask',
    name: 'Three-Neck Round-Bottom Flask (250 mL)',
    category: 'reaction-vessel',
    use: 'Accommodates simultaneous reflux, addition funnels, gas entry, and thermometer monitoring in complex synthesis.',
    handling:
      'Secure each neck component with appropriate ground glass joint clips. Lubricate joints lightly with vacuum grease.',
    safetyNote:
      'Never seal all three necks completely without a pressure relief or gas outlet path.',
    imageKey: 'beaker',
    specification: '250 mL Three-Neck Round Bottom',
  },
  {
    id: 'test-tube',
    name: 'Test Tube (Borosilicate)',
    category: 'reaction-vessel',
    use: 'Contains small-scale qualitative chemical reactions, precipitate observations, and flame heating tests.',
    handling:
      'Hold with a wooden or metal test tube holder clamped in the upper third. Point open mouth away from everyone.',
    safetyNote:
      'Heat gently along the side while tilting at 45°; never heat directly at the sealed base to prevent liquid eruption.',
    imageKey: 'test-tube',
    specification: '16 x 150 mm Borosilicate Glass',
  },
  {
    id: 'hard-glass-tube',
    name: 'Hard Glass Combustion Tube',
    category: 'reaction-vessel',
    use: 'Withstands high thermal stress during solid reductions (such as organic carbon-hydrogen detection with CuO).',
    handling:
      'Clamp horizontally or slightly sloped downward toward mouth. Heat gradually along the length before intense focus.',
    safetyNote:
      'Remove delivery tube from receiver liquid before turning off the burner to prevent catastrophic water suck-back.',
    imageKey: 'test-tube',
    specification: 'Heavy-Wall Borosilicate Combustion Tube',
  },
  {
    id: 'distillation-flask',
    name: 'Distillation Flask with Side Arm',
    category: 'reaction-vessel',
    use: 'Separates volatile liquids by selective vaporization and guides vapors through the angled side arm into a condenser.',
    handling:
      'Clamp firmly at the neck and connect the side arm securely to the condenser with a vapor-tight seal.',
    safetyNote:
      'Position the thermometer bulb directly opposite the side arm opening to measure true vapor temperature.',
    imageKey: 'beaker',
    specification: '250 mL Distillation Flask with Side Arm',
  },
  {
    id: 'separating-funnel',
    name: 'Separating Funnel (250 mL)',
    category: 'reaction-vessel',
    use: 'Separates immiscible liquid phases (such as organic and aqueous layers in liquid-liquid extraction).',
    handling:
      'Invert carefully while holding the stopper firmly with your palm; vent pressure regularly through the stopcock.',
    safetyNote:
      'Point the drainage stem away from people when venting built-up vapor pressure.',
    imageKey: 'beaker',
    specification: '250 mL Pear-Shaped with PTFE Stopcock',
  },
  {
    id: 'gas-jar',
    name: 'Gas Collecting Jar with Cover Plate',
    category: 'reaction-vessel',
    use: 'Collects and stores evolved laboratory gases over pneumatic water troughs or by air displacement.',
    handling:
      'Slide the greased glass cover plate smoothly across the ground rim to form an airtight seal before lifting.',
    safetyNote:
      'Label toxic, choking, or flammable gases clearly; never inhale gas directly from the jar mouth.',
    imageKey: 'beaker',
    specification: 'Heavy Soda-Glass Jar with Ground Cover Plate',
  },
  {
    id: 'trough',
    name: 'Pneumatic Water Trough',
    category: 'reaction-vessel',
    use: 'Contains water reservoir for inverted gas jar collection and alkali metal reactions.',
    handling:
      'Fill with water to designated fill mark. Place on a level, stable surface behind a safety shield.',
    safetyNote:
      'Clean water thoroughly after alkali metal experiments; neutralize residual caustic solutions.',
    imageKey: 'beaker',
    specification: 'Pneumatic Glass/Polypropylene Trough',
  },
  {
    id: 'u-tube-cell',
    name: 'Glass U-Tube Cell',
    category: 'reaction-vessel',
    use: 'Holds electrolytes for Daniell galvanic cells and connects half-cells with a potassium nitrate salt bridge.',
    handling:
      'Mount vertically in a clamp stand; ensure both arms have equal electrolyte levels.',
    safetyNote:
      'Do not allow salt bridge gel to dry out or crack, as this breaks ionic conduction.',
    imageKey: 'beaker',
    specification: 'Borosilicate Glass U-Tube (20 mm diameter)',
  },
  {
    id: 'electrolytic-cell',
    name: 'Electrolytic U-Tube Cell',
    category: 'reaction-vessel',
    use: 'Contains electrolyte solution (such as copper(II) chloride) for non-spontaneous DC electrochemical decomposition.',
    handling:
      'Insert graphite electrodes into perforated stoppers. Clamp in a fume hood and connect to DC power supply.',
    safetyNote:
      'Toxic chlorine gas evolves at the positive anode; perform exclusively inside an operating fume hood.',
    imageKey: 'beaker',
    specification: 'Electrolytic Cell with Rubber Bung Adaptors',
  },
  {
    id: 'watch-glass',
    name: 'Watch Glass (100 mm)',
    category: 'reaction-vessel',
    use: 'Holds small solid samples for observation, evaporates droplet liquids, and covers beakers to prevent dust.',
    handling:
      'Hold by the outer edge with dry fingers or tweezers. Place concave side up on the benchtop.',
    safetyNote:
      'Never heat watch glasses directly over an open flame; they are not rated for intense direct thermal shock.',
    imageKey: 'watch-glass',
    specification: '100 mm Soda-Lime Pressed Glass',
  },
  {
    id: 'evaporating-dish',
    name: 'Evaporating Dish (75 mL)',
    category: 'heating',
    use: 'Evaporates solvents to crystallize dissolved solids using direct heating over a Bunsen burner.',
    handling:
      'Handle hot porcelain dishes strictly using crucible tongs; cool on a ceramic wire gauze.',
    safetyNote:
      'Do not plunge hot porcelain dishes into cold water; severe thermal shock will crack porcelain.',
    imageKey: 'weighing-boat',
    specification: '75 mL Glazed Porcelain with Pouring Lip',
  },

  // ---------------------------------------------------------------------------
  // Measuring Instruments
  // ---------------------------------------------------------------------------
  {
    id: 'graduated-cylinder',
    name: 'Graduated Cylinder (100 mL)',
    category: 'measuring',
    use: 'Measures liquid volumes with moderate laboratory precision (±0.5 mL).',
    handling:
      'Place on a level bench. Lower your gaze so your eye is strictly horizontal with the liquid surface; read the lowest point of the concave meniscus.',
    safetyNote:
      'Keep the plastic/rubber bumper ring near the top collar to cushion the glass if tipped over. Never heat or mix hot acid solutions inside cylinders.',
    imageKey: 'graduated-cylinder',
    specification: '100 mL Class B Borosilicate Glass (1 mL Subdivisions)',
    aliases: ['graduated-cylinder-100', 'measuring-cylinder'],
  },
  {
    id: 'burette',
    name: 'Burette (50 mL)',
    category: 'measuring',
    use: 'Delivers measured, variable volumes of titrant with high analytical precision (0.05 mL resolution) in titrations.',
    handling:
      'Clamp strictly vertical. Fill below eye level using a small funnel; purge the air bubble trapped in the tip before recording initial volume.',
    safetyNote:
      'Operate the stopcock with your left hand cupped around the barrel to prevent dislodging the stopcock plug.',
    imageKey: 'graduated-cylinder',
    specification: '50 mL Class A Glass Burette (0.1 mL graduations, PTFE stopcock)',
  },
  {
    id: 'pipette',
    name: 'Volumetric Pipette (25 mL)',
    category: 'measuring',
    use: 'Transfers exact, highly reproducible single liquid aliquots with high analytical tolerance.',
    handling:
      'Always use a rubber pipette suction bulb or mechanical pipette pump. Never pipette chemicals by mouth.',
    safetyNote:
      'Touch the tip gently to the inner receiver wall to drain; do not blow out the small residual liquid bead calibrated into the tip.',
    imageKey: 'graduated-cylinder',
    specification: '25.0 mL One-Mark Class A Pipette (±0.03 mL)',
    aliases: ['volumetric-pipette'],
  },
  {
    id: 'digital-balance',
    name: 'Digital Balance (0.01 g)',
    category: 'measuring',
    use: 'Measures the mass of solid chemical reagents with electronic precision.',
    handling:
      'Keep on a level, draft-free bench. Place a weighing boat on the pan and press TARE before scooping solid reagents.',
    safetyNote:
      'Never place chemical reagents directly onto the metal balance pan. Clean any spilled powders immediately with a soft brush.',
    imageKey: 'digital-balance',
    specification: 'Electronic Top-Loading Balance (0–200 g x 0.01 g)',
  },
  {
    id: 'thermometer',
    name: 'Laboratory Glass Thermometer (-10 to 110°C)',
    category: 'measuring',
    use: 'Monitors temperature changes during calorimetry, dissolutions, distillations, and water bath warming.',
    handling:
      'Immerse the bulb centrally in the liquid without touching vessel walls or the bottom. Never use as a stirring rod.',
    safetyNote:
      'Handle gently; report any mercury/alcohol column separation or glass fractures immediately.',
    imageKey: 'graduated-cylinder',
    specification: '-10 to 110°C (0.1°C / 1°C graduations)',
  },
  {
    id: 'calorimeter',
    name: 'Insulated Coffee-Cup Calorimeter',
    category: 'measuring',
    use: 'Measures heat of solution (ΔH_sol) and heat of neutralization (ΔH_neut) under constant pressure with minimal heat loss.',
    handling:
      'Nest two polystyrene cups inside a support beaker; insert the thermometer and stirrer through the insulated lid.',
    safetyNote:
      'Stir gently to ensure uniform thermal distribution; avoid forceful stirring that could puncture the foam wall.',
    imageKey: 'beaker',
    specification: 'Polystyrene Double-Cup Calorimeter with Lid',
  },
  {
    id: 'voltmeter',
    name: 'Digital Multimeter / Voltmeter',
    category: 'measuring',
    use: 'Measures electromotive force (EMF) and open-circuit potential difference generated by galvanic cells.',
    handling:
      'Set the selector dial to DC Volts. Connect black probe to negative anode (COM) and red probe to positive cathode (V).',
    safetyNote:
      'High-impedance measurement draws near-zero current, preserving true open-circuit chemical cell potentials.',
    imageKey: 'digital-balance',
    specification: 'Digital Multi-meter (0–20 V DC, high input impedance)',
  },
  {
    id: 'conductivity-apparatus',
    name: 'Electrical Conductivity Apparatus',
    category: 'measuring',
    use: 'Tests the electrolytic conductivity of solutions by passing DC current through inert electrodes to illuminate a test bulb.',
    handling:
      'Immerse electrodes into test solution; switch on power to observe bulb brightness; switch off and rinse electrodes with distilled water.',
    safetyNote:
      'Always disconnect the power supply before rinsing or handling electrodes to prevent electrical shock.',
    imageKey: 'digital-balance',
    specification: 'Low-Voltage DC Circuit with Indicator Bulb and Electrodes',
  },
  {
    id: 'ph-paper',
    name: 'Universal pH Indicator Paper',
    category: 'measuring',
    use: 'Estimates solution pH across the 1–14 scale by matching test strip color changes against a standard chart.',
    handling:
      'Dip a clean glass rod into the solution and touch a drop to the dry paper strip on a watch glass.',
    safetyNote:
      'Do not dip the paper strip directly into stock chemical bottles to avoid reagent contamination.',
    imageKey: 'watch-glass',
    specification: 'Full-Range pH 1–14 Test Strips with Color Scale',
    aliases: ['universal-ph-paper'],
  },

  // ---------------------------------------------------------------------------
  // Heating & Combustion Equipment
  // ---------------------------------------------------------------------------
  {
    id: 'bunsen-burner',
    name: 'Bunsen Burner',
    category: 'heating',
    use: 'Provides high-temperature thermal energy for combustion, flame tests, boiling, and glass working.',
    handling:
      'Close air collar to light with a yellow safety flame; open collar to adjust to a roaring non-luminous blue flame for heating.',
    safetyNote:
      'Never leave an open flame unattended. Tie back long hair, secure loose clothing, and know the master gas shutoff valve location.',
    imageKey: 'bunsen-burner',
    specification: 'Natural Gas / LPG Laboratory Burner with Adjustable Air Collar',
  },
  {
    id: 'spirit-lamp',
    name: 'Spirit Lamp (Alcohol Burner)',
    category: 'heating',
    use: 'Provides a moderate, gentle open flame for low-temperature heating when gas line access is unavailable.',
    handling:
      'Keep wick trimmed to 3 mm. Fill with denatured ethanol to no more than two-thirds capacity; replace cap to extinguish.',
    safetyNote:
      'Never blow out an alcohol burner; use the snuffer cap. Never refill a warm or burning spirit lamp.',
    imageKey: 'bunsen-burner',
    specification: '150 mL Glass Lamp with Ceramic Wick Holder',
  },
  {
    id: 'water-bath',
    name: 'Thermostatically Controlled Water Bath',
    category: 'heating',
    use: 'Warms reaction mixtures indirectly at controlled temperatures (e.g. 60–70°C for esterification) without open flame.',
    handling:
      'Ensure water level covers the immersed portion of test tubes. Monitor temperature with a thermometer.',
    safetyNote:
      'Essential for heating flammable organic solvents (such as ethanol and ether) where open flames pose severe fire risks.',
    imageKey: 'beaker',
    specification: 'Electric Laboratory Water Bath (Ambient to 100°C)',
  },
  {
    id: 'combustion-spoon',
    name: 'Deflagrating Combustion Spoon',
    category: 'heating',
    use: 'Holds solid elements (such as sulfur or charcoal) during combustion and lowers them into closed gas collection jars.',
    handling:
      'Line cup with fine sand if burning metals. Heat over burner flame until the solid ignites, then lower into gas jar.',
    safetyNote:
      'Wear protective goggles; noxious choking oxides (SO₂, CO₂) evolve rapidly upon lowering into oxygen.',
    imageKey: 'spatula',
    specification: 'Long-Stem Stainless Steel Combustion Spoon with Jar Shield',
  },
  {
    id: 'wire-gauze',
    name: 'Wire Gauze with Ceramic Center',
    category: 'heating',
    use: 'Distributes burner flame heat uniformly beneath flat-bottomed glassware resting on a tripod.',
    handling:
      'Center the gauze on the tripod ring; place beakers or flasks centrally over the white ceramic circle.',
    safetyNote:
      'Discard gauze when the wire mesh becomes frayed or the ceramic center wears thin.',
    imageKey: 'bunsen-burner',
    specification: '150 x 150 mm Galvanized Steel with Ceramic Inset',
  },

  // ---------------------------------------------------------------------------
  // Handling & Assistive Tools
  // ---------------------------------------------------------------------------
  {
    id: 'spatula',
    name: 'Laboratory Spatula',
    category: 'assistive-device',
    use: 'Transfers solid chemical powders, crystals, and granules from reagent containers to weighing boats or reaction vessels.',
    handling:
      'Use a clean, dry stainless steel blade. Tap gently with your index finger against the blade to dispense minute portions.',
    safetyNote:
      'Never return excess chemicals to stock reagent bottles to prevent batch contamination; dispose of excess properly.',
    imageKey: 'spatula',
    specification: 'Stainless Steel Spoon-Spatula (150 mm)',
    aliases: ['laboratory-spatula'],
  },
  {
    id: 'dropper',
    name: 'Medicine Dropper / Pasteur Pipette',
    category: 'assistive-device',
    use: 'Dispenses liquids and chemical indicator solutions drop by drop with controlled volume.',
    handling:
      'Hold strictly vertical; squeeze rubber bulb gently to draw and release drops. Never invert or lay flat with liquid inside.',
    safetyNote:
      'Use separate dedicated droppers for each reagent to prevent accidental cross-contamination.',
    imageKey: 'dropper',
    specification: 'Glass Dropper with Natural Rubber Bulb (1 mL)',
  },
  {
    id: 'stirring-rod',
    name: 'Glass Stirring Rod',
    category: 'assistive-device',
    use: 'Stirs solutions to accelerate dissolution and guides liquid flow during decanting or filtration.',
    handling:
      'Hold between fingertips and stir in gentle circular motions without striking the glass walls or bottom.',
    safetyNote:
      'Rinse with distilled water between different test solutions. Never use a glass stirring rod as a pry bar or thermometer.',
    imageKey: 'stirring-rod',
    specification: 'Solid Borosilicate Glass Rod with Fire-Polished Ends (200 mm)',
    aliases: ['glass-stirring-rod'],
  },
  {
    id: 'weighing-boat',
    name: 'Weighing Boat',
    category: 'assistive-device',
    use: 'Contains solid chemical reagents cleanly on the digital balance pan during mass determination.',
    handling:
      'Tare the balance with the empty dish. Bend slightly along the corner crease to form a convenient pouring chute.',
    safetyNote:
      'Do not use polystyrene weighing boats with hot solids or aggressive organic solvents (such as acetone).',
    imageKey: 'weighing-boat',
    specification: 'Polystyrene Diamond/Square Weighing Dish',
  },
  {
    id: 'wash-bottle',
    name: 'Wash Bottle (500 mL)',
    category: 'assistive-device',
    use: 'Dispenses controlled streams of pure distilled water for rinsing glassware, electrodes, and preparing dilutions.',
    handling:
      'Squeeze the flexible bottle body gently with fingers to direct the angled nozzle stream.',
    safetyNote:
      'Fill wash bottles exclusively with demineralized/distilled water. Never fill with acids, solvents, or tap water.',
    imageKey: 'wash-bottle',
    specification: '500 mL Low-Density Polyethylene with Angled Delivery Tip',
  },
  {
    id: 'test-tube-rack',
    name: 'Test Tube Rack',
    category: 'assistive-device',
    use: 'Holds multiple test tubes upright in ordered series for qualitative comparisons, reactions, and drying.',
    handling:
      'Place on a level, stable surface. Keep test tubes arranged logically by sample label or concentration.',
    safetyNote:
      'Never place hot test tubes in plastic racks; use heat-resistant wooden or wire racks.',
    imageKey: 'test-tube',
    specification: 'Polypropylene/Wood Rack with Inverted Drying Pegs',
  },
  {
    id: 'clamp-stand',
    name: 'Retort Stand and Clamp',
    category: 'assistive-device',
    use: 'Provides sturdy vertical support for holding burettes, condensers, and reaction vessels at desired heights.',
    handling:
      'Position the heavy rectangular base forward beneath the clamped apparatus so the center of gravity rests securely over the plate.',
    safetyNote:
      'Tighten clamp screws finger-tight; overtightening metal clamps onto bare glass can crush glassware.',
    imageKey: 'graduated-cylinder',
    specification: 'Cast Iron Base with 600 mm Steel Rod and Padded 3-Finger Clamp',
  },
  {
    id: 'tripod',
    name: 'Laboratory Tripod Stand',
    category: 'assistive-device',
    use: 'Supports wire gauze and glassware over a Bunsen burner during thermal experiments.',
    handling:
      'Center over the burner base with the three legs placed on a firm, non-flammable laboratory bench.',
    safetyNote:
      'Tripods remain hot long after the flame is extinguished; allow to cool completely before moving.',
    imageKey: 'bunsen-burner',
    specification: 'Triangular Cast-Iron Ring with 200 mm Steel Legs',
  },
  {
    id: 'tongs',
    name: 'Crucible Tongs / Beaker Tongs',
    category: 'assistive-device',
    use: 'Grips and transfers hot crucibles, evaporating dishes, beakers, and burning magnesium ribbon safely.',
    handling:
      'Grip the vessel rim or body securely with the curved jaws; hold firmly and keep at arm’s length.',
    safetyNote:
      'Ensure the jaws are dry before gripping hot glass to prevent localized thermal shock.',
    imageKey: 'spatula',
    specification: 'Stainless Steel Crucible Tongs (200 mm)',
    aliases: ['crucible-tongs'],
  },
  {
    id: 'funnel',
    name: 'Filter Funnel (60° Angle)',
    category: 'assistive-device',
    use: 'Guides liquids smoothly into narrow-necked containers and supports folded filter paper during gravity filtration.',
    handling:
      'Seat firmly in an iron ring or flask neck with the stem tip touching the inner wall of the receiver to promote smooth drainage.',
    safetyNote:
      'Do not fill filter paper above its rim to prevent unfiltered mixture from bypassing the paper.',
    imageKey: 'beaker',
    specification: '60° Angle Borosilicate Short-Stem Glass Funnel',
  },
  {
    id: 'condenser',
    name: 'Liebig Condenser',
    category: 'assistive-device',
    use: 'Cools and condenses hot vapors back into liquid using a continuous jacket of counter-current cold water.',
    handling:
      'Connect water inlet tube to the bottom jacket nozzle and outlet tube to the top nozzle leading to the sink drain.',
    safetyNote:
      'Ensure secure hose clamps; water pressure surges can dislodge tubes and flood the laboratory bench.',
    imageKey: 'beaker',
    specification: '300 mm Borosilicate Glass Liebig Condenser with 24/40 Joints',
    aliases: ['liebig-condenser'],
  },
  {
    id: 'gas-delivery-tube',
    name: 'Glass Delivery Tube with Stopper',
    category: 'assistive-device',
    use: 'Transfers generated gases from the reaction vessel into wash bottles or receiver solutions.',
    handling:
      'Insert glass tubing into rubber stoppers using a drop of water or glycerol as lubricant; hold tubing close to the bung.',
    safetyNote:
      'Always disconnect delivery tubes from liquid receivers before extinguishing burner flames to prevent suck-back.',
    imageKey: 'stirring-rod',
    specification: 'Borosilicate Glass Tubing (6 mm outer diameter)',
  },
  {
    id: 'platinum-wire',
    name: 'Platinum Inoculating / Flame Test Wire',
    category: 'assistive-device',
    use: 'Introduces metal salt samples into the non-luminous Bunsen burner flame for atomic emission spectroscopic analysis.',
    handling:
      'Clean by dipping in concentrated hydrochloric acid and holding in the flame until no color is imparted.',
    safetyNote:
      'Platinum is delicate and expensive; avoid mechanical bending; clean thoroughly after each test.',
    imageKey: 'stirring-rod',
    specification: 'Platinum Wire (0.3 mm) fused into Glass Support Rod',
  },
  {
    id: 'safety-shield',
    name: 'Transparent Acrylic Safety Blast Shield',
    category: 'assistive-device',
    use: 'Protects students and instructors from sudden spattering, thermal eruptions, or caustic aerosols during hazardous demonstrations.',
    handling:
      'Position squarely between the reaction apparatus and observers with weighted stabilizing base feet.',
    safetyNote:
      'Mandatory for reactive metal demonstrations (such as sodium reacting with water). Keep clean and scratch-free.',
    imageKey: 'beaker',
    specification: 'Heavy Polycarbonate / Acrylic Demonstration Shield',
  },
  {
    id: 'white-tile',
    name: 'White Ceramic Titration Tile',
    category: 'assistive-device',
    use: 'Provides a clean, uniform diffuse white background beneath titration flasks to highlight delicate indicator color transitions.',
    handling:
      'Place flat on the base plate of the retort stand directly under the Erlenmeyer flask.',
    safetyNote:
      'Wipe clean of spilled acids or indicator dyes promptly to prevent permanent staining.',
    imageKey: 'watch-glass',
    specification: 'Glazed White Ceramic Tile (150 x 150 mm)',
  },
  {
    id: 'cobalt-glass',
    name: 'Blue Cobalt Glass Optical Filter',
    category: 'assistive-device',
    use: 'Filters out intense yellow 589 nm sodium emission lines to clearly reveal pale violet potassium flame emission.',
    handling:
      'Hold close to your eye and view the flame through the blue glass plate.',
    safetyNote:
      'Clean dust and fingerprints before use; handle edges carefully to avoid chipped glass.',
    imageKey: 'watch-glass',
    specification: 'Cobalt Blue Optical Glass Plate (50 x 50 mm)',
  },
  {
    id: 'wooden-splint',
    name: 'Wooden Test Splints',
    category: 'assistive-device',
    use: 'Ignited or glowing splints test for flammable hydrogen gas (pop sound) and oxidizing oxygen gas (rekindles).',
    handling:
      'Light over a burner flame; blow out flame to leave a glowing ember before inserting into gas test vessels.',
    safetyNote:
      'Quench burnt splints under running tap water before discarding into the waste bin to prevent fires.',
    imageKey: 'spatula',
    specification: 'Untreated Softwood Laboratory Splints (150 mm)',
  },
  {
    id: 'filter-paper',
    name: 'Quantitative Filter Paper',
    category: 'assistive-device',
    use: 'Blots excess mineral oil from sodium metal and separates insoluble precipitates from liquid filtrates.',
    handling:
      'Fold into quarters, open into a cone, and seat snugly into the glass funnel with a drop of water.',
    safetyNote:
      'Dispose of paper contaminated with sodium or reactive metals safely under water.',
    imageKey: 'watch-glass',
    specification: 'Ashless Qualitative Filter Paper Circles (110 mm)',
  },
  {
    id: 'knife',
    name: 'Laboratory Scalpel / Dissecting Knife',
    category: 'assistive-device',
    use: 'Cuts soft alkali metals (such as sodium) under paraffin oil into precise rice-grain sized demonstration pieces.',
    handling:
      'Cut with light downward pressure against a ceramic tile; keep fingers clear of the cutting edge.',
    safetyNote:
      'Store blade with protective guard; wipe blade dry of paraffin oil after handling reactive metals.',
    imageKey: 'spatula',
    specification: 'Stainless Steel Scalpel with Fixed Blade',
  },
  {
    id: 'dc-power-supply',
    name: 'Adjustable DC Power Supply (0–12 V)',
    category: 'assistive-device',
    use: 'Supplies regulated direct current to drive non-spontaneous electrochemical decomposition in electrolytic cells.',
    handling:
      'Turn voltage dial to zero before connecting leads; increase potential gradually to desired voltage (e.g. 6.0 V).',
    safetyNote:
      'Switch off power before adjusting electrodes or touching electrolyte solutions.',
    imageKey: 'digital-balance',
    specification: 'Regulated Benchtop DC Power Supply (0–12 V, 0–3 A)',
  },
  {
    id: 'carbon-electrodes',
    name: 'Inert Graphite Carbon Electrodes',
    category: 'assistive-device',
    use: 'Conducts electrical current into electrolyte solutions without reacting with corrosive evolved halogens (such as chlorine).',
    handling:
      'Clamp securely in rubber bungs; handle brittle graphite rods carefully to avoid snapping.',
    safetyNote:
      'Rinse with distilled water and dry after electrolysis; inspect for erosion before reuse.',
    imageKey: 'stirring-rod',
    specification: 'High-Density Spectroscopic Graphite Rods (6 x 100 mm)',
  },
  {
    id: 'connecting-wires',
    name: 'Insulated Wires with Alligator Clips',
    category: 'assistive-device',
    use: 'Connects electrodes, meters, and power supplies to form continuous external circuits in electrochemical cells.',
    handling:
      'Fasten spring-loaded alligator jaws securely onto metal electrode tabs or graphite terminals.',
    safetyNote:
      'Avoid short circuits by keeping red (+) and black (-) clip jaws separated when power is switched on.',
    imageKey: 'stirring-rod',
    specification: 'Insulated Copper Test Leads with Insulated Alligator Clips',
  },
  {
    id: 'sandpaper',
    name: 'Silicon Carbide Sandpaper',
    category: 'assistive-device',
    use: 'Polishes metal plates (zinc, copper) to strip non-conductive oxide layers before galvanic cell assembly.',
    handling:
      'Rub metal surfaces briskly until bright, shiny metallic luster is restored.',
    safetyNote:
      'Wipe metal dust off plates with a paper towel; avoid inhaling fine metal particulate dust.',
    imageKey: 'spatula',
    specification: 'Fine Grit (P400) Waterproof Silicon Carbide Paper',
  },
  {
    id: 'flashlight',
    name: 'Collimated Optical Light Source',
    category: 'assistive-device',
    use: 'Projects a concentrated, narrow horizontal light beam through solutions to observe Tyndall effect scattering in colloids.',
    handling:
      'Direct beam horizontally through the center of the beaker against a dark background screen.',
    safetyNote:
      'Do not shine high-intensity light beams directly into observers’ eyes.',
    imageKey: 'digital-balance',
    specification: 'High-Lumen Focusable LED Collimated Light Source',
  },
  // ---------------------------------------------------------------------------
  // Chemical Reagents & Materials
  // ---------------------------------------------------------------------------
  {
    id: 'water',
    name: 'Deionized Water (Solvent)',
    category: 'liquid-chemical',
    use: 'Universal polar solvent used to dissolve ionic compounds, prepare standard dilutions, and clean analytical glassware.',
    handling:
      'Dispense using squeeze wash bottles or graduated cylinders. Store at ambient room temperature away from alkali metals.',
    safetyNote:
      'Never consume water from laboratory vessels; assume all containers may carry trace chemical contamination.',
    imageKey: 'water',
    specification: 'Deionized H₂O (Type II Laboratory Water)',
    aliases: ['distilled-water', 'deionized-water'],
  },
  {
    id: 'hydrochloric-acid',
    name: 'Hydrochloric Acid (HCl)',
    category: 'liquid-chemical',
    use: 'Strong monoprotic acid used for acid-base titrations, metal displacement reactions, and salt identification tests.',
    handling:
      'Work in a well-ventilated fume hood. Always add acid to water slowly with constant stirring, never water to concentrated acid.',
    safetyNote:
      'Corrosive acid that causes severe chemical skin burns and serious eye damage. Inhalation of vapors causes respiratory irritation.',
    imageKey: 'water',
    specification: 'Aqueous HCl (0.1 M - 1.0 M Standard Solution)',
    aliases: ['hcl', 'dilute-hydrochloric-acid'],
  },
  {
    id: 'sodium-chloride',
    name: 'Sodium Chloride (NaCl)',
    category: 'solid-chemical',
    use: 'Ionic crystalline solid used as a model electrolyte solute for dissolution, saturation, and conductivity experiments.',
    handling:
      'Transfer crystals using a dry laboratory spatula into a tared weighing boat. Reseal stock container immediately after use.',
    safetyNote:
      'Never ingest or taste laboratory reagents. Flush eyes with clean running water if salt dust causes mechanical irritation.',
    imageKey: 'sodium-chloride',
    specification: 'Reagent Grade NaCl (99.5% Purity)',
    aliases: ['nacl', 'table-salt'],
  },
  {
    id: 'sodium-hydroxide',
    name: 'Sodium Hydroxide (NaOH)',
    category: 'solid-chemical',
    use: 'Strong alkaline base used for acid-base neutralization titrations, precipitation of metal cations, and saponification.',
    handling:
      'Handle hygroscopic pellets with a dry scoop spatula. Dissolve slowly with cooling because dissolution is strongly exothermic.',
    safetyNote:
      'Extremely caustic base that rapidly destroys skin tissue and causes irreversible blindness. Wear splash goggles at all times.',
    imageKey: 'sodium-chloride',
    specification: 'ACS Grade Solid Pellets (98% Purity)',
    aliases: ['naoh', 'caustic-soda'],
  },
  {
    id: 'ammonia-gas',
    name: 'Ammonia Gas (NH₃)',
    category: 'gas-chemical',
    use: 'Alkaline gaseous product generated from ammonium salts; reacts with gaseous HCl to form dense white ammonium chloride fumes.',
    handling:
      'Generate only inside an operating fume hood. Collect by upward delivery into an inverted dry gas jar.',
    safetyNote:
      'Pungent, suffocating gas that severely irritates eyes and lungs. Do not inhale directly; waft vapors gently if testing odor.',
    imageKey: 'gas-jar',
    specification: 'Gaseous NH₃ (Dry)',
    aliases: ['nh3', 'ammonia'],
  },
]

/**
 * Fast lookup map index of all equipment catalog items by primary ID and aliases.
 */
export const equipmentCatalogMap = new Map<string, EquipmentCatalogItem>()
for (const item of equipmentCatalog) {
  equipmentCatalogMap.set(item.id, item)
  if (item.aliases) {
    for (const alias of item.aliases) {
      equipmentCatalogMap.set(alias, item)
    }
  }
}

/**
 * Retrieves an equipment catalog item by ID or alias.
 */
export function getEquipmentCatalogItem(id: string): EquipmentCatalogItem | undefined {
  return equipmentCatalogMap.get(id)
}

/**
 * Maps any equipment catalog item to an existing supported laboratory visual icon.
 */
export function getToolVisualKey(id: string): ToolVisualKey {
  const item = getEquipmentCatalogItem(id)
  const key = item?.id ?? id
  switch (key) {
    case 'graduated-cylinder':
    case 'graduated-cylinder-100':
    case 'burette':
    case 'pipette':
    case 'volumetric-pipette':
    case 'thermometer':
    case 'test-tube':
    case 'test-tube-rack':
    case 'dropper':
    case 'hard-glass-tube':
    case 'wash-bottle':
    case 'clamp-stand':
      return 'graduated-cylinder'
    case 'stirring-rod':
    case 'glass-stirring-rod':
    case 'platinum-wire':
    case 'gas-delivery-tube':
    case 'carbon-electrodes':
    case 'connecting-wires':
      return 'stirring-rod'
    case 'digital-balance':
    case 'voltmeter':
    case 'conductivity-apparatus':
    case 'dc-power-supply':
    case 'flashlight':
      return 'digital-balance'
    case 'spatula':
    case 'laboratory-spatula':
    case 'combustion-spoon':
    case 'tongs':
    case 'crucible-tongs':
    case 'knife':
    case 'sandpaper':
    case 'wooden-splint':
      return 'spatula'
    case 'weighing-boat':
    case 'watch-glass':
    case 'evaporating-dish':
    case 'ph-paper':
    case 'universal-ph-paper':
    case 'white-tile':
    case 'cobalt-glass':
    case 'filter-paper':
      return 'weighing-boat'
    case 'water':
    case 'hydrochloric-acid':
      return 'water'
    case 'sodium-chloride':
    case 'sodium-hydroxide':
      return 'sodium-chloride'
    default:
      return 'beaker'
  }
}

/**
 * Constructs a fully populated ExperimentToolItem directly from the equipment catalog
 * to avoid duplication across experiment definitions.
 */
export function resolveToolItem(
  id: string,
  overrides?: Partial<ExperimentToolItem>,
): ExperimentToolItem {
  const catalogItem = getEquipmentCatalogItem(id)
  if (!catalogItem) {
    throw new Error(`Unknown equipment catalog ID: ${id}`)
  }
  return {
    id: catalogItem.id,
    name: overrides?.name ?? catalogItem.name,
    visual: overrides?.visual ?? getToolVisualKey(catalogItem.id),
    shortExplanation: overrides?.shortExplanation ?? catalogItem.use,
    purpose: overrides?.purpose ?? catalogItem.use,
    specification: overrides?.specification ?? catalogItem.specification,
    safetyNote: overrides?.safetyNote ?? catalogItem.safetyNote,
  }
}
