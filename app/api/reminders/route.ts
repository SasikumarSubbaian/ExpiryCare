import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { differenceInDays, format, isToday, subDays } from 'date-fns'
import { sendExpiryReminder } from '@/lib/email/sender'

// Use service role key to bypass RLS for checking all users' items
async function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  // Security: Validate key format (JWT tokens start with 'eyJ')
  if (!supabaseServiceKey.startsWith('eyJ')) {
    throw new Error('Invalid service role key format')
  }

  // Security: Audit log (without exposing the key)
  console.log('[AUDIT] Service role key accessed at:', new Date().toISOString())

  // Create admin client with service role key
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  try {
    // Optional: Add API key protection for cron jobs
    // Uncomment if you set CRON_SECRET in environment variables
    // const cronSecret = process.env.CRON_SECRET
    // if (cronSecret) {
    //   const authHeader = request.headers.get('authorization')
    //   if (authHeader !== `Bearer ${cronSecret}`) {
    //     return NextResponse.json(
    //       { error: 'Unauthorized' },
    //       { status: 401 }
    //     )
    //   }
    // }

    const supabase = await getServiceRoleClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = format(today, 'yyyy-MM-dd')

    // Get all life items that haven't expired yet (or expired today)
    // FEATURE 02: Include items that need first reminder (expiryDate - reminderDays) or last day reminder (expiryDate - 1)
    // Also include items that haven't sent first_reminder_sent or last_day_reminder_sent
    const { data: items, error: itemsError } = await supabase
      .from('life_items')
      .select('id, user_id, title, category, expiry_date, reminder_days, person_name, first_reminder_sent, last_day_reminder_sent')
      .gte('expiry_date', format(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')) // Include items from 7 days ago to catch expired reminders
      .order('expiry_date', { ascending: true })

    if (itemsError) {
      throw itemsError
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        message: 'No items found',
        reminders_sent: 0,
        timestamp: new Date().toISOString(),
      })
    }

    // Get user emails
    const userIds = Array.from(new Set(items.map((item: any) => item.user_id)))
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw usersError
    }

    const userEmailMap = new Map(
      users.users.map((user: any) => [user.id, user.email])
    )

    // Get already sent reminders for today
    const todayDateStr = format(today, 'yyyy-MM-dd')
    const { data: sentReminders, error: logsError } = await supabase
      .from('reminder_logs')
      .select('life_item_id, reminder_day')
      .gte('sent_at', `${todayDateStr}T00:00:00Z`)
      .lt('sent_at', `${todayDateStr}T23:59:59Z`)

    if (logsError) {
      console.error('Error fetching reminder logs:', logsError)
    }

    const sentRemindersSet = new Set(
      (sentReminders || []).map((r: any) => `${r.life_item_id}-${r.reminder_day}`)
    )

    const remindersToSend: Array<{
      itemId: string
      userId: string
      userEmail: string
      title: string
      category: string
      expiryDate: string
      daysUntil: number
      reminderDay: number
      personName?: string | null
      reminderType?: 'first' | 'last_day' // Track reminder type for database update
    }> = []

    // FEATURE 02: Check each item for reminders using new logic
    // Rule 1: Send FIRST reminder exactly at: expiryDate - reminderDays (use max reminder day)
    // Rule 2: Send SECOND reminder exactly at: expiryDate - 1 day
    // Each reminder must be sent ONLY ONCE
    for (const item of items) {
      const expiryDate = new Date(item.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const daysUntil = differenceInDays(expiryDate, today)

      // Get the primary reminder day (use the maximum value from reminder_days array)
      // This is the "reminderDays" value mentioned in requirements (7, 15, or 30)
      const reminderDaysArray = item.reminder_days || []
      if (reminderDaysArray.length === 0) {
        continue // Skip items with no reminder days
      }
      const primaryReminderDay = Math.max(...reminderDaysArray)

      // Calculate when first reminder should be sent (expiryDate - primaryReminderDay)
      const firstReminderDate = subDays(expiryDate, primaryReminderDay)
      const firstReminderDateStr = format(firstReminderDate, 'yyyy-MM-dd')
      const todayStr = format(today, 'yyyy-MM-dd')

      // Calculate when last day reminder should be sent (expiryDate - 1 day)
      const lastDayReminderDate = subDays(expiryDate, 1)
      const lastDayReminderDateStr = format(lastDayReminderDate, 'yyyy-MM-dd')

      // Check if we should send FIRST reminder today
      // Only send if:
      // 1. Today is the first reminder date (expiryDate - primaryReminderDay)
      // 2. first_reminder_sent is false
      // 3. Item hasn't expired yet (daysUntil >= primaryReminderDay)
      const shouldSendFirstReminder = 
        firstReminderDateStr === todayStr &&
        !item.first_reminder_sent &&
        daysUntil >= primaryReminderDay

      // Check if we should send LAST DAY reminder today
      // Only send if:
      // 1. Today is the last day reminder date (expiryDate - 1 day)
      // 2. last_day_reminder_sent is false
      // 3. Item hasn't expired yet (daysUntil >= 1)
      const shouldSendLastDayReminder =
        lastDayReminderDateStr === todayStr &&
        !item.last_day_reminder_sent &&
        daysUntil >= 1

      // Send first reminder if needed
      if (shouldSendFirstReminder) {
        const ownerEmail = userEmailMap.get(item.user_id) as string | undefined
        if (ownerEmail) {
          remindersToSend.push({
            itemId: item.id,
            userId: item.user_id,
            userEmail: ownerEmail,
            title: item.title,
            category: item.category,
            expiryDate: item.expiry_date,
            daysUntil: primaryReminderDay, // Days until expiry when first reminder is sent
            reminderDay: primaryReminderDay,
            personName: item.person_name,
            reminderType: 'first', // Mark as first reminder
          })

          // Send to family members (who are registered users)
          const { data: familyMembers } = await supabase
            .from('family_members')
            .select('email')
            .eq('user_id', item.user_id)

          if (familyMembers) {
            for (const member of familyMembers) {
              const memberUser = users.users.find((u: any) => u.email === member.email)
              if (memberUser && memberUser.email) {
                remindersToSend.push({
                  itemId: item.id,
                  userId: item.user_id,
                  userEmail: memberUser.email,
                  title: item.title,
                  category: item.category,
                  expiryDate: item.expiry_date,
                  daysUntil: primaryReminderDay,
                  reminderDay: primaryReminderDay,
                  personName: item.person_name,
                  reminderType: 'first',
                })
              }
            }
          }
        }
      }

      // Send last day reminder if needed
      if (shouldSendLastDayReminder) {
        const ownerEmail = userEmailMap.get(item.user_id) as string | undefined
        if (ownerEmail) {
          remindersToSend.push({
            itemId: item.id,
            userId: item.user_id,
            userEmail: ownerEmail,
            title: item.title,
            category: item.category,
            expiryDate: item.expiry_date,
            daysUntil: 1, // 1 day until expiry
            reminderDay: 1,
            personName: item.person_name,
            reminderType: 'last_day', // Mark as last day reminder
          })

          // Send to family members (who are registered users)
          const { data: familyMembers } = await supabase
            .from('family_members')
            .select('email')
            .eq('user_id', item.user_id)

          if (familyMembers) {
            for (const member of familyMembers) {
              const memberUser = users.users.find((u: any) => u.email === member.email)
              if (memberUser && memberUser.email) {
                remindersToSend.push({
                  itemId: item.id,
                  userId: item.user_id,
                  userEmail: memberUser.email,
                  title: item.title,
                  category: item.category,
                  expiryDate: item.expiry_date,
                  daysUntil: 1,
                  reminderDay: 1,
                  personName: item.person_name,
                  reminderType: 'last_day',
                })
              }
            }
          }
        }
      }
    }

    // Send emails and log reminders
    // FEATURE 02: Track which items have sent first_reminder_sent and last_day_reminder_sent
    let sentCount = 0
    const errors: string[] = []
    const itemsWithFirstReminderSent = new Set<string>()
    const itemsWithLastDayReminderSent = new Set<string>()

    for (const reminder of remindersToSend) {
      try {
        await sendExpiryReminder(
          reminder.userEmail,
          reminder.title,
          reminder.category,
          reminder.expiryDate,
          reminder.daysUntil,
          reminder.personName
        )

        // Log the sent reminder in reminder_logs table
        await supabase.from('reminder_logs').insert({
          life_item_id: reminder.itemId,
          user_id: reminder.userId,
          reminder_day: reminder.reminderDay,
        })

        // Track reminder type for database update
        if (reminder.reminderType === 'first') {
          itemsWithFirstReminderSent.add(reminder.itemId)
        } else if (reminder.reminderType === 'last_day') {
          itemsWithLastDayReminderSent.add(reminder.itemId)
        }

        sentCount++
      } catch (error: any) {
        console.error(`Failed to send reminder for item ${reminder.itemId}:`, error)
        errors.push(`Item ${reminder.title}: ${error.message}`)
      }
    }

    // FEATURE 02: Update first_reminder_sent and last_day_reminder_sent flags in database
    // This ensures each reminder is sent only once
    // Convert Set to Array for iteration compatibility
    const firstReminderItemIds = Array.from(itemsWithFirstReminderSent)
    for (const itemId of firstReminderItemIds) {
      try {
        await supabase
          .from('life_items')
          .update({ first_reminder_sent: true })
          .eq('id', itemId)
      } catch (error: any) {
        console.error(`Failed to update first_reminder_sent for item ${itemId}:`, error)
      }
    }

    const lastDayReminderItemIds = Array.from(itemsWithLastDayReminderSent)
    for (const itemId of lastDayReminderItemIds) {
      try {
        await supabase
          .from('life_items')
          .update({ last_day_reminder_sent: true })
          .eq('id', itemId)
      } catch (error: any) {
        console.error(`Failed to update last_day_reminder_sent for item ${itemId}:`, error)
      }
    }

    return NextResponse.json({
      message: `Processed ${items.length} items`,
      reminders_found: remindersToSend.length,
      reminders_sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in reminder cron job:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST endpoint for manual testing
export async function POST(request: Request) {
  return GET(request)
}
