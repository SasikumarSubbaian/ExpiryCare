import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { PLAN_PRICES } from '@/lib/plans'
import Link from 'next/link'

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  let user = null
  
  try {
    const supabase = await createClient()
    
    // Check if supabase client was created successfully
    if (!supabase) {
      // Environment variables missing or client creation failed
      redirect('/login')
    }
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      redirect('/login')
    }
    
    user = authUser
  } catch (error) {
    // If Supabase connection fails, redirect to login
    console.error('[UpgradePage] Supabase connection error:', error)
    redirect('/login')
  }

  if (!user) {
    redirect('/login')
  }

  const currentPlan = await getUserPlan(user.id)

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
                Up to 10 life items
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Email reminders
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                5 document uploads (OCR)
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                Medicine tracking
              </li>
              <li className="flex items-center text-gray-400">
                <span className="mr-2">✗</span>
                WhatsApp reminders
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
                WhatsApp reminders
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Medicine tracking
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Unlimited document uploads
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Family sharing (up to 5 members)
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

        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Payment integration coming soon. For now, contact support to upgrade.</p>
        </div>
      </div>
    </div>
  )
}

