import { createClient } from './server'
import type { PlanType } from '@/lib/plans'

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    // Default to free plan if not found
    return 'free'
  }

  // Check if plan is expired
  if (data.status === 'expired' || (data.expires_at && new Date(data.expires_at) < new Date())) {
    return 'free'
  }

  return (data.plan as PlanType) || 'free'
}

export async function getItemCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      // Log error but don't throw - return 0 to prevent breaking the page
      console.error('Error counting items:', error)
      // If it's a permission error, it might be RLS issue - return 0 gracefully
      return 0
    }

    return count || 0
  } catch (err: any) {
    console.error('Exception in getItemCount:', err)
    return 0
  }
}

export async function getFamilyMemberCount(userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting family members:', error)
    return 0
  }

  return count || 0
}

export async function getDocumentCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('document_url', 'is', null)

    if (error) {
      console.error('Error counting documents:', error)
      return 0
    }

    return count || 0
  } catch (err: any) {
    console.error('Exception in getDocumentCount:', err)
    return 0
  }
}

