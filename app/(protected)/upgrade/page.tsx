'use client'

import { useState, useEffect } from 'react'
import { PLANS } from '@/config/plans'
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
  // Map 'family' plan to 'pro' for display (family plan removed from UI)
  const planForDisplay = planLimits?.plan === 'family' ? 'pro' : (planLimits?.plan || 'free')
  const currentPlan: 'free' | 'pro' = planForDisplay === 'family' ? 'pro' : planForDisplay

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                  isCurrentPlan ? 'border-primary-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">Current</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-600">/year</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="text-green-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-md cursor-default">
                    Current Plan
                  </button>
                ) : (
                  <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    {plan.id === 'free' ? 'Downgrade to Free' : 'Upgrade to Pro'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Payment integration coming soon. For now, contact support to upgrade.</p>
        </div>
      </div>
    </div>
  )
}
