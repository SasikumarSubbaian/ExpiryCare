import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/sender'
import { subDays, format } from 'date-fns'

/**
 * Welcome Email API Route
 * Sends welcome email after item is successfully created
 * This is called from the client after item insertion succeeds
 * 
 * PRODUCTION-SAFE: Never throws errors, always returns JSON responses
 * Item creation must succeed even if email fails
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 200 } // Return 200 to not break item creation flow
      )
    }

    const { data, error: authError } = await supabase.auth.getUser()
    if (authError || !data?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 200 } // Return 200 to not break item creation flow
      )
    }

    const user = data.user

    // 2. Parse request body
    const body = await request.json()
    const { itemName, expiryDate, reminderDays } = body

    if (!itemName || !expiryDate || !reminderDays || !Array.isArray(reminderDays) || reminderDays.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 200 } // Return 200 to not break item creation flow
      )
    }

    // 3. Calculate next reminder date (first reminder: expiryDate - max(reminderDays))
    // Use the largest reminder day value for the first reminder
    const maxReminderDay = Math.max(...reminderDays)
    const expiryDateObj = new Date(expiryDate)
    expiryDateObj.setHours(0, 0, 0, 0)
    const nextReminderDate = subDays(expiryDateObj, maxReminderDay)
    const nextReminderDateStr = format(nextReminderDate, 'yyyy-MM-dd')

    // 4. Get user email
    const userEmail = user.email
    if (!userEmail) {
      console.warn('[WelcomeEmail] User has no email address')
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 200 } // Return 200 to not break item creation flow
      )
    }

    // 5. Send welcome email (async, non-blocking)
    // Don't await - let it run in background
    sendWelcomeEmail(
      userEmail,
      itemName,
      expiryDate,
      reminderDays,
      nextReminderDateStr
    ).catch((error: any) => {
      // Log error but don't throw - item creation already succeeded
      console.error('[WelcomeEmail] Background email send failed:', error?.message || error)
    })

    // 6. Return success immediately (don't wait for email)
    return NextResponse.json({
      success: true,
      message: 'Welcome email queued',
    })
  } catch (error: any) {
    // Global error handler - NEVER throw, always return JSON
    console.error('[WelcomeEmail] Error:', error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: 'Email service error',
      },
      { status: 200 } // Return 200 to not break item creation flow
    )
  }
}
