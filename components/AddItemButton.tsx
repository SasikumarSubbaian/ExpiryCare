'use client'

import type { PlanType } from '@/lib/plans'

type AddItemButtonProps = {
  onAddItem: () => void
  onChooseFile: () => void
  fileCount?: number
  userPlan?: PlanType
}

export default function AddItemButton({ onAddItem, onChooseFile, fileCount = 0, userPlan = 'free' }: AddItemButtonProps) {
  const isFileLimitReached = userPlan === 'free' && fileCount >= 5

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onAddItem}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        + ADD Items
      </button>
      <button
        onClick={onChooseFile}
        disabled={isFileLimitReached}
        className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
          isFileLimitReached
            ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        }`}
        title={isFileLimitReached ? 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders' : ''}
      >
        📄 Choosen File
      </button>
    </div>
  )
}

