import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { env } from '@/lib/env'

/**
 * Creates a Supabase client for use in Client Components
 * This client automatically handles session management and cookie updates
 * 
 * @returns Supabase client instance for browser usage
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Singleton instance of the Supabase client for browser usage
 * Use this in Client Components and client-side hooks
 */
export const supabase = createClient()
