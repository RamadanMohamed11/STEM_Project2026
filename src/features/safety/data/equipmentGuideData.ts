import type { EquipmentCategory, EquipmentGuideItem } from '../types/equipmentGuide'

export const equipmentCategories: readonly { id: EquipmentCategory; label: string }[] = [
  { id: 'all', label: 'All Equipment' },
  { id: 'glassware', label: 'Glassware' },
  { id: 'measurement', label: 'Measurement' },
  { id: 'handling', label: 'Handling Tools' },
  { id: 'storage', label: 'Storage & Containers' },
] as const

export const equipmentGuideList: readonly EquipmentGuideItem[] = [
  {
    id: 'beaker',
    name: 'Beaker',
    category: 'glassware',
    categoryLabel: 'Glassware',
    shortPurpose: 'Used to hold, mix, and roughly estimate liquids.',
    description:
      'A beaker is a flat-bottomed cylindrical glass container with a small pouring lip. It is one of the most widely used pieces of equipment in chemistry labs for preparing solutions, holding liquids, and carrying out simple reactions.',
    intendedUse: [
      'Holding and temporarily storing liquids during an experiment.',
      'Mixing solutions using a glass stirring rod.',
      'Heating liquids gently on a hot plate or wire gauze over a Bunsen burner.',
      'Dissolving solid chemicals into liquid solvents.',
    ],
    safetyNotes: [
      'Always inspect for chips, stars, or cracks before heating or adding liquids.',
      'Use beaker tongs or heat-resistant gloves when handling hot beakers—hot glass looks exactly like cold glass.',
      'Do not heat dry beakers or allow liquids to boil completely away to avoid thermal shock.',
      'Support filled beakers by the body and base; never carry them by the rim alone.',
    ],
    commonMistakes: [
      'Using beaker volume marks for exact measurements (beaker lines are rough approximations with up to ±5% error).',
      'Placing hot beakers directly onto cold bench surfaces or near water puddles, which can shatter the glass.',
      'Stirring vigorously with a glass rod against the bottom, which can crack or punch through the base.',
    ],
    materialType: 'Borosilicate glass (Pyrex-type)',
    visualKey: 'beaker',
  },
  {
    id: 'test-tube',
    name: 'Test Tube',
    category: 'glassware',
    categoryLabel: 'Glassware',
    shortPurpose: 'Used to observe small-scale reactions and heat small liquid samples.',
    description:
      'A test tube is a slender cylindrical tube of clear glass with a rounded U-shaped bottom and an open top. It allows students to observe color changes, gas evolution, and precipitate formation using small, safe chemical amounts.',
    intendedUse: [
      'Conducting small-scale qualitative chemical tests.',
      'Observing precipitates, color shifts, and gas formation clearly.',
      'Gently heating small liquid samples in a water bath or over a flame.',
      'Comparing multiple reaction samples side by side in a test tube rack.',
    ],
    safetyNotes: [
      'Always place test tubes in a sturdy test tube rack when not being actively handled.',
      'When heating, always aim the open mouth away from yourself and everyone nearby.',
      'Use a wooden or metal test tube holder clamped near the upper third of the tube.',
      'Heat the liquid gently by moving the tube through the flame; never heat the sealed bottom in one spot.',
    ],
    commonMistakes: [
      'Looking directly down into the open mouth of a test tube while a reaction or heating is taking place.',
      'Filling the test tube more than halfway, which easily causes boiling liquid to shoot out (bumping).',
      'Holding a test tube with bare hands while heating or mixing exothermic reagents.',
    ],
    materialType: 'Borosilicate glass',
    visualKey: 'test-tube',
  },
  {
    id: 'graduated-cylinder',
    name: 'Graduated Cylinder',
    category: 'measurement',
    categoryLabel: 'Measurement',
    shortPurpose: 'Used to measure liquid volumes accurately.',
    description:
      'A graduated cylinder is a tall, narrow glass or plastic cylinder marked with calibrated graduation lines. Because it is narrower than a beaker, it provides far greater accuracy for measuring specific liquid volumes.',
    intendedUse: [
      'Measuring exact volumes of liquids for solutions and dilutions.',
      'Measuring displaced volume to find the volume of irregular solids.',
      'Transferring measured volumes of liquids into beakers or flasks.',
    ],
    safetyNotes: [
      'Always place the cylinder on a level, flat surface while reading.',
      'Read the volume at eye level at the bottom of the curved liquid surface (the meniscus).',
      'Ensure the plastic bumper ring (guard) stays near the top to protect the glass if the cylinder tips.',
      'Hold the cylinder firmly with one hand while pouring into or out of it.',
    ],
    commonMistakes: [
      'Heating liquids or using the cylinder as a reaction vessel (heat ruins the factory volume calibration).',
      'Mixing chemicals or crushing solids with a stirring rod inside the cylinder (can punch through the base).',
      'Reading volume from above or below eye level, causing parallax measurement error.',
    ],
    materialType: 'Calibrated borosilicate glass or chemical-resistant polypropylene',
    visualKey: 'graduated-cylinder',
  },
  {
    id: 'stirring-rod',
    name: 'Glass Stirring Rod',
    category: 'handling',
    categoryLabel: 'Handling Tools',
    shortPurpose: 'Used to stir solutions and guide liquid flow.',
    description:
      'A glass stirring rod is a solid cylinder of chemical-resistant glass with fire-polished, rounded ends. It is designed to speed up the dissolution of solids in liquids and prevent splashing when pouring.',
    intendedUse: [
      'Gently stirring liquids and dissolving solid solutes in a beaker.',
      'Guiding liquid down the rod during pouring to prevent drips and splashes.',
      'Transferring a single drop of solution onto pH indicator paper.',
    ],
    safetyNotes: [
      'Stir with a gentle circular motion without tapping or banging the bottom of glassware.',
      'Place the rod on a clean watch glass or paper towel when not in use to avoid rolling off the bench.',
      'Rinse with distilled water between different chemicals to avoid cross-contamination.',
      'Check both rounded ends before use to make sure there are no sharp, chipped edges.',
    ],
    commonMistakes: [
      'Striking the beaker bottom like a hammer (glass-on-glass impacts can break the beaker).',
      'Using a glass thermometer as a stirring rod (thermometers have delicate bulbs that easily break).',
      'Leaving the rod standing tall in an empty or lightweight container, causing it to tip over.',
    ],
    materialType: 'Solid borosilicate glass',
    visualKey: 'stirring-rod',
  },
  {
    id: 'digital-balance',
    name: 'Digital Balance',
    category: 'measurement',
    categoryLabel: 'Measurement',
    shortPurpose: 'Used to measure the mass of substances with high precision.',
    description:
      'A digital balance is an electronic instrument that measures the mass of solid reagents and laboratory objects, typically to two decimal places (0.01 g) in secondary school chemistry labs.',
    intendedUse: [
      'Accurately weighing solid chemical reagents before preparing solutions.',
      'Determining mass changes before and after a reaction.',
      'Weighing containers such as weighing boats, watch glasses, or crucibles.',
    ],
    safetyNotes: [
      'Always place a clean weighing boat or paper on the pan—never put chemicals directly on the metal pan.',
      'Press the "Tare" or "Zero" button with the clean weighing boat on the pan before adding your reagent.',
      'Keep the balance clean and dry; immediately brush away any spilled powder using a balance brush.',
      'Never place hot objects onto the balance pan (heat causes air convection currents that give false fluctuating weights).',
    ],
    commonMistakes: [
      'Pouring chemicals into a weighing boat while it is resting on the balance pan (spills fall into internal mechanisms).',
      'Leaning on the workbench or pressing heavily on the weighing pan while reading.',
      'Forgetting to press Tare, resulting in weighing the boat along with the chemical.',
    ],
    materialType: 'Stainless steel weighing pan with electronic strain gauge',
    visualKey: 'digital-balance',
  },
  {
    id: 'spatula',
    name: 'Laboratory Spatula',
    category: 'handling',
    categoryLabel: 'Handling Tools',
    shortPurpose: 'Used to scoop, transfer, and dispense solid chemical reagents.',
    description:
      'A laboratory spatula is a handheld tool made of stainless steel or porcelain, often featuring a flat blade at one end and a slightly curved scoop at the other. It is used to transfer powders and crystals cleanly.',
    intendedUse: [
      'Scooping solid chemicals out of stock reagent bottles.',
      'Transferring small, controlled amounts of powder onto a weighing boat.',
      'Breaking up softly clumped crystals inside a weighing container.',
    ],
    safetyNotes: [
      'Ensure the spatula is completely clean and dry before inserting it into any chemical supply bottle.',
      'Never return excess chemical powder back into the original stock bottle to prevent contaminating the entire supply.',
      'Gently tap the spatula shaft with your index finger to dispense powders in small, controlled increments.',
      'Wipe and wash the spatula immediately after use before touching another reagent.',
    ],
    commonMistakes: [
      'Using a wet or contaminated spatula inside a stock container, ruining the chemical supply.',
      'Scooping far too much chemical at once and then attempting to pour it back into the bottle.',
      'Using the spatula to stir acidic or corrosive solutions (it is designed for dry solids, not liquid mixing).',
    ],
    materialType: 'Chemical-resistant stainless steel or glazed porcelain',
    visualKey: 'spatula',
  },
  {
    id: 'dropper-pipette',
    name: 'Dropper (Pipette)',
    category: 'handling',
    categoryLabel: 'Handling Tools',
    shortPurpose: 'Used to transfer small, controlled volumes or drops of liquid.',
    description:
      'A dropper (or transfer pipette) is a narrow tube with a squeezable bulb. It is used to add liquids drop by drop when preparing solutions, adjusting volumes to a graduation mark, or performing indicator tests.',
    intendedUse: [
      'Adding liquids drop by drop to reach an exact graduation line in a cylinder or flask.',
      'Dispensing chemical indicators (such as phenolphthalein or universal indicator).',
      'Transferring small volumes (1 to 3 mL) of liquid reagents safely between containers.',
    ],
    safetyNotes: [
      'Squeeze the bulb before placing the tip into the liquid, then release slowly to draw liquid up.',
      'Always hold the dropper vertically when dispensing drops for consistent drop size and control.',
      'Never invert (turn upside down) or lay a filled dropper flat, as liquid will enter and corrode the rubber bulb.',
      'Use separate droppers for different reagents to prevent accidental cross-reactions.',
    ],
    commonMistakes: [
      'Letting liquid get sucked into the rubber bulb by squeezing or inverting the dropper while full.',
      'Touching the dropper tip to the sides of the receiving container or into the recipient solution, contaminating the dropper.',
      'Using the same dropper for multiple chemical bottles without thorough washing.',
    ],
    materialType: 'Borosilicate glass with rubber bulb or one-piece polyethylene',
    visualKey: 'dropper-pipette',
  },
  {
    id: 'chemical-container',
    name: 'Chemical Container',
    category: 'storage',
    categoryLabel: 'Storage & Containers',
    shortPurpose: 'Used to store and protect chemical reagents safely.',
    description:
      'A chemical container (reagent bottle, jar, or flask) is designed for secure chemical storage. It features chemical-resistant glass or plastic walls, a tight-fitting cap, and an informative hazard label.',
    intendedUse: [
      'Securely storing solid and liquid chemical reagents in the school laboratory.',
      'Preserving solutions and preventing contamination from atmospheric dust and moisture.',
      'Displaying chemical names, concentrations, and safety hazard warnings clearly.',
    ],
    safetyNotes: [
      'Always read the chemical label twice before opening to verify the substance name and concentration.',
      'Place the bottle cap upside-down on the bench, or hold it between fingers, to avoid contaminating the inner cap.',
      'Always replace the cap securely immediately after removing the needed amount.',
      'Support the bottom of the container with one hand and hold the neck with the other when carrying.',
    ],
    commonMistakes: [
      'Leaving chemical bottles uncapped or with loose lids on the worktop.',
      'Carrying chemical containers by the lid alone (a loose lid can detach and drop the heavy container).',
      'Switching bottle caps between different chemical containers, causing hazardous cross-contamination.',
    ],
    materialType: 'Amber or clear borosilicate glass, high-density polyethylene (HDPE)',
    visualKey: 'chemical-container',
  },
]
