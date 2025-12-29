// Reminder Limits
// Enforces limits on reminder sending to prevent abuse

import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { getPlanLimits } from '@/lib/plans'

const MAX_REMINDERS_PER_ITEM = 3
const MAX_EMAIL_REMINDERS_PER_DAY = 5
const MAX_WHATSAPP_REMINDERS_PER_MONTH = 30

/**
 * Check if user can send more email reminders today
 */
export async function canSendEmailReminder(userId: string): Promise<{
  allowed: boolean
  reason?: string
  countToday: number
}> {
  try {
    const supabase = await createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reminder_type', 'email')
      .gte('sent_at', todayStr)

    if (error) {
      console.error('[Reminder Limits] Error counting emails:', error)
      // Allow on error to prevent blocking legitimate users
      return { allowed: true, countToday: 0 }
    }

    const countToday = count || 0

    if (countToday >= MAX_EMAIL_REMINDERS_PER_DAY) {
      return {
        allowed: false,
        reason: 'Daily email reminder limit reached. Please try again tomorrow.',
        countToday,
      }
    }

    return {
      allowed: true,
      countToday,
    }
  } catch (error) {
    console.error('[Reminder Limits] Error checking email limit:', error)
    // Allow on error
    return { allowed: true, countToday: 0 }
  }
}

/**
 * Check if user can send more WhatsApp reminders this month
 */
export async function canSendWhatsAppReminder(userId: string): Promise<{
  allowed: boolean
  reason?: string
  countThisMonth: number
}> {
  try {
    const userPlan = await getUserPlan(userId)
    const limits = getPlanLimits(userPlan)

    // Only PRO users can send WhatsApp reminders
    if (!limits.allowsWhatsAppReminders) {
      return {
        allowed: false,
        reason: 'WhatsApp reminders are only available for Pro plan users.',
        countThisMonth: 0,
      }
    }

    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDayOfMonth.setHours(0, 0, 0, 0)
    const monthStartStr = firstDayOfMonth.toISOString().split('T')[0]

    const { count, error } = await supabase
      .from('reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reminder_type', 'whatsapp')
      .gte('sent_at', monthStartStr)

    if (error) {
      console.error('[Reminder Limits] Error counting WhatsApp:', error)
      return { allowed: true, countThisMonth: 0 }
    }

    const countThisMonth = count || 0

    if (countThisMonth >= MAX_WHATSAPP_REMINDERS_PER_MONTH) {
      return {
        allowed: false,
        reason: 'Monthly WhatsApp reminder limit reached. Please try again next month.',
        countThisMonth,
      }
    }

    return {
      allowed: true,
      countThisMonth,
    }
  } catch (error) {
    console.error('[Reminder Limits] Error checking WhatsApp limit:', error)
    return { allowed: true, countThisMonth: 0 }
  }
}

/**
 * Check if item has reached max reminders
 */
export async function canSendItemReminder(itemId: string): Promise<{
  allowed: boolean
  reason?: string
  reminderCount: number
}> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('reminder_logs')
      .select('*', { count: 'exact', head: true })
      .eq('life_item_id', itemId)

    if (error) {
      console.error('[Reminder Limits] Error counting item reminders:', error)
      return { allowed: true, reminderCount: 0 }
    }

    const reminderCount = count || 0

    if (reminderCount >= MAX_REMINDERS_PER_ITEM) {
      return {
        allowed: false,
        reason: 'Maximum reminders for this item have been sent.',
        reminderCount,
      }
    }

    return {
      allowed: true,
      reminderCount,
    }
  } catch (error) {
    console.error('[Reminder Limits] Error checking item limit:', error)
    return { allowed: true, reminderCount: 0 }
  }
}

