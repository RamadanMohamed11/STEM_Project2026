import type { TutorOutcome } from './aiTutorClient.ts'

export type ExplainState =
  | { status: 'idle' }
  | { status: 'loading'; text: string }
  | { status: 'done'; text: string; stopped?: boolean }
  | { status: 'fallback'; reason: string }

export const explainFallbackReasons = {
  loggedOut: 'Log in to get an AI explanation. Here is the saved explanation:',
  failed: 'The AI explanation is not available right now. Here is the saved explanation:',
} as const

/** Every failure ends with the saved static explanation, never with an empty panel. */
export function explainStateFromOutcome(outcome: TutorOutcome, text: string): ExplainState {
  const hasText = text.trim().length > 0
  if (outcome.kind === 'done')
    return hasText
      ? { status: 'done', text }
      : { status: 'fallback', reason: explainFallbackReasons.failed }
  if (outcome.kind === 'aborted')
    return hasText ? { status: 'done', text, stopped: true } : { status: 'idle' }
  if (outcome.kind === 'unauthorized')
    return { status: 'fallback', reason: explainFallbackReasons.loggedOut }
  if (outcome.kind === 'rate-limited')
    return { status: 'fallback', reason: `${outcome.message} Here is the saved explanation:` }
  return { status: 'fallback', reason: explainFallbackReasons.failed }
}
