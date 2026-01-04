'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

/**
 * Email Verification Message Page
 * Shows message after signup that user needs to verify email via Supabase confirmation link
 */
export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setResendLoading(true)
    setError(null)
    setResendSuccess(false)

    try {
      // Use Supabase's resend confirmation email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        setError(resendError.message || 'Failed to resend confirmation email. Please try again.')
        setResendLoading(false)
        return
      }

      setResendSuccess(true)
      setResendLoading(false)
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="relative flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="ExpiryCare Logo" 
                width={36}
                height={36}
                priority
                className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent tracking-tight">
              ExpiryCare
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Check your email
          </h1>
          <p className="text-gray-600">
            We've sent a confirmation link to your email address
          </p>
        </div>

        {/* Message Card */}
        <div className="bg-white rounded-2xl shadow-large border border-gray-200 p-8">
          {resendSuccess && (
            <div className="mb-6 bg-success-50 border-2 border-success-200 text-success-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-down">
              <span className="text-success-600 text-xl">✓</span>
              <div className="flex-1">
                <p className="font-semibold">Email sent!</p>
                <p className="text-sm text-success-600 mt-1">A new confirmation link has been sent to your email.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-danger-50 border-2 border-danger-200 text-danger-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-down">
              <span className="text-danger-600 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm text-danger-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verify your email address
              </h2>
              <p className="text-gray-600 mb-4">
                We've sent a confirmation link to:
              </p>
              {email && (
                <p className="text-base font-semibold text-gray-900 mb-6">
                  {email}
                </p>
              )}
              <p className="text-sm text-gray-600">
                Click the link in the email to verify your account and complete your registration.
              </p>
            </div>

            <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
              <p className="text-sm text-primary-800">
                <strong>💡 Tip:</strong> Check your spam folder if you don't see the email. The confirmation link expires in 24 hours.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading || !email}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-primary-200 rounded-xl text-base font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {resendLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend confirmation email
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="block w-full text-center py-3 px-4 text-base font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <span className="text-success-500">🔒</span>
            <span>Secure email verification</span>
          </div>
        </div>
      </div>
    </div>
  )
}
