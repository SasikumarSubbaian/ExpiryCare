'use client'

import { useState, useEffect } from 'react'
import OCRConfirmationModal from './OCRConfirmationModal'
import type { PlanType } from '@/lib/plans'

type OCRFileUploadModalProps = {
  isOpen: boolean
  file: File
  onClose: () => void
  onSuccess?: () => void
  userPlan?: PlanType
  documentCount?: number
}

/**
 * OCR File Upload Modal
 * Separate flow for OCR processing - independent from Add Item modal
 * Shows OCR confirmation popup with category-aware fields
 */
export default function OCRFileUploadModal({
  isOpen,
  file,
  onClose,
  onSuccess,
  userPlan = 'free',
  documentCount = 0,
}: OCRFileUploadModalProps) {
  const [processingOCR, setProcessingOCR] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOCRConfirmation, setShowOCRConfirmation] = useState(false)
  const [ocrExtractedData, setOcrExtractedData] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('warranty')

  // Process OCR when modal opens
  useEffect(() => {
    if (isOpen && file) {
      processOCR(file)
    }
  }, [isOpen, file])

  const processOCR = async (fileToProcess: File) => {
    setProcessingOCR(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', fileToProcess)
      formData.append('category', selectedCategory)

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.extractedData) {
        // Show confirmation modal with extracted data
        setOcrExtractedData(result.extractedData)
        setShowOCRConfirmation(true)
      } else {
        // Handle errors gracefully
        if (result.error) {
          if (result.error.includes('limit') || result.error.includes('Upgrade')) {
            setError(result.error)
          } else {
            setError('Could not extract details from document. Please try adding the item manually.')
          }
        } else {
          setError('Could not extract details from document. Please try adding the item manually.')
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('OCR processing error:', errorMessage)
      setError('Could not extract details from document. Please try adding the item manually.')
    } finally {
      setProcessingOCR(false)
    }
  }

  const handleOCRConfirm = async (data: any) => {
    // Save item to database with OCR-extracted data
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to save items')
        return
      }

      // Prepare item data from OCR extraction
      const itemData: any = {
        user_id: user.id,
        category: data.category || 'other',
        expiry_date: data.expiryDate?.value || null,
        reminder_days: [7], // Default reminder
        notes: null,
        document_url: null, // Will be uploaded separately if needed
        person_name: null,
      }

      // Category-specific fields
      if (data.category === 'warranty') {
        itemData.title = data.productName || 'Warranty'
        if (data.companyName) {
          itemData.notes = `Company: ${data.companyName}`
        }
      } else if (data.category === 'insurance') {
        itemData.title = data.policyType ? `${data.policyType} Insurance` : 'Insurance'
        if (data.insurerName) {
          itemData.notes = `Insurer: ${data.insurerName}`
        }
      } else if (data.category === 'amc') {
        itemData.title = data.serviceType || 'AMC'
        if (data.providerName) {
          itemData.notes = `Provider: ${data.providerName}`
        }
      } else if (data.category === 'subscription') {
        itemData.title = data.serviceName || 'Subscription'
        if (data.planType) {
          itemData.notes = `Plan: ${data.planType}`
        }
      } else if (data.category === 'medicine') {
        itemData.title = data.medicineName || 'Medicine'
        itemData.person_name = 'Self' // Default for medicine
        if (data.brandName) {
          itemData.notes = `Brand: ${data.brandName}`
        }
        itemData.reminder_days = [30, 7, 0] // Medicine reminders
      } else {
        itemData.title = data.documentType || 'Other'
      }

      // Upload document if file exists
      if (file) {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('documents')
              .getPublicUrl(filePath)
            itemData.document_url = urlData.publicUrl
          }
        } catch (uploadErr) {
          console.error('Document upload error:', uploadErr)
          // Continue without document URL
        }
      }

      // Insert item
      const { error: insertError } = await supabase
        .from('life_items')
        .insert([itemData])

      if (insertError) {
        throw insertError
      }

      setShowOCRConfirmation(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error saving OCR item:', errorMessage)
      setError('Failed to save item. Please try again.')
    }
  }

  const handleOCRCancel = () => {
    setShowOCRConfirmation(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Document</h2>

          {processingOCR && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Extracting details from document...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {!processingOCR && !error && (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Document: {file.name}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OCR Confirmation Modal */}
      {showOCRConfirmation && ocrExtractedData && (
        <OCRConfirmationModal
          isOpen={showOCRConfirmation}
          extractedData={ocrExtractedData}
          onConfirm={handleOCRConfirm}
          onCancel={handleOCRCancel}
          onEdit={(field, value) => {
            // Update extracted data
            const updated = { ...ocrExtractedData }
            if (field === 'expiryDate') {
              updated.expiryDate = { ...updated.expiryDate, value }
            } else {
              updated[field] = value
            }
            setOcrExtractedData(updated)
          }}
        />
      )}
    </>
  )
}

