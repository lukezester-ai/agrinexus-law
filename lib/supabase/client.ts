import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv, isSupabasePublicEnvConfigured } from '@/lib/supabase/env'

export function isSupabaseBrowserConfigured(): boolean {
  return isSupabasePublicEnvConfigured()
}

function createBrowserClientSafe(): SupabaseClient | null {
  try {
    const env = getSupabasePublicEnv()
    if (!env) return null
    return createBrowserClient(env.url, env.anonKey)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[supabase] browser client unavailable:', msg)
    return null
  }
}

export function createClient() {
  const client = createBrowserClientSafe()
  if (!client) {
    throw new Error('Supabase browser client is not configured.')
  }
  return client
}

export function createOptionalClient(): SupabaseClient | null {
  return createBrowserClientSafe()
}
