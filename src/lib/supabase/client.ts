import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

export const supabaseConfig = readSupabaseConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
let client: SupabaseClient | null = null
export function getSupabaseClient() {
  if (!supabaseConfig || typeof window === 'undefined') return null
  client ??= createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
