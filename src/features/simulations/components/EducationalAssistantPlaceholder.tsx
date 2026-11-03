import { BookOpenText, Sparkles } from 'lucide-react'

export function EducationalAssistantPlaceholder({ note }: { note: string }) {
  return (
    <section
      aria-labelledby="educational-assistant-title"
      className="rounded-xl border border-line bg-white px-5 py-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-navy">
            <BookOpenText size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal">
              Learning support
            </p>
            <h2 id="educational-assistant-title" className="text-sm font-semibold text-navy">
              Scientific insight
            </h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 text-[11px] font-semibold text-ink/75">
          <Sparkles size={13} aria-hidden="true" /> AI assistant planned
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink/80">{note}</p>
      <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink/70">
        This explanation is static educational text. There is no AI chat or generated response in
        this release.
      </p>
    </section>
  )
}
