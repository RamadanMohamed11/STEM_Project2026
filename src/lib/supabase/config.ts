export interface SupabaseConfig {
  url: string
  publishableKey: string
}

/** Only these two named, intentionally public variables may enter the browser. */
export function readSupabaseConfig(url?: string, key?: string): SupabaseConfig | null {
  if (!url || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return null
  try {
    const parsed = new URL(url)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      !['', '/'].includes(parsed.pathname)
    )
      return null
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) return null
    return { url: parsed.origin, publishableKey: key }
  } catch {
    return null
  }
}
