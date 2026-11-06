# Home Page Educational Sections (Task T06)

## Overview

Task T06 expands the **STEM Virtual Lab** Home page with four comprehensive, student-focused educational sections placed directly below the T05 Hero section. These sections are tailored specifically for secondary school students, explaining what the platform is, demonstrating why chemistry matters in everyday life, showing the core value of hands-on experimentation, and providing a clear, interactive 6-step journey through the application.

## 1. Architectural Structure

The Home page (`src/pages/HomePage.tsx`) assembles the following sections sequentially:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. T05 Chemistry Hero (Preserved intact)                    │
│    Headline, call-to-actions, visual 3D beaker banner       │
├─────────────────────────────────────────────────────────────┤
│ 2. Section 1: Website Introduction                          │
│    src/features/home/components/WebsiteIntroduction.tsx     │
├─────────────────────────────────────────────────────────────┤
│ 3. Section 2: Chemistry in Everyday Life                    │
│    src/features/home/components/EverydayChemistry.tsx       │
├─────────────────────────────────────────────────────────────┤
│ 4. Section 3: Why Practical Experiments Matter              │
│    src/features/home/components/WhyExperimentsMatter.tsx    │
├─────────────────────────────────────────────────────────────┤
│ 5. Section 4: How the Website Works (6-Step Journey)        │
│    src/features/home/components/HowItWorks.tsx              │
├─────────────────────────────────────────────────────────────┤
│ 6. Prototype Status Callout & 3D Lab Link                   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Section Details & Educational Content

### Section 1: Website Introduction (`WebsiteIntroduction.tsx`)
- **Audience:** Secondary school students preparing for classroom lessons, exams, and practical lab tests.
- **Purpose:** Answers what the platform is, who it is for, and how the virtual lab helps students understand practical science.
- **Pillars:**
  1. *Built for Secondary School Science:* Aligned with high school chemistry topics and exam requirements.
  2. *Learn by Doing, Not Just Reading:* Hands-on manipulation of beakers, balances, spatulas, and solutions.
  3. *Safe and Unlimited Practice:* Freedom to make mistakes, reset anytime, and learn without chemical hazards.
- **Interactive Links:** Direct access to `/safety` and `/experiments/preview/lab`.

### Section 2: Chemistry in Everyday Life (`EverydayChemistry.tsx`)
Connects chemistry to four familiar, relatable everyday phenomena with clear observations and scientific explanations:
1. **Cooking Food:** Thermal chemical reactions, denaturation of proteins, and caramelization of sugars.
2. **Rusting Iron:** Oxidation of iron metal in the presence of oxygen and atmospheric moisture to form iron oxide.
3. **Cleaning with Soap:** Surfactant molecular structure with hydrophilic heads and hydrophobic tails lifting grease into water.
4. **Everyday Materials:** Material science and properties (thermal conductivity of metals vs. heat insulation of polymers).

### Section 3: Why Practical Experiments Matter (`WhyExperimentsMatter.tsx`)
Explains the pedagogical advantages of experimental science:
1. **Understand Scientific Ideas:** Translating abstract textbook equations into concrete observations.
2. **See How Materials Actually Change:** Observing dissolution, temperature changes, color shifts, and gas generation.
3. **Master Laboratory Tools:** Practicing graduated cylinders, digital balances, spatulas, and stirring rods.
4. **Connect Lessons to Real Situations:** Linking classroom science to medicine, water purification, and sustainability.

### Section 4: How the Website Works (`HowItWorks.tsx`)
Presents a 6-step roadmap with clear differentiation between active/available features and planned features:

| Step | Title | Target Route | Status Pill | Tone | Feature State |
|:---|:---|:---|:---|:---|:---|
| 01 | Create an Account | `/signup` | Coming Soon | `neutral` | Planned / Preview |
| 02 | Learn Laboratory Safety | `/safety` | Available | `ready` | Active |
| 03 | Choose Grade and Term | `/grades` | Coming Soon | `neutral` | Structure Ready |
| 04 | Explore Chemistry Experiments | `/experiments` | Available Demo | `ready` | Active |
| 05 | Use the Virtual Laboratory | `/experiments/preview/lab` | 3D Lab Ready | `ready` | Active 3D |
| 06 | Test Your Knowledge | `/experiments/exp-salt-water-001/quiz` | Coming Soon | `neutral` | Preview Ready |

## 3. Language & Accessibility Standards

- **Language:** English only (`lang="en"`, `dir="ltr"`). No Arabic or RTL elements.
- **Tone:** Friendly, direct, secondary-school appropriate vocabulary. Short sentences without corporate or academic jargon.
- **Semantics:** Landmark `<section>` wrappers with `aria-labelledby`, accessible heading hierarchies (`<h2>`, `<h3>`), semantic `<ol>` and `<ul>` lists, and `aria-hidden="true"` on decorative icons.
- **Responsive Layout:** Mobile-first grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` and `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), responsive padding, and tap targets exceeding 44px (`min-h-11`).
- **Design Tokens:** Strict adherence to color tokens (`--color-navy`, `--color-teal`, `--color-teal-dark`, `--color-teal-soft`, `--color-canvas`, `--color-line`).

## 4. Verification

- `npm run typecheck`: Passed (TypeScript `tsc -b --pretty`).
- `npm run lint`: Passed (ESLint clean, 0 warnings/errors).
- `npm test`: Passed (193 tests passing in `tests/*.test.mjs`).
- `npm run build`: Production bundle built cleanly with Vite.
