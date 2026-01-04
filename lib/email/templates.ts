export function getExpiryReminderEmail(
  itemTitle: string,
  category: string,
  expiryDate: string,
  daysUntil: number,
  personName?: string | null
) {
  const categoryLabels: Record<string, string> = {
    warranty: 'Warranty',
    insurance: 'Insurance',
    amc: 'AMC',
    medicine: 'Medicine',
    subscription: 'Subscription',
    other: 'Item',
  }

  const categoryLabel = categoryLabels[category] || 'Item'
  const isExpired = daysUntil < 0
  const isToday = daysUntil === 0
  const isUrgent = daysUntil <= 7 && daysUntil > 0

  let subject = ''
  let urgencyText = ''

  if (isExpired) {
    subject = `⚠️ ${itemTitle} has expired`
    urgencyText = `This ${categoryLabel.toLowerCase()} expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago.`
  } else if (isToday) {
    subject = `🔴 ${itemTitle} expires today!`
    urgencyText = `This ${categoryLabel.toLowerCase()} expires today. Please take action.`
  } else if (isUrgent) {
    subject = `🟡 ${itemTitle} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
    urgencyText = `This ${categoryLabel.toLowerCase()} expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`
  } else {
    subject = `📅 Reminder: ${itemTitle} expires in ${daysUntil} days`
    urgencyText = `This ${categoryLabel.toLowerCase()} expires in ${daysUntil} days.`
  }

  const personText = personName ? ` for ${personName}` : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ExpiryCare</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${subject}</h2>
    
    <div style="background: ${isExpired || isToday ? '#fef2f2' : isUrgent ? '#fff7ed' : '#f0f9ff'}; border-left: 4px solid ${isExpired || isToday ? '#ef4444' : isUrgent ? '#f97316' : '#0ea5e9'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">
        ${urgencyText}
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${itemTitle}${personText}</p>
      <p style="margin: 0 0 10px 0;"><strong>Category:</strong> ${categoryLabel}</p>
      <p style="margin: 0;"><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This is an automated reminder from ExpiryCare. To manage your items, visit your dashboard.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>ExpiryCare - Never miss an important expiry</p>
  </div>
</body>
</html>
  `

  const text = `
ExpiryCare Reminder

${subject}

${urgencyText}

Item: ${itemTitle}${personText}
Category: ${categoryLabel}
Expiry Date: ${new Date(expiryDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

This is an automated reminder from ExpiryCare. To manage your items, visit your dashboard.

ExpiryCare - Never miss an important expiry
  `.trim()

  return { subject, html, text }
}

/**
 * Welcome Email Template
 * Sent immediately after a user successfully adds a new item
 */
export function getWelcomeEmail(
  itemName: string,
  expiryDate: string,
  reminderDays: number[],
  nextReminderDate: string
) {
  const subject = `🎉 Welcome to ExpiryCare - ${itemName} added successfully!`

  // Format expiry date nicely
  const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Format next reminder date
  const formattedNextReminderDate = new Date(nextReminderDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Format reminder days (e.g., "7, 15, and 30 days" or "7 days")
  const reminderDaysText = reminderDays.length === 1
    ? `${reminderDays[0]} day`
    : reminderDays.length === 2
    ? `${reminderDays[0]} and ${reminderDays[1]} days`
    : `${reminderDays.slice(0, -1).join(', ')}, and ${reminderDays[reminderDays.length - 1]} days`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ExpiryCare! 🎉</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Your item has been added successfully!</h2>
    
    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">
        We'll send you reminders before your item expires, so you never miss an important date.
      </p>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Item Name:</strong> ${itemName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Expiry Date:</strong> ${formattedExpiryDate}</p>
      <p style="margin: 0 0 10px 0;"><strong>Reminder Days:</strong> ${reminderDaysText} before expiry</p>
      <p style="margin: 0;"><strong>Next Reminder:</strong> ${formattedNextReminderDate}</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        <strong>What happens next?</strong>
      </p>
      <ul style="color: #6b7280; font-size: 14px; margin: 0; padding-left: 20px;">
        <li>We'll send you a reminder ${reminderDaysText} before your item expires</li>
        <li>You'll also receive a final reminder 1 day before expiry</li>
        <li>Manage all your items from your ExpiryCare dashboard</li>
      </ul>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Thank you for using ExpiryCare! We're here to help you stay organized and never miss an important expiry.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>ExpiryCare - Never miss an important expiry</p>
  </div>
</body>
</html>
  `

  const text = `
Welcome to ExpiryCare! 🎉

Your item has been added successfully!

We'll send you reminders before your item expires, so you never miss an important date.

Item Name: ${itemName}
Expiry Date: ${formattedExpiryDate}
Reminder Days: ${reminderDaysText} before expiry
Next Reminder: ${formattedNextReminderDate}

What happens next?
- We'll send you a reminder ${reminderDaysText} before your item expires
- You'll also receive a final reminder 1 day before expiry
- Manage all your items from your ExpiryCare dashboard

Thank you for using ExpiryCare! We're here to help you stay organized and never miss an important expiry.

ExpiryCare - Never miss an important expiry
  `.trim()

  return { subject, html, text }
}

/**
 * OTP Email Template
 * Sent for email verification during signup
 */
export function getOTPEmail(
  otp: string,
  userName?: string
) {
  const subject = `🔐 Verify your ExpiryCare account - Your OTP is ${otp}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${userName ? `Hi ${userName},` : 'Hi there,'}</h2>
    
    <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
      Thank you for signing up for ExpiryCare! To complete your registration, please verify your email address using the OTP below.
    </p>

    <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 24px; margin: 30px 0; text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">Your verification code:</p>
      <div style="font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; margin: 10px 0;">
        ${otp}
      </div>
      <p style="color: #ef4444; font-size: 12px; margin: 10px 0 0 0; font-weight: 500;">
        ⏰ This code expires in 10 minutes
      </p>
    </div>

    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #9a3412; font-weight: 500;">
        🔒 Security Tip: Never share this code with anyone. ExpiryCare will never ask for your OTP.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        <strong>Didn't request this code?</strong>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        If you didn't sign up for ExpiryCare, you can safely ignore this email. No account will be created.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>ExpiryCare - Never miss an important expiry</p>
    <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
  </div>
</body>
</html>
  `

  const text = `
Verify Your Email - ExpiryCare

${userName ? `Hi ${userName},` : 'Hi there,'}

Thank you for signing up for ExpiryCare! To complete your registration, please verify your email address using the OTP below.

Your verification code: ${otp}

⏰ This code expires in 10 minutes

🔒 Security Tip: Never share this code with anyone. ExpiryCare will never ask for your OTP.

Didn't request this code?
If you didn't sign up for ExpiryCare, you can safely ignore this email. No account will be created.

ExpiryCare - Never miss an important expiry
This is an automated email. Please do not reply.
  `.trim()

  return { subject, html, text }
}
