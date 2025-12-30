import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Server-side auth guard for protected pages
 * Returns user if authenticated, redirects to login if not
 * Never throws - always redirects on error
 */
export async function requireAuth(): Promise<User> {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      // Supabase client is null - redirect to login
      redirect('/login')
    }

    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data?.user) {
      // Auth error or no user - redirect to login
      redirect('/login')
    }

    return data.user
  } catch (error: unknown) {
    // Any error during auth check - redirect to login
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    console.error('[requireAuth] Error:', {
      message: errorMessage,
      name: errorName,
    })
    redirect('/login')
  }
}

/**
 * Optional auth - returns user if authenticated, null if not
 * Never throws - returns null on error
 */
export async function getOptionalAuth(): Promise<User | null> {
  try {
    const supabase = await createClient()
    
    if (!supabase) {
      return null
    }

    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data?.user) {
      return null
    }

    return data.user
  } catch {
    // Any error - return null
    return null
  }
}

