# Curriculum Sources & Syllabus Alignment (Task T38)

## 1. Overview
This document outlines the curricular alignment of the **STEM Virtual Lab** with the official secondary chemistry curriculum issued by the **Egyptian Ministry of Education and Technical Education (وزارة التربية والتعليم والتعليم الفني)**.

To satisfy the pedagogical requirements of the Egyptian General Secondary Certificate (Thanaweya Amma / الثانوية العامة) and Secondary Grades 1 and 2, every unit and lesson in the virtual laboratory corresponds directly to practical laboratory requirements and experimental demonstrations specified in the official textbooks.

### Scope Guidelines Followed
- **Practical Experiments Only**: In accordance with task scope, only units and lessons that contain authentic, hands-on or wet-lab laboratory experiments are included. Purely theoretical or numerical calculation chapters without laboratory protocols are excluded from the laboratory browser.
- **English UI & Scientific Nomenclature**: All titles, units, descriptions, and reagent formulas use standardized international English chemical nomenclature (IUPAC) with standard metric units (mL, g, °C, M).
- **Dual Availability State**:
  - The validated 3D salt dissolution workbench (`exp-salt-water-001`) retains `demo` status (`publication_status = 'published'`).
  - All 22 newly introduced secondary curriculum experiments are initialized in `planned` status (`publication_status = 'draft'`), reserving their identities and academic relationships ahead of simulation engine implementation in Phase 4.

---

## 2. Syllabus Breakdown by Grade & Term

### Grade 1 Secondary (`grade-secondary-1`)
*Source Textbook: "Chemistry for First Year Secondary", Egyptian Ministry of Education.*

#### First Term (`term-secondary-1-1`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 1**: Chemistry: The Central Science | Lesson 1: Chemistry and Measurement | `exp-volume-002` | Measuring Liquid Volume | `low` | Graduated cylinder volume measurement and reading the meniscus at eye level. |
| **Unit 1**: Chemistry: The Central Science | Lesson 1: Chemistry and Measurement | `exp-ph-003` | Exploring pH Indicators | `low` | Classification of aqueous solutions into acidic, neutral, and basic using indicators and pH paper. |
| **Unit 3**: Solutions, Colloids, and Acids & Bases | Lesson 1: Solutions and Solubility | `exp-salt-water-001` | Dissolving Salt in Water | `low` | Quantitative dissolution of NaCl in water, distinguishing homogeneous solutions from undissolved solid (3D Demo). |
| **Unit 3**: Solutions, Colloids, and Acids & Bases | Lesson 2: Colloids and the Tyndall Effect | `exp-colloids-004` | Distinguishing Solutions and Colloids | `none` | Concentrated light scattering (Tyndall effect) through water, salt solution, and colloidal dispersions. |
| **Unit 3**: Solutions, Colloids, and Acids & Bases | Lesson 3: Acid-Base Indicators and Titration | `exp-titration-005` | Acid-Base Neutralization Titration | `medium` | Burette neutralization of hydrochloric acid with sodium hydroxide using phenolphthalein. |

#### Second Term (`term-secondary-1-2`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 4**: Thermochemistry | Lesson 1: Heat of Solution and Calorimetry | `exp-heat-dissolution-006` | Measuring Heat of Solution in a Calorimeter | `medium` | Coffee-cup calorimetry measuring temperature change during dissolution of ammonium nitrate and sodium hydroxide. |
| **Unit 4**: Thermochemistry | Lesson 2: Heat of Neutralization | `exp-heat-neutralization-007` | Determination of the Heat of Neutralization | `medium` | Determination of molar enthalpy of neutralization between equimolar solutions of strong acid and strong base. |

---

### Grade 2 Secondary (`grade-secondary-2`)
*Source Textbook: "Chemistry for Second Year Secondary", Egyptian Ministry of Education.*

#### First Term (`term-secondary-2-1`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 1**: Atomic Structure | Lesson 1: Atomic Emission Spectra and Flame Tests | `exp-flame-tests-008` | Flame Emission Tests for Metal Cations | `medium` | Bunsen burner flame emission colors for sodium (yellow-orange), potassium (violet), calcium (brick-red), and copper (green-blue). |
| **Unit 2**: Periodic Table and Periodicity of Properties | Lesson 1: Acidic and Basic Properties of Oxides | `exp-oxides-009` | Acidity and Basicity of Element Oxides | `low` | Chemical behavior of magnesium oxide and carbon dioxide in water with litmus indicators. |
| **Unit 2**: Periodic Table and Periodicity of Properties | Lesson 2: Chemical Activity of Halogens | `exp-halogen-displacement-010` | Halogen Displacement Reactions | `high` | Single displacement reactions of chlorine water with potassium bromide and potassium iodide. |

#### Second Term (`term-secondary-2-2`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 3**: Chemical Bonding and Molecular Shapes | Lesson 1: Electrical Conductivity of Solutions | `exp-conductivity-011` | Electrical Conductivity of Aqueous Solutions | `low` | Testing electrolytic dissociation of NaCl, HCl, CH₃COOH, and sucrose using an electrode apparatus. |
| **Unit 4**: Representative Main Group Elements | Lesson 1: Properties of Alkali Metals (Group 1A) | `exp-sodium-water-012` | Reaction of Sodium with Water | `high` | Controlled reaction of metallic sodium with water, demonstrating hydrogen gas evolution and alkaline solution formation. |
| **Unit 4**: Representative Main Group Elements | Lesson 2: Nitrogen Compounds and Ammonia Gas | `exp-ammonia-prep-013` | Preparation of Ammonia Gas and Fountain Experiment | `high` | Heating ammonium chloride with slaked lime, followed by the ammonia fountain demonstration of high water solubility. |

