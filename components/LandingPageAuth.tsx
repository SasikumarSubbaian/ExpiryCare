'use client'

import { useAuth } from '@/app/providers'
import Link from 'next/link'
import type { ReactNode } from 'react'

type LandingPageAuthProps = {
  authenticated?: ReactNode
  guest?: ReactNode
  children?: ReactNode
}

/**
 * Client-only component that conditionally renders based on auth state
 * Uses AuthProvider context - no function-as-children pattern
 */
export default function LandingPageAuth({ 
  authenticated,
  guest,
  children 
}: LandingPageAuthProps) {
  const { user, userName, loading } = useAuth()

  // Show loading state (defaults to guest view)
  if (loading) {
    return <>{guest || children}</>
  }

  // Show authenticated or guest content
  if (user) {
    return <>{authenticated || children}</>
  }

  return <>{guest || children}</>
}

/**
 * Navigation component that shows different links based on auth state
 */
export function AuthNavigation() {
  const { user } = useAuth()

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
      >
        Dashboard
      </Link>
    )
  }

  return (
    <>
      <Link
        href="/login"
        className="text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 text-sm font-semibold text-white gradient-primary rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105"
      >
        Get Started
      </Link>
    </>
  )
}

/**
 * Hero CTA component that shows different content based on auth state
 */
export function AuthHeroCTA() {
  const { user, userName } = useAuth()

  if (user) {
    return (
      <div className="mt-10 animate-scale-in">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-soft mb-6">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <p className="text-base font-medium text-gray-700">
            Welcome back, <span className="text-primary-600 font-semibold">{userName}</span>!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white gradient-primary rounded-xl shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
          >
            Go to Dashboard
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <form action="/auth/signout" method="post" className="inline">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-10 animate-scale-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white gradient-primary rounded-xl shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
        >
          Start Free Trial
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 shadow-soft hover:shadow-medium transition-all duration-300"
        >
          Log In
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-success-500">✓</span>
          <span>No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-success-500">✓</span>
          <span>Free forever plan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-success-500">✓</span>
          <span>Setup in 2 minutes</span>
        </div>
      </div>
    </div>
  )
}
