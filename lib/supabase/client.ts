import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv, isSupabasePublicEnvConfigured } from '@/lib/supabase/env'

export function isSupabaseBrowserConfigured(): boolean {
  return isSupabasePublicEnvConfigured()
}

export function createClient() {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error('Supabase browser client is not configured.')
  }
  return createBrowserClient(env.url, env.anonKey)
}

export function createOptionalClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv()
  if (!env) return null
  return createBrowserClient(env.url, env.anonKey)
}
