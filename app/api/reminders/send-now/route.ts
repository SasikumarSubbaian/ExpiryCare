import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { differenceInDays, isToday } from 'date-fns'
import { sendExpiryReminder } from '@/lib/email/sender'

// API endpoint to send reminder immediately for a specific item
export async function POST(request: Request) {
  try {
    const { itemId, userId } = await request.json()

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'itemId and userId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get the item
    const { data: item, error: itemError } = await supabase
      .from('life_items')
      .select('id, title, category, expiry_date, reminder_days, person_name, user_id')
      .eq('id', itemId)
      .eq('user_id', userId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Get user email
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Calculate days until expiry
    const expiryDate = new Date(item.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntil = differenceInDays(expiryDate, today)

    // Check if reminder should be sent (within reminder days or expired)
    const reminderDays = item.reminder_days || [7]
    const shouldSend = reminderDays.some(day => {
      if (day === 0) {
        // Send on expiry day or if expired
        return isToday(expiryDate) || daysUntil < 0
      }
      // Send if days until matches reminder day
      return daysUntil === day
    })

    if (!shouldSend && daysUntil > Math.max(...reminderDays)) {
      return NextResponse.json({
        message: 'Reminder not due yet',
        daysUntil,
        reminderDays,
        sent: false,
      })
    }

    // Send the reminder email
    try {
      await sendExpiryReminder(
        user.email,
        item.title,
        item.category,
        item.expiry_date,
        daysUntil,
        item.person_name
      )

      // Log the reminder (if reminder_logs table exists)
      try {
        const reminderDay = daysUntil <= 0 ? 0 : Math.min(...reminderDays.filter(d => d >= daysUntil))
        await supabase.from('reminder_logs').insert({
          life_item_id: item.id,
          user_id: userId,
          reminder_day: reminderDay,
        })
      } catch (logError) {
        // Log error but don't fail the request - table might not exist yet
        console.warn('Could not log reminder (table may not exist):', logError)
      }

      return NextResponse.json({
        message: 'Reminder sent successfully',
        sent: true,
        daysUntil,
        email: user.email,
      })
    } catch (emailError: any) {
      console.error('Error sending reminder email:', emailError)
      
      // Provide helpful error messages
      let errorMessage = 'Failed to send email'
      if (emailError.message?.includes('not configured') || emailError.message?.includes('RESEND_API_KEY')) {
        errorMessage = 'Email service not configured. Please set RESEND_API_KEY in environment variables.'
      } else if (emailError.message?.includes('Invalid') || emailError.message?.includes('invalid')) {
        errorMessage = 'Invalid Resend API key. Please check your RESEND_API_KEY.'
      } else if (emailError.message?.includes('Cannot find module')) {
        errorMessage = 'Resend package not installed. Run: npm install resend'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: emailError.message,
          sent: false,
          setupRequired: emailError.message?.includes('not configured') || emailError.message?.includes('RESEND_API_KEY'),
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in send-now reminder:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

