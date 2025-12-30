'use client'

import { useRef } from 'react'
import type { PlanType } from '@/lib/plans'

type DashboardActionsProps = {
  onAddItem: () => void
  onChooseFile: (file: File) => void
  userPlan?: PlanType
  documentCount?: number
}

/**
 * Dashboard Actions Component
 * Two independent buttons: "Add Item" (manual) and "Choose File" (OCR)
 * NO shared handlers, NO shared state
 */
export default function DashboardActions({ 
  onAddItem, 
  onChooseFile,
  userPlan = 'free',
  documentCount = 0 
}: DashboardActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChooseFile = () => {
    // Open file picker
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload PNG, JPG, or PDF')
        return
      }

      // Check document upload limit for free plan
      if (userPlan === 'free' && documentCount >= 5) {
        alert('Free plan allows only 5 document uploads. Upgrade to Pro for unlimited uploads.')
        return
      }

      // Pass file to parent handler (OCR flow)
      onChooseFile(file)
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex gap-4 items-center mb-6 sm:mb-8">
      {/* Add Item Button - Opens manual entry modal */}
      <button
        onClick={onAddItem}
        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        + Add Item
      </button>

      {/* Choose File Button - Opens file picker for OCR */}
      <button
        onClick={handleChooseFile}
        className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        📄 Choose File
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

