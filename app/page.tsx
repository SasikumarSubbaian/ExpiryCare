import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PLAN_PRICES } from '@/lib/plans'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Never miss an important expiry again
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Track warranties, insurance, medicines, and subscriptions with timely reminders. 
              Built for Indian families who value peace of mind.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
              >
                Start Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required • Free forever plan available</p>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The Problem We Solve</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Life gets busy, and important dates slip through the cracks
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">😰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Missed Warranty Claims</h3>
              <p className="text-gray-600 text-sm">
                Realized your phone warranty expired last month? Too late. Save money by tracking expiry dates.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">💊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expired Medicines</h3>
              <p className="text-gray-600 text-sm">
                Medicine expiry dates are easy to miss. Track medicines for yourself and family members.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Renewals</h3>
              <p className="text-gray-600 text-sm">
                Health, vehicle, or term insurance - missing renewals can be costly. Get reminders in advance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How ExpiryCare Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, reliable, and designed for peace of mind
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your Items</h3>
              <p className="text-gray-600 text-sm">
                Quickly add warranties, insurance, medicines, or subscriptions. Set custom reminder days.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Timely Reminders</h3>
              <p className="text-gray-600 text-sm">
                Receive email reminders before items expire. Never miss an important date again.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Organized</h3>
              <p className="text-gray-600 text-sm">
                View all your expiries in one place. See what's expiring soon, expired, or still active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-600">/year</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Up to 5 life items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Email reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Expiry tracking</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-2 mt-0.5">✗</span>
                  <span>Medicine tracking</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-2 mt-0.5">✗</span>
                  <span>Document uploads</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-primary-500 p-6 relative">
              <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₹{PLAN_PRICES.pro}</span>
                <span className="text-gray-600">/year</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Unlimited items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Email reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Medicine tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Document uploads</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-2 mt-0.5">✗</span>
                  <span>Family sharing</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Family Plan */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Family</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₹{PLAN_PRICES.family}</span>
                <span className="text-gray-600">/year</span>
              </div>
              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Unlimited items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Email reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Medicine tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Document uploads</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 mt-0.5">✓</span>
                  <span>Up to 5 family members</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to never miss an expiry again?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-8">
            Join thousands of Indian families who trust ExpiryCare to keep track of what matters.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 shadow-lg"
          >
            Start Free - No Credit Card Required
          </Link>
          <p className="mt-4 text-sm text-primary-200">
            Free plan includes 5 items • Upgrade anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} ExpiryCare. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/contact"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