---

### Grade 3 Secondary (`grade-secondary-3`)
*Source Textbook: "Chemistry for Third Year Secondary (General Secondary)", Egyptian Ministry of Education.*

#### First Term (`term-secondary-3-1`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 1**: Transition Elements | Lesson 1: Catalytic Activity of Transition Metal Compounds | `exp-catalysis-014` | Catalytic Decomposition of Hydrogen Peroxide | `medium` | Heterogeneous catalytic decomposition of H₂O₂ using manganese(IV) oxide catalyst tested with a glowing splint. |
| **Unit 2**: Chemical Analysis | Lesson 1: Qualitative Detection of Anions | `exp-anions-015` | Identification of Acid Radicals (Anions) | `medium` | Main and confirmatory test-tube reactions for carbonate, thiosulfate, and chloride using dilute HCl and AgNO₃. |
| **Unit 2**: Chemical Analysis | Lesson 2: Qualitative Detection of Cations | `exp-cations-016` | Identification of Basic Radicals (Cations) | `medium` | Systematic precipitation of iron(II), iron(III), and aluminum(III) hydroxides and solubility in excess NaOH. |
| **Unit 2**: Chemical Analysis | Lesson 3: Quantitative Volumetric Analysis | `exp-volumetric-titration-017` | Neutralization Titration using Methyl Orange | `low` | Quantitative standardization of hydrochloric acid against standard sodium carbonate with methyl orange indicator. |
| **Unit 3**: Chemical Equilibrium | Lesson 1: Le Chatelier Principle and Concentration Changes | `exp-equilibrium-018` | Chemical Equilibrium and Le Chatelier Principle | `low` | Perturbation of reversible reaction between iron(III) chloride and ammonium thiocyanate observing color shifts. |

#### Second Term (`term-secondary-3-2`)
| Unit | Lesson | Experiment ID | Title | Hazard Level | Description |
|---|---|---|---|---|---|
| **Unit 4**: Electrochemistry | Lesson 1: Galvanic Cells and Cell Potential | `exp-daniell-cell-019` | Constructing a Daniell Galvanic Cell | `low` | Assembly of zinc-copper Daniell cell with KNO₃ agar salt bridge and digital voltmeter electromotive force measurement. |
| **Unit 4**: Electrochemistry | Lesson 2: Electrolytic Cells and Electrolysis | `exp-electrolysis-020` | Electrolysis of Copper(II) Chloride Solution | `medium` | Electrolysis of aqueous CuCl₂ using graphite electrodes with copper cathode deposition and anode chlorine evolution. |
| **Unit 5**: Organic Chemistry | Lesson 1: Detection of Carbon and Hydrogen in Organic Compounds | `exp-organic-detection-021` | Detection of Carbon and Hydrogen in Organic Matter | `medium` | Oxidation of organic material with black CuO to detect CO₂ (limewater turbidity) and H₂O (anhydrous CuSO₄). |
| **Unit 5**: Organic Chemistry | Lesson 2: Preparation of Ethene and Testing Unsaturation | `exp-ethylene-prep-022` | Preparation of Ethene and Baeyer Test | `high` | Laboratory dehydration of ethanol at 180°C with conc. H₂SO₄ and Baeyer unsaturation test with alkaline KMnO₄. |
| **Unit 5**: Organic Chemistry | Lesson 3: Esters and Esterification Reaction | `exp-esterification-023` | Synthesis of Ethyl Acetate Ester | `medium` | Warm water bath acid-catalyzed condensation of glacial acetic acid and ethanol producing fruity ethyl acetate. |

---

## 3. Scientific Review Checklist

Before promoting any planned experiment to a published interactive 3D simulation, curriculum reviewers and chemistry educators should verify the following points:

### Reagent & Stoichiometric Verification
- [ ] Confirm chemical formulas and phase states (s, l, g, aq) match standard secondary textbooks.
- [ ] Ensure concentrations (e.g., 0.1 M, 1.0 M) reflect standard secondary school laboratory preparations.
- [ ] Check that balanced chemical equations are correctly displayed without stoichiometric omissions.

### Safety & PPE Calibration
- [ ] Verify hazard classification (`none`, `low`, `medium`, `high`) reflects real laboratory risks.
- [ ] Confirm required PPE (goggles, gloves, lab coat, face shield) aligns with international GHS standards.
- [ ] Ensure high-risk experiments (sodium with water, ethene preparation, ammonia generation) mandate blast shield or fume hood precautions.

### Pedagogical & Didactic Alignment
- [ ] Validate that 3 to 5 clear, actionable learning objectives are defined per experiment.
- [ ] Verify procedure steps correspond to official Ministry of Education practical examination sheets.
- [ ] Check that expected observations (color changes, precipitate textures, gas evolution) match physical chemical reality.
