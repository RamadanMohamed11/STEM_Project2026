import type { SafetyRule } from '../lib/safetyRules.ts'

/**
 * L9 lab safety rules (data). Explanations are general school-lab guidance; teachers' local
 * risk assessments always take precedence.
 */
export const LAB_SAFETY_RULES: readonly SafetyRule[] = [
  {
    id: 'water-into-concentrated-acid',
    title: 'Water added to a concentrated acid',
    hazard: 'corrosive',
    severity: 'danger',
    explanation:
      'Adding water to a concentrated acid releases heat so fast that the mixture can boil and spit acid. Always add the acid slowly to the water, never water to acid.',
    effect: 'heat',
    when: { kind: 'liquid-into-concentrated' },
  },
  {
    id: 'corrosive-without-goggles',
    title: 'Handling a corrosive liquid without goggles',
    hazard: 'corrosive',
    severity: 'warning',
    explanation:
      'Acids and alkalis can splash into the eyes. Put on safety goggles before pouring or testing them.',
    when: {
      kind: 'hazard-without-ppe',
      hazard: 'corrosive',
      ppe: 'goggles',
      actions: ['pour', 'dip'],
    },
  },
  {
    id: 'flame-without-goggles',
    title: 'Lighting a flame without goggles',
    hazard: 'hot-surface',
    severity: 'warning',
    explanation:
      'Heating can make liquids spit or glass crack. Wear safety goggles whenever a burner is lit.',
    when: { kind: 'flame-without-ppe', ppe: 'goggles' },
  },
  {
    id: 'incompatible-chemicals',
    title: 'Incompatible chemicals mixed',
    hazard: 'toxic-gas',
    severity: 'danger',
    explanation:
      'These chemicals react dangerously together (for example releasing a toxic gas). Check the label and the procedure before mixing anything.',
    effect: 'smoke',
    when: { kind: 'incompatible-mix' },
  },
  {
    id: 'heating-empty-vessel',
    title: 'Heating an empty glass vessel',
    hazard: 'hot-surface',
    severity: 'warning',
    explanation:
      'Empty glassware heats unevenly and can crack. Put the liquid in before lighting the burner.',
    when: { kind: 'heat-empty-vessel' },
  },
  {
    id: 'heating-closed-vessel',
    title: 'Heating a closed container',
    hazard: 'explosive',
    severity: 'danger',
    explanation:
      'Gas expands when heated; a sealed container can burst. Never heat a closed container — leave it open or use a delivery tube.',
    effect: 'explosion',
    when: { kind: 'heat-closed-vessel', aboveC: 80 },
  },
  {
    id: 'boiled-dry',
    title: 'Vessel boiled dry',
    hazard: 'hot-surface',
    severity: 'warning',
    explanation:
      'All the liquid boiled away while the flame was still on, so the glass now overheats. Turn off the burner before the liquid runs out.',
    when: { kind: 'boil-dry' },
  },
]
