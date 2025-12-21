'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { canAddFamilyMember, type PlanType } from '@/lib/plans'
import LoadingSpinner from './LoadingSpinner'
import { useToast, ToastContainer } from './ToastProvider'

type FamilyMember = {
  id: string
  email: string
  role: string
  created_at: string
}

type FamilyMembersSectionProps = {
  userPlan?: PlanType
  currentMemberCount?: number
}

export default function FamilyMembersSection({ userPlan = 'free', currentMemberCount = 0 }: FamilyMembersSectionProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { showToast, removeToast, toasts } = useToast()

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  const loadFamilyMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (err: any) {
      console.error('Error loading family members:', err)
      showToast('Unable to load family members. Please refresh the page.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)

    try {
      // Check plan limits
      const limitCheck = canAddFamilyMember(userPlan, currentMemberCount)
      if (!limitCheck.allowed) {
        setError(limitCheck.reason || 'Plan limit reached')
        setInviting(false)
        return
      }

      const { error: insertError } = await supabase
        .from('family_members')
        .insert([{ email: email.trim().toLowerCase(), role: 'viewer' }])

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email is already invited')
        } else {
          throw insertError
        }
      } else {
        showToast(`Family member invited successfully! They'll see your items once they sign up.`, 'success')
        setEmail('')
        loadFamilyMembers()
      }
    } catch (err: any) {
      let errorMessage = 'Unable to invite family member. Please try again.'
      
      if (err.code === '23505') {
        errorMessage = 'This email is already invited.'
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Connection issue. Please check your internet and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this family member? They will no longer see your shared items.')) return

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showToast('Family member removed successfully.', 'success')
      loadFamilyMembers()
    } catch (err: any) {
      showToast('Unable to remove family member. Please try again.', 'error')
      console.error('Error removing family member:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Family Members</h2>
        <p className="text-sm text-gray-500 mt-1">Share your items with family (view-only)</p>
      </div>

      <div className="p-4 sm:p-6">
        {/* Invite Form */}
        <form onSubmit={handleInvite} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {inviting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inviting...
                </>
              ) : (
                'Invite'
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-sm text-green-600">{success}</p>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
              <span className="text-red-600">⚠️</span>
              <div>
                <p className="font-medium">Unable to invite</p>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </form>

        {/* Family Members List */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" text="Loading family members..." />
          </div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👨‍👩‍👧‍👦</div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              No family members yet
            </p>
            <p className="text-sm text-gray-500">
              Invite family members to share your items with them.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.email}</p>
                  <p className="text-xs text-gray-500">Viewer • Invited {new Date(member.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

