# T41 — Generic hazard warnings

Implemented 8 November 2026. Draft educational guidance only; no official chemical classification or practical competence claim.

## Data and integration

- `src/features/safety/data/hazards.ts`: seven stable IDs: flammable, toxic-gas, explosive, corrosive, oxidizer, hot-surface, irritant. Each provides a label, description, Lucide icon key, precautions, reviewed-handling PPE and engineering controls. Fume hoods are correctly identified as engineering controls rather than wearable PPE. Glove material, heat protection and additional controls remain activity-specific.
- Existing T40 material notes now have explicit references: concentrated hydrochloric acid → corrosive; chlorine water → toxic-gas; cyclohexane → flammable. No concentration-specific GHS category was invented. Remaining chemical associations need content review.
- Optional `Experiment.hazards`, `SafetyMetadata.hazards` and material `hazards` reference the shared IDs. No hazard is inferred from a chemical name, illustration or experiment title. Existing salt/water data was not assigned an unsupported hazard.
- Optional `Experiment.hazardSteps` explicitly maps workflow step IDs to hazard IDs. `getContextualSafetyState` adds mapped precautions at the current step, retaining the existing blocked-action priority, scientific state and other safety checks. Completed workflows do not trigger a mapped active-step warning.
- `getExperimentHazardIds` combines and deduplicates experiment/safety/material/step references. Unknown identifiers return no invented definitions.
- Details and material sections reuse `HazardAlert`. Laboratory entry uses a dismissible warning; mapped step warnings remain visible separately. The warning area has bounded internal scrolling and does not introduce document scrolling into the immersive lab.
- `VirtualLabPage` now uses the same existing student catalog selector as details, including its explicit sample fallback. This does not add a backend service, new simulation definition or a new data-fetching implementation.

## Acknowledgement lifecycle

`ExperimentHazardGate` prevents mounting the actual laboratory child when the supplied metadata is high-risk and at least one recognized hazard is assigned, including hazards on materials. Direct lab URLs pass through the same gate. The checkbox is initially unchecked and Continue is disabled until explicitly checked. No extra gate applies when hazard associations are absent or the activity is not high-risk.

Acknowledgements live in an in-memory set via a small subscription hook, separate from scientific stores and safety-training progress. Keys include the experiment ID, level, sorted hazard IDs and step mappings. Navigation within the running app preserves that acknowledgement; a changed risk key or browser refresh requires a new one. No browser storage, account write, credential or completion record is created. Restarting scientific quantities does not automatically revoke an unchanged acknowledgement.

The gate is educational frontend UX, not server authorization, a safety certificate or a substitute for teacher review. Catalog fallback remains the existing demonstration behavior; this is not a live risk-assessment verification service. Future published hazardous content needs reviewed metadata and end-to-end testing with its actual supported simulation, including remote-data availability handling. No such new chemical experiment or publication was added here.

## Actual verification

- `npm run typecheck`, `npm run lint`, `npm run build`: passed. Existing large Three.js chunk warning remains.
- `npm test`: **345 passed, 0 failed, skipped or cancelled**; 146.4 seconds. Four new tests cover all seven lookups, missing/unknown IDs, relationship aggregation, high-risk gating rules, identity isolation, unchanged safe entry, disabled direct-entry gate and explicit contextual step mapping.
- Browser on the local Vite app: isolated fixture checks passed for disabled initial gate, dismissing the introductory warning, explicit checkbox enabling Continue, opening the fixture child only after acknowledgement, and clearing acknowledgement on refresh.
- Visual checks: default desktop and 375px mobile. Mobile hazard content had no horizontal document overflow. The actual salt details page showed no new hazard panel and the actual 3D lab rendered without a hazard acknowledgement gate. Existing laboratory safety confirmation remains unchanged.
- Existing planned-content visual check: Halogen Displacement Reactions rendered its actual T40 details and material warnings through the real page component at desktop and 375px. It remains Coming Soon with no lab action. This was an isolated rendering harness, not publication or a new experiment.
- High-risk gate visual fixture: ignored `artifacts/t41-preview.html` and `.tsx`, clearly labelled QA-only. It is not a production route, catalog experiment, curriculum assignment or database record. It exercises the real reusable components, not a fake scientific result.
- Evidence: `artifacts/t41-tests-final.log`, `t41-build.log`, `t41-browser.json`, `t41-hazard-mobile.png`, `t41-safe-lab.png`.

## Academic references

General wording and the need for activity-specific risk assessment were reviewed against [ACS middle/high-school safety guidance](https://www.acs.org/education/policies/middle-and-high-school-chemistry/safety.html) and [ACS secondary-school chemistry guidelines](https://www.acs.org/content/dam/acsorg/education/policies/guidelines-teaching-mshs-chemistry/mshs-guidelines-final-2018.pdf). Chemical-specific controls must come from the reviewed procedure and safety data sheet; see [Penn EHRS oxidizer guidance](https://ehrs.upenn.edu/health-safety/lab-safety/chemical-hygiene-plan/standard-operating-procedures/sop-strong-oxidizers) and [Cornell corrosives guidance](https://ehs.cornell.edu/research-safety/chemical-safety/laboratory-safety-manual/chapter-8-chemical-hazards/89-corrosives).

No database, RLS, auth setting, scientific calculation or 3D model was changed. No new dependency, push or production deployment is part of T41.
