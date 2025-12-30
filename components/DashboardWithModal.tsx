'use client'

import { useState } from 'react'
import AddItemModal from './AddItemModal'
import DashboardActions from './DashboardActions'
import OCRFileUploadModal from './OCRFileUploadModal'
import { useToast, ToastContainer } from './ToastProvider'
import type { PlanType } from '@/lib/plans'

type DashboardWithModalProps = {
  children: React.ReactNode
  userPlan?: PlanType
  currentItemCount?: number
  documentCount?: number
}

export default function DashboardWithModal({ children, userPlan = 'free', currentItemCount = 0, documentCount = 0 }: DashboardWithModalProps) {
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showToast, removeToast, toasts } = useToast()

  const handleItemAdded = () => {
    setIsAddItemModalOpen(false)
    showToast('Item added successfully! You\'ll receive reminders before it expires.', 'success')
    // Refresh page to show new item
    window.location.reload()
  }

  const handleChooseFile = (file: File) => {
    // Open OCR modal with selected file
    setSelectedFile(file)
    setIsOCRModalOpen(true)
  }

  const handleOCRComplete = () => {
    setIsOCRModalOpen(false)
    setSelectedFile(null)
    showToast('Document processed successfully!', 'success')
    // Refresh page to show new item
    window.location.reload()
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Two independent buttons: Add Item and Choose File */}
          <DashboardActions
            onAddItem={() => setIsAddItemModalOpen(true)}
            onChooseFile={handleChooseFile}
            userPlan={userPlan}
            documentCount={documentCount}
          />
          {children}
        </div>
      </div>
      
      {/* Add Item Modal - Manual entry only, NO OCR */}
      <AddItemModal 
        isOpen={isAddItemModalOpen} 
        onClose={() => setIsAddItemModalOpen(false)}
        onSuccess={handleItemAdded}
        userPlan={userPlan}
        currentItemCount={currentItemCount}
        documentCount={documentCount}
      />

      {/* OCR File Upload Modal - Separate flow for OCR */}
      {selectedFile && (
        <OCRFileUploadModal
          isOpen={isOCRModalOpen}
          file={selectedFile}
          onClose={() => {
            setIsOCRModalOpen(false)
            setSelectedFile(null)
          }}
          onSuccess={handleOCRComplete}
          userPlan={userPlan}
          documentCount={documentCount}
        />
      )}
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

