import type { ExperimentToolItem } from '../types/toolsAndMaterials'
import { ToolAndMaterialVisual } from './ToolAndMaterialVisual'

interface ExperimentToolsSectionProps {
  tools: readonly ExperimentToolItem[] | undefined
}

export function ExperimentToolsSection({ tools }: ExperimentToolsSectionProps) {
  return (
    <section aria-labelledby="experiment-tools-title" className="space-y-5 border-t border-line pt-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="experiment-tools-title" className="text-xl font-semibold text-navy">
          Laboratory Tools
        </h2>
        {tools && tools.length > 0 && (
          <span className="text-xs font-medium text-slate">
            {tools.length} {tools.length === 1 ? 'tool' : 'tools'} required
          </span>
        )}
      </div>

      {!tools || tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-canvas/60 p-6 text-center">
          <p className="text-sm text-slate">
            Tools and laboratory apparatus for this planned experiment have not been finalized yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="flex flex-col justify-between rounded-xl border border-line bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              aria-labelledby={`tool-title-${tool.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <ToolAndMaterialVisual
                    visual={tool.visual}
                    altText={`${tool.name} laboratory illustration`}
                    className="size-20 shrink-0"
                  />
                  {tool.specification && (
                    <span className="inline-block rounded-md bg-canvas px-2.5 py-1 text-right text-[11px] font-medium text-slate">
                      {tool.specification}
                    </span>
                  )}
                </div>

                <div>
                  <h3 id={`tool-title-${tool.id}`} className="text-base font-semibold text-navy">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate">
                    {tool.shortExplanation}
                  </p>
                </div>

                <div className="space-y-1.5 rounded-lg bg-canvas/70 p-3 text-xs">
                  <span className="font-semibold text-teal-dark">Primary Purpose:</span>
                  <p className="leading-relaxed text-ink/90">{tool.purpose}</p>
                </div>
              </div>

              {tool.safetyNote && (
                <div className="mt-4 border-t border-line/70 pt-3 text-[11px] leading-relaxed text-slate">
                  <span className="font-semibold text-navy">Handling tip: </span>
                  {tool.safetyNote}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
