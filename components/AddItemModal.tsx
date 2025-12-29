'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { canAddItem, canUseMedicine, canUploadDocuments, canChooseFile, type PlanType } from '@/lib/plans'

type AddItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userPlan?: PlanType
  currentItemCount?: number
  fileCount?: number
}

type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'
type PersonOption = 'self' | 'dad' | 'mom' | 'custom'

export default function AddItemModal({ isOpen, onClose, onSuccess, userPlan = 'free', currentItemCount = 0, fileCount = 0 }: AddItemModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('warranty')
  const [expiryDate, setExpiryDate] = useState('')
  const [reminderDays, setReminderDays] = useState<number[]>([7])
  const [notes, setNotes] = useState('')
  
  // Medicine-specific fields
  const [medicineName, setMedicineName] = useState('')
  const [personOption, setPersonOption] = useState<PersonOption>('self')
  const [customPersonName, setCustomPersonName] = useState('')
  
  // Document upload
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processingOCR, setProcessingOCR] = useState(false)
  const [ocrExtracted, setOcrExtracted] = useState(false)
  const [ocrProgress, setOcrProgress] = useState<string>('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Process OCR when document is uploaded (all plans, but free plan has limit)
  const processOCR = async (file: File) => {
    // For free plan, check limit before processing
    if (userPlan === 'free') {
      const canChoose = canChooseFile(userPlan, fileCount)
      if (!canChoose.allowed) {
        setError(canChoose.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders')
        return
      }
    }
    
    setProcessingOCR(true)
    setError(null)
    setOcrProgress('Uploading document...')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      setOcrProgress('Processing document with OCR...')
      
      const response = await fetch('/api/ocr/extract', {
        method: 'POST',
        body: formData,
      })
      
      setOcrProgress('Extracting details...')
      
      const result = await response.json()
      
      if (!response.ok) {
        // Handle API errors
        const errorMsg = result.error || result.details || 'Failed to process document'
        console.warn('OCR API error:', errorMsg)
        setOcrProgress('')
        setProcessingOCR(false)
        // Don't show error to user - OCR is optional, they can still fill manually
        return
      }
      
      setOcrProgress('Finalizing extraction...')
      
      if (result.success && result.extractedData) {
        const data = result.extractedData
        let extractedAny = false
        
        // Auto-fill form fields from OCR
        if (data.title && !title) {
          setTitle(data.title)
          extractedAny = true
        }
        
        if (data.expiryDate && !expiryDate) {
          // The OCR API now returns dates in YYYY-MM-DD format
          // Validate the date before setting it
          const dateStr = data.expiryDate.trim()
          
          // Check if it's a valid date format (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Validate it's a real date
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              // Check if date components match (prevents invalid dates like 2024-02-30)
              const [year, month, day] = dateStr.split('-').map(Number)
              if (date.getFullYear() === year && 
                  date.getMonth() + 1 === month && 
                  date.getDate() === day) {
                setExpiryDate(dateStr)
                extractedAny = true
              } else {
                console.warn('Invalid date extracted from OCR:', dateStr)
              }
            } else {
              console.warn('Invalid date format from OCR:', dateStr)
            }
          } else {
            console.warn('Date format not recognized from OCR:', dateStr)
          }
        }
        
        if (data.category && !category) {
          // Validate category is one of the allowed values
          const validCategories: Category[] = ['warranty', 'insurance', 'amc', 'subscription', 'medicine', 'other']
          if (validCategories.includes(data.category as Category)) {
            setCategory(data.category as Category)
            extractedAny = true
          }
        }
        
        if (data.notes && !notes) {
          setNotes(data.notes)
          extractedAny = true
        }
        
        if (extractedAny) {
          setOcrExtracted(true)
          setOcrProgress('Details extracted successfully!')
          // Clear progress message after a moment
          setTimeout(() => setOcrProgress(''), 2000)
        } else {
          console.warn('OCR completed but no valid data extracted:', result)
          setOcrProgress('No details found - please fill manually')
          setTimeout(() => setOcrProgress(''), 3000)
        }
      } else {
        console.warn('OCR completed but no data extracted:', result)
        setOcrProgress('No text found - please fill manually')
        setTimeout(() => setOcrProgress(''), 3000)
      }
    } catch (err: any) {
      console.error('OCR processing error:', err)
      setOcrProgress('Processing failed - please fill manually')
      setTimeout(() => setOcrProgress(''), 3000)
      // Don't show error to user - OCR is optional enhancement
      // They can still fill the form manually
    } finally {
      setProcessingOCR(false)
    }
  }

  // Reset reminder days when category changes to Medicine
  useEffect(() => {
    if (category === 'medicine') {
      if (!canUseMedicine(userPlan)) {
        setCategory('warranty') // Reset to warranty if medicine not allowed
        setError('Medicine tracking requires Pro or Family plan')
      } else {
        setReminderDays([30, 7, 0])
      }
    } else {
      setReminderDays([7])
    }
  }, [category, userPlan])

  if (!isOpen) return null

  const handleReminderDayToggle = (day: number) => {
    setReminderDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day].sort((a, b) => b - a) // Sort descending
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
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL (for private buckets, we'll use signed URLs via API route)
      // Store the path (user_id/filename) so we can generate signed URLs later
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Return the full URL - the download route will handle converting to signed URL if needed
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

      // Check plan limits before adding
      const canAdd = canAddItem(userPlan, currentItemCount)
      if (!canAdd.allowed) {
        setError(canAdd.reason || 'Cannot add more items. Please upgrade your plan.')
        setLoading(false)
        return
      }

      // For medicine, use medicine name as title if provided, otherwise use title
      const finalTitle = category === 'medicine' && medicineName 
        ? medicineName 
        : title

      if (category === 'medicine' && !medicineName) {
        setError('Medicine name is required')
        setLoading(false)
        return
      }

      const personName = getPersonName()

      // Document is required for Pro/Family plans
      if (userPlan !== 'free' && !documentFile) {
        setError('Document upload is required for Pro and Family plans')
        setLoading(false)
        return
      }

      // Reminder Days is required for Pro/Family plans
      if ((userPlan === 'pro' || userPlan === 'family') && reminderDays.length === 0) {
        setError('Please select at least one reminder day')
        setLoading(false)
        return
      }

      // Validate expiry date is not empty and is valid
      if (!expiryDate || expiryDate.trim() === '') {
        setError('Expiry date is required')
        setLoading(false)
        return
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        setError('Invalid date format. Please enter a valid date.')
        setLoading(false)
        return
      }

      // Validate it's a real date
      const dateObj = new Date(expiryDate)
      if (isNaN(dateObj.getTime())) {
        setError('Invalid date. Please enter a valid date.')
        setLoading(false)
        return
      }

      // Check if date components match (prevents invalid dates like 2024-02-30)
      const [year, month, day] = expiryDate.split('-').map(Number)
      if (dateObj.getFullYear() !== year || 
          dateObj.getMonth() + 1 !== month || 
          dateObj.getDate() !== day) {
        setError('Invalid date. Please enter a valid date.')
        setLoading(false)
        return
      }

      // For Free plan, basic fields are required
      if (userPlan === 'free') {
        if (!title && !isMedicine) {
          setError('Title is required')
          setLoading(false)
          return
        }
        if (reminderDays.length === 0) {
          setError('Please select at least one reminder day')
          setLoading(false)
          return
        }
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

      // Insert the item - don't fetch it back to avoid RLS permission issues
      const { error: insertError } = await supabase
        .from('life_items')
        .insert({
          user_id: user.id,
          title: finalTitle,
          category,
          expiry_date: expiryDate,
          reminder_days: reminderDays,
          notes: notes || null,
          person_name: personName,
          document_url: documentUrl,
        })

      if (insertError) {
        console.error('Insert error details:', insertError)
        console.error('User ID:', user.id)
        console.error('User authenticated:', !!user)
        
        // Provide more helpful error messages
        if (insertError.code === '42501') {
          throw new Error('Permission denied. Please run migration 008_fix_rls_policies_final.sql in Supabase to fix RLS policies.')
        } else if (insertError.code === '23503') {
          throw new Error('Foreign key constraint violation. Please check your database constraints.')
        } else if (insertError.message?.includes('users') || insertError.message?.includes('permission denied')) {
          throw new Error('Database permission error. Please run migration 008_fix_rls_policies_final.sql to fix RLS policies.')
        }
        throw new Error(insertError.message || 'Failed to add item. Please try again.')
      }

      // Insert succeeded - create a temporary object for reminder check
      // We don't fetch the item back to avoid RLS permission issues
      const insertedItem = {
        id: 'temp-id', // Not used for reminder
        title: finalTitle,
        category,
        expiry_date: expiryDate,
        reminder_days: reminderDays,
        person_name: personName,
      }

      // Check if reminder should be sent immediately (if item expires within reminder days)
      if (insertedItem) {
        const expiryDateObj = new Date(expiryDate)
        expiryDateObj.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((expiryDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // Check if any reminder day matches (item expires within reminder period)
        const shouldSendNow = reminderDays.some(day => {
          if (day === 0) {
            // Send if expires today or already expired
            return daysUntil <= 0
          }
          // Send if days until expiry matches reminder day
          return daysUntil === day || (daysUntil <= day && daysUntil >= 0)
        })

        // Send reminder immediately if within reminder period
        // Note: We skip this for now since we don't have the item ID
        // Reminders will be sent by the scheduled cron job
        if (shouldSendNow) {
          console.log('Item expires within reminder period - reminder will be sent by scheduled job')
          // TODO: Once we have the item ID from insert, we can send reminder here
        }
      }

      // Reset form
      setTitle('')
      setCategory('warranty')
      setExpiryDate('')
      setReminderDays([7])
      setNotes('')
      setMedicineName('')
      setPersonOption('self')
      setCustomPersonName('')
      setDocumentFile(null)
      
      // Close modal and refresh
      setLoading(false)
      onClose()
      if (onSuccess) {
        onSuccess()
      }
      // Refresh the page to show new items
      // Force a full page reload to ensure fresh data
      window.location.reload()
    } catch (err: any) {
      // Provide helpful, calm error messages
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
      setTitle('')
      setCategory('warranty')
      setExpiryDate('')
      setReminderDays([7])
      setNotes('')
      setMedicineName('')
      setPersonOption('self')
      setCustomPersonName('')
      setDocumentFile(null)
      setError(null)
      onClose()
    }
  }

  const isMedicine = category === 'medicine'
  const reminderDayOptions = isMedicine ? [30, 7, 0] : [7, 15, 30]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Life Item</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category {userPlan === 'free' && <span className="text-red-500">*</span>}
            </label>
            <select
              id="category"
              required={userPlan === 'free'}
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="warranty">Warranty</option>
              <option value="insurance">Insurance</option>
              <option value="amc">AMC</option>
              <option value="subscription">Subscription</option>
              {canUseMedicine(userPlan) && <option value="medicine">Medicine</option>}
              <option value="other">Other</option>
            </select>
            {!canUseMedicine(userPlan) && (
              <p className="mt-1 text-xs text-gray-500">
                Medicine tracking requires Pro or Family plan
              </p>
            )}
          </div>

          {/* Medicine Name (only for Medicine category) */}
          {isMedicine && canUseMedicine(userPlan) && (
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
          )}

          {/* Title (only for non-Medicine categories) */}
          {!isMedicine && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title {userPlan === 'free' && <span className="text-red-500">*</span>}
              </label>
              <input
                id="title"
                type="text"
                required={userPlan === 'free'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., iPhone 14 Warranty"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

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

          {/* Expiry Date */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date {(userPlan === 'free' || userPlan === 'pro' || userPlan === 'family') && <span className="text-red-500">*</span>}
            </label>
            <input
              id="expiryDate"
              type="date"
              required={userPlan === 'free' || userPlan === 'pro' || userPlan === 'family'}
              value={expiryDate}
              onChange={(e) => {
                const value = e.target.value
                // Only set if it's a valid date string (YYYY-MM-DD format)
                if (value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  setExpiryDate(value)
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 text-base text-gray-900 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                expiryDate && expiryDate.trim() !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {expiryDate && expiryDate.trim() !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) && (
              <p className="mt-1 text-xs text-red-500">Please enter a valid date in YYYY-MM-DD format</p>
            )}
          </div>

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Days {(userPlan === 'pro' || userPlan === 'family') && <span className="text-red-500">*</span>}
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
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Document Upload - Available for all plans (Free: 5 uploads limit) */}
          <div>
            <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
              Document {userPlan !== 'free' ? '*' : '(optional)'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Upload image or PDF (max 10MB). {userPlan !== 'free' ? 'We\'ll automatically extract details from your document.' : `Free plan: ${fileCount}/5 uploads used.`}
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
            
            <div className="flex items-center gap-2">
              <input
                id="document"
                type="file"
                accept="image/*,.pdf"
                required={userPlan !== 'free'}
                disabled={userPlan === 'free' && fileCount >= 5}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      setError('File size must be less than 10MB')
                      return
                    }
                    
                    // Check if free plan user can upload
                    if (userPlan === 'free') {
                      const canChoose = canChooseFile(userPlan, fileCount)
                      if (!canChoose.allowed) {
                        setError(canChoose.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders')
                        return
                      }
                    }
                    
                    setDocumentFile(file)
                    setError(null)
                    
                    // Process OCR for all plans (Free plan has limit check above)
                    await processOCR(file)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {processingOCR && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>{ocrProgress || 'Processing document and extracting details...'}</span>
              </div>
            )}
            {documentFile && !processingOCR && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span>📄 {documentFile.name}</span>
                {ocrExtracted && (
                  <span className="text-green-600 text-xs">✓ Details extracted - Please review and complete any missing fields</span>
                )}
                {!ocrExtracted && userPlan !== 'free' && (
                  <span className="text-gray-500 text-xs">No details extracted - Please fill the form manually</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null)
                    setOcrExtracted(false)
                    // Reset form fields if they were auto-filled
                    if (ocrExtracted) {
                      setTitle('')
                      setExpiryDate('')
                      setNotes('')
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || 
                ((userPlan === 'pro' || userPlan === 'family') && reminderDays.length === 0) || 
                (userPlan === 'free' && reminderDays.length === 0) ||
                (isMedicine && !medicineName)}
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
    </div>
  )
}
