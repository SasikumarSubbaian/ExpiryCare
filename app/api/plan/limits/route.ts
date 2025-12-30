import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { getItemCount, getFamilyMemberCount, getDocumentCount } from '@/lib/supabase/plans'

// Force Node.js runtime for database operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Plan Limits API Route
 * Returns user's current plan and usage limits
 * NEVER throws - always returns safe JSON response
 */
export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        {
          plan: 'free',
          itemCount: 0,
          familyMemberCount: 0,
          documentCount: 0,
          error: 'Service configuration error',
        },
        { status: 200 }
      )
    }

    const { data, error: authError } = await supabase.auth.getUser()
    if (authError || !data?.user) {
      return NextResponse.json(
        {
          plan: 'free',
          itemCount: 0,
          familyMemberCount: 0,
          documentCount: 0,
          error: 'Unauthorized',
        },
        { status: 200 }
      )
    }

    const user = data.user

    // Get user plan and counts - all have safe fallbacks
    let plan: 'free' | 'pro' | 'family' = 'free'
    let itemCount = 0
    let familyMemberCount = 0
    let documentCount = 0

    try {
      plan = await getUserPlan(user.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[PlanLimits] Error fetching plan:', errorMessage)
      plan = 'free'
    }

    try {
      itemCount = await getItemCount(user.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[PlanLimits] Error fetching item count:', errorMessage)
      itemCount = 0
    }

    try {
      familyMemberCount = await getFamilyMemberCount(user.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[PlanLimits] Error fetching family member count:', errorMessage)
      familyMemberCount = 0
    }

    try {
      documentCount = await getDocumentCount(user.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[PlanLimits] Error fetching document count:', errorMessage)
      documentCount = 0
    }

    return NextResponse.json({
      plan,
      itemCount,
      familyMemberCount,
      documentCount,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[PlanLimits] Global error:', errorMessage)
    
    // Always return safe fallback
    return NextResponse.json(
      {
        plan: 'free',
        itemCount: 0,
        familyMemberCount: 0,
        documentCount: 0,
        error: 'An error occurred',
      },
      { status: 200 }
    )
  }
}

