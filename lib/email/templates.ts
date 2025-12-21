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

