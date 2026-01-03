import { getExpiryReminderEmail } from './templates'

// Using Resend for email sending
// Install: npm install resend
// Get API key from: https://resend.com/api-keys

type SendEmailParams = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  // Check if Resend is configured
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not configured - email will not be sent')
    throw new Error('Email service not configured. Please set RESEND_API_KEY in environment variables.')
  }

  // Validate API key format (Resend keys start with 're_')
  if (!resendApiKey.startsWith('re_')) {
    console.warn('RESEND_API_KEY format appears invalid - should start with "re_"')
    throw new Error('Invalid Resend API key format. Please check your RESEND_API_KEY.')
  }

  try {
    // Dynamic import to avoid issues if package is not installed
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ExpiryCare <onboarding@resend.dev>'

    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    })

    if (result.error) {
      console.error('Error sending email:', result.error)
      // Provide more helpful error message
      if (result.error.message?.includes('invalid') || result.error.message?.includes('401')) {
        throw new Error('Invalid Resend API key. Please check your RESEND_API_KEY in environment variables.')
      }
      throw result.error
    }

    return result.data
  } catch (err: any) {
    console.error('Failed to send email:', err)
    // Re-throw with more context
    if (err.message?.includes('Cannot find module')) {
      throw new Error('Resend package not installed. Run: npm install resend')
    }
    throw err
  }
}

export async function sendExpiryReminder(
  to: string,
  itemTitle: string,
  category: string,
  expiryDate: string,
  daysUntil: number,
  personName?: string | null
) {
  const { subject, html, text } = getExpiryReminderEmail(
    itemTitle,
    category,
    expiryDate,
    daysUntil,
    personName
  )

  return sendEmail({ to, subject, html, text })
}



export async function sendWelcomeEmail(to: string, itemName: string, expiryDate: string, reminderDays: number[], nextReminderDate: string) { try { const { getWelcomeEmail } = await import('./templates'); const { subject, html, text } = getWelcomeEmail(itemName, expiryDate, reminderDays, nextReminderDate); return await sendEmail({ to, subject, html, text }); } catch (error: any) { console.error('[Email] Failed to send welcome email:', error?.message || error); return null; } }
