import Link from 'next/link'
import Image from 'next/image'
import { PLAN_PRICES } from '@/lib/plans'
import dynamicImport from 'next/dynamic'

// Force static rendering to prevent SSR crashes
export const dynamic = 'force-static'
export const revalidate = false

// Load client-only auth component with SSR disabled
const LandingPageAuth = dynamicImport(
  () => import('@/components/LandingPageAuth'),
  { ssr: false }
)

// Safe env access with fallback
function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  return url && typeof url === 'string' ? url : 'https://expirycare.com'
}

export default function LandingPage() {
  // Static values - no async operations, no Supabase calls, no browser APIs
  const proPlanPrice = PLAN_PRICES?.pro ? String(PLAN_PRICES.pro) : '299'
  const currentYear = new Date().getFullYear()
  const siteUrl = getSiteUrl()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-50 glass-effect border-b border-gray-200/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Image 
                  src="/logo.png" 
                  alt="ExpiryCare Logo" 
                  width={48}
                  height={48}
                  className="h-10 w-10 lg:h-12 lg:w-12 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                ExpiryCare
              </span>
            </Link>
            <nav className="flex items-center gap-3 sm:gap-4">
              {/* Auth-aware navigation - loaded client-side */}
              <LandingPageAuth>
                {({ user, userName }) => (
                  user ? (
                    <Link
                      href="/dashboard"
                      className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
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
                )}
              </LandingPageAuth>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-24">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-soft mb-6 animate-slide-down">
              <span className="text-success-500">✓</span>
              <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ Indian families</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 leading-tight mb-6 animate-slide-up">
              Never miss an important{' '}
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                expiry again
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-slide-up">
              Track warranties, insurance, medicines, and subscriptions with intelligent reminders. 
              <span className="block mt-2 text-base sm:text-lg text-gray-500">
                Built for Indian families who value peace of mind and financial security.
              </span>
            </p>
            
            {/* Auth-aware hero CTA - loaded client-side */}
            <LandingPageAuth>
              {({ user, userName }) => (
                user ? (
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
                ) : (
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
              )}
            </LandingPageAuth>
          </div>
        </div>
      </section>

      {/* Problems Section with Modern Cards */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              The Problem We Solve
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Life gets busy, and important dates slip through the cracks. We've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group bg-white p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-soft hover:shadow-medium card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-danger-100 to-danger-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                😰
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Missed Warranty Claims</h3>
              <p className="text-gray-600 leading-relaxed">
                Realized your phone warranty expired last month? Too late. Save money by tracking expiry dates proactively.
              </p>
            </div>
            <div className="group bg-white p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-soft hover:shadow-medium card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-warning-100 to-warning-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                💊
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Expired Medicines</h3>
              <p className="text-gray-600 leading-relaxed">
                Medicine expiry dates are easy to miss. Track medicines for yourself and family members with smart reminders.
              </p>
            </div>
            <div className="group bg-white p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-soft hover:shadow-medium card-hover">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📄
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Insurance Renewals</h3>
              <p className="text-gray-600 leading-relaxed">
                Health, vehicle, or term insurance - missing renewals can be costly. Get reminders well in advance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How ExpiryCare Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, reliable, and designed for peace of mind
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary text-white text-3xl font-bold mb-6 shadow-medium group-hover:shadow-large group-hover:scale-110 transition-all duration-300">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Add Your Items</h3>
              <p className="text-gray-600 leading-relaxed">
                Quickly add warranties, insurance, medicines, or subscriptions. Upload documents or enter manually. Set custom reminder days.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary text-white text-3xl font-bold mb-6 shadow-medium group-hover:shadow-large group-hover:scale-110 transition-all duration-300">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Timely Reminders</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive email and WhatsApp reminders before items expire. Never miss an important date again. Customize reminder frequency.
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary text-white text-3xl font-bold mb-6 shadow-medium group-hover:shadow-large group-hover:scale-110 transition-all duration-300">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Stay Organized</h3>
              <p className="text-gray-600 leading-relaxed">
                View all your expiries in one beautiful dashboard. See what's expiring soon, expired, or still active. Track by category.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with Enhanced Cards */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-soft hover:shadow-medium card-hover">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">₹0</span>
                  <span className="text-gray-600 ml-2">/year</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="text-success-500 mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-gray-700">Up to 10 life items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-gray-700">Email reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-gray-700">Expiry tracking dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success-500 mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-gray-700">5 document uploads (OCR)</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-3 mt-0.5 text-xl">✗</span>
                  <span>Medicine tracking</span>
                </li>
                <li className="flex items-start text-gray-400">
                  <span className="mr-3 mt-0.5 text-xl">✗</span>
                  <span>WhatsApp reminders</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-300"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl border-2 border-primary-500 p-8 shadow-large relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-white text-primary-600 text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl">
                POPULAR
              </div>
              <div className="mb-6 relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">₹{proPlanPrice}</span>
                  <span className="text-primary-100 ml-2">/year</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 relative z-10">
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Unlimited items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Email & WhatsApp reminders</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Medicine tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Unlimited document uploads</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Family sharing (up to 5 members)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-3 mt-0.5 text-xl">✓</span>
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 bg-white text-primary-600 font-bold rounded-xl hover:bg-gray-50 shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-12 sm:py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                <span className="text-success-600 text-xl">🔒</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Bank-level Security</p>
                <p className="text-sm text-gray-600">Your data is encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 text-xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">GDPR Compliant</p>
                <p className="text-sm text-gray-600">Privacy first</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                <span className="text-warning-600 text-xl">⭐</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">4.9/5 Rating</p>
                <p className="text-sm text-gray-600">From 1,000+ users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to never miss an expiry again?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Indian families who trust ExpiryCare to keep track of what matters most.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-primary-600 bg-white rounded-xl hover:bg-gray-50 shadow-large hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Start Free - No Credit Card Required
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-6 text-sm text-primary-200">
            Free plan includes 10 items & 5 document uploads • Upgrade anytime
          </p>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="ExpiryCare Logo" 
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold text-white">ExpiryCare</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Never miss an important expiry again. Track warranties, insurance, medicines, and subscriptions with intelligent reminders.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="text-white">f</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="text-white">t</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <span className="text-white">in</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/upgrade" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} ExpiryCare. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm">
              Made with ❤️ for Indian families
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
