'use client'

import { useState } from 'react'
import AddItemModal from './AddItemModal'
import AddItemButton from './AddItemButton'
import { useToast, ToastContainer } from './ToastProvider'
import type { PlanType } from '@/lib/plans'

type DashboardWithModalProps = {
  children: React.ReactNode
  userPlan?: PlanType
  currentItemCount?: number
}

export default function DashboardWithModal({ children, userPlan = 'free', currentItemCount = 0 }: DashboardWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showToast, removeToast, toasts } = useToast()

  const handleItemAdded = () => {
    setIsModalOpen(false)
    showToast('Item added successfully! You\'ll receive reminders before it expires.', 'success')
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <AddItemButton onClick={() => setIsModalOpen(true)} />
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
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

