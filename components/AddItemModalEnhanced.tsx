'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { canAddItem, canUseMedicine, canUploadDocuments, canChooseFile, type PlanType } from '@/lib/plans'
import { useToast } from './ToastProvider'
import ImageCropModal from './ImageCropModal'
import HandwritingConfirmationModal from './HandwritingConfirmationModal'
import LowConfidenceWarningModal from './LowConfidenceWarningModal'
import CategoryAwareConfirmationModal, {
  type CategoryAwareExtractionData,
} from './CategoryAwareConfirmationModal'
// Browser OCR removed - using Google Vision OCR API instead

type AddItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userPlan?: PlanType
  currentItemCount?: number
  fileCount?: number
  defaultMode?: 'manual' | 'file' // 'manual' for ADD Items, 'file' for Choosen File
}

type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'
type PersonOption = 'self' | 'dad' | 'mom' | 'custom'

// OCR Processing Steps
type OCRStep = 'idle' | 'uploading' | 'processing' | 'extracting' | 'parsing' | 'complete' | 'error'

interface AutoDetectedFields {
  title: boolean
  expiryDate: boolean
  manufacturingDate: boolean
  batchNumber: boolean
  category: boolean
  notes: boolean
}

export default function AddItemModalEnhanced({
  isOpen,
  onClose,
  onSuccess,
  userPlan = 'free',
  currentItemCount = 0,
  fileCount = 0,
  defaultMode = 'manual',
}: AddItemModalProps) {
  // Form fields
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('warranty')
  const [expiryDate, setExpiryDate] = useState('')
  const [manufacturingDate, setManufacturingDate] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [reminderDays, setReminderDays] = useState<number[]>([7])
  const [notes, setNotes] = useState('')

  // Medicine-specific fields
  const [medicineName, setMedicineName] = useState('')
  const [personOption, setPersonOption] = useState<PersonOption>('self')
  const [customPersonName, setCustomPersonName] = useState('')

  // Category-specific fields
  // Warranty
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('')
  const [warrantyPeriod, setWarrantyPeriod] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  
  // Insurance
  const [policyType, setPolicyType] = useState('')
  const [provider, setProvider] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  
  // AMC
  const [serviceProvider, setServiceProvider] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [serviceType, setServiceType] = useState('')
  
  // Subscription
  const [serviceName, setServiceName] = useState('')
  const [plan, setPlan] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  
  // Medicine (additional)
  const [manufacturer, setManufacturer] = useState('')
  
  // Other category - 3 custom fields
  const [otherField1, setOtherField1] = useState('') // Document Type (hidden label)
  const [otherField2, setOtherField2] = useState('')
  const [otherField3, setOtherField3] = useState('')

  // Document upload & OCR
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [showHandwritingConfirmation, setShowHandwritingConfirmation] = useState(false)
  const [showLowConfidenceWarning, setShowLowConfidenceWarning] = useState(false)
  const [showAIExtractionConfirmation, setShowAIExtractionConfirmation] = useState(false)
  const [aiExtractionData, setAiExtractionData] = useState<CategoryAwareExtractionData | null>(null)
  const [lowConfidenceData, setLowConfidenceData] = useState<{
    confidence: number
    text: string
  } | null>(null)
  const [handwritingData, setHandwritingData] = useState<{
    text: string
    expiryDate: string | null
    confidence: number
    reasoning?: string
  } | null>(null)
  const [ocrStep, setOcrStep] = useState<OCRStep>('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [rawOcrText, setRawOcrText] = useState('')
  const [ocrConfidence, setOcrConfidence] = useState(0)
  const [aiConfidence, setAiConfidence] = useState(0)
  const [isSecondPass, setIsSecondPass] = useState(false)
  const [firstPassData, setFirstPassData] = useState<any>(null)
  const [autoDetected, setAutoDetected] = useState<AutoDetectedFields>({
    title: false,
    expiryDate: false,
    manufacturingDate: false,
    batchNumber: false,
    category: false,
    notes: false,
  })

  // Form state
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal closes, ensure loading states are reset when opening
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    } else {
      // When modal opens, ensure loading states are reset
      setLoading(false)
      setUploading(false)
      
      // Auto-trigger file picker when modal opens in 'file' mode
      if (defaultMode === 'file' && fileInputRef.current) {
        // Small delay to ensure modal is fully rendered
        setTimeout(() => {
          fileInputRef.current?.click()
        }, 100)
      }
    }
  }, [isOpen, defaultMode])

  // Cleanup image URL on unmount
  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl)
      }
    }
  }, [originalImageUrl])

  const resetForm = () => {
    setTitle('')
    setCategory('warranty')
    setExpiryDate('')
    setManufacturingDate('')
    setBatchNumber('')
    setReminderDays([7])
    setNotes('')
    setMedicineName('')
    setPersonOption('self')
    setCustomPersonName('')
    
    // Reset category-specific fields
    setProductName('')
    setBrand('')
    setWarrantyPeriod('')
    setSerialNumber('')
    setPolicyType('')
    setProvider('')
    setPolicyNumber('')
    setServiceProvider('')
    setContractNumber('')
    setServiceType('')
    setServiceName('')
    setPlan('')
    setSubscriptionId('')
    setManufacturer('')
    setOtherField1('')
    setOtherField2('')
    setOtherField3('')
    
    setDocumentFile(null)
    setOriginalImageUrl(null)
    setShowCropModal(false)
    setShowHandwritingConfirmation(false)
    setShowLowConfidenceWarning(false)
    setShowAIExtractionConfirmation(false)
    setHandwritingData(null)
    setLowConfidenceData(null)
    setAiExtractionData(null)
    setOcrStep('idle')
    setOcrProgress(0)
    setOcrError(null)
    setRawOcrText('')
    setOcrConfidence(0)
    setAiConfidence(0)
    setIsSecondPass(false)
    setFirstPassData(null)
    setAutoDetected({
      title: false,
      expiryDate: false,
      manufacturingDate: false,
      batchNumber: false,
      category: false,
      notes: false,
    })
    setError(null)
    setLoading(false)
    setUploading(false)
  }

  // Process document with Browser OCR + AI
  const processDocument = async (file: File, isCroppedImage = false) => {
    // Check if free plan user can upload (limit check)
    if (userPlan === 'free') {
      const canChoose = canChooseFile(userPlan, fileCount)
      if (!canChoose.allowed) {
        setOcrError(canChoose.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders')
        setOcrStep('error')
        showToast(canChoose.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders', 'error')
        return
      }
    }

    setOcrStep('uploading')
    setOcrProgress(5)
    setOcrError(null)

    try {
      // Step 1: Google Vision OCR Processing
      setOcrStep('extracting')
      setOcrProgress(10)

      // Use Google Vision OCR API
      const formData = new FormData()
      formData.append('image', file)

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const ocrData = await ocrResponse.json()

      // Check for OCR limit exceeded (403 status)
      if (ocrResponse.status === 403 && ocrData.error === 'OCR_LIMIT_EXCEEDED') {
        setOcrStep('idle')
        setOcrProgress(0)
        setOcrError(ocrData.message || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders')
        showToast(ocrData.message || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders', 'error')
        // Close modal and allow user to upgrade
        return
      }

      // Check for authentication errors (401 status)
      if (ocrResponse.status === 401) {
        setOcrStep('idle')
        setOcrProgress(0)
        setOcrError('Please log in to use OCR')
        showToast('Please log in to use OCR', 'error')
        return
      }

      if (!ocrResponse.ok) {
        throw new Error(ocrData.message || 'OCR API request failed')
      }

      // Check for OCR errors
      if (ocrData.error) {
        throw new Error(ocrData.message || 'OCR failed')
      }

      const rawText = ocrData.text || ''
      // Use confidenceScore if available (0-100), otherwise fallback to level-based conversion
      const ocrConf = ocrData.confidenceScore ?? (ocrData.confidence === 'HIGH' ? 90 : ocrData.confidence === 'MEDIUM' ? 70 : 50)

      // Security: Only log non-sensitive metadata (no personal data)
      console.log('[Google Vision OCR] Completed:', {
        textLength: rawText.length,
        confidence: ocrData.confidence,
        confidenceScore: ocrConf,
      })
      
      // SECURITY: Do NOT log full OCR text or any portion that may contain personal data
      // Removed: console.log('[Google Vision OCR] Full OCR Text:', rawText)
      // Removed: console.log('[Google Vision OCR] OCR Text (first 200 chars):', rawText.substring(0, 200))

      setRawOcrText(rawText)
      setOcrConfidence(ocrConf)
      setOcrProgress(60)

      // Step 2: Validate OCR text - must have at least 10 characters
      if (!rawText || rawText.trim().length < 10) {
        console.warn('[Error Handling] OCR returned empty or too short text:', rawText?.length || 0)
        setOcrStep('idle')
        setOcrProgress(0)
        setOcrError('Couldn\'t confidently read this document. Please enter manually.')
        showToast('Couldn\'t confidently read this document. Please enter manually.', 'info')
        // Never block user - allow manual entry
        return
      }

      // Step 3: Run Hybrid Reasoning Engine (Regex-based extraction)
      setOcrStep('parsing')
      setOcrProgress(70)

      try {
        const reasoningResponse = await fetch('/api/ai/hybrid-reasoning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ocrText: rawText,
          }),
        })

        // Parse response (always returns 200, even on errors)
        let result: any
        try {
          result = await reasoningResponse.json()
        } catch (jsonError: any) {
          console.error('[Error Handling] Failed to parse AI response:', jsonError)
          setOcrStep('idle')
          setOcrProgress(0)
          setOcrError('Couldn\'t confidently read this document. Please enter manually.')
          showToast('Couldn\'t confidently read this document. Please enter manually.', 'info')
          return
        }

        // Check if extraction was successful
        if (result.extracted) {
          const extracted = result.extracted as CategoryAwareExtractionData
          
          // Add category confidence if available
          extracted.categoryConfidence = result.categoryConfidence

          // Always show confirmation modal - never auto-fill
          setAiExtractionData(extracted)
          setShowAIExtractionConfirmation(true)
          setOcrStep('complete')
          setOcrProgress(100)
          
          // Show warning if confidence is low or expiry missing
          if (extracted.confidence < 60) {
            setOcrError('Low confidence detected. Please review extracted fields carefully.')
          } else if (!extracted.expiryDate) {
            setOcrError('Expiry date not detected. Please enter manually.')
          } else if (extracted.confidence < 80) {
            setOcrError('Medium confidence. Please review extracted fields.')
          }
          return
        } else {
          // No extraction or error - allow manual entry
          console.warn('[Error Handling] Could not extract data:', result.error)
          setOcrStep('idle')
          setOcrProgress(0)
          setOcrError('Couldn\'t confidently read this document. Please enter manually.')
          showToast('Couldn\'t confidently read this document. Please enter manually.', 'info')
          // Never block user - allow manual entry
          return
        }
    } catch (ocrError: any) {
      // Browser OCR error - don't block user
      console.warn('[Error Handling] Browser OCR failed:', ocrError)
      setOcrStep('idle')
      setOcrProgress(0)
      setOcrError('Couldn\'t confidently read this document. Please enter manually.')
      showToast('Couldn\'t confidently read this document. Please enter manually.', 'info')
      // Never block user - allow manual entry
    }
    } catch (reasoningError: any) {
      // AI processing error - don't block user
      console.warn('[Error Handling] Reasoning Engine failed:', reasoningError)
      setOcrStep('idle')
      setOcrProgress(0)
      setOcrError('We couldn\'t confidently detect expiry. Please enter manually.')
      showToast('We couldn\'t confidently detect expiry. Please enter manually.', 'info')
      // Never block user - allow manual entry
        // Fall through to allow manual entry
        return
      }
  }

  // Merge results from first and second pass
  const mergeResults = (firstPass: any, secondPass: any) => {
    console.log('[Crop] Merging results from first and second pass')
    
    // Prefer second pass (cropped) for expiry date (more accurate)
    // Prefer first pass for other fields (more context)
    const mergedParsedData = {
      productName: firstPass.parsedData?.productName || secondPass.parsedData?.productName || null,
      expiryDate: secondPass.parsedData?.expiryDate || firstPass.parsedData?.expiryDate || null, // Prefer cropped
      manufacturingDate: firstPass.parsedData?.manufacturingDate || secondPass.parsedData?.manufacturingDate || null,
      batchNumber: firstPass.parsedData?.batchNumber || secondPass.parsedData?.batchNumber || null,
      confidenceScore: Math.max(
        firstPass.parsedData?.confidenceScore || 0,
        secondPass.parsedData?.confidenceScore || 0
      ),
      detectedLabels: [
        ...(firstPass.parsedData?.detectedLabels || []),
        ...(secondPass.parsedData?.detectedLabels || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
    }

    // Combine raw text (first pass has more context)
    const mergedRawText = firstPass.rawText 
      ? `${firstPass.rawText}\n\n[Cropped area]: ${secondPass.rawText}`
      : secondPass.rawText

    // Use higher OCR confidence
    const mergedOcrConfidence = Math.max(firstPass.ocrConfidence || 0, secondPass.ocrConfidence || 0)

    applyParsedData(mergedRawText, mergedParsedData, mergedOcrConfidence, [])

    setOcrStep('complete')
    setOcrProgress(100)
    setIsSecondPass(false)
    setFirstPassData(null)

    console.log('[Crop] Results merged successfully')
  }

  // Apply parsed data to form fields
  // Apply confirmed fields from AI extraction confirmation modal
  const handleAIExtractionConfirm = async (
    confirmedFields: Record<string, string | null>
  ) => {
    // Apply confirmed fields to form
    const newAutoDetected: AutoDetectedFields = {
      title: false,
      expiryDate: false,
      manufacturingDate: false,
      batchNumber: false,
      category: false,
      notes: false,
    }

    // Apply confirmed fields (allow overwriting existing values if user confirmed)
    if (confirmedFields.expiryDate) {
      setExpiryDate(confirmedFields.expiryDate)
      newAutoDetected.expiryDate = true
    }

    // Get category from extracted data
    const extractedCategory = aiExtractionData?.category || 'other'
    setCategory(extractedCategory as Category)
    newAutoDetected.category = true

    // Map extracted fields to form fields based on category
    if (confirmedFields.productName) {
      setTitle(confirmedFields.productName)
      newAutoDetected.title = true
    } else if (confirmedFields.medicineName) {
      setTitle(confirmedFields.medicineName)
      newAutoDetected.title = true
    } else if (confirmedFields.serviceName) {
      setTitle(confirmedFields.serviceName)
      newAutoDetected.title = true
    }

    // Handle category-specific fields
    if (extractedCategory === 'warranty') {
      const brand = confirmedFields.brand as string | null
      if (brand) {
        const currentNotes = notes || ''
        const brandNote = `Brand: ${brand}`
        if (!currentNotes.includes(brand)) {
          setNotes(currentNotes ? `${currentNotes}\n${brandNote}` : brandNote)
        }
      }
    } else if (extractedCategory === 'insurance') {
      const provider = confirmedFields.provider as string | null
      if (provider) {
        const currentNotes = notes || ''
        const providerNote = `Provider: ${provider}`
        if (!currentNotes.includes(provider)) {
          setNotes(currentNotes ? `${currentNotes}\n${providerNote}` : providerNote)
        }
      }
      const policyType = confirmedFields.policyType as string | null
      if (policyType) {
        const currentNotes = notes || ''
        const policyNote = `Policy Type: ${policyType}`
        if (!currentNotes.includes(policyType)) {
          setNotes(currentNotes ? `${currentNotes}\n${policyNote}` : policyNote)
        }
      }
    } else if (extractedCategory === 'amc') {
      const serviceProvider = confirmedFields.serviceProvider as string | null
      if (serviceProvider) {
        const currentNotes = notes || ''
        const providerNote = `Service Provider: ${serviceProvider}`
        if (!currentNotes.includes(serviceProvider)) {
          setNotes(currentNotes ? `${currentNotes}\n${providerNote}` : providerNote)
        }
      }
    } else if (extractedCategory === 'medicine') {
      const manufacturer = confirmedFields.manufacturer as string | null
      if (manufacturer) {
        const currentNotes = notes || ''
        const manufacturerNote = `Manufacturer: ${manufacturer}`
        if (!currentNotes.includes(manufacturer)) {
          setNotes(currentNotes ? `${currentNotes}\n${manufacturerNote}` : manufacturerNote)
        }
      }
      const batchNo = confirmedFields.batchNo as string | null
      if (batchNo) {
        setBatchNumber(batchNo)
        newAutoDetected.batchNumber = true
      }
    } else if (extractedCategory === 'other') {
      // For "other" category, handle documentType
      const documentType = confirmedFields.documentType as string | null
      if (documentType) {
        const currentNotes = notes || ''
        const documentTypeNote = `Document Type: ${documentType}`
        if (!currentNotes.includes(documentType)) {
          setNotes(currentNotes ? `${currentNotes}\n${documentTypeNote}` : documentTypeNote)
        }
      }
    }

    // Determine final category
    const finalCategory = extractedCategory as Category
    
    setAutoDetected(newAutoDetected)
    setShowAIExtractionConfirmation(false)
    setAiExtractionData(null)
    
    // Auto-save if all required fields are present
    // For "other" category, use documentType as title if available, otherwise use existing title
    const finalTitle = (confirmedFields.productName as string | null) || 
      (confirmedFields.medicineName as string | null) || 
      (confirmedFields.serviceName as string | null) || 
      (finalCategory === 'other' && confirmedFields.documentType ? confirmedFields.documentType : null) ||
      (finalCategory === 'medicine' && medicineName ? medicineName : title)
    const hasRequiredFields = finalTitle && confirmedFields.expiryDate && reminderDays.length > 0
    
    if (hasRequiredFields) {
      // Auto-submit the form
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('You must be logged in to add items')
          setLoading(false)
          return
        }

        // Check plan limits
        const canAdd = canAddItem(userPlan, currentItemCount)
        if (!canAdd.allowed) {
          setError(canAdd.reason || 'Free plan allows only 10 items. Upgrade to Pro for unlimited items.')
          setLoading(false)
          return
        }

        const personName = getPersonName()

        // Upload document if provided
        let documentUrl: string | null = null
        if (documentFile) {
          setUploading(true)
          try {
            documentUrl = await uploadDocument(documentFile, user.id)
          } catch (uploadErr: any) {
            setError(uploadErr.message || 'Failed to upload document')
            setLoading(false)
            setUploading(false)
            return
          }
          setUploading(false)
        }

        // Prepare notes
        // For "other" category, ensure documentType is included in notes if present
        const documentType = finalCategory === 'other' ? (confirmedFields.documentType as string | null) : null
        const notesWithExtras = [
          notes,
          manufacturingDate && `Manufacturing Date: ${manufacturingDate}`,
          batchNumber && `Batch Number: ${batchNumber}`,
          documentType && `Document Type: ${documentType}`,
        ]
          .filter(Boolean)
          .join('\n')

        // Insert the item
        const { error: insertError } = await supabase.from('life_items').insert({
          user_id: user.id,
          title: finalTitle,
          category: finalCategory,
          expiry_date: confirmedFields.expiryDate,
          reminder_days: reminderDays,
          notes: notesWithExtras || null,
          person_name: personName,
          document_url: documentUrl,
        })

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(insertError.message || 'Failed to add item. Please try again.')
        }

        // Success - reset form, close modal and navigate to dashboard
        resetForm()
        setLoading(false)
        setUploading(false)
        onClose()
        
        showToast('Item added successfully!', 'success')
        
        // Navigate to dashboard after a short delay to allow toast to show
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      } catch (err: any) {
        console.error('Error saving item:', err)
        setError(err.message || 'Failed to save item. Please try again.')
        setLoading(false)
        setUploading(false)
      }
    } else {
      // Not all required fields - just close confirmation modal, let user fill remaining fields
      // Form is already populated, user can click "Add Item" when ready
    }
  }

  const applyParsedData = (
    rawText: string,
    parsedData: any,
    ocrConf: number,
    errors: string[]
  ) => {
    setRawOcrText(rawText || '')
    setOcrConfidence(ocrConf || 0)

    if (parsedData && parsedData.confidenceScore > 0) {
      setAiConfidence(parsedData.confidenceScore / 100) // Convert to 0-1 scale

      // Prefill form fields from parsed data
      const newAutoDetected: AutoDetectedFields = {
        title: false,
        expiryDate: false,
        manufacturingDate: false,
        batchNumber: false,
        category: false,
        notes: false,
      }

      // Product Name / Title
      if (parsedData.productName && !title) {
        setTitle(parsedData.productName)
        newAutoDetected.title = true
      }

      // Expiry Date
      if (parsedData.expiryDate && !expiryDate) {
        console.log('[Auto-fill] Setting expiry date:', parsedData.expiryDate)
        setExpiryDate(parsedData.expiryDate)
        newAutoDetected.expiryDate = true
      } else if (parsedData.expiryDate) {
        console.log('[Auto-fill] Expiry date already set, skipping:', expiryDate)
      } else {
        console.log('[Auto-fill] No expiry date in parsed data:', parsedData)
      }

      // Manufacturing Date
      if (parsedData.manufacturingDate && !manufacturingDate) {
        setManufacturingDate(parsedData.manufacturingDate)
        newAutoDetected.manufacturingDate = true
      }

      // Batch Number
      if (parsedData.batchNumber && !batchNumber) {
        setBatchNumber(parsedData.batchNumber)
        newAutoDetected.batchNumber = true
      }

      // Category (if detected and valid)
      if (parsedData.detectedLabels && parsedData.detectedLabels.length > 0) {
        const labels = parsedData.detectedLabels.map((l: string) => l.toLowerCase())
        if (labels.includes('warranty') || labels.includes('guarantee')) {
          setCategory('warranty')
          newAutoDetected.category = true
        } else if (labels.includes('insurance') || labels.includes('policy')) {
          setCategory('insurance')
          newAutoDetected.category = true
        } else if (labels.includes('medicine') || labels.includes('medication')) {
          setCategory('medicine')
          newAutoDetected.category = true
        }
      }

      // Notes (if available)
      if (rawText && rawText.length > 0 && !notes) {
        // Use raw OCR text as notes if no structured notes
        setNotes(rawText.substring(0, 500))
        newAutoDetected.notes = true
      }

      setAutoDetected(newAutoDetected)
    }

    // Show warning if confidence is low
    if (parsedData && parsedData.confidenceScore < 70) {
      setOcrError(
        `Low confidence detected (${parsedData.confidenceScore}%). Please review all auto-filled fields carefully.`
      )
    }

    // Log any errors from processing
    if (errors && errors.length > 0) {
      console.warn('Processing warnings:', errors)
    }
  }

  // Handle cropped image - CRITICAL: This should be fast (<3s) since it's a smaller region
  const handleCroppedImage = async (croppedBlob: Blob) => {
    setShowCropModal(false)
    setIsSecondPass(true)
    
    console.log('[Crop] Processing cropped image - should be fast (<3s)')
    const cropStartTime = Date.now()
    
    // Create file from blob
    const croppedFile = new File([croppedBlob], 'cropped-image.png', { type: 'image/png' })
    
    // Process cropped image (second pass)
    await processDocument(croppedFile, true)
    
    const cropProcessingTime = Date.now() - cropStartTime
    console.log(`[Crop] Cropped OCR completed in ${cropProcessingTime}ms`)
    
    if (cropProcessingTime > 3000) {
      console.warn(`[Crop] Cropped OCR took ${cropProcessingTime}ms (target: <3000ms)`)
    } else {
      console.log(`[Crop] ✅ Cropped OCR completed in ${cropProcessingTime}ms (target: <3000ms)`)
    }
    
    // Clean up image URL
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl)
      setOriginalImageUrl(null)
    }
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false)
    
    // Use first pass data if available
    if (firstPassData) {
      applyParsedData(
        firstPassData.rawText,
        firstPassData.parsedData,
        firstPassData.ocrConfidence,
        []
      )
      setOcrStep('complete')
      setOcrProgress(100)
      setFirstPassData(null)
    } else {
      setOcrStep('idle')
      setOcrProgress(0)
    }
    
    // Clean up image URL
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl)
      setOriginalImageUrl(null)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Check if free plan user can upload (limit check)
    if (userPlan === 'free') {
      const canChoose = canChooseFile(userPlan, fileCount)
      if (!canChoose.allowed) {
        setError(canChoose.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders')
        e.target.value = '' // Clear file input
        return
      }
    }

    setDocumentFile(file)
    setError(null)
    setIsSecondPass(false)
    setFirstPassData(null)

    // Process document automatically when file is selected
    // Now processes for all plans (free plan has limit check in processDocument)
    await processDocument(file, false)
  }

  const handleReminderDayToggle = (day: number) => {
    setReminderDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day].sort((a, b) => b - a)
      }
    })
  }

  const getPersonName = (): string | null => {
    if (category !== 'medicine') return null

    switch (personOption) {
      case 'self':
        return 'Self'
      case 'dad':
        return 'Dad'
      case 'mom':
        return 'Mom'
      case 'custom':
        return customPersonName.trim() || null
      default:
        return null
    }
  }

  const uploadDocument = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath)
      return data.publicUrl
    } catch (err: any) {
      console.error('Error uploading file:', err)
      throw new Error('Failed to upload document: ' + err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to add items')
        setLoading(false)
        return
      }

      // Check plan limits
      const canAdd = canAddItem(userPlan, currentItemCount)
      if (!canAdd.allowed) {
        setError(canAdd.reason || 'Cannot add more items. Please upgrade your plan.')
        setLoading(false)
        return
      }

      // Generate title based on category
      let finalTitle = ''
      if (category === 'warranty') {
        if (!productName) {
          setError('Product name is required')
          setLoading(false)
          return
        }
        if (!brand) {
          setError('Brand/Company is required')
          setLoading(false)
          return
        }
        finalTitle = `${productName} - ${brand}`
      } else if (category === 'insurance') {
        if (!policyType) {
          setError('Policy type is required')
          setLoading(false)
          return
        }
        if (!provider) {
          setError('Insurance provider is required')
          setLoading(false)
          return
        }
        finalTitle = `${policyType} - ${provider}`
      } else if (category === 'amc') {
        if (!serviceProvider) {
          setError('Service provider is required')
          setLoading(false)
          return
        }
        if (!productName) {
          setError('Product name is required')
          setLoading(false)
          return
        }
        finalTitle = `${productName} - ${serviceProvider}`
      } else if (category === 'subscription') {
        if (!serviceName) {
          setError('Service name is required')
          setLoading(false)
          return
        }
        finalTitle = serviceName
      } else if (category === 'medicine') {
        if (!medicineName) {
          setError('Medicine name is required')
          setLoading(false)
          return
        }
        finalTitle = medicineName
      } else if (category === 'other') {
        // For "other" category, use Field 1 (Document Type) as title if available, otherwise generic title
        finalTitle = otherField1 || 'Other Document'
      }

      const personName = getPersonName()

      // Validate expiry date (required for all categories)
      if (!expiryDate) {
        setError('Expiry date is required')
        setLoading(false)
        return
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        setError('Invalid date format. Please enter a valid date.')
        setLoading(false)
        return
      }

      if (reminderDays.length === 0) {
        setError('Please select at least one reminder day')
        setLoading(false)
        return
      }

      // Upload document if provided
      let documentUrl: string | null = null
      if (documentFile) {
        setUploading(true)
        try {
          documentUrl = await uploadDocument(documentFile, user.id)
        } catch (uploadErr: any) {
          setError(uploadErr.message || 'Failed to upload document')
          setLoading(false)
          setUploading(false)
          return
        }
        setUploading(false)
      }

      // Build notes with category-specific fields
      const notesParts: string[] = []
      
      if (notes) notesParts.push(notes)
      
      // Category-specific fields to add to notes
      if (category === 'warranty') {
        if (warrantyPeriod) notesParts.push(`Warranty Period: ${warrantyPeriod}`)
        if (serialNumber) notesParts.push(`Serial Number: ${serialNumber}`)
      } else if (category === 'insurance') {
        if (policyNumber) notesParts.push(`Policy Number: ${policyNumber}`)
      } else if (category === 'amc') {
        if (contractNumber) notesParts.push(`Contract Number: ${contractNumber}`)
        if (serviceType) notesParts.push(`Service Type: ${serviceType}`)
      } else if (category === 'subscription') {
        if (plan) notesParts.push(`Plan: ${plan}`)
        if (subscriptionId) notesParts.push(`Subscription ID: ${subscriptionId}`)
      } else if (category === 'medicine') {
        if (manufacturer) notesParts.push(`Brand/Manufacturer: ${manufacturer}`)
        if (batchNumber) notesParts.push(`Batch Number: ${batchNumber}`)
        if (manufacturingDate) notesParts.push(`Manufacturing Date: ${manufacturingDate}`)
      } else if (category === 'other') {
        if (otherField1) notesParts.push(`Document Type: ${otherField1}`)
        if (otherField2) notesParts.push(`Field 2: ${otherField2}`)
        if (otherField3) notesParts.push(`Field 3: ${otherField3}`)
      }
      
      const notesWithExtras = notesParts.length > 0 ? notesParts.join('\n') : null

      const { error: insertError } = await supabase.from('life_items').insert({
        user_id: user.id,
        title: finalTitle,
        category,
        expiry_date: expiryDate,
        reminder_days: reminderDays,
        notes: notesWithExtras || null,
        person_name: personName,
        document_url: documentUrl,
      })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(insertError.message || 'Failed to add item. Please try again.')
      }

      // Success - reset and close
      resetForm()
      setLoading(false)
      onClose()
      if (onSuccess) {
        onSuccess()
      }
      window.location.reload()
    } catch (err: any) {
      let errorMessage = 'Something went wrong. Please try again.'

      if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
        errorMessage = 'This item already exists. Please check your list.'
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Connection issue. Please check your internet and try again.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      setLoading(false)
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!loading && !uploading) {
      resetForm()
      onClose()
    }
  }

  const isMedicine = category === 'medicine'
  const reminderDayOptions = isMedicine ? [30, 7, 0] : [7, 15, 30]
  const showConfidenceWarning = aiConfidence > 0 && aiConfidence < 0.7

  if (!isOpen) return null

  // Separate modes: 'file' mode never shows manual entry form, 'manual' mode shows form
  const isFileMode = defaultMode === 'file'
  const isProcessingFile = isFileMode && documentFile && ocrStep !== 'idle' && ocrStep !== 'complete'
  const isWaitingForFile = isFileMode && !documentFile && ocrStep === 'idle'
  const showFormFields = !isFileMode && !showAIExtractionConfirmation // Only show form in manual mode

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* File Mode: Hidden file input (auto-triggered) */}
      {isFileMode && (
        <input
          ref={fileInputRef}
          id="document-file-mode"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={handleFileChange}
          disabled={loading || uploading || (ocrStep !== 'idle' && ocrStep !== 'complete')}
          className="hidden"
        />
      )}

      {/* File Mode: Processing Popup - Show only when processing file */}
      {isProcessingFile && (
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Processing Document...
              </span>
              <span className="text-sm text-blue-700">{ocrProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>
                {ocrStep === 'uploading' && 'Uploading document...'}
                {ocrStep === 'processing' && 'Running OCR...'}
                {ocrStep === 'extracting' && 'Extracting text...'}
                {ocrStep === 'parsing' && 'Parsing with AI...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* File Mode: Waiting for file selection - Show minimal message */}
      {isWaitingForFile && (
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Please select a file to continue...</p>
            <p className="text-xs text-gray-500">File picker should open automatically</p>
          </div>
        </div>
      )}

      {/* Main Form Modal - Show when not processing */}
      {showFormFields && (
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Life Item</h2>
            <button
              onClick={handleClose}
              disabled={loading || uploading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* OCR Progress Visualization */}
          {ocrStep !== 'idle' && ocrStep !== 'complete' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Processing Document...
                </span>
                <span className="text-sm text-blue-700">{ocrProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>
                  {ocrStep === 'uploading' && 'Uploading document...'}
                  {ocrStep === 'processing' && 'Running OCR...'}
                  {ocrStep === 'extracting' && 'Extracting text...'}
                  {ocrStep === 'parsing' && 'Parsing with AI...'}
                </span>
              </div>
            </div>
          )}

          {/* OCR Timeout / Low Confidence Prompt for Cropping */}
          {showCropModal && (
            <div className={`border rounded-lg p-4 ${
              ocrError?.includes('timeout') 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-start gap-2">
                <span className={`text-lg ${
                  ocrError?.includes('timeout') ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {ocrError?.includes('timeout') ? '⏱' : '⚠'}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    ocrError?.includes('timeout') ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {ocrError?.includes('timeout') 
                      ? 'OCR Timeout - Crop Required'
                      : `Low OCR Confidence Detected (${ocrConfidence.toFixed(1)}%)`
                    }
                  </p>
                  <p className={`text-xs mt-1 ${
                    ocrError?.includes('timeout') ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    {ocrError?.includes('timeout') 
                      ? 'The image is too large. Please crop the expiry/warranty area for faster processing (<3s).'
                      : 'For better accuracy, please crop the expiry date area in the image. This will help us extract the date more accurately.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OCR Complete / Error Messages */}
          {ocrStep === 'complete' && !showCropModal && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <span className="text-green-600">✓</span>
                <span>
                  Document processed successfully
                  {ocrConfidence > 0 && ` (OCR: ${ocrConfidence.toFixed(1)}%)`}
                  {aiConfidence > 0 && ` (AI: ${(aiConfidence * 100).toFixed(1)}%)`}
                  {isSecondPass && ' (with crop enhancement)'}
                </span>
              </div>
            </div>
          )}

          {ocrError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <span>⚠</span>
                <span>{ocrError}</span>
              </div>
            </div>
          )}

          {/* Confidence Warning */}
          {showConfidenceWarning && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 text-lg">⚠</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Low Confidence Detected
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    AI confidence is {(aiConfidence * 100).toFixed(1)}%. Please review all
                    auto-filled fields carefully and make corrections if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Upload - Available for all plans (Free: 5 uploads limit) */}
          {!isFileMode && (
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                Document {userPlan !== 'free' ? '*' : '(optional)'}
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload image or PDF (max 10MB). {userPlan !== 'free' ? 'We\'ll automatically extract details.' : `Free plan: ${fileCount}/5 uploads used.`}
              </p>
              
              {/* Upgrade Banner for Free Plan when limit reached */}
              {userPlan === 'free' && fileCount >= 5 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">
                    🔓 You've used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders
                  </p>
                  <a
                    href="/settings/plans"
                    className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
                  >
                    Upgrade to Pro →
                  </a>
                </div>
              )}
              
              <input
                id="document"
                type="file"
                accept="image/*,.pdf"
                required={userPlan !== 'free'}
                disabled={loading || uploading || (ocrStep !== 'idle' && ocrStep !== 'complete') || (userPlan === 'free' && fileCount >= 5)}
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {documentFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <span>📄 {documentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null)
                      setRawOcrText('')
                      setOcrStep('idle')
                      setOcrProgress(0)
                      setOcrError(null)
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category {userPlan === 'free' && <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <select
                id="category"
                required={userPlan === 'free'}
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={`flex-1 px-3 py-2 text-base text-gray-900 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  autoDetected.category ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <option value="warranty">Warranty</option>
                <option value="insurance">Insurance</option>
                <option value="amc">AMC</option>
                <option value="subscription">Subscription</option>
                {canUseMedicine(userPlan) && <option value="medicine">Medicine</option>}
                <option value="other">Other</option>
              </select>
              {autoDetected.category && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Auto-detected
                </span>
              )}
            </div>
          </div>

          {/* Category-Aware Fields */}
          
          {/* WARRANTY CATEGORY */}
          {category === 'warranty' && (
            <>
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., iPhone 14, Samsung TV"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand/Company <span className="text-red-500">*</span>
                </label>
                <input
                  id="brand"
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Apple, Samsung, LG"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="warrantyPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Period (optional)
                </label>
                <input
                  id="warrantyPeriod"
                  type="text"
                  value={warrantyPeriod}
                  onChange={(e) => setWarrantyPeriod(e.target.value)}
                  placeholder="e.g., 1 Year, 2 Years"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number (optional)
                </label>
                <input
                  id="serialNumber"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., SN123456789"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* INSURANCE CATEGORY */}
          {category === 'insurance' && (
            <>
              <div>
                <label htmlFor="policyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="policyType"
                  required
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select policy type</option>
                  <option value="Health">Health Insurance</option>
                  <option value="Motor">Motor Insurance</option>
                  <option value="Life">Life Insurance</option>
                  <option value="Travel">Travel Insurance</option>
                  <option value="Home">Home Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider <span className="text-red-500">*</span>
                </label>
                <input
                  id="provider"
                  type="text"
                  required
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="e.g., HDFC Life, ICICI Lombard, Star Health"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number (optional)
                </label>
                <input
                  id="policyNumber"
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="e.g., POL123456789"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* AMC CATEGORY */}
          {category === 'amc' && (
            <>
              <div>
                <label htmlFor="serviceProvider" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Provider <span className="text-red-500">*</span>
                </label>
                <input
                  id="serviceProvider"
                  type="text"
                  required
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  placeholder="e.g., Samsung Service Center, LG Service"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., AC, Refrigerator, Washing Machine"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Number (optional)
                </label>
                <input
                  id="contractNumber"
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g., AMC123456"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type (optional)
                </label>
                <input
                  id="serviceType"
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g., Annual Maintenance, Comprehensive"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* SUBSCRIPTION CATEGORY */}
          {category === 'subscription' && (
            <>
              <div>
                <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="serviceName"
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Netflix, Amazon Prime, Spotify"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type (optional)
                </label>
                <input
                  id="plan"
                  type="text"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="e.g., Premium, Basic, Family"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="subscriptionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription ID (optional)
                </label>
                <input
                  id="subscriptionId"
                  type="text"
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  placeholder="e.g., SUB123456"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* MEDICINE CATEGORY */}
          {category === 'medicine' && canUseMedicine(userPlan) && (
            <>
              <div>
                <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="medicineName"
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g., Paracetamol 500mg"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand/Manufacturer (optional)
                </label>
                <input
                  id="manufacturer"
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g., Cipla, Sun Pharma"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number (optional)
                </label>
                <input
                  id="batchNumber"
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g., ABC123"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="manufacturingDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturing Date (optional)
                </label>
                <input
                  id="manufacturingDate"
                  type="date"
                  value={manufacturingDate}
                  onChange={(e) => setManufacturingDate(e.target.value)}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* OTHER CATEGORY */}
          {category === 'other' && (
            <>
              <div>
                <label htmlFor="otherField1" className="block text-sm font-medium text-gray-700 mb-1">
                  Field 1 <span className="text-xs text-gray-500 font-normal">(Document Type)</span>
                </label>
                <input
                  id="otherField1"
                  type="text"
                  value={otherField1}
                  onChange={(e) => setOtherField1(e.target.value)}
                  placeholder="e.g., Driving License, Passport, Certificate"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="otherField2" className="block text-sm font-medium text-gray-700 mb-1">
                  Field 2
                </label>
                <input
                  id="otherField2"
                  type="text"
                  value={otherField2}
                  onChange={(e) => setOtherField2(e.target.value)}
                  placeholder="Enter any additional information"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="otherField3" className="block text-sm font-medium text-gray-700 mb-1">
                  Field 3
                </label>
                <input
                  id="otherField3"
                  type="text"
                  value={otherField3}
                  onChange={(e) => setOtherField3(e.target.value)}
                  placeholder="Enter any additional information"
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* Expiry Date - Always shown for all categories */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="expiryDate"
                type="date"
                required
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value)
                  setAutoDetected((prev) => ({ ...prev, expiryDate: false }))
                }}
                className={`flex-1 px-3 py-2 text-base text-gray-900 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  autoDetected.expiryDate ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              />
              {autoDetected.expiryDate && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Auto-detected
                </span>
              )}
            </div>
          </div>

          {/* Person (only for Medicine category) */}
          {isMedicine && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Person <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(['self', 'dad', 'mom'] as PersonOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPersonOption(option)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        personOption === option
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPersonOption('custom')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      personOption === 'custom'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {personOption === 'custom' && (
                  <input
                    type="text"
                    value={customPersonName}
                    onChange={(e) => setCustomPersonName(e.target.value)}
                    placeholder="Enter person name"
                    className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Days <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {isMedicine
                ? 'Select when you want to be reminded before expiry (default: 30, 7, and on expiry day)'
                : 'Select when you want to be reminded before expiry'}
            </p>
            <div className="flex flex-wrap gap-2">
              {reminderDayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleReminderDayToggle(day)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    reminderDays.includes(day)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day === 0 ? 'On expiry day' : `${day} days`}
                </button>
              ))}
            </div>
            {reminderDays.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Please select at least one reminder day</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setAutoDetected((prev) => ({ ...prev, notes: false }))
                }}
                placeholder="Additional details..."
                className={`flex-1 px-3 py-2 text-base text-gray-900 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  autoDetected.notes ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              />
              {autoDetected.notes && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2">
                  Auto-detected
                </span>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                uploading ||
                reminderDays.length === 0 ||
                !expiryDate ||
                (category === 'warranty' && (!productName || !brand)) ||
                (category === 'insurance' && (!policyType || !provider)) ||
                (category === 'amc' && (!serviceProvider || !productName)) ||
                (category === 'subscription' && !serviceName) ||
                (category === 'medicine' && !medicineName)
              }
              className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading document...
                </>
              ) : loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding item...
                </>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </form>
        </div>
      )}

      {/* Image Crop Modal - Shows when OCR times out or confidence is low */}
      {showCropModal && originalImageUrl && (
        <ImageCropModal
          isOpen={showCropModal}
          imageUrl={originalImageUrl}
          onCrop={handleCroppedImage}
          onCancel={handleCropCancel}
          title={ocrError?.includes('timeout') 
            ? "Crop Expiry/Warranty Area (Fast Processing)"
            : "Crop Expiry Date Area for Better Accuracy"
          }
        />
      )}

      {/* Category-Aware Extraction Confirmation Modal - Shows after extraction */}
      {showAIExtractionConfirmation && aiExtractionData && (
        <CategoryAwareConfirmationModal
          isOpen={showAIExtractionConfirmation}
          data={aiExtractionData}
          onConfirm={handleAIExtractionConfirm}
          onCancel={() => {
            setShowAIExtractionConfirmation(false)
            setAiExtractionData(null)
            // In file mode, close the modal completely when canceling confirmation
            if (isFileMode) {
              handleClose()
            }
          }}
        />
      )}

      {/* Low Confidence Warning Modal - Shows when handwritten OCR confidence < 50% */}
      {showLowConfidenceWarning && lowConfidenceData && (
        <LowConfidenceWarningModal
          isOpen={showLowConfidenceWarning}
          confidence={lowConfidenceData.confidence}
          detectedText={lowConfidenceData.text}
          onRetakePhoto={() => {
            // Clear document and allow retake
            setDocumentFile(null)
            setShowLowConfidenceWarning(false)
            setLowConfidenceData(null)
            setOcrStep('idle')
            setOcrProgress(0)
            setRawOcrText('')
            setOcrError(null)
            // Reset file input if possible
            const fileInput = document.getElementById('document') as HTMLInputElement
            if (fileInput) {
              fileInput.value = ''
            }
          }}
          onEnterManually={() => {
            // Clear detected data, allow manual entry
            setShowLowConfidenceWarning(false)
            setLowConfidenceData(null)
            setOcrStep('idle')
            setOcrProgress(0)
            setRawOcrText('')
            // Don't auto-fill anything - user will enter manually
            setAutoDetected({
              title: false,
              expiryDate: false,
              manufacturingDate: false,
              batchNumber: false,
              category: false,
              notes: false,
            })
          }}
          onDismiss={() => {
            // User wants to use low confidence results anyway (not recommended)
            // Still show confirmation modal if expiry date was detected
            if (rawOcrText) {
              // Try to extract expiry from raw text (with low confidence)
              setShowLowConfidenceWarning(false)
              setLowConfidenceData(null)
              // Proceed with low confidence - user has been warned
              setOcrStep('complete')
              setOcrProgress(100)
            }
          }}
        />
      )}

      {/* Handwriting Confirmation Modal - Shows when handwritten expiry is detected */}
      {showHandwritingConfirmation && handwritingData && (
        <HandwritingConfirmationModal
          isOpen={showHandwritingConfirmation}
          detectedText={handwritingData.text}
          detectedExpiryDate={handwritingData.expiryDate}
          reasoningConfidence={handwritingData.confidence}
          reasoning={handwritingData.reasoning}
          onConfirm={(confirmedDate) => {
            setExpiryDate(confirmedDate)
            setAutoDetected((prev) => ({ ...prev, expiryDate: true }))
            setShowHandwritingConfirmation(false)
            setHandwritingData(null)
          }}
          onEdit={() => {
            // Focus on expiry date field for editing
            setShowHandwritingConfirmation(false)
            setHandwritingData(null)
            // Expiry date field will be pre-filled, user can edit
            if (handwritingData.expiryDate) {
              setExpiryDate(handwritingData.expiryDate)
              setAutoDetected((prev) => ({ ...prev, expiryDate: true }))
            }
          }}
          onReject={() => {
            // Clear expiry date, allow manual input
            setExpiryDate('')
            setAutoDetected((prev) => ({ ...prev, expiryDate: false }))
            setShowHandwritingConfirmation(false)
            setHandwritingData(null)
          }}
        />
      )}
    </div>
  )
}

