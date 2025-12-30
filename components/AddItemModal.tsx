'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { canAddItem, canUseMedicine, canUploadDocuments, canUploadDocument, type PlanType } from '@/lib/plans'

type AddItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userPlan?: PlanType
  currentItemCount?: number
  documentCount?: number
}

type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'
type PersonOption = 'self' | 'dad' | 'mom' | 'custom'

// Category-specific field definitions
const categoryFields = {
  warranty: ['productName', 'companyName'],
  insurance: ['policyType', 'insurerName'],
  amc: ['serviceType', 'providerName'],
  subscription: ['serviceName'],
  medicine: ['medicineName', 'brandName'],
  other: ['field1', 'field2', 'field3'], // Custom fields for Other category
} as const

export default function AddItemModal({ isOpen, onClose, onSuccess, userPlan = 'free', currentItemCount = 0, documentCount = 0 }: AddItemModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('warranty')
  const [expiryDate, setExpiryDate] = useState('')
  const [reminderDays, setReminderDays] = useState<number[]>([7])
  const [notes, setNotes] = useState('')
  
  // Category-specific fields
  const [productName, setProductName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [policyType, setPolicyType] = useState('')
  const [insurerName, setInsurerName] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [providerName, setProviderName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [medicineName, setMedicineName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [field1, setField1] = useState('')
  const [field2, setField2] = useState('')
  const [field3, setField3] = useState('')
  
  // Medicine-specific fields
  const [personOption, setPersonOption] = useState<PersonOption>('self')
  const [customPersonName, setCustomPersonName] = useState('')
  
  // Document upload (optional - for manual entry, document is just stored, no OCR)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // CRITICAL: Add Item modal is MANUAL ENTRY ONLY
  // NO OCR processing here - OCR is handled separately via "Choose File" button
  // Document upload in this modal is just for storage, not for OCR extraction

  // Reset form fields when category changes
  useEffect(() => {
    // Reset all category-specific fields
    setProductName('')
    setCompanyName('')
    setPolicyType('')
    setInsurerName('')
    setServiceType('')
    setProviderName('')
    setServiceName('')
    setMedicineName('')
    setBrandName('')
    setField1('')
    setField2('')
    setField3('')
    setPersonOption('self')
    setCustomPersonName('')
    setTitle('')
    
    // Reset reminder days based on category
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

      // Build title and notes based on category and extracted fields
      let finalTitle = title
      let finalNotes = notes
      
      if (category === 'warranty') {
        finalTitle = productName || title || 'Warranty'
        if (companyName) {
          finalNotes = finalNotes ? `${finalNotes}\nCompany: ${companyName}` : `Company: ${companyName}`
        }
      } else if (category === 'insurance') {
        finalTitle = policyType ? `${policyType} Insurance` : title || 'Insurance'
        if (insurerName) {
          finalNotes = finalNotes ? `${finalNotes}\nInsurer: ${insurerName}` : `Insurer: ${insurerName}`
        }
      } else if (category === 'amc') {
        finalTitle = serviceType || title || 'AMC'
        if (providerName) {
          finalNotes = finalNotes ? `${finalNotes}\nProvider: ${providerName}` : `Provider: ${providerName}`
        }
      } else if (category === 'subscription') {
        finalTitle = serviceName || title || 'Subscription'
      } else if (category === 'medicine') {
        if (!medicineName) {
          setError('Medicine name is required')
          setLoading(false)
          return
        }
        finalTitle = medicineName
        if (brandName) {
          finalNotes = finalNotes ? `${finalNotes}\nBrand: ${brandName}` : `Brand: ${brandName}`
        }
      } else if (category === 'other') {
        // For Other category, use field2 (Product/License/Document) as title if provided
        finalTitle = field2 || title || 'Other'
        if (field1) {
          finalNotes = finalNotes ? `${finalNotes}\nCompany: ${field1}` : `Company: ${field1}`
        }
        if (field3) {
          finalNotes = finalNotes ? `${finalNotes}\nNotes: ${field3}` : `Notes: ${field3}`
        }
      }
      
      if (!finalTitle) {
        setError('Title is required')
        setLoading(false)
        return
      }

      const personName = getPersonName()

      // CRITICAL: Document and OCR are OPTIONAL - users can always add items manually
      // OCR is a convenience feature, not a requirement
      // Add Item flow must work independently of OCR success/failure

      // Reminder Days is required for Pro/Family plans
      if ((userPlan === 'pro' || userPlan === 'family') && reminderDays.length === 0) {
        setError('Please select at least one reminder day')
        setLoading(false)
        return
      }

      // For Free plan, basic fields are required
      if (userPlan === 'free') {
        // Check category-specific required fields
        if (category === 'warranty' && !productName && !title) {
          setError('Product name is required')
          setLoading(false)
          return
        }
        if (category === 'insurance' && !policyType && !title) {
          setError('Policy type is required')
          setLoading(false)
          return
        }
        if (category === 'amc' && !serviceType && !title) {
          setError('Service type is required')
          setLoading(false)
          return
        }
        if (category === 'subscription' && !serviceName && !title) {
          setError('Service name is required')
          setLoading(false)
          return
        }
        if (category !== 'medicine' && category !== 'warranty' && category !== 'insurance' && category !== 'amc' && category !== 'subscription' && category !== 'other' && !title) {
          setError('Title is required')
          setLoading(false)
          return
        }
        if (!expiryDate) {
          setError('Expiry date is required')
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
        // Check document upload limit before uploading (for free plan only)
        if (userPlan === 'free') {
          const canUpload = canUploadDocument(userPlan, documentCount)
          if (!canUpload.allowed) {
            setError(
              canUpload.reason || 
              `You've reached the free plan limit of 5 document uploads. Upgrade to Pro for unlimited document uploads & WhatsApp reminders.`
            )
            setLoading(false)
            return
          }
        }

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
          notes: finalNotes || null,
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
      setProductName('')
      setCompanyName('')
      setPolicyType('')
      setInsurerName('')
      setServiceType('')
      setProviderName('')
      setServiceName('')
      setMedicineName('')
      setBrandName('')
      setField1('')
      setField2('')
      setField3('')
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
      setProductName('')
      setCompanyName('')
      setPolicyType('')
      setInsurerName('')
      setServiceType('')
      setProviderName('')
      setServiceName('')
      setMedicineName('')
      setBrandName('')
      setField1('')
      setField2('')
      setField3('')
      setPersonOption('self')
      setCustomPersonName('')
      setDocumentFile(null)
      setError(null)
      onClose()
    }
  }
  
  // Helper to render category-specific fields
  const renderCategoryFields = () => {
    const fields = categoryFields[category]
    if (!fields || fields.length === 0) return null
    
    return fields.map((field) => {
      const fieldLabel = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
      
      if (category === 'warranty') {
        if (field === 'productName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Product Name {userPlan === 'free' && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field}
                type="text"
                required={userPlan === 'free'}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., iPhone 14"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
        if (field === 'companyName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                id={field}
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Apple Inc."
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
      }
      
      if (category === 'insurance') {
        if (field === 'policyType') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Policy Type {userPlan === 'free' && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field}
                type="text"
                required={userPlan === 'free'}
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                placeholder="e.g., Health, Motor, Life"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
        if (field === 'insurerName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Insurer Name
              </label>
              <input
                id={field}
                type="text"
                value={insurerName}
                onChange={(e) => setInsurerName(e.target.value)}
                placeholder="e.g., LIC, HDFC Life"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
      }
      
      if (category === 'amc') {
        if (field === 'serviceType') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Service Type {userPlan === 'free' && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field}
                type="text"
                required={userPlan === 'free'}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g., Annual Maintenance"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
        if (field === 'providerName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name
              </label>
              <input
                id={field}
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="e.g., Service Provider Name"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
      }
      
      if (category === 'subscription') {
        if (field === 'serviceName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Service Name {userPlan === 'free' && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field}
                type="text"
                required={userPlan === 'free'}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Netflix, Spotify"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
      }
      
      if (category === 'medicine') {
        if (field === 'medicineName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                id={field}
                type="text"
                required
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="e.g., Paracetamol 500mg"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
        if (field === 'brandName') {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name
              </label>
              <input
                id={field}
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Crocin, Dolo"
                className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )
        }
      }
      
      if (category === 'other') {
        const labels = {
          field1: 'Company Name',
          field2: 'Product / License / Document',
          field3: 'Notes',
        }
        const placeholders = {
          field1: 'Optional company name',
          field2: 'Product, license, or document name',
          field3: 'Additional notes',
        }
        
        return (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
              {labels[field as keyof typeof labels]}
            </label>
            <input
              id={field}
              type="text"
              value={field === 'field1' ? field1 : field === 'field2' ? field2 : field3}
              onChange={(e) => {
                if (field === 'field1') setField1(e.target.value)
                else if (field === 'field2') setField2(e.target.value)
                else setField3(e.target.value)
              }}
              placeholder={placeholders[field as keyof typeof placeholders]}
              className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )
      }
      
      return null
    })
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

          {/* Category-specific fields - dynamically rendered */}
          {renderCategoryFields()}
          
          {/* Title field - shown for categories that don't have a primary name field */}
          {category !== 'medicine' && category !== 'warranty' && category !== 'insurance' && category !== 'amc' && category !== 'subscription' && category !== 'other' && (
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
                placeholder="Item title"
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
              Expiry Date {userPlan === 'free' && <span className="text-red-500">*</span>}
            </label>
            <input
              id="expiryDate"
              type="date"
              required={userPlan === 'free'}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
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

          {/* Document Upload - Available for all plans (with limits for free) */}
          {canUploadDocuments(userPlan) && (
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                Document (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload image or PDF (max 10MB) to attach to this item. For automatic extraction, use the "Choose File" button on the dashboard.
                {userPlan === 'free' && (
                  <span className={`block mt-1 font-medium ${
                    documentCount >= 5 
                      ? 'text-yellow-700' 
                      : documentCount >= 3 
                      ? 'text-orange-600' 
                      : 'text-primary-600'
                  }`}>
                    Free plan: {documentCount}/5 documents used
                    {documentCount >= 3 && documentCount < 5 && (
                      <span className="ml-1 text-xs">(Almost at limit)</span>
                    )}
                  </span>
                )}
              </p>
              {userPlan === 'free' && documentCount >= 5 && (
                <div className="mb-2 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-md">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📊</span>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-900 font-semibold mb-1">
                        Document Upload Limit Reached
                      </p>
                      <p className="text-xs text-yellow-800 mb-3">
                        You've used all {documentCount} of your 5 free document uploads. Upgrade to Pro for unlimited document uploads & WhatsApp reminders.
                      </p>
                      <a
                        href="/upgrade"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 px-4 py-2 rounded-md transition-colors"
                      >
                        Upgrade to Pro →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            <div className="flex items-center gap-2">
              <input
                id="document"
                type="file"
                accept="image/*,.pdf"
                required={false}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Check file size
                    if (file.size > 10 * 1024 * 1024) {
                      setError('File size must be less than 10MB')
                      return
                    }

                    // Check document upload limit for free plan BEFORE setting the file
                    if (userPlan === 'free') {
                      const canUpload = canUploadDocument(userPlan, documentCount)
                      if (!canUpload.allowed) {
                        setError(
                          canUpload.reason || 
                          `You've reached the free plan limit of 5 document uploads. Upgrade to Pro for unlimited document uploads & WhatsApp reminders.`
                        )
                        e.target.value = '' // Clear file input
                        setDocumentFile(null) // Clear any previous file selection
                        return
                      }
                    }

                    setDocumentFile(file)
                    setError(null)
                    // Document is just stored - no OCR processing in manual Add Item flow
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            {documentFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span>📄 {documentFile.name}</span>
                <button
                  type="button"
                  onClick={() => setDocumentFile(null)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Remove
                </button>
              </div>
            )}
            </div>
          )}

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
                (category === 'medicine' && !medicineName) ||
                (category === 'warranty' && userPlan === 'free' && !productName) ||
                (category === 'insurance' && userPlan === 'free' && !policyType) ||
                (category === 'amc' && userPlan === 'free' && !serviceType) ||
                (category === 'subscription' && userPlan === 'free' && !serviceName)}
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
