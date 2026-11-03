import type { LaboratoryPresentation } from '@/types/laboratory'

/** Demonstration script only. No live apparatus, measurements, or reaction are produced. */
export const saltDissolutionWorkspace: LaboratoryPresentation = {
  experimentId: 'exp-salt-water-001',
  inventory: [
    {
      id: 'beaker',
      title: 'Beaker',
      category: 'equipment',
      visual: 'beaker',
      description: 'Holds the water and provides space for stirring.',
      detail:
        'Graduations on typical beakers are approximate, not for precise volume measurements.',
    },
    {
      id: 'graduated-cylinder',
      title: 'Graduated cylinder',
      category: 'equipment',
      visual: 'graduated-cylinder',
      description: 'Used to measure a chosen volume of water.',
      detail: 'Read the bottom of the water meniscus at eye level.',
    },
    {
      id: 'stirring-rod',
      title: 'Stirring rod',
      category: 'equipment',
      visual: 'stirring-rod',
      description: 'Helps distribute the salt through the water.',
      detail: 'A clean glass rod is normally used with gentle circular movements.',
    },
    {
      id: 'spatula',
      title: 'Laboratory spatula',
      category: 'equipment',
      visual: 'spatula',
      description:
        'Scoop a 5 g demonstration portion from the NaCl jar using a controlled dip gesture.',
      detail:
        'Bring the spatula tip over the jar opening, move it to scoop, then transfer the crystals to the weighing boat.',
    },
    {
      id: 'weighing-boat',
      title: 'Weighing boat',
      category: 'equipment',
      visual: 'weighing-boat',
      description: 'Holds transferred salt for simulated weighing; can be tilted over the beaker.',
      detail:
        'Place the loaded boat on the balance to obtain model-derived net mass. A true calibrated load cell is not simulated.',
    },
    {
      id: 'digital-balance',
      title: 'Digital balance',
      category: 'equipment',
      visual: 'digital-balance',
      description: 'Displays the modelled NaCl net mass in a tared weighing boat.',
      detail:
        'This teaching balance derives its display from solid-mass state when a weighing boat is placed on it; it is not a calibrated instrument.',
    },
    {
      id: 'water',
      title: 'Water',
      category: 'materials',
      visual: 'water',
      description: 'The solvent in the proposed salt solution.',
      detail: 'Water molecules surround the sodium and chloride ions when the solid dissolves.',
    },
    {
      id: 'sodium-chloride',
      title: 'Sodium chloride',
      category: 'materials',
      visual: 'sodium-chloride',
      description: 'The solute; solid table salt (NaCl).',
      detail:
        'Dissolving separates existing sodium and chloride ions; it does not create a new chemical substance.',
    },
  ],
  stages: [
    {
      id: 'equipment',
      kind: 'equipment',
      title: 'Laboratory Equipment',
      introduction: 'Identify the tools used to prepare and observe an aqueous salt solution.',
      steps: [
        'Locate a clean beaker, graduated cylinder, stirring rod, spatula, weighing boat and digital balance.',
        'Check the purpose of each tool in the inventory panel.',
      ],
      note: 'Drag equipment into the actual 3D workbench; scientific actions depend on meaningful contact gestures.',
    },
    {
      id: 'reactants',
      kind: 'materials',
      title: 'Reactants and Chemicals',
      introduction:
        'This demonstration uses water and sodium chloride. They are a solvent and a solute, rather than reactants in a new-compound-forming reaction.',
      steps: [
        'Identify water (H₂O) as the solvent.',
        'Identify sodium chloride (NaCl) as the ionic solid to be dissolved.',
      ],
      note: 'Use lab-specified materials only; never taste or drink from laboratory containers.',
    },
    {
      id: 'procedure',
      kind: 'procedure',
      title: 'Experimental Procedures',
      introduction:
        'The intended method is to add a measured portion of salt to water and stir gently.',
      steps: [
        'Measure water with a graduated cylinder and transfer it to the beaker.',
        'Scoop NaCl with the spatula, deposit it in a tared weighing boat, then place the boat on the balance.',
        'Add the solid and stir; observe whether visible crystals remain.',
      ],
      note: 'Use direct 3D apparatus movement to pour, scoop, weigh, transfer and stir. Quantities are deterministic educational values, not certified measurements.',
    },
    {
      id: 'measurements',
      kind: 'measurements',
      title: 'Measurements',
      introduction:
        'A real experiment would record the initial water volume, added salt mass, and observations of undissolved solid.',
      steps: [
        'Read the liquid meniscus at eye level when measuring water volume.',
        'Record salt mass in grams and water volume in millilitres.',
        'Document whether any visible salt remains after stirring.',
      ],
      note: 'Readouts derive from domain quantities. The weighing-boat net mass appears only while it is on the simulated balance.',
    },
    {
      id: 'observations',
      kind: 'observations',
      title: 'Chemical Reactions and Results',
      introduction:
        'Salt dissolving in water is generally a physical dissolution process, not evidence that a new chemical compound formed.',
      steps: [
        'If the amount added is within the solubility limit, the salt crystals become no longer visible.',
        'Sodium and chloride ions disperse through the water, forming an aqueous solution.',
        'Consider how evaporation could recover solid sodium chloride from the solution.',
      ],
      note: 'Dissolved and undissolved mass are calculated from simplified simulation rules. Treat their time dependence as educational, not experimentally validated.',
    },
  ],
  assistantNote:
    'When sodium chloride dissolves, existing Na⁺ and Cl⁻ ions separate from the crystal and become surrounded by water molecules. The solution can appear clear even though dissolved ions are present.',
}
