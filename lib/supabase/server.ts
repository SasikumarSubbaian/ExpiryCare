import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Gracefully handle missing environment variables
  // Return null instead of throwing to allow pages to render
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] Missing environment variables:',
      {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      }
    )
    // Return a mock client that will fail gracefully
    // This prevents 500 errors when env vars are missing
    return null as any
  }

  try {
    // Try to get cookies - this can fail in certain build contexts
    let cookieStore
    try {
      cookieStore = await cookies()
    } catch (cookieError) {
      console.error('[Supabase] Error accessing cookies:', cookieError)
      // Return null if cookies can't be accessed
      return null as any
    }

    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            try {
              return cookieStore.get(name)?.value
            } catch (error) {
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
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('[Supabase] Error creating client:', error)
    // Return null to allow pages to render even if client creation fails
    return null as any
  }
}

