import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { AlertCircle, ChevronDown, LogIn, RotateCcw, Send, Sparkles, Square } from 'lucide-react'
import { routePaths } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/authContext'
import { AI_TUTOR_CLIENT_LIMITS, type TutorChatMessage } from '../lib/aiTutorClient'
import { askTutor } from '../lib/tutorSession'

interface ChatEntry extends TutorChatMessage {
  id: number
  streaming?: boolean
  stopped?: boolean
}

type Problem = { kind: 'error' | 'rate-limited' | 'unauthorized'; message: string } | null

export interface AiTutorPanelProps {
  experimentId: string
  experimentTitle: string
  /** Current stage label, sent to the tutor as context. */
  stage?: string
  /** Called at send time so the latest lab state is used. */
  getLabState?: () => string | undefined
  suggestions: readonly string[]
  /** `page`: collapsible card. `overlay`: always expanded, for the lab side panel. */
  variant?: 'page' | 'overlay'
  defaultOpen?: boolean
}

let nextId = 1

export function AiTutorPanel({
  experimentId,
  experimentTitle,
  stage,
  getLabState,
  suggestions,
  variant = 'page',
  defaultOpen = false,
}: AiTutorPanelProps) {
  const { state: auth } = useAuth()
  const [open, setOpen] = useState(variant === 'overlay' || defaultOpen)
  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<Problem>(null)
  const [announcement, setAnnouncement] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prefix = useId()
  const expanded = variant === 'overlay' || open

  // Abort an in-flight answer when the panel unmounts (navigation, experiment change).
  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages])

  async function ask(history: ChatEntry[]) {
    const replyId = nextId++
    setMessages([...history, { id: replyId, role: 'assistant', content: '', streaming: true }])
    setBusy(true)
    setProblem(null)
    setAnnouncement('The AI tutor is answering.')
    const controller = new AbortController()
    abortRef.current = controller

    let replyText = ''
    const outcome = await askTutor({
      experimentId,
      stage,
      labState: getLabState?.(),
      messages: history,
      signal: controller.signal,
      onDelta: (text) => {
        replyText += text
        setMessages((current) =>
          current.map((m) => (m.id === replyId ? { ...m, content: m.content + text } : m)),
        )
      },
    })

    abortRef.current = null
    setBusy(false)
    const keep = outcome.kind === 'done' || (outcome.kind === 'aborted' && !!replyText.trim())
    // Failed or empty replies are removed so a retry resends the same question cleanly.
    setMessages((current) =>
      keep
        ? current.map((m) =>
            m.id === replyId ? { ...m, streaming: false, stopped: outcome.kind === 'aborted' } : m,
          )
        : current.filter((m) => m.id !== replyId),
    )
    if (outcome.kind === 'done') setAnnouncement(`AI tutor: ${replyText}`)
    else if (outcome.kind === 'aborted') setAnnouncement('Answer stopped.')
    else {
      setProblem({ kind: outcome.kind, message: outcome.message })
      setAnnouncement(outcome.message)
    }
  }

  function send(text: string) {
    const content = text.trim().slice(0, AI_TUTOR_CLIENT_LIMITS.maxMessageChars)
    if (!content || busy) return
    setDraft('')
    void ask([...messages, { id: nextId++, role: 'user', content }])
  }

  function retry() {
    if (busy) return
    const history = [...messages]
    while (history.length && history[history.length - 1].role !== 'user') history.pop()
    if (history.length) void ask(history)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    send(draft)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(draft)
    }
    // Keep Escape inside the chat instead of clearing lab selections.
    if (event.key === 'Escape') event.stopPropagation()
  }

  const titleId = `${prefix}-title`
  const bodyId = `${prefix}-body`

  const body = (() => {
    if (auth.status === 'loading')
      return <p className="text-sm text-slate">Checking your account…</p>
    if (auth.status === 'unavailable')
      return (
        <p className="text-sm leading-relaxed text-slate">
          The AI tutor is not available in this version of the site.
        </p>
      )
    if (auth.status !== 'authenticated')
      return (
        <div className="space-y-3 text-sm leading-relaxed text-ink">
          <p>Log in to ask the AI tutor questions about “{experimentTitle}”.</p>
          <Link
            to={routePaths.login}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-dark px-4 font-semibold text-white hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <LogIn size={16} aria-hidden="true" /> Log in
          </Link>
        </div>
      )

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate">
            Ask about what you see, why a step matters, or the science behind “{experimentTitle}”.
          </p>
        ) : (
          <ol
            ref={listRef}
            aria-label="Conversation with the AI tutor"
            className={`min-h-0 space-y-3 overflow-y-auto overscroll-contain pr-1 ${
              variant === 'overlay' ? 'flex-1' : 'max-h-96'
            }`}
          >
            {messages.map((message) => (
              <li
                key={message.id}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-teal-dark text-white'
                      : 'rounded-bl-md border border-line bg-surface-muted text-ink'
                  }`}
                >
                  <span className="sr-only">
                    {message.role === 'user' ? 'You: ' : 'AI tutor: '}
                  </span>
                  {message.content ||
                    (message.streaming ? (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        <span className="size-1.5 animate-pulse rounded-full bg-slate" />
                        <span className="size-1.5 animate-pulse rounded-full bg-slate [animation-delay:150ms]" />
                        <span className="size-1.5 animate-pulse rounded-full bg-slate [animation-delay:300ms]" />
                      </span>
                    ) : null)}
                  {message.stopped && (
                    <span className="mt-1 block text-xs italic text-slate">(stopped)</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {problem && (
          <div
            role="alert"
            className="flex flex-wrap items-start gap-2 rounded-lg border border-danger/30 bg-white px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">{problem.message}</span>
            {problem.kind === 'error' && (
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw size={14} aria-hidden="true" />}
                onClick={retry}
              >
                Retry
              </Button>
            )}
            {problem.kind === 'unauthorized' && (
              <Link
                to={routePaths.login}
                className="font-semibold text-teal-dark underline underline-offset-4"
              >
                Log in
              </Link>
            )}
          </div>
        )}

        {messages.length === 0 && (
          <div>
            <p id={`${prefix}-suggest`} className="mb-2 text-xs font-semibold text-slate">
              Try asking
            </p>
            <ul aria-labelledby={`${prefix}-suggest`} className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => send(question)}
                    className="min-h-9 rounded-full border border-teal/40 bg-white px-3 py-1.5 text-left text-xs font-medium text-teal-dark hover:bg-teal-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-55"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-1.5">
          <label htmlFor={`${prefix}-input`} className="sr-only">
            Your question for the AI tutor
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id={`${prefix}-input`}
              ref={inputRef}
              rows={2}
              value={draft}
              maxLength={AI_TUTOR_CLIENT_LIMITS.maxMessageChars}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question…"
              aria-describedby={`${prefix}-hint`}
              className="min-h-11 flex-1 resize-none rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink placeholder:text-slate focus-visible:border-teal focus-visible:outline-2 focus-visible:outline-teal"
            />
            {busy ? (
              <Button
                variant="secondary"
                aria-label="Stop answer"
                title="Stop answer"
                onClick={() => abortRef.current?.abort()}
                icon={<Square size={15} aria-hidden="true" />}
              >
                <span className="sr-only sm:not-sr-only">Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                aria-label="Send question"
                title="Send question"
                disabled={!draft.trim()}
                icon={<Send size={15} aria-hidden="true" />}
              >
                <span className="sr-only sm:not-sr-only">Send</span>
              </Button>
            )}
          </div>
          <p id={`${prefix}-hint`} className="flex justify-between gap-3 text-[11px] text-slate">
            <span>Enter to send · Shift+Enter for a new line</span>
            <span aria-hidden="true">
              {draft.length}/{AI_TUTOR_CLIENT_LIMITS.maxMessageChars}
            </span>
          </p>
        </form>
      </div>
    )
  })()

  return (
    <section
      aria-labelledby={titleId}
      className={
        variant === 'overlay'
          ? 'flex h-full min-h-0 flex-col gap-3 bg-white p-4 text-ink'
          : 'rounded-xl border border-line bg-white p-5 shadow-card sm:p-6'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal-dark">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal">
              Learning support
            </p>
            <h2 id={titleId} className="text-sm font-semibold text-navy sm:text-base">
              {variant === 'page' ? (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={bodyId}
                  onClick={() => {
                    setOpen(!open)
                    if (!open) window.setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded text-left hover:text-teal-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  Ask the AI tutor
                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                    className={`transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                'Ask the AI tutor'
              )}
            </h2>
          </div>
        </div>
      </div>
      <div
        id={bodyId}
        hidden={!expanded}
        className={variant === 'overlay' ? 'flex min-h-0 flex-1 flex-col gap-3' : 'mt-4 space-y-3'}
      >
        {body}
        <p className="border-t border-line pt-2.5 text-[11px] leading-relaxed text-slate">
          AI answers can be wrong — check with your teacher.
        </p>
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  )
}
