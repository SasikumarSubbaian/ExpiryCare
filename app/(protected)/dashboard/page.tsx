'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import ItemsSection from '@/components/ItemsSection'
import DashboardWithModal from '@/components/DashboardWithModal'
import FamilyMembersSection from '@/components/FamilyMembersSection'
import PlanDisplay from '@/components/PlanDisplay'
import type { User } from '@supabase/supabase-js'

// Client component - no server-side Supabase calls
// All data fetching happens via API route

type LifeItem = {
  id: string
  title: string
  category: 'warranty' | 'insurance' | 'amc' | 'medicine' | 'subscription' | 'other'
  expiry_date: string
  reminder_days: number[]
  notes: string | null
  document_url: string | null
  person_name: string | null
  created_at: string
  user_id: string
}

type DashboardData = {
  user: {
    id: string
    email: string | undefined
    userName: string
  }
  userPlan: 'free' | 'pro' | 'family'
  itemCount: number
  familyMemberCount: number
  documentCount: number
  items: LifeItem[]
  categorized: {
    expired: LifeItem[]
    expiringSoon: LifeItem[]
    active: LifeItem[]
  }
  error?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch dashboard data from API route
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/dashboard', {
          method: 'GET',
          credentials: 'include', // Include cookies for auth
        })

        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login')
          return
        }

        if (!response.ok) {
          // Server error - show error message
          const errorData = await response.json().catch(() => ({ error: 'Failed to load dashboard' }))
          setError(errorData.error || 'Failed to load dashboard data')
          setLoading(false)
          return
        }

        const dashboardData: DashboardData = await response.json()
        setData(dashboardData)
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
        console.error('[Dashboard] Error fetching data:', errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Failed to load dashboard data'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/login"
            className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // Convert user data to User type for components
  const user: User = {
    id: data.user.id,
    email: data.user.email || undefined,
    user_metadata: {},
  } as User

  const ownItems = data.items
  const sharedItems: LifeItem[] = [] // Will be populated when family sharing is implemented

  return (
    <DashboardWithModal
      userPlan={data.userPlan}
      currentItemCount={data.itemCount}
      documentCount={data.documentCount}
    >
      <DashboardHeader user={user} userName={data.user.userName} />

      {/* Plan Display */}
      <div className="mb-6 sm:mb-8">
        <PlanDisplay
          plan={data.userPlan}
          itemCount={data.itemCount}
          familyMemberCount={data.familyMemberCount}
        />
      </div>

      {/* Family Members Section */}
      {data.userPlan === 'family' && (
        <div className="mb-6 sm:mb-8">
          <FamilyMembersSection
            userPlan={data.userPlan}
            currentMemberCount={data.familyMemberCount}
          />
        </div>
      )}

      {/* Own Items Sections */}
      <div className="space-y-6 sm:space-y-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900">My Items</h2>

        {/* Debug: Show error if items expected but none found */}
        {data.itemCount > 0 && ownItems.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Debug Info:</strong> Database shows {data.itemCount} item(s) but query returned 0.
              Please check browser console for details.
            </p>
          </div>
        )}

        <ItemsSection
          title="Expiring Soon"
          subtitle="Items expiring within 30 days"
          items={data.categorized.expiringSoon}
          emptyMessage="No items expiring soon. You're all set!"
          emptySubtext="Items expiring within 30 days will appear here."
        />

        <ItemsSection
          title="Expired"
          subtitle="Items that have expired"
          items={data.categorized.expired}
          emptyMessage="No expired items"
          emptySubtext="Great job keeping track! Expired items will appear here."
        />

        <ItemsSection
          title="Active"
          subtitle="Items with more than 30 days remaining"
          items={data.categorized.active}
          emptyMessage="No active items yet"
          emptySubtext="Add your first item to get started tracking your expiries."
        />
      </div>

      {/* Shared Items Sections */}
      {sharedItems.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          <h2 className="text-xl font-bold text-gray-900">Shared with Me</h2>

          <ItemsSection
            title="Expiring Soon"
            subtitle="Shared items expiring within 30 days"
            items={[]}
            emptyMessage="No shared items expiring soon"
            emptySubtext=""
          />

          <ItemsSection
            title="Expired"
            subtitle="Shared items that have expired"
            items={[]}
            emptyMessage="No expired shared items"
            emptySubtext=""
          />

          <ItemsSection
            title="Active"
            subtitle="Shared items with more than 30 days remaining"
            items={[]}
            emptyMessage="No active shared items"
            emptySubtext=""
          />
        </div>
      )}

      {/* Back to Home Button at Bottom */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 font-medium transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </DashboardWithModal>
  )
}
