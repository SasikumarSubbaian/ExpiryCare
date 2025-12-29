import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
    // Return null to allow page to render as guest
    return null as any
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    console.error('[Supabase] Invalid URL format:', supabaseUrl)
    return null as any
  }

  let cookieStore
  try {
    cookieStore = await cookies()
  } catch (error: any) {
    // cookies() can throw in certain contexts (e.g., during static generation)
    console.error('[Supabase] Error accessing cookies:', error?.message || error)
    // Return null to allow page to render as guest
    return null as any
  }

  try {
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value
          } catch (error) {
            console.error('[Supabase] Error getting cookie:', name, error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // Cookie set failed in Server Component - this is expected
            // Don't log to avoid noise in production
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // Cookie remove failed in Server Component - this is expected
            // Don't log to avoid noise in production
          }
        },
      },
    })
    return client
  } catch (error: any) {
    console.error('[Supabase] Error creating client:', {
      message: error?.message || error,
      stack: error?.stack,
    })
    // Return null to allow page to render as guest
    return null as any
  }
}

