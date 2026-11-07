import type { ExperimentMaterialItem } from '../types/toolsAndMaterials'
import { ToolAndMaterialVisual } from './ToolAndMaterialVisual'

interface ExperimentMaterialsSectionProps {
  materials: readonly ExperimentMaterialItem[] | undefined
  measurementDisclaimer?: string
}

/** Helper to render chemical formulas with proper subscripts (e.g., H₂O / H2O -> H<sub>2</sub>O). */
function FormattedChemicalFormula({ formula }: { formula: string }) {
  // Normalize unicode subscripts (e.g., ₂ -> 2) so digits can be wrapped in <sub> tags
  const normalized = formula.replace(/[\u2080-\u2089]/g, (char) =>
    String(char.charCodeAt(0) - 0x2080),
  )
  const parts = normalized.split(/(\d+)/)
  return (
    <span className="font-mono text-sm font-semibold tracking-wide text-teal-dark">
      {parts.map((part, index) =>
        /^\d+$/.test(part) ? <sub key={index}>{part}</sub> : part,
      )}
    </span>
  )
}

export function ExperimentMaterialsSection({
  materials,
  measurementDisclaimer,
}: ExperimentMaterialsSectionProps) {
  return (
    <section
      aria-labelledby="experiment-materials-title"
      className="space-y-5 border-t border-line pt-8"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="experiment-materials-title" className="text-xl font-semibold text-navy">
            Chemical Materials
          </h2>
          <p className="mt-0.5 text-xs text-slate">
            Reagents, solvents, and substances used in this experiment.
          </p>
        </div>
        {materials && materials.length > 0 && (
          <span className="text-xs font-medium text-slate">
            {materials.length} {materials.length === 1 ? 'material' : 'materials'} specified
          </span>
        )}
      </div>

      {!materials || materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-6 text-center">
          <p className="text-sm text-slate">
            Chemical materials and reagents for this planned experiment have not been finalized yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {materials.map((material) => (
              <article
                key={material.id}
                className="flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                aria-labelledby={`material-title-${material.id}`}
              >
                <div className="space-y-4">
                  {/* Header: Visual + Name & Formula + Role */}
                  <div className="flex items-start gap-4">
                    <ToolAndMaterialVisual
                      visual={material.visual}
                      altText={`${material.name} container illustration`}
                      className="size-20 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block rounded bg-teal-soft px-2 py-0.5 text-[11px] font-semibold text-teal-dark">
                          {material.role}
                        </span>
                        {material.formula && (
                          <FormattedChemicalFormula formula={material.formula} />
                        )}
                      </div>
                      <h3
                        id={`material-title-${material.id}`}
                        className="text-lg font-semibold text-navy"
                      >
                        {material.name}
                      </h3>
                      <p className="text-xs text-slate">{material.physicalAppearance}</p>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="rounded-lg bg-canvas/70 p-3 text-xs">
                    <span className="font-semibold text-navy">Purpose in Experiment: </span>
                    <span className="leading-relaxed text-ink/90">{material.purpose}</span>
                  </div>

                  {/* Quantities: Experiment Target vs Initial Stock Supply */}
                  <div className="grid grid-cols-2 gap-3 border-t border-line/70 pt-3">
                    <div className="space-y-1 rounded-lg border border-teal/20 bg-teal-soft/30 p-2.5">
                      <span className="block text-[11px] font-medium text-slate">
                        {material.requiredQuantity.label}
                      </span>
                      <span className="block text-base font-bold text-teal-dark">
                        {material.requiredQuantity.amount} {material.requiredQuantity.unit}
                      </span>
                      {material.requiredQuantity.description && (
                        <span className="block text-[10px] text-slate">
                          {material.requiredQuantity.description}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 rounded-lg border border-line bg-canvas/40 p-2.5">
                      <span className="block text-[11px] font-medium text-slate">
                        {material.stockQuantity.label}
                      </span>
                      <span className="block text-base font-semibold text-navy">
                        {material.stockQuantity.amount} {material.stockQuantity.unit}
                      </span>
                      {material.stockQuantity.description && (
                        <span className="block text-[10px] text-slate">
                          {material.stockQuantity.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Safety Notes */}
                  {material.safetyNotes.length > 0 && (
                    <div className="space-y-1.5 border-t border-line/70 pt-3">
                      <span className="block text-[11px] font-semibold text-navy">
                        Safety Notes:
                      </span>
                      <ul className="list-disc space-y-1 pl-4 text-xs text-slate">
                        {material.safetyNotes.map((note, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Model Disclaimer */}
          {measurementDisclaimer && (
            <p className="rounded-lg border border-line/80 bg-canvas/50 px-4 py-2.5 text-xs text-slate">
              <strong className="font-semibold text-navy">Note:</strong> {measurementDisclaimer}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
