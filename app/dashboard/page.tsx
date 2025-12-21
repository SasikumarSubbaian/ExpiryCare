import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, isPast, isToday } from 'date-fns'
import DashboardHeader from '@/components/DashboardHeader'
import ItemsSection from '@/components/ItemsSection'
import DashboardWithModal from '@/components/DashboardWithModal'
import FamilyMembersSection from '@/components/FamilyMembersSection'
import PlanDisplay from '@/components/PlanDisplay'
import { getUserPlan, getItemCount, getFamilyMemberCount } from '@/lib/supabase/plans'

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

  // Get user plan and counts
  const userPlan = await getUserPlan(user.id)
  const itemCount = await getItemCount(user.id)
  const familyMemberCount = await getFamilyMemberCount(user.id)

  // Fetch user's items
  // RLS policies should filter items to only show the user's own items (and shared items if family plan)
  // We'll also filter by user_id in code to separate own vs shared items
  const { data: items, error } = await supabase
    .from('life_items')
    .select('*')
    .order('expiry_date', { ascending: true })

  if (error) {
    console.error('Error fetching items:', error)
    // Log error details for debugging
    console.error('Error details:', JSON.stringify(error, null, 2))
  }

  const lifeItems: LifeItem[] = items || []
  
  // Debug logging to help troubleshoot
  console.log(`[Dashboard] User ID: ${user.id} (type: ${typeof user.id})`)
  console.log(`[Dashboard] Item count from getItemCount: ${itemCount}`)
  console.log(`[Dashboard] Total items fetched from query: ${lifeItems.length}`)
  
  if (itemCount > 0 && lifeItems.length === 0) {
    console.error('[Dashboard] ERROR: getItemCount shows items exist but query returned none!')
    console.error('[Dashboard] This suggests a query or RLS policy issue')
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

  // Since we're already filtering by user_id in the query, all items should be own items
  // But we'll still filter to be safe and handle any edge cases
  const ownItems = lifeItems.filter(item => String(item.user_id) === String(user.id))
  const sharedItems = lifeItems.filter(item => String(item.user_id) !== String(user.id))
  
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
      <DashboardHeader user={user} />

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
    </DashboardWithModal>
  )
}
