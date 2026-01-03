import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { getItemCount, getFamilyMemberCount, getDocumentCount } from '@/lib/supabase/plans'
import { canUseOCR } from '@/lib/ocr/pricingLogic'

// Force Node.js runtime for database operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Cache plan data for 1 hour to improve performance
export const revalidate = 3600

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
        ocrAllowed: true,
        ocrRemaining: 0,
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
          ocrAllowed: true,
          ocrRemaining: 0,
          error: 'Unauthorized',
        },
        { status: 200 }
      )
    }

    const user = data.user

    // Parallel data fetching for better performance
    const [planResult, itemCountResult, familyMemberCountResult, documentCountResult, ocrCheckResult] = await Promise.allSettled([
      getUserPlan(user.id),
      getItemCount(user.id),
      getFamilyMemberCount(user.id),
      getDocumentCount(user.id),
      canUseOCR(user.id),
    ])

    // Extract results with safe fallbacks
    const plan: 'free' | 'pro' | 'family' = 
      planResult.status === 'fulfilled' ? planResult.value : 'free'
    
    const itemCount = 
      itemCountResult.status === 'fulfilled' ? itemCountResult.value : 0
    
    const familyMemberCount = 
      familyMemberCountResult.status === 'fulfilled' ? familyMemberCountResult.value : 0
    
    const documentCount = 
      documentCountResult.status === 'fulfilled' ? documentCountResult.value : 0
    
    const ocrCheck = 
      ocrCheckResult.status === 'fulfilled' ? ocrCheckResult.value : { allowed: true, remaining: 0 }

    // Log errors if any
    if (planResult.status === 'rejected') {
      console.error('[PlanLimits] Error fetching plan:', planResult.reason)
    }
    if (itemCountResult.status === 'rejected') {
      console.error('[PlanLimits] Error fetching item count:', itemCountResult.reason)
    }
    if (familyMemberCountResult.status === 'rejected') {
      console.error('[PlanLimits] Error fetching family member count:', familyMemberCountResult.reason)
    }
    if (documentCountResult.status === 'rejected') {
      console.error('[PlanLimits] Error fetching document count:', documentCountResult.reason)
    }
    if (ocrCheckResult.status === 'rejected') {
      console.error('[PlanLimits] Error checking OCR usage:', ocrCheckResult.reason)
    }

    return NextResponse.json({
      plan,
      itemCount,
      familyMemberCount,
      documentCount,
      ocrAllowed: ocrCheck.allowed,
      ocrRemaining: ocrCheck.remaining || 0,
      ocrLimitReason: ocrCheck.reason,
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
        ocrAllowed: true,
        ocrRemaining: 0,
        error: 'An error occurred',
      },
      { status: 200 }
    )
  }
}

