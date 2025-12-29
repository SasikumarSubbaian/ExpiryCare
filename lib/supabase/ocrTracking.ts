// OCR Usage Tracking
// Tracks document uploads (OCR calls) for pricing enforcement

import { createClient } from './server'

/**
 * Get total OCR count for a user (all time)
 * Used for FREE plan limit (max 5)
 */
export async function getOcrCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('document_url', 'is', null)

    if (error) {
      console.error('Error counting OCR uploads:', error)
      return 0
    }

    return count || 0
  } catch (err: any) {
    console.error('Exception in getOcrCount:', err)
    return 0
  }
}

/**
 * Get OCR count for today
 * Used for PRO plan daily limit (max 10/day)
 */
export async function getOcrCountToday(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('document_url', 'is', null)
      .gte('created_at', todayStr)

    if (error) {
      console.error('Error counting today\'s OCR uploads:', error)
      return 0
    }

    return count || 0
  } catch (err: any) {
    console.error('Exception in getOcrCountToday:', err)
    return 0
  }
}

/**
 * Get OCR count for this month
 * Used for PRO plan monthly limit (max 200/month)
 */
export async function getOcrCountThisMonth(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    const monthStartStr = firstDayOfMonth.toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('document_url', 'is', null)
      .gte('created_at', monthStartStr)

    if (error) {
      console.error('Error counting this month\'s OCR uploads:', error)
      return 0
    }

    return count || 0
  } catch (err: any) {
    console.error('Exception in getOcrCountThisMonth:', err)
    return 0
  }
}

