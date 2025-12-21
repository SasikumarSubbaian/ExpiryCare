'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { canAddItem, canUseMedicine, canUploadDocuments, type PlanType } from '@/lib/plans'

type AddItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userPlan?: PlanType
  currentItemCount?: number
}

type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'
type PersonOption = 'self' | 'dad' | 'mom' | 'custom'

export default function AddItemModal({ isOpen, onClose, onSuccess, userPlan = 'free', currentItemCount = 0 }: AddItemModalProps) {
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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

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

      // Get public URL
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

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

      const { error: insertError } = await supabase
        .from('life_items')
        .insert([
          {
            user_id: user.id,
            title: finalTitle,
            category,
            expiry_date: expiryDate,
            reminder_days: reminderDays,
            notes: notes || null,
            person_name: personName,
            document_url: documentUrl,
          },
        ])

      if (insertError) {
        throw insertError
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
      router.refresh()
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
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Title (only for non-Medicine categories) */}
          {!isMedicine && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., iPhone 14 Warranty"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              </div>
            </div>
          )}

          {/* Expiry Date */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              id="expiryDate"
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

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
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Document Upload */}
          {canUploadDocuments(userPlan) && (
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                Document (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">Upload image or PDF (max 10MB)</p>
            <div className="flex items-center gap-2">
              <input
                id="document"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      setError('File size must be less than 10MB')
                      return
                    }
                    setDocumentFile(file)
                    setError(null)
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
          {!canUploadDocuments(userPlan) && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              Document upload requires Pro or Family plan
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
              disabled={loading || uploading || reminderDays.length === 0 || (isMedicine && !medicineName)}
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
