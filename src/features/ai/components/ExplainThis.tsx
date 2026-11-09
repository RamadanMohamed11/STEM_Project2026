import { useEffect, useId, useRef, useState } from 'react'
import { BookOpenText, RotateCcw, Sparkles, Square } from 'lucide-react'
import { useAuth } from '@/features/auth/authContext'
import { askTutor } from '../lib/tutorSession'
import {
  explainFallbackReasons,
  explainStateFromOutcome,
  type ExplainState,
} from '../lib/explainState'

export interface ExplainThisProps {
  experimentId: string
  /** Predefined prompt (see buildExplainPrompt); never typed by the student. */
  prompt: string
  stage?: string
  getLabState?: () => string | undefined
  /** Existing static explanation, shown when the AI cannot answer. */
  fallback: string
  label?: string
  className?: string
}

/** "Explain this": calls the AI only on click and always ends with something to read. */
export function ExplainThis({
  experimentId,
  prompt,
  stage,
  getLabState,
  fallback,
  label = 'Explain this',
  className = '',
}: ExplainThisProps) {
  const { state: auth } = useAuth()
  const [state, setState] = useState<ExplainState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  const regionId = useId()

  useEffect(() => () => abortRef.current?.abort(), [])

  async function explain() {
    if (state.status === 'loading') return
    if (auth.status !== 'authenticated') {
      setState({ status: 'fallback', reason: explainFallbackReasons.loggedOut })
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    let text = ''
    setState({ status: 'loading', text })
    const outcome = await askTutor({
      experimentId,
      stage,
      labState: getLabState?.(),
      messages: [{ role: 'user', content: prompt }],
      signal: controller.signal,
      onDelta: (delta) => {
        text += delta
        setState({ status: 'loading', text })
      },
    })
    abortRef.current = null
    setState(explainStateFromOutcome(outcome, text))
  }

  const busy = state.status === 'loading'
  const buttonClass =
    'inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal'

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {busy ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className={`${buttonClass} border-line-strong bg-white text-navy hover:bg-surface-muted`}
          >
            <Square size={13} aria-hidden="true" /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={explain}
            aria-controls={regionId}
            className={`${buttonClass} border-teal/50 bg-white text-teal-dark hover:bg-teal-soft`}
          >
            {state.status === 'idle' ? (
              <Sparkles size={14} aria-hidden="true" />
            ) : (
              <RotateCcw size={13} aria-hidden="true" />
            )}
            {state.status === 'idle' ? label : 'Explain again'}
          </button>
        )}
      </div>

      <div id={regionId} aria-live="polite" aria-busy={busy}>
        {(state.status === 'loading' || state.status === 'done') && (
          <div className="rounded-xl border border-teal/25 bg-teal-soft/40 p-3.5 text-xs leading-relaxed text-ink/90">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-teal-dark">
              <Sparkles size={13} aria-hidden="true" /> AI explanation
            </p>
            {state.text ? (
              <p className="whitespace-pre-wrap break-words">{state.text}</p>
            ) : (
              <p className="text-slate">Thinking…</p>
            )}
            {state.status === 'done' && state.stopped && (
              <p className="mt-1 italic text-slate">(stopped)</p>
            )}
            <p className="mt-2 text-[11px] text-slate">
              AI answers can be wrong — check with your teacher.
            </p>
          </div>
        )}
        {state.status === 'fallback' && (
          <div className="rounded-xl border border-line bg-canvas/60 p-3.5 text-xs leading-relaxed text-ink/90">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-navy">
              <BookOpenText size={13} aria-hidden="true" /> {state.reason}
            </p>
            <p className="whitespace-pre-wrap">{fallback}</p>
          </div>
        )}
      </div>
    </div>
  )
}
