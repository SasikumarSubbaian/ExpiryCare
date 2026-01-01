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

  // ✅ HARD SAFETY NET: Force confirmation modal to open when we have result
  useEffect(() => {
    if (ocrExtractedData !== null) {
      setProcessingOCR(false)
      setShowOCRConfirmation(true)
    }
  }, [ocrExtractedData])

  const processOCR = async (fileToProcess: File) => {
    try {
      setProcessingOCR(true)
      setShowOCRConfirmation(false)
      setError(null)

      const formData = new FormData()
      formData.append('file', fileToProcess)
      formData.append('category', selectedCategory)

      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      console.log('OCR RESULT:', result)

      // ✅ ALWAYS STORE RESULT (even partial or empty)
      // Use fullText to determine if we should show success
      const fullText = result.fullText || result.text || result.rawText || ''
      const hasText = fullText.trim().length > 30
      
      // Store extractedData if available, otherwise store empty object
      // Include fullText in extractedData for popup
      const extractedData = {
        ...(result.extractedData || result.data || {}),
        fullText: fullText, // Include full text for reference
        success: result.success !== false, // Use API success, default to true
        category: result.category || 'other',
        extractedFields: result.extractedFields || result.fields || {},
      }
      
      setOcrExtractedData(extractedData)

      // ✅ FORCE UI TRANSITION - Always open confirmation modal if text exists
      // Only show error if no text at all
      if (!hasText && !result.success) {
        setError('No text found in document. Please ensure the document is clear and readable.')
      }
      
      setProcessingOCR(false)
      setShowOCRConfirmation(true)

      // Only set error for rate limits (but still show confirmation)
      if (result.error && (result.error.includes('limit') || result.error.includes('Upgrade') || result.error.includes('RATE_LIMIT'))) {
        setError(result.error)
      }

    } catch (error: unknown) {
      console.error('OCR failed:', error)
      // Even on error, show confirmation modal with empty data for manual entry
      setOcrExtractedData({})
      setProcessingOCR(false)
      setShowOCRConfirmation(true)
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

      // Helper to extract value from field (handles both old string format and new FieldWithConfidence format)
      const getFieldValue = (field: any): string | null => {
        if (!field) return null
        if (typeof field === 'string') return field
        if (typeof field === 'object' && 'value' in field) return field.value
        return null
      }
      
      // Category-specific fields
      if (data.category === 'warranty') {
        itemData.title = getFieldValue(data.productName) || 'Warranty'
        const companyName = getFieldValue(data.companyName)
        if (companyName) {
          itemData.notes = `Company: ${companyName}`
        }
      } else if (data.category === 'insurance') {
        const policyType = getFieldValue(data.policyType)
        itemData.title = policyType ? `${policyType} Insurance` : 'Insurance'
        const insurerName = getFieldValue(data.insurerName)
        if (insurerName) {
          itemData.notes = `Insurer: ${insurerName}`
        }
      } else if (data.category === 'amc') {
        itemData.title = getFieldValue(data.serviceType) || 'AMC'
        const providerName = getFieldValue(data.providerName)
        if (providerName) {
          itemData.notes = `Provider: ${providerName}`
        }
      } else if (data.category === 'subscription') {
        itemData.title = getFieldValue(data.serviceName) || 'Subscription'
      } else if (data.category === 'medicine') {
        const medicineName = getFieldValue(data.medicineName)
        itemData.title = medicineName || 'Medicine'
        itemData.person_name = 'Self' // Default for medicine
        const brandName = getFieldValue(data.brandName)
        if (brandName) {
          itemData.notes = `Brand: ${brandName}`
        }
        itemData.reminder_days = [30, 7, 0] // Medicine reminders
      } else {
        itemData.title = getFieldValue(data.documentType) || 'Other'
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
      {/* Processing Modal - Only show when processing and NOT showing confirmation */}
      {processingOCR && !showOCRConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Document</h2>
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Extracting details from document...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display - Only show when there's an error and NOT showing confirmation */}
      {error && !showOCRConfirmation && !processingOCR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Document</h2>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Document: {file.name}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Confirmation Modal - ALWAYS show when flag is true, even with empty data */}
      {showOCRConfirmation && (
        <OCRConfirmationModal
          isOpen={showOCRConfirmation}
          extractedData={ocrExtractedData || {}}
          onConfirm={handleOCRConfirm}
          onCancel={handleOCRCancel}
          onEdit={(field, value) => {
            // Update extracted data
            const updated = ocrExtractedData ? { ...ocrExtractedData } : {}
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

