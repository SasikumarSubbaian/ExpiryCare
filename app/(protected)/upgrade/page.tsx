'use client'

import { useState, useEffect } from 'react'
import { PLAN_PRICES } from '@/lib/plans'
import Link from 'next/link'
import type { PlanType } from '@/lib/plans'

type PlanLimits = {
  plan: PlanType
  itemCount: number
  familyMemberCount: number
  documentCount: number
  error?: string
}

/**
 * Upgrade Page - Client Component
 * Fetches plan limits from API route to avoid server-side session issues
 * NEVER throws - always renders safely
 */
export default function UpgradePage() {
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlanLimits() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/plan/limits', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch plan information')
        }
        
        const data: PlanLimits = await response.json()
        setPlanLimits(data)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error('[Upgrade] Error fetching plan limits:', errorMessage)
        setError('Failed to load plan information')
        // Set safe fallback
        setPlanLimits({
          plan: 'free',
          itemCount: 0,
          familyMemberCount: 0,
          documentCount: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPlanLimits()
  }, [])

  // Safe fallback if still loading or error
  const currentPlan: PlanType = planLimits?.plan || 'free'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading plan information...</p>
        </div>
      </div>
    )
  }

  if (error && !planLimits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade Your Plan</h1>
          <p className="text-gray-600">Choose the plan that's right for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${currentPlan === 'free' ? 'border-primary-500' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">₹0</span>
              <span className="text-gray-600">/year</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Up to 5 life items
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Email reminders
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                Medicine tracking
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                Document uploads
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                Family sharing
              </li>
            </ul>
            {currentPlan === 'free' ? (
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-md cursor-default">
                Current Plan
              </button>
            ) : (
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                Current Plan
              </button>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${currentPlan === 'pro' ? 'border-primary-500' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              {currentPlan === 'pro' && (
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">Current</span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">₹{PLAN_PRICES.pro}</span>
              <span className="text-gray-600">/year</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Unlimited items
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Email reminders
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Medicine tracking
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Document uploads
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                Family sharing
              </li>
            </ul>
            {currentPlan === 'pro' ? (
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md cursor-default">
                Current Plan
              </button>
            ) : (
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Family Plan */}
          <div className={`bg-white rounded-lg shadow-sm border-2 p-6 ${currentPlan === 'family' ? 'border-primary-500' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Family</h3>
              {currentPlan === 'family' && (
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">Current</span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">₹{PLAN_PRICES.family}</span>
              <span className="text-gray-600">/year</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Unlimited items
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Email reminders
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Medicine tracking
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Document uploads
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Up to 5 family members
              </li>
            </ul>
            {currentPlan === 'family' ? (
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md cursor-default">
                Current Plan
              </button>
            ) : (
              <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                Upgrade to Family
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Payment integration coming soon. For now, contact support to upgrade.</p>
        </div>
      </div>
    </div>
  )
}
