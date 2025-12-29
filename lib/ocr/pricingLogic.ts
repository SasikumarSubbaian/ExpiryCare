import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/lib/plans'
import { getUserPlan } from '@/lib/supabase/plans'
import { getDocumentCount } from '@/lib/supabase/plans'
import { getItemCount } from '@/lib/supabase/plans'
import { PLAN_LIMITS } from '@/lib/plans'

/**
 * Pricing Logic Enforcement
 * All limits must be enforced in backend API
 */

export interface CanUploadDocumentResult {
  allowed: boolean
  reason?: string
}

export interface CanAddLifeItemResult {
  allowed: boolean
  reason?: string
}

export interface CanUseOCRResult {
  allowed: boolean
  reason?: string
  remaining?: number
}

export interface CanSendWhatsAppResult {
  allowed: boolean
  reason?: string
}

/**
 * Checks if user can upload a document
 */
export async function canUploadDocument(
  userId: string
): Promise<CanUploadDocumentResult> {
  const userPlan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[userPlan]

  if (!limits.allowsDocuments) {
    return {
      allowed: false,
      reason: 'Document uploads are not available for your plan. Upgrade to Pro for document uploads.',
    }
  }

  // Free plan: max 5 documents
  if (userPlan === 'free') {
    const documentCount = await getDocumentCount(userId)
    if (documentCount >= limits.maxOcrUploads) {
      return {
        allowed: false,
        reason: `Free plan allows only ${limits.maxOcrUploads} document uploads. Upgrade to Pro for unlimited uploads.`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Checks if user can add a life item
 */
export async function canAddLifeItem(userId: string): Promise<CanAddLifeItemResult> {
  const userPlan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[userPlan]

  if (limits.maxItems === -1) {
    return { allowed: true } // Unlimited
  }

  const itemCount = await getItemCount(userId)
  if (itemCount >= limits.maxItems) {
    return {
      allowed: false,
      reason: `Free plan allows only ${limits.maxItems} items. Upgrade to Pro for unlimited items.`,
    }
  }

  return { allowed: true }
}

/**
 * Checks if user can use OCR
 */
export async function canUseOCR(userId: string): Promise<CanUseOCRResult> {
  const userPlan = await getUserPlan(userId)
  const supabase = await createClient()

  // Free plan: max 5 OCR calls total
  if (userPlan === 'free') {
    const { count } = await supabase
      .from('ocr_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const totalCalls = count || 0
    if (totalCalls >= 5) {
      return {
        allowed: false,
        reason: 'Free plan allows only 5 OCR calls. Upgrade to Pro for unlimited OCR.',
        remaining: 0,
      }
    }

    return {
      allowed: true,
      remaining: 5 - totalCalls,
    }
  }

  // Pro plan: max 10 OCR/day, 200 OCR/month
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Check daily limit
  const { count: todayCount } = await supabase
    .from('ocr_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString())

  if ((todayCount || 0) >= 10) {
    return {
      allowed: false,
      reason: 'Daily OCR limit reached (10 calls/day). Please try again tomorrow.',
      remaining: 0,
    }
  }

  // Check monthly limit
  const { count: monthCount } = await supabase
    .from('ocr_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())

  if ((monthCount || 0) >= 200) {
    return {
      allowed: false,
      reason: 'Monthly OCR limit reached (200 calls/month). Please try again next month.',
      remaining: 0,
    }
  }

  return {
    allowed: true,
    remaining: Math.min(10 - (todayCount || 0), 200 - (monthCount || 0)),
  }
}

/**
 * Checks if user can send WhatsApp reminders
 */
export async function canSendWhatsAppReminder(
  userId: string
): Promise<CanSendWhatsAppResult> {
  const userPlan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[userPlan]

  // WhatsApp reminders only for Pro/Family plans
  // (Assuming this is configured in plans.ts)
  if (userPlan === 'free') {
    return {
      allowed: false,
      reason: 'WhatsApp reminders require Pro or Family plan. Upgrade to enable WhatsApp reminders.',
    }
  }

  return { allowed: true }
}

