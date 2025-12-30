import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getItemCount, getFamilyMemberCount, getDocumentCount } from '@/lib/supabase/plans'
import { serializeArray } from '@/lib/utils/serialize'
import { differenceInDays, isPast, isToday } from 'date-fns'

// CRITICAL: Force Node.js runtime for Supabase server operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Type definitions matching dashboard page
type LifeItem = {
  id: string
  title: string
  category: 'warranty' | 'insurance' | 'amc' | 'medicine' | 'subscription' | 'other'
  expiry_date: string
  reminder_days: number[]
  notes: string | null
  document_url: string | null
  person_name: string | null
  created_at: string
  user_id: string
}

type DashboardData = {
  user: {
    id: string
    email: string | undefined
    userName: string
  }
  userPlan: 'free' | 'pro' | 'family'
  itemCount: number
  familyMemberCount: number
  documentCount: number
  items: LifeItem[]
  categorized: {
    expired: LifeItem[]
    expiringSoon: LifeItem[]
    active: LifeItem[]
  }
}

/**
 * GET /api/dashboard
 * 
 * Server-only API route that fetches all dashboard data
 * - Authenticates user via Supabase
 * - Fetches user profile, plan, counts, and items
 * - Categorizes items by expiry status
 * - Returns serializable JSON (no Date objects, BigInt, etc.)
 * - Never throws errors - returns fallback data instead
 */
export async function GET() {
  try {
    // Create Supabase client - safe env access
    const supabase = await createClient()

    if (!supabase) {
      console.error('[DashboardAPI] Supabase client is null')
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      )
    }

    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData?.user) {
      console.error('[DashboardAPI] Auth error:', authError?.message || 'No user')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = authData.user

    // Get user profile for name display - safe fallbacks
    let userName = user.email?.split('@')[0] || 'User'
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (!profileError && profile?.full_name) {
        userName = profile.full_name
      } else if (user.user_metadata?.full_name) {
        userName = user.user_metadata.full_name
      } else if (user.user_metadata?.name) {
        userName = user.user_metadata.name
      }
    } catch (err: unknown) {
      // Profile fetch failed - use metadata as fallback
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[DashboardAPI] Profile fetch error:', errorMessage)
      if (user.user_metadata?.full_name) {
        userName = user.user_metadata.full_name
      } else if (user.user_metadata?.name) {
        userName = user.user_metadata.name
      }
    }

    // Get user plan and counts - all functions have safe fallbacks (no throws)
    const userPlan = await getUserPlan(user.id) // Returns 'free' on error
    const itemCount = await getItemCount(user.id) // Returns 0 on error
    const familyMemberCount = await getFamilyMemberCount(user.id) // Returns 0 on error
    const documentCount = await getDocumentCount(user.id) // Returns 0 on error

    // Fetch user's items - safe fallback to empty array
    // CRITICAL: All data must be serializable (no Date, BigInt, undefined)
    let items: LifeItem[] = []

    try {
      const result = await supabase
        .from('life_items')
        .select('id, user_id, title, category, expiry_date, reminder_days, notes, document_url, person_name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('expiry_date', { ascending: true })

      if (result.error) {
        console.error('[DashboardAPI] Error fetching items:', result.error.message)
        // Continue with empty array - don't break the response
        items = []
      } else {
        // Cast Supabase result once - then apply normal filters
        const rows = (result.data ?? []) as LifeItem[]
        // CRITICAL: Ensure all data is serializable - convert to plain array
        items = serializeArray(
          rows
            .filter(item => item && String(item.user_id) === String(user.id))
            .map(item => ({
              id: String(item.id || ''),
              user_id: String(item.user_id || ''),
              title: String(item.title || ''),
              category: String(item.category || 'other') as LifeItem['category'],
              expiry_date: String(item.expiry_date || ''),
              reminder_days: Array.isArray(item.reminder_days) ? item.reminder_days.map(d => Number(d) || 0) : [],
              notes: item.notes ? String(item.notes) : null,
              document_url: item.document_url ? String(item.document_url) : null,
              person_name: item.person_name ? String(item.person_name) : null,
              created_at: String(item.created_at || ''),
            }))
        )
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[DashboardAPI] Exception fetching items:', errorMessage)
      // Continue with empty array - don't break the response
      items = []
    }

    // Categorize items
    // CRITICAL: Use Date only for calculation, never pass Date objects in response
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const categorizeItems = (items: LifeItem[]): { expired: LifeItem[]; expiringSoon: LifeItem[]; active: LifeItem[] } => {
      const expired: LifeItem[] = []
      const expiringSoon: LifeItem[] = []
      const active: LifeItem[] = []

      items.forEach(item => {
        try {
          const expiryDateStr = String(item.expiry_date || '')
          if (!expiryDateStr) {
            expired.push(item)
            return
          }

          const expiryDate = new Date(expiryDateStr)
          if (isNaN(expiryDate.getTime())) {
            expired.push(item)
            return
          }

          expiryDate.setHours(0, 0, 0, 0)
          const daysUntil = differenceInDays(expiryDate, today)

          if (isPast(expiryDate) && !isToday(expiryDate)) {
            expired.push(item)
          } else if (isToday(expiryDate)) {
            expired.push(item)
          } else if (daysUntil > 0 && daysUntil <= 30) {
            expiringSoon.push(item)
          } else if (daysUntil > 30) {
            active.push(item)
          } else {
            expired.push(item)
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          console.error('[DashboardAPI] Error categorizing item:', item.id, errorMessage)
          expired.push(item)
        }
      })

      // CRITICAL: Ensure all arrays are serializable
      return {
        expired: serializeArray(expired),
        expiringSoon: serializeArray(expiringSoon),
        active: serializeArray(active),
      }
    }

    const categorized = categorizeItems(items)

    // Build response data - all serializable
    const responseData: DashboardData = {
      user: {
        id: user.id,
        email: user.email,
        userName,
      },
      userPlan,
      itemCount,
      familyMemberCount,
      documentCount,
      items: serializeArray(items),
      categorized,
    }

    return NextResponse.json(responseData)
  } catch (error: unknown) {
    // Global error handler - never throw, always return JSON
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[DashboardAPI] Global error:', errorMessage)

    // Return safe fallback data instead of error
    return NextResponse.json(
      {
        user: {
          id: '',
          email: undefined,
          userName: 'User',
        },
        userPlan: 'free' as const,
        itemCount: 0,
        familyMemberCount: 0,
        documentCount: 0,
        items: [],
        categorized: {
          expired: [],
          expiringSoon: [],
          active: [],
        },
        error: 'An error occurred while loading dashboard data',
      },
      { status: 500 }
    )
  }
}

