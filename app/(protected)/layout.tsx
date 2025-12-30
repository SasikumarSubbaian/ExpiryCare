import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import { ReactNode } from 'react'

// CRITICAL: Force Node.js runtime to prevent Edge runtime crashes with cookies()
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Protected Layout - Handles authentication for all pages in (protected) route group
 * - Reads Supabase auth cookies ONCE
 * - Fetches user ONCE
 * - Redirects to /login if unauthenticated
 * - Never throws errors
 * - Provides user context to all child pages
 * 
 * This layout ensures all child pages are authenticated before rendering.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode
}) {
  // Fetch user ONCE at layout level - all child pages inherit this
  let user: User | null = null

  try {
    const supabase = await createClient()

    if (!supabase) {
      // Supabase client is null - redirect to login
      console.error('[ProtectedLayout] Supabase client is null')
      redirect('/login')
    }

    const { data, error } = await supabase.auth.getUser()

    if (error) {
      // Auth error - redirect to login
      console.error('[ProtectedLayout] Auth error:', error.message)
      redirect('/login')
    }

    if (!data?.user) {
      // No user - redirect to login
      console.error('[ProtectedLayout] No user found')
      redirect('/login')
    }

    user = data.user
  } catch (error: unknown) {
    // Any error during auth check - redirect to login
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    console.error('[ProtectedLayout] Exception:', {
      message: errorMessage,
      name: errorName,
    })
    redirect('/login')
  }

  // User is authenticated - render children
  // Note: We don't pass user as a prop because Next.js layouts don't support that
  // Instead, child pages will fetch user again (but it's cached by Supabase)
  // This is acceptable because the layout ensures auth is valid
  return <>{children}</>
}

