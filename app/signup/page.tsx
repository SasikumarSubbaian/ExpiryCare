'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { validatePassword } from '@/lib/utils/passwordValidation'
import { validateEmail } from '@/lib/utils/emailValidation'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isEmailValid, setIsEmailValid] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Real-time email validation
  useEffect(() => {
    if (email.length === 0) {
      setEmailError(null)
      setIsEmailValid(false)
      return
    }

    const validation = validateEmail(email)
    setIsEmailValid(validation.valid)
    setEmailError(validation.error || null)
  }, [email])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Validate email format (frontend validation)
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Please enter a valid email address')
      setLoading(false)
      return
    }

    // 2. Validate password before submitting
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)'
      )
      setLoading(false)
      return
    }

    try {
      // 3. Create user account in Supabase (email_verified will be false by default)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailValidation.normalized!, // Use normalized email
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        // Provide helpful, calm error messages
        let errorMessage = 'Unable to create account. Please try again.'
        
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          errorMessage = 'This email is already registered. Please sign in instead.'
        } else if (signUpError.message.includes('Password')) {
          errorMessage = 'Password does not meet requirements. Please check and try again.'
        } else if (signUpError.message.includes('network') || signUpError.message.includes('fetch')) {
          errorMessage = 'Connection issue. Please check your internet and try again.'
        } else if (signUpError.message) {
          errorMessage = signUpError.message
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (!signUpData.user) {
        setError('Failed to create account. Please try again.')
        setLoading(false)
        return
      }

      // 4. CRITICAL FIX: Sign out user immediately after signup
      // This prevents session from persisting and bypassing verification
      // Supabase creates a session on signup, but we need to clear it until email is verified
      await supabase.auth.signOut()

      // 5. Supabase automatically sends confirmation email
      // Redirect to verification message page
      router.push(`/verify-email?email=${encodeURIComponent(emailValidation.normalized!)}`)
    } catch (err: any) {
      setError('Something went wrong. Please try again in a moment.')
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError('Unable to sign in with Google. Please try again.')
        setGoogleLoading(false)
      }
      // OAuth will redirect, so we don't need to handle success here
    } catch (err: any) {
      setError('Something went wrong. Please try again in a moment.')
      setGoogleLoading(false)
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
            Create your account
          </h1>
          <p className="text-gray-600">
            Start tracking your expiries in minutes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-large border border-gray-200 p-8">
          {error && (
            <div className="mb-6 bg-danger-50 border-2 border-danger-200 text-danger-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-down">
              <span className="text-danger-600 text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Unable to create account</p>
                <p className="text-sm text-danger-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-base text-gray-900 border-2 border-gray-200 rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 text-base text-gray-900 border-2 rounded-xl shadow-soft focus:outline-none focus:ring-2 transition-all duration-200 ${
                  emailError
                    ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500'
                    : isEmailValid && email.length > 0
                    ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
                    : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-2 text-sm text-danger-600 animate-slide-down">
                  {emailError}
                </p>
              )}
              {isEmailValid && email.length > 0 && !emailError && (
                <p className="mt-2 text-sm text-success-600 flex items-center gap-1">
                  <span>✓</span> Valid email address
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base text-gray-900 border-2 border-gray-200 rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading || !isEmailValid || !name.trim() || !password}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-medium text-base font-semibold text-white gradient-primary hover:shadow-large focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              Log In
            </Link>
          </div>
          
          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl shadow-soft text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {googleLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </>
            )}
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-success-500">🔒</span>
              <span>Secure signup</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-500">✓</span>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-success-500">⚡</span>
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
