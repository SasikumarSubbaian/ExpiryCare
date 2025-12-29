import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { differenceInDays, format, isToday } from 'date-fns'
import { sendExpiryReminder } from '@/lib/email/sender'
import { canSendEmailReminder, canSendItemReminder } from '@/lib/abuse/reminderLimits'

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
    const { data: items, error: itemsError } = await supabase
      .from('life_items')
      .select('id, user_id, title, category, expiry_date, reminder_days, person_name')
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
    }> = []

    // Check each item for reminders
    for (const item of items) {
      const expiryDate = new Date(item.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const daysUntil = differenceInDays(expiryDate, today)

      // Check each reminder day in the array
      for (const reminderDay of item.reminder_days || []) {
        const reminderKey = `${item.id}-${reminderDay}`
        
        // Skip if already sent today
        if (sentRemindersSet.has(reminderKey)) {
          continue
        }

        // Check if reminder should be sent today
        // For reminder_day = 0, send on expiry day
        // For reminder_day > 0, send when daysUntil == reminderDay
        const shouldSend =
          (reminderDay === 0 && (isToday(expiryDate) || daysUntil < 0)) ||
          (reminderDay > 0 && daysUntil === reminderDay)

        if (shouldSend) {
          // Send reminder to item owner
          const ownerEmail = userEmailMap.get(item.user_id) as string | undefined
          if (ownerEmail) {
            remindersToSend.push({
              itemId: item.id,
              userId: item.user_id,
              userEmail: ownerEmail,
              title: item.title,
              category: item.category,
              expiryDate: item.expiry_date,
              daysUntil,
              reminderDay,
              personName: item.person_name,
            })
          }

          // Send reminder to family members (who are registered users)
          const { data: familyMembers } = await supabase
            .from('family_members')
            .select('email')
            .eq('user_id', item.user_id)

          if (familyMembers) {
            for (const member of familyMembers) {
              // Find if family member email matches any registered user
              const memberUser = users.users.find((u: any) => u.email === member.email)
              if (memberUser && memberUser.email) {
                remindersToSend.push({
                  itemId: item.id,
                  userId: item.user_id,
                  userEmail: memberUser.email,
                  title: item.title,
                  category: item.category,
                  expiryDate: item.expiry_date,
                  daysUntil,
                  reminderDay,
                  personName: item.person_name,
                })
              }
            }
          }
        }
      }
    }

    // Send emails and log reminders (with abuse protection)
    let sentCount = 0
    const errors: string[] = []
    const skippedCount = 0

    for (const reminder of remindersToSend) {
      try {
        // Check item reminder limit (max 3 per item)
        const itemLimit = await canSendItemReminder(reminder.itemId)
        if (!itemLimit.allowed) {
          console.log(`Skipping reminder for item ${reminder.itemId}: ${itemLimit.reason}`)
          continue
        }

        // Check user daily email limit (max 5/day)
        const emailLimit = await canSendEmailReminder(reminder.userId)
        if (!emailLimit.allowed) {
          console.log(`Skipping email for user ${reminder.userId}: ${emailLimit.reason}`)
          errors.push(`Daily email limit reached for ${reminder.title}`)
          continue
        }

        await sendExpiryReminder(
          reminder.userEmail,
          reminder.title,
          reminder.category,
          reminder.expiryDate,
          reminder.daysUntil,
          reminder.personName
        )

        // Log the sent reminder
        await supabase.from('reminder_logs').insert({
          life_item_id: reminder.itemId,
          user_id: reminder.userId,
          reminder_type: 'email',
          reminder_day: reminder.reminderDay,
          sent_at: new Date().toISOString(),
        })

        sentCount++
      } catch (error: any) {
        console.error(`Failed to send reminder for item ${reminder.itemId}:`, error)
        errors.push(`Item ${reminder.title}: Could not send reminder`)
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
