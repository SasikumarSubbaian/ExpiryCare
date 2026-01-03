'use client'

import { useRef, useState, useEffect } from 'react'
import type { PlanType } from '@/lib/plans'
import { useRouter } from 'next/navigation'

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
  const [ocrAllowed, setOcrAllowed] = useState(true)
  const [ocrRemaining, setOcrRemaining] = useState(0)
  const [ocrLimitReason, setOcrLimitReason] = useState<string | undefined>()
  const [loadingOcrCheck, setLoadingOcrCheck] = useState(false)
  const router = useRouter()

  // Fetch OCR usage on mount and when plan changes
  useEffect(() => {
    checkOCRUsage()
  }, [userPlan])

  const checkOCRUsage = async () => {
    try {
      setLoadingOcrCheck(true)
      const response = await fetch('/api/plan/limits')
      const data = await response.json()
      
      setOcrAllowed(data.ocrAllowed ?? true)
      setOcrRemaining(data.ocrRemaining ?? 0)
      setOcrLimitReason(data.ocrLimitReason)
    } catch (error) {
      console.error('Error checking OCR usage:', error)
      // On error, allow OCR (fail open)
      setOcrAllowed(true)
    } finally {
      setLoadingOcrCheck(false)
    }
  }

  const handleChooseFile = async () => {
    // 🔧 CRITICAL: Check OCR usage BEFORE opening file picker
    // This prevents free plan users from selecting files when limit is reached
    if (userPlan === 'free') {
      // Refresh OCR usage check before allowing file selection
      await checkOCRUsage()
      
      if (!ocrAllowed) {
        // Show upgrade message
        const message = ocrLimitReason || 'Free plan allows only 5 OCR calls. Upgrade to Pro for unlimited OCR.'
        if (confirm(`${message}\n\nWould you like to upgrade to Pro plan?`)) {
          router.push('/upgrade')
        }
        return
      }
      
      // Show remaining OCR calls for free plan
      if (ocrRemaining <= 1 && ocrRemaining > 0) {
        if (!confirm(`You have ${ocrRemaining} OCR call remaining. After this, you'll need to upgrade to Pro for unlimited OCR.\n\nContinue?`)) {
          return
        }
      }
    }
    
    // Open file picker only if OCR is allowed
    if (ocrAllowed) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // 🔧 CRITICAL: Double-check OCR usage before processing file
      // This is a safety net in case the check was bypassed
      if (userPlan === 'free') {
        await checkOCRUsage()
        if (!ocrAllowed) {
          const message = ocrLimitReason || 'Free plan allows only 5 OCR calls. Upgrade to Pro for unlimited OCR.'
          alert(message)
          // Reset input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          return
        }
      }

      // Check document upload limit for free plan (separate from OCR limit)
      if (userPlan === 'free' && documentCount >= 5) {
        alert('Free plan allows only 5 document uploads. Upgrade to Pro for unlimited uploads.')
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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
        disabled={loadingOcrCheck || (userPlan === 'free' && !ocrAllowed)}
        className={`inline-flex items-center justify-center px-6 py-3 border-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${
          loadingOcrCheck || (userPlan === 'free' && !ocrAllowed)
            ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        }`}
        title={userPlan === 'free' && !ocrAllowed ? (ocrLimitReason || 'OCR limit reached. Upgrade to Pro.') : undefined}
      >
        {loadingOcrCheck ? '⏳ Loading...' : userPlan === 'free' && !ocrAllowed ? '🚫 OCR Limit Reached' : '📄 Choose File'}
        {userPlan === 'free' && ocrAllowed && ocrRemaining > 0 && ocrRemaining <= 5 && (
          <span className="ml-2 text-xs text-gray-500">({ocrRemaining} left)</span>
        )}
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

