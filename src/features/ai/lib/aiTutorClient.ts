/**
 * T46 browser client for the T45 `ai-tutor` Edge Function (contract: docs/AI_TUTOR.md).
 * Pure helpers are exported for tests; network access is injected.
 */

export const AI_TUTOR_CLIENT_LIMITS = {
  maxMessages: 20,
  maxMessageChars: 2000,
  maxLabStateChars: 1000,
} as const

export interface TutorChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TutorRequestBody {
  experimentId: string
  stage?: string
  labState?: string
  messages: TutorChatMessage[]
}

export type TutorStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; finishReason: string | null }
  | { type: 'error'; message: string }

export type TutorOutcome =
  | { kind: 'done' }
  | { kind: 'aborted' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'rate-limited'; message: string }
  | { kind: 'error'; message: string }

export const tutorMessages = {
  unauthorized: 'Your session has expired. Please log in again to use the AI tutor.',
  rateLimited: 'You’ve reached the hourly limit for AI questions. Please try again later.',
  unavailable: 'The AI tutor is not available right now. Please try again.',
  interrupted: 'The AI tutor stopped unexpectedly. Please try again.',
} as const

/** Incremental parser for the simplified `data: {json}\n\n` events sent by the function. */
export function createTutorEventParser() {
  let buffer = ''
  const parseBlock = (block: string): TutorStreamEvent | null => {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('')
    if (!data) return null
    try {
      const event = JSON.parse(data) as Partial<TutorStreamEvent> & Record<string, unknown>
      if (event.type === 'delta' && typeof event.text === 'string')
        return { type: 'delta', text: event.text }
      if (event.type === 'done')
        return {
          type: 'done',
          finishReason: typeof event.finishReason === 'string' ? event.finishReason : null,
        }
      if (event.type === 'error')
        return {
          type: 'error',
          message: typeof event.message === 'string' ? event.message : tutorMessages.interrupted,
        }
    } catch {
      // Ignore malformed blocks.
    }
    return null
  }
  return {
    push(chunk: string): TutorStreamEvent[] {
      buffer += chunk
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      return blocks.map(parseBlock).filter((event): event is TutorStreamEvent => event !== null)
    },
    flush(): TutorStreamEvent[] {
      const last = buffer.trim() ? parseBlock(buffer) : null
      buffer = ''
      return last ? [last] : []
    },
  }
}

/**
 * Keeps the request within server limits: the most recent messages only, non-empty, clipped,
 * starting with a user turn (the server requires the last one to be from the user).
 */
export function prepareHistory(messages: readonly TutorChatMessage[]): TutorChatMessage[] {
  const clean = messages
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, AI_TUTOR_CLIENT_LIMITS.maxMessageChars),
    }))
    .filter((message) => message.content.length > 0)
  const recent = clean.slice(-AI_TUTOR_CLIENT_LIMITS.maxMessages)
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift()
  return recent
}

export function clipLabState(text: string | undefined) {
  if (!text) return undefined
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  const max = AI_TUTOR_CLIENT_LIMITS.maxLabStateChars
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** Server stage labels allow letters, digits, spaces, `-` and `_` only (max 80). */
export function toStageLabel(stage: string | undefined) {
  if (!stage) return undefined
  const clean = stage
    .replace(/[^A-Za-z0-9 _-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim()
  return /^[A-Za-z0-9]/.test(clean) ? clean : undefined
}

export function getAiTutorEndpoint(supabaseUrl: string) {
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ai-tutor`
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown }
    return typeof body.error === 'string' && body.error.trim() ? body.error : null
  } catch {
    return null
  }
}

export interface StreamTutorOptions {
  endpoint: string
  publishableKey: string
  accessToken: string
  body: TutorRequestBody
  signal?: AbortSignal
  onDelta: (text: string) => void
  fetchImpl?: typeof fetch
}

/** Streams one reply. Never throws: every failure becomes a student-safe outcome. */
export async function streamTutorReply(options: StreamTutorOptions): Promise<TutorOutcome> {
  const { signal, onDelta } = options
  const doFetch = options.fetchImpl ?? fetch
  let response: Response
  try {
    response = await doFetch(options.endpoint, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
        apikey: options.publishableKey,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(options.body),
    })
  } catch {
    return signal?.aborted
      ? { kind: 'aborted' }
      : { kind: 'error', message: tutorMessages.unavailable }
  }

  if (response.status === 401) return { kind: 'unauthorized', message: tutorMessages.unauthorized }
  if (response.status === 429)
    return {
      kind: 'rate-limited',
      message: (await readErrorMessage(response)) ?? tutorMessages.rateLimited,
    }
  if (!response.ok || !response.body)
    return {
      kind: 'error',
      message: (await readErrorMessage(response)) ?? tutorMessages.unavailable,
    }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = createTutorEventParser()
  const handle = (events: TutorStreamEvent[]): TutorOutcome | null => {
    for (const event of events) {
      if (event.type === 'delta') onDelta(event.text)
      else if (event.type === 'done') return { kind: 'done' }
      else return { kind: 'error', message: event.message }
    }
    return null
  }

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) {
        const final = handle([...parser.push(decoder.decode()), ...parser.flush()])
        // A stream that ends without a `done` event was cut off.
        return final ?? { kind: 'error', message: tutorMessages.interrupted }
      }
      const outcome = handle(parser.push(decoder.decode(value, { stream: true })))
      if (outcome) {
        await reader.cancel().catch(() => {})
        return outcome
      }
    }
  } catch {
    return signal?.aborted
      ? { kind: 'aborted' }
      : { kind: 'error', message: tutorMessages.interrupted }
  }
}
