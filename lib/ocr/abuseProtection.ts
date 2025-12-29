import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/lib/plans'

/**
 * Abuse Protection Utilities
 */

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  error?: string
  retryAfter?: number
}

/**
 * Validates file for upload
 */
export function validateFile(file: File): FileValidationResult {
  // Max size: 10MB
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    }
  }

  // Allowed types
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload PNG, JPG, or PDF',
    }
  }

  // For images, check dimensions (will be done server-side)
  // For PDFs, check page count (will be done server-side)

  return { valid: true }
}

/**
 * Generates SHA-256 hash for duplicate detection
 */
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const hash = createHash('sha256').update(buffer).digest('hex')
  return hash
}

/**
 * Checks OCR limits based on plan
 */
export async function checkOCRLimit(
  userId: string,
  userPlan: PlanType
): Promise<{ allowed: boolean; error?: string; remaining?: number }> {
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
        error: 'Free plan allows only 5 OCR calls. Upgrade to Pro for unlimited OCR.',
        remaining: 0,
      }
    }

    return {
      allowed: true,
      remaining: 5 - totalCalls,
    }
  }

  // Pro plan: max 10 OCR/day, 200 OCR/month
  if (userPlan === 'pro' || userPlan === 'family') {
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
        error: 'Daily OCR limit reached (10 calls/day). Please try again tomorrow.',
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
        error: 'Monthly OCR limit reached (200 calls/month). Please try again next month.',
        remaining: 0,
      }
    }

    return {
      allowed: true,
      remaining: Math.min(10 - (todayCount || 0), 200 - (monthCount || 0)),
    }
  }

  return { allowed: false, error: 'Invalid plan' }
}

/**
 * Logs OCR call for tracking
 */
export async function logOCRCall(
  userId: string,
  fileHash: string,
  category: string,
  success: boolean
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('ocr_logs').insert({
    user_id: userId,
    file_hash: fileHash,
    category,
    success,
  })
}

/**
 * Checks for duplicate file (by hash)
 */
export async function checkDuplicateFile(
  userId: string,
  fileHash: string
): Promise<{ isDuplicate: boolean; existingResult?: any }> {
  const supabase = await createClient()

  // Check if we've processed this file before
  const { data } = await supabase
    .from('ocr_logs')
    .select('ocr_result')
    .eq('user_id', userId)
    .eq('file_hash', fileHash)
    .eq('success', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data && data.ocr_result) {
    return {
      isDuplicate: true,
      existingResult: data.ocr_result,
    }
  }

  return { isDuplicate: false }
}

/**
 * Rate limiting check (simple in-memory for now, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetAt) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { allowed: true }
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return {
      allowed: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }
  }

  record.count++
  return { allowed: true }
}

