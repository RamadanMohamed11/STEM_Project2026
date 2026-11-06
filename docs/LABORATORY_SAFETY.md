# T12 — Laboratory Safety Introduction and PPE Guide

## Integration and educational content

The existing `/safety` page and `SafetyOverview` were extended. Existing navigation, page heading, design tokens and the link to Choose Your Grade remain in place. The guide is public and does not depend on an account.

Four sections introduce safe practical work:

1. **Why safety matters**: care for yourself and others, following instructions, workspace awareness and careful handling of materials.
2. **Your protective equipment**: five illustrated icon entries for coats, goggles, gloves, footwear, and hair/clothing. Each explains what it is, why it helps, when to use it and mistakes to avoid.
3. **Before entering the laboratory**: instructions, hazard/risk awareness, safety equipment locations, workspace preparation, teacher supervision and unknown substances.
4. **Good habits in the lab**: food/drink, labels, chemical handling, reporting incidents, equipment condition and following school emergency instructions.

The previous blanket instruction to always use gloves was corrected. PPE selection is tied to the activity's risk assessment and teacher instructions. The guide explains that glove types do not provide universal protection, and ordinary glasses do not replace splash protection. General lessons remain separate from experiment-specific requirements.

Topic links support quick navigation through the page. All content stays visible without requiring a checklist, quiz, acknowledgement or completed status. The next action goes to the existing `/grades` page; no later grade-selection feature is implemented.

## Content structure and components

- `src/features/safety/data/safetyContent.ts`: typed `SafetyTip` and `PPEItem` records, stable IDs, source IDs, source links and an explicit academic-review status. No scientific experiment definitions are duplicated.
- `SafetyOverview.tsx`: retains the three original themes and reuses the structured introduction data.
- `PPEGuide.tsx`: responsive, labeled icon guide using the existing Lucide dependency. Icons are decorative; text supplies all meaning.
- `SafetyLessonSection.tsx`: shared numbered section wrapper and `SafetyTipList` for other local safety lessons or warnings later.
- `src/pages/SafetyPage.tsx`: assembles the sections, scope statement, references and next-step action.
- `tests/safetyContent.test.mjs`: content-reference integrity, complete PPE records, public rendering, topic links and absence of completion controls.

The local data can support additional lessons and teacher review later. Source IDs identify the basis of each entry; they are not claims of academic approval. No authentication, backend, new dependency, quiz or completion storage was added.

## Sources and academic review

Authoritative sources consulted on 6 November 2026:

- [ACS: Safety in Middle and High School Chemistry](https://www.acs.org/education/policies/middle-and-high-school-chemistry/safety.html): secondary-school safety education and risk assessment context.
- [ACS: Guidelines for Chemical Laboratory Safety in Secondary Schools](https://www.acs.org/content/dam/acsorg/about/governance/committees/chemicalsafety/publications/acs-secondary-safety-guidelines.pdf): hazards, labels, preparation, practical work and emergency planning. Relevant sections include printed pages 20, 30–31, 52–55, 58–62 and 66–67.
- [ACS: Student Laboratory Code of Conduct](https://institute.acs.org/acs-center/lab-safety/education-training/high-school-labs/student-lab-code-of-conduct.html): general behavior and handling equipment. This source is a school-policy template, not the application's institutional policy or a mandatory online acknowledgement form.
- [California Department of Education: Personal Protective Equipment](https://www.cde.ca.gov/ci/pl/ppe.asp): activity-based PPE selection, including gloves and body protection. This supplements ACS's model rules with explicit risk-based selection guidance.
- [UNSW Chemistry: First Year Laboratory Safety](https://www.chem.unsw.edu.au/bridging-prelab/safety_induction.php): supplemental support for the no-tasting guidance. Only general handling principles were adapted for the school audience, not university-specific procedures.

Student wording is original, concise English. No hazard classifications, chemical-specific glove selections, emergency treatment procedures or certifications were invented. The page explicitly requires academic review before adoption as official school/university guidance. School rules and teacher-reviewed experiment instructions still determine practical requirements.

## Verification

- TypeScript, ESLint and production build: passed.
- Automated tests: **217 passed, 0 failed, 0 cancelled**. Logs are in the ignored `artifacts/t12-*.log` files.
- Production deployment: `dpl_5THEsF5cqrEfWKofafvYEhMAa8b3`, verified READY on the existing `stem-project2026.vercel.app` domain.
- Desktop browser: all four sections and five PPE entries rendered publicly; the equipment topic link navigated to `#ppe-guide`.
- Mobile browser: reviewed at 390 × 844; cards stacked in one column without horizontal clipping. The temporary viewport override was reset.
- The references disclosure opened and exposed all five source links. Choose Your Grade navigated to `/grades`, and browser Back returned to Safety.
- The existing public lab route opened without authentication. The simulation's own safety confirmation remains unchanged and separate from this introduction.
- A SHA-256 comparison of 87 existing simulation files found **0 changed**.

The build retains the large JavaScript chunk warning. Academic content review is still pending; software verification is not institutional safety approval. Desktop and mobile screenshots are saved in the ignored `artifacts/t12-safety-desktop.png` and `artifacts/t12-safety-mobile.png` files.
