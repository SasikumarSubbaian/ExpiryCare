'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlanType, PLAN_LIMITS } from '@/lib/plans'
import { getUserPlanClient } from '@/lib/supabase/plans-client'
import Link from 'next/link'

export default function PlanSettingsPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Block access in production - this is for testing only
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.push('/dashboard')
    }
  }, [router])

  useEffect(() => {
    // Only load if not in production
    if (process.env.NODE_ENV !== 'production') {
      loadUserInfo()
    }
  }, [])

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const plan = await getUserPlanClient(user.id)
        setCurrentPlan(plan)
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const setPlan = async (plan: PlanType) => {
    if (!userId) {
      setMessage('Please log in first')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year from now

      const { error: upsertError } = await supabase
        .from('user_plans')
        .upsert({
          user_id: userId,
          plan: plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        // If table doesn't exist, show SQL instructions
        if (upsertError.message.includes('relation') || upsertError.message.includes('does not exist')) {
          setMessage(`Table 'user_plans' doesn't exist. Please run the SQL migration first. See instructions below.`)
        } else {
          throw upsertError
        }
      } else {
        setCurrentPlan(plan)
        setMessage(`Successfully set plan to ${plan.toUpperCase()}! Refresh the page to see changes.`)
        // Reload user info to reflect changes
        setTimeout(() => {
          loadUserInfo()
        }, 500)
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
      console.error('Error setting plan:', err)
    } finally {
      setLoading(false)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">This page is only available in development mode.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const limits = PLAN_LIMITS[currentPlan]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Plan Settings</h1>
          <p className="text-gray-600 mt-2">Test and manage your subscription plan (Development Only)</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Development Only</h2>
          <p className="text-sm text-yellow-800">
            This page is for testing plans locally. It will not be available in production.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {!userId ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Please log in first to test plans.</p>
              <Link
                href="/login"
                className="mt-2 inline-block text-sm text-red-600 hover:text-red-800"
              >
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Current User ID:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{userId}</code>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Current Plan: <span className="font-bold text-primary-600">{currentPlan.toUpperCase()}</span></p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setPlan('free')}
                    disabled={loading || currentPlan === 'free'}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      currentPlan === 'free'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Free Plan
                  </button>
                  <button
                    onClick={() => setPlan('pro')}
                    disabled={loading || currentPlan === 'pro'}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      currentPlan === 'pro'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Pro Plan
                  </button>
                  <button
                    onClick={() => setPlan('family')}
                    disabled={loading || currentPlan === 'family'}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                      currentPlan === 'family'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Family Plan
                  </button>
                </div>

                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.includes('Error') || message.includes('doesn\'t exist')
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Current Plan Limits:</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>Max Items: {limits.maxItems === -1 ? 'Unlimited' : limits.maxItems}</li>
                    <li>Max Family Members: {limits.maxFamilyMembers === -1 ? 'Unlimited' : limits.maxFamilyMembers}</li>
                    <li>Medicine Tracking: {limits.allowsMedicine ? '✓ Enabled' : '✗ Disabled'}</li>
                    <li>Document Upload: {limits.allowsDocuments ? '✓ Enabled' : '✗ Disabled'}</li>
                    <li>Family Sharing: {limits.allowsSharing ? '✓ Enabled' : '✗ Disabled'}</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Setup Instructions</h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">1. Create user_plans table (if not exists):</h3>
              <p className="mb-2">Run this SQL in your Supabase SQL Editor:</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs">
{`CREATE TABLE IF NOT EXISTS user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'family')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own plan
CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own plan (for dev/testing)
CREATE POLICY "Users can update their own plan"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own plan
CREATE POLICY "Users can insert their own plan"
  ON user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Test the plans:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click on a plan button above to set your plan</li>
                <li>Go to Dashboard to see plan limits in action</li>
                <li>Try adding items to test Free plan limit (5 items)</li>
                <li>Test Pro plan features (medicine tracking, documents)</li>
                <li>Test Family plan features (family sharing)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Reset to Free plan:</h3>
              <p>Click the "Free Plan" button above to reset your plan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

