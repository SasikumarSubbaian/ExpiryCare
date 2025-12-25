import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, isPast, isToday } from 'date-fns'
import { revalidatePath } from 'next/cache'
import DashboardHeader from '@/components/DashboardHeader'
import ItemsSection from '@/components/ItemsSection'
import DashboardWithModal from '@/components/DashboardWithModal'
import FamilyMembersSection from '@/components/FamilyMembersSection'
import PlanDisplay from '@/components/PlanDisplay'
import { getUserPlan, getItemCount, getFamilyMemberCount } from '@/lib/supabase/plans'

// Revalidate this page every time it's accessed (for fresh data after adds)
export const revalidate = 0
export const dynamic = 'force-dynamic'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user) {
    redirect('/login')
  }

  // Get user profile for name display
  let userName = user.email?.split('@')[0] || 'User'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    if (profile?.full_name) {
      userName = profile.full_name
    } else if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name
    } else if (user.user_metadata?.name) {
      userName = user.user_metadata.name
    }
  } catch (err) {
    console.error('Error fetching user profile:', err)
    // Fallback to email or metadata
    if (user.user_metadata?.full_name) {
      userName = user.user_metadata.full_name
    } else if (user.user_metadata?.name) {
      userName = user.user_metadata.name
    }
  }

  // Get user plan and counts (with error handling)
  let userPlan: 'free' | 'pro' | 'family' = 'free'
  let itemCount = 0
  let familyMemberCount = 0
  
  try {
    userPlan = await getUserPlan(user.id)
  } catch (err) {
    console.error('Error getting user plan:', err)
  }
  
  try {
    itemCount = await getItemCount(user.id)
  } catch (err) {
    console.error('Error getting item count:', err)
  }
  
  try {
    familyMemberCount = await getFamilyMemberCount(user.id)
  } catch (err) {
    console.error('Error getting family member count:', err)
  }

  // Fetch user's items
  // Always use explicit user_id filter for reliability
  let items: any[] = []
  let error: any = null
  
  // Use explicit user_id filter - more reliable than relying solely on RLS
  const result = await supabase
    .from('life_items')
    .select('id, user_id, title, category, expiry_date, reminder_days, notes, document_url, person_name, created_at, updated_at')
    .eq('user_id', user.id)
    .order('expiry_date', { ascending: true })
  
  items = result.data || []
  error = result.error

  if (error) {
    console.error('[Dashboard] Error fetching items:', error)
    console.error('[Dashboard] Error code:', error.code)
    console.error('[Dashboard] Error message:', error.message)
    console.error('[Dashboard] Error details:', JSON.stringify(error, null, 2))
    console.error('[Dashboard] User ID:', user.id)
    console.error('[Dashboard] User authenticated:', !!user)
    
    // If it's a permission error, show helpful message
    if (error.code === '42501') {
      console.error('[Dashboard] RLS Policy Issue: Check that life_items table has proper RLS policies')
      console.error('[Dashboard] Please run migration 011_ensure_rls_policies_production.sql in Supabase')
    }
  }

  // Filter items by user_id in code as well (double safety)
  const lifeItems: LifeItem[] = (items || []).filter(item => String(item.user_id) === String(user.id))
  
  // Debug logging to help troubleshoot
  console.log(`[Dashboard] User ID: ${user.id} (type: ${typeof user.id})`)
  console.log(`[Dashboard] User Plan: ${userPlan}`)
  console.log(`[Dashboard] Item count from getItemCount: ${itemCount}`)
  console.log(`[Dashboard] Total items fetched from query: ${lifeItems.length}`)
  console.log(`[Dashboard] Items:`, lifeItems.map(item => ({ id: item.id, title: item.title, category: item.category })))
  
  if (itemCount > 0 && lifeItems.length === 0) {
    console.error('[Dashboard] ERROR: getItemCount shows items exist but query returned none!')
    console.error('[Dashboard] This suggests a query or RLS policy issue')
    console.error('[Dashboard] Try checking RLS policies in Supabase')
  }
  
  if (lifeItems.length > 0) {
    console.log(`[Dashboard] Successfully loaded ${lifeItems.length} items`)
  }
  
  if (lifeItems.length > 0) {
    console.log(`[Dashboard] First few items:`, lifeItems.slice(0, 3).map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      expiry_date: item.expiry_date,
      user_id: item.user_id,
      user_id_type: typeof item.user_id
    })))
  }

  // All items from the query should be the user's own items since we filtered by user_id
  // For family plan, we might have shared items, but for now, all items are own items
  const ownItems = lifeItems
  const sharedItems: LifeItem[] = [] // Will be populated when family sharing is implemented
  
  // Debug: Check if items are being filtered out incorrectly
  if (lifeItems.length > 0 && ownItems.length === 0) {
    console.warn('[Dashboard] WARNING: Items fetched but none match user_id after string conversion')
    console.warn('[Dashboard] This might indicate a user_id type mismatch')
  }

  // Categorize items
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const categorizeItems = (items: LifeItem[]) => {
    // Create arrays for each category
    const expired: LifeItem[] = []
    const expiringSoon: LifeItem[] = []
    const active: LifeItem[] = []

    items.forEach(item => {
      // Parse expiry date - handle both date strings and date objects
      const expiryDateStr = item.expiry_date
      const expiryDate = new Date(expiryDateStr)
      expiryDate.setHours(0, 0, 0, 0)
      
      // Calculate days until expiry
      const daysUntil = differenceInDays(expiryDate, today)
      
      // Categorize item
      if (isPast(expiryDate) && !isToday(expiryDate)) {
        // Item has expired (past, but not today)
        expired.push(item)
      } else if (isToday(expiryDate)) {
        // Item expires today - show in expired section
        expired.push(item)
      } else if (daysUntil > 0 && daysUntil <= 30) {
        // Item expires within 30 days
        expiringSoon.push(item)
      } else if (daysUntil > 30) {
        // Item expires in more than 30 days
        active.push(item)
      } else {
        // Fallback: if daysUntil is negative but not caught by isPast, treat as expired
        expired.push(item)
      }
    })

    return { expired, expiringSoon, active }
  }

  const ownCategorized = categorizeItems(ownItems)
  const sharedCategorized = categorizeItems(sharedItems)
  
  // Debug: Log categorization results
  console.log(`[Dashboard] Categorized items - Expired: ${ownCategorized.expired.length}, Expiring Soon: ${ownCategorized.expiringSoon.length}, Active: ${ownCategorized.active.length}`)

  return (
    <DashboardWithModal userPlan={userPlan} currentItemCount={itemCount}>
      <DashboardHeader user={user} userName={userName} />

      {/* Plan Display */}
      <div className="mb-6 sm:mb-8">
        <PlanDisplay 
          plan={userPlan} 
          itemCount={itemCount}
          familyMemberCount={familyMemberCount}
        />
      </div>

      {/* Family Members Section */}
      {userPlan === 'family' && (
        <div className="mb-6 sm:mb-8">
          <FamilyMembersSection 
            userPlan={userPlan}
            currentMemberCount={familyMemberCount}
          />
        </div>
      )}

      {/* Own Items Sections */}
      <div className="space-y-6 sm:space-y-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900">My Items</h2>
        
        {/* Debug: Show error if items expected but none found */}
        {itemCount > 0 && ownItems.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>Debug Info:</strong> Database shows {itemCount} item(s) but query returned 0. 
              Please check browser console for details.
            </p>
          </div>
        )}
        
        <ItemsSection
          title="Expiring Soon"
          subtitle="Items expiring within 30 days"
          items={ownCategorized.expiringSoon}
          emptyMessage="No items expiring soon. You're all set!"
          emptySubtext="Items expiring within 30 days will appear here."
        />

        <ItemsSection
          title="Expired"
          subtitle="Items that have expired"
          items={ownCategorized.expired}
          emptyMessage="No expired items"
          emptySubtext="Great job keeping track! Expired items will appear here."
        />

        <ItemsSection
          title="Active"
          subtitle="Items with more than 30 days remaining"
          items={ownCategorized.active}
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
            items={sharedCategorized.expiringSoon}
            emptyMessage="No shared items expiring soon"
            emptySubtext=""
          />

          <ItemsSection
            title="Expired"
            subtitle="Shared items that have expired"
            items={sharedCategorized.expired}
            emptyMessage="No expired shared items"
            emptySubtext=""
          />

          <ItemsSection
            title="Active"
            subtitle="Shared items with more than 30 days remaining"
            items={sharedCategorized.active}
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
