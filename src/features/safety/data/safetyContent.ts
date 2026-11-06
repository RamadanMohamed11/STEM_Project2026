export const safetySources = [
  {
    id: 'acs-overview',
    title: 'ACS — Safety in Middle and High School Chemistry',
    url: 'https://www.acs.org/education/policies/middle-and-high-school-chemistry/safety.html',
  },
  {
    id: 'acs-guidelines',
    title: 'ACS — Laboratory Safety in Secondary Schools (PDF)',
    url: 'https://www.acs.org/content/dam/acsorg/about/governance/committees/chemicalsafety/publications/acs-secondary-safety-guidelines.pdf',
  },
  {
    id: 'acs-conduct',
    title: 'ACS — Student Laboratory Code of Conduct',
    url: 'https://institute.acs.org/acs-center/lab-safety/education-training/high-school-labs/student-lab-code-of-conduct.html',
  },
  {
    id: 'cde-ppe',
    title: 'California Department of Education — Personal Protective Equipment',
    url: 'https://www.cde.ca.gov/ci/pl/ppe.asp',
  },
  {
    id: 'unsw-safety',
    title: 'UNSW Chemistry — First Year Laboratory Safety',
    url: 'https://www.chem.unsw.edu.au/bridging-prelab/safety_induction.php',
  },
] as const

export type SafetySourceId = (typeof safetySources)[number]['id']
export const safetyReviewStatus = 'Academic review needed' as const

export interface SafetyTip {
  id: string
  title: string
  detail: string
  sourceIds: readonly SafetySourceId[]
}

export interface PPEItem {
  id: string
  title: string
  icon: 'coat' | 'goggles' | 'gloves' | 'shoes' | 'hair'
  what: string
  why: string
  when: string
  avoid: string
  sourceIds: readonly SafetySourceId[]
}

export const safetyIntroduction = [
  {
    id: 'ppe',
    title: 'Wear protective gear (PPE)',
    detail:
      'PPE means personal protective equipment. Use the safety goggles, clothing and gloves chosen for the activity by your teacher.',
    sourceIds: ['cde-ppe'],
  },
  {
    id: 'workspace',
    title: 'Know your workspace',
    detail:
      'Keep your work table clear. Know where safety tools and exits are. Follow your teacher’s directions before touching equipment.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'materials',
    title: 'Handle materials safely',
    detail:
      'Glass can break and hot tools can burn. Never handle unknown chemicals without permission. Report spills or broken equipment straight away.',
    sourceIds: ['acs-guidelines'],
  },
] as const satisfies readonly SafetyTip[]

export const ppeGuide: readonly PPEItem[] = [
  {
    id: 'lab-coat',
    title: 'Laboratory Coat',
    icon: 'coat',
    what: 'A protective layer over your clothes.',
    why: 'Helps protect skin and clothing from splashes.',
    when: 'Wear the coat or apron your teacher selects for the activity’s risks.',
    avoid: 'Leaving it open or continuing with contaminated clothing. Tell your teacher.',
    sourceIds: ['cde-ppe', 'acs-guidelines'],
  },
  {
    id: 'goggles',
    title: 'Safety Goggles',
    icon: 'goggles',
    what: 'Eye protection fitted around your eyes.',
    why: 'Chemical splash goggles help keep splashes out.',
    when: 'Wear teacher-approved eye protection for practical chemistry, including demonstrations. Follow the experiment’s rules.',
    avoid: 'Using ordinary glasses as splash protection or lifting goggles while hazards remain.',
    sourceIds: ['acs-guidelines', 'cde-ppe'],
  },
  {
    id: 'gloves',
    title: 'Protective Gloves',
    icon: 'gloves',
    what: 'Hand protection chosen for a specific task.',
    why: 'The right type helps protect against the identified hazard.',
    when: 'Use gloves when the risk assessment calls for them. Ask your teacher which type to use.',
    avoid:
      'Assuming one glove protects against every chemical or heat. Do not touch your face with contaminated gloves.',
    sourceIds: ['cde-ppe', 'acs-guidelines'],
  },
  {
    id: 'shoes',
    title: 'Closed-Toe Shoes',
    icon: 'shoes',
    what: 'Shoes that cover your toes and feet.',
    why: 'Help protect against spills and dropped objects.',
    when: 'Wear suitable closed footwear for hands-on laboratory work.',
    avoid: 'Sandals, open toes or exposed feet.',
    sourceIds: ['cde-ppe', 'acs-conduct'],
  },
  {
    id: 'hair-clothing',
    title: 'Hair and Clothing',
    icon: 'hair',
    what: 'Tied-back long hair and secured loose clothing.',
    why: 'Keeps them away from flames and equipment.',
    when: 'Prepare before practical work. Ask for help securing loose sleeves or clothing.',
    avoid: 'Hair, sleeves or dangling items hanging over the work area.',
    sourceIds: ['acs-conduct', 'acs-guidelines'],
  },
]

export const beforeLab: readonly SafetyTip[] = [
  {
    id: 'read',
    title: 'Read the instructions',
    detail: 'Read every step before starting. Ask about anything unclear.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'risks',
    title: 'Understand the risks',
    detail:
      'A hazard can cause harm. Risk is how likely harm is and how serious it could be. Discuss possible dangers and precautions with your teacher.',
    sourceIds: ['acs-guidelines'],
  },
  {
    id: 'safety-tools',
    title: 'Find safety equipment',
    detail:
      'Know the exits, eyewash and safety shower locations. Learn the school’s emergency instructions before work begins.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'organize',
    title: 'Clear your workspace',
    detail: 'Put bags away where directed. Keep work areas and exits clear.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'teacher',
    title: 'Wait for your teacher',
    detail: 'Work only with teacher supervision. Follow the demonstrated method.',
    sourceIds: ['acs-guidelines'],
  },
  {
    id: 'unknown',
    title: 'Check before using materials',
    detail: 'Do not use unknown or unlabelled substances. Ask your teacher first.',
    sourceIds: ['acs-guidelines'],
  },
]

export const labBehavior: readonly SafetyTip[] = [
  {
    id: 'food',
    title: 'Keep food and drinks outside',
    detail: 'Do not eat, drink or chew gum in the lab. Wash your hands after practical work.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'labels',
    title: 'Read labels carefully',
    detail:
      'Check the substance name and warnings before use. Ask your teacher to explain unfamiliar symbols.',
    sourceIds: ['acs-guidelines'],
  },
  {
    id: 'chemicals',
    title: 'Use only the instructed materials',
    detail:
      'Never taste laboratory chemicals or smell them directly. Do not mix substances unless instructed.',
    sourceIds: ['acs-guidelines', 'unsw-safety'],
  },
  {
    id: 'spills',
    title: 'Report spills and injuries',
    detail:
      'Tell your teacher immediately, even about small spills or breakages. Do not try to clean an unknown spill yourself.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'equipment',
    title: 'Use tools as shown',
    detail: 'Check for damage. Report cracked glass or faulty tools instead of using them.',
    sourceIds: ['acs-conduct'],
  },
  {
    id: 'emergency',
    title: 'Follow emergency instructions',
    detail:
      'Alert your teacher and follow the school’s emergency plan. Do not improvise a rescue or cleanup.',
    sourceIds: ['acs-guidelines'],
  },
]
