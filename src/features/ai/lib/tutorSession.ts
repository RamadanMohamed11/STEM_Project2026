import { getSupabaseClient, supabaseConfig } from '@/lib/supabase/client'
import {
  clipLabState,
  getAiTutorEndpoint,
  prepareHistory,
  streamTutorReply,
  toStageLabel,
  tutorMessages,
  type TutorChatMessage,
  type TutorOutcome,
} from './aiTutorClient'

export interface AskTutorOptions {
  experimentId: string
  stage?: string
  labState?: string
  messages: readonly TutorChatMessage[]
  signal?: AbortSignal
  onDelta: (text: string) => void
}

/** Browser entry point shared by the chat panel and "Explain this": adds config and session token. */
export async function askTutor(options: AskTutorOptions): Promise<TutorOutcome> {
  const client = getSupabaseClient()
  if (!client || !supabaseConfig) return { kind: 'error', message: tutorMessages.unavailable }
  const { data } = await client.auth.getSession()
  const token = data.session?.access_token
  if (!token) return { kind: 'unauthorized', message: tutorMessages.unauthorized }

  const stage = toStageLabel(options.stage)
  const labState = clipLabState(options.labState)
  return streamTutorReply({
    endpoint: getAiTutorEndpoint(supabaseConfig.url),
    publishableKey: supabaseConfig.publishableKey,
    accessToken: token,
    signal: options.signal,
    onDelta: options.onDelta,
    body: {
      experimentId: options.experimentId,
      ...(stage ? { stage } : {}),
      ...(labState ? { labState } : {}),
      messages: prepareHistory(options.messages),
    },
  })
}
