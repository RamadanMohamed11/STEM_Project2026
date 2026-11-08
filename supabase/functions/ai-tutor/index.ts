// T45 AI tutor Edge Function (Supabase Edge Runtime / Deno).
// Secrets: NVIDIA_API_KEY (required), NVIDIA_MODEL (optional), AI_TUTOR_ALLOWED_ORIGINS (optional,
// comma-separated). SUPABASE_URL and SUPABASE_ANON_KEY are provided by the platform.
// See docs/AI_TUTOR.md.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0'
import { createTutorHandler, normalizeExperimentRow } from './core.ts'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): unknown
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

/** Every database call runs as the student (RLS applies); no service-role key is used. */
function clientFor(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

const handler = createTutorHandler({
  env: {
    nvidiaApiKey: Deno.env.get('NVIDIA_API_KEY'),
    nvidiaModel: Deno.env.get('NVIDIA_MODEL'),
    allowedOrigins: (Deno.env.get('AI_TUTOR_ALLOWED_ORIGINS') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  async authenticate(token) {
    const { data, error } = await clientFor(token).auth.getUser(token)
    if (error || !data.user) return null
    return { userId: data.user.id, isAnonymous: data.user.is_anonymous === true }
  },
  async loadExperiment(token, experimentId) {
    const { data, error } = await clientFor(token)
      .from('experiments')
      .select(
        'id, title, short_description, about_paragraphs, learning_objectives, required_tools, required_materials, safety_metadata',
      )
      .eq('id', experimentId)
      .maybeSingle()
    if (error) throw new Error('experiment lookup failed')
    return data ? normalizeExperimentRow(data as Record<string, unknown>) : null
  },
  async consumeQuota(token, limit) {
    const { data, error } = await clientFor(token).rpc('consume_ai_tutor_quota', {
      p_limit: limit,
    })
    if (error) throw new Error('quota check failed')
    const row = (Array.isArray(data) ? data[0] : data) as {
      allowed?: boolean
      remaining?: number
    } | null
    return { allowed: row?.allowed === true, remaining: Number(row?.remaining ?? 0) }
  },
  fetch: (input, init) => fetch(input, init),
  log: (message, details) => console.error(message, details ?? {}),
})

Deno.serve(handler)
