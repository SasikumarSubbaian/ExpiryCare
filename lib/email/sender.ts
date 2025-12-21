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
    console.error('RESEND_API_KEY is not configured')
    throw new Error('Email service not configured')
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
      throw result.error
    }

    return result.data
  } catch (err: any) {
    console.error('Failed to send email:', err)
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

