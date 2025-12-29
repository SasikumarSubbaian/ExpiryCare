'use client'

import { useState, useEffect } from 'react'
import AddItemModal from './AddItemModalEnhanced'
import AddItemButton from './AddItemButton'
import { useToast, ToastContainer } from './ToastProvider'
import { createClient } from '@/lib/supabase/client'
import { canChooseFile } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'

type DashboardWithModalProps = {
  children: React.ReactNode
  userPlan?: PlanType
  currentItemCount?: number
}

export default function DashboardWithModal({ children, userPlan = 'free', currentItemCount = 0 }: DashboardWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'manual' | 'file'>('manual')
  const [fileCount, setFileCount] = useState(0)
  const [loadingFileCount, setLoadingFileCount] = useState(true)
  const { showToast, removeToast, toasts } = useToast()
  const supabase = createClient()

  // Count files with document_url for Free Plan users
  useEffect(() => {
    const countFiles = async () => {
      if (userPlan !== 'free') {
        setLoadingFileCount(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoadingFileCount(false)
          return
        }

        const { count, error } = await supabase
          .from('life_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('document_url', 'is', null)

        if (error) {
          console.error('Error counting files:', error)
          setLoadingFileCount(false)
          return
        }

        setFileCount(count || 0)
      } catch (err) {
        console.error('Exception counting files:', err)
      } finally {
        setLoadingFileCount(false)
      }
    }

    countFiles()
  }, [userPlan, supabase])

  const handleItemAdded = () => {
    setIsModalOpen(false)
    showToast('Item added successfully! You\'ll receive reminders before it expires.', 'success')
    // Refresh file count after adding
    if (userPlan === 'free') {
      const refreshCount = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { count } = await supabase
            .from('life_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .not('document_url', 'is', null)

          setFileCount(count || 0)
        } catch (err) {
          console.error('Error refreshing file count:', err)
        }
      }
      refreshCount()
    }
  }

  const handleAddItem = () => {
    setModalMode('manual')
    setIsModalOpen(true)
  }

  const handleChooseFile = () => {
    // Check Free Plan limit
    const canChoose = canChooseFile(userPlan, fileCount)
    if (!canChoose.allowed) {
      showToast(canChoose.reason || 'Cannot choose more files. Please upgrade to Pro plan.', 'error')
      return
    }
    setModalMode('file')
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <AddItemButton 
              onAddItem={handleAddItem} 
              onChooseFile={handleChooseFile}
              fileCount={fileCount}
              userPlan={userPlan}
            />
            {userPlan === 'free' && !loadingFileCount && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Files used: {fileCount}/5 (Free Plan)
                </p>
                {fileCount >= 5 && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">
                      🔓 You've used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders
                    </p>
                    <a
                      href="/settings/plans"
                      className="mt-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                    >
                      Upgrade to Pro →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
      <AddItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleItemAdded}
        userPlan={userPlan}
        currentItemCount={currentItemCount}
        fileCount={fileCount}
        defaultMode={modalMode}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

