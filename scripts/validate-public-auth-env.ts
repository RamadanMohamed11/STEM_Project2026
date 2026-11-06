import { readSupabaseConfig } from '../src/lib/supabase/config.ts'

/** Fail before bundling if a developer mistakenly places a secret in public Vite env. */
export function validatePublicAuthEnvironment(env: Record<string, string | undefined>) {
  if (
    Object.keys(env).some(
      (name) =>
        name.startsWith('VITE_') && /SECRET|SERVICE_ROLE|DATABASE_URL|ACCESS_TOKEN/i.test(name),
    )
  )
    throw new Error('Sensitive credentials must not use public VITE_ variables.')
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (key && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))
    throw new Error(
      'Use a browser-safe Supabase publishable key. Secret and legacy keys are not allowed.',
    )
  const url = env.VITE_SUPABASE_URL
  if (url && !readSupabaseConfig(url, key || 'sb_publishable_buildcheck'))
    throw new Error('Invalid Supabase project URL.')
}
