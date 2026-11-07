import type { ExperimentLearningContent } from '@/types/experiment'

/** Draft introductions only; not official lessons, procedures or simulation definitions. */
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

export const liquidVolumeLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'This planned activity introduces graduated glassware and reading water volume. Graduated glassware has marks that help you read a volume.',
    'The planned focus is reading the meniscus at eye level. The meniscus is the curved surface of a liquid. This helps you understand how to read a volume scale carefully.',
    'The activity is not available yet. Its materials and instructions are still being reviewed.',
  ],
  objectives: [
    { id: 'volume-scale', text: 'Recognize the volume scale on graduated glassware.' },
    { id: 'volume-meniscus', text: 'Describe what a meniscus is.' },
    {
      id: 'volume-reading',
      text: 'Explain why a water volume reading should be taken at eye level.',
    },
  ],
}

export const phIndicatorsLearning: ExperimentLearningContent = {
  reviewStatus: 'draft',
  about: [
    'This planned activity introduces how indicator colors can help describe solutions as acidic, neutral or basic.',
    'The planned focus is comparing indicator colors. This helps you connect a visible observation with the properties of a solution.',
    'The activity is not available yet. Its chemicals and instructions are still being reviewed.',
  ],
  objectives: [
    { id: 'ph-groups', text: 'Recognize the words acidic, neutral and basic.' },
    { id: 'ph-colors', text: 'Describe how indicator colors can help compare solutions.' },
  ],
}
