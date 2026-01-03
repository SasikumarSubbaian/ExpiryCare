'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/lib/ocr/categorySchemas'

type FieldWithConfidence = {
  value: string | null
  confidence: 'High' | 'Medium' | 'Low'
  confidencePercentage?: number
}

type ExtractedData = {
  category: string
  categoryConfidence: 'High' | 'Medium' | 'Low'
  categoryConfidencePercentage?: number
  expiryDate: {
    value: string | null
    confidence: 'High' | 'Medium' | 'Low'
    sourceKeyword: string | null
  }
  productName?: FieldWithConfidence
  companyName?: FieldWithConfidence
  policyType?: FieldWithConfidence
  policyNumber?: FieldWithConfidence
  provider?: FieldWithConfidence
  insurerName?: FieldWithConfidence
  serviceType?: FieldWithConfidence
  providerName?: FieldWithConfidence
  serviceName?: FieldWithConfidence
  planType?: FieldWithConfidence
  medicineName?: FieldWithConfidence
  brandName?: FieldWithConfidence
  documentName?: FieldWithConfidence
  documentType?: FieldWithConfidence
  issuer?: FieldWithConfidence
  holderName?: FieldWithConfidence
  warnings?: string[]
  // New format fields
  extractedFields?: Record<string, any>
  fields?: Record<string, any>
  fullText?: string
  success?: boolean
}

type OCRConfirmationModalProps = {
  isOpen: boolean
  extractedData: ExtractedData | null
  onConfirm: (data: ExtractedData) => void
  onCancel: () => void
  onEdit: (field: string, value: string) => void
}

type FieldState = {
  confirmed: boolean
  skipped: boolean
  edited: boolean
  value: string | null
}

export default function OCRConfirmationModal({
  isOpen,
  extractedData,
  onConfirm,
  onCancel,
  onEdit,
}: OCRConfirmationModalProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})
  // FEATURE: Reminder Days and Notes for OCR flow
  const [reminderDays, setReminderDays] = useState<number[]>([7]) // Default to 7 days
  const [notes, setNotes] = useState('')

  // ✅ NEVER SELF-BLOCK: Always render modal if isOpen is true
  if (!isOpen) return null
  
  // If no extractedData, show empty form for manual entry (never return null)
  if (!extractedData || Object.keys(extractedData).length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Extracted Information</h2>
            <p className="text-gray-600 mb-4">No data was extracted. Please enter the details manually.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm({ 
                  category: 'other', 
                  categoryConfidence: 'Low' as const,
                  categoryConfidencePercentage: 0,
                  expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null }
                })}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Continue with Manual Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleEdit = (field: string, currentValue: string | null) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const handleSaveEdit = (field: string) => {
    if (editingField === field) {
      onEdit(field, editValue)
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          edited: true,
          value: editValue,
        }
      }))
      setEditingField(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const handleConfirmField = (field: string) => {
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        confirmed: true,
        skipped: false,
      }
    }))
  }

  const handleSkipField = (field: string) => {
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        skipped: true,
        confirmed: false,
      }
    }))
  }

  // 🔧 LAYER 6: Handle final confirmation with skipped fields
  const handleFinalConfirm = () => {
    // Collect skipped fields
    const skippedFields: string[] = []
    for (const [fieldName, state] of Object.entries(fieldStates)) {
      if (state.skipped) {
        skippedFields.push(fieldName)
      }
    }
    
    // Create final data object without skipped fields
    const finalData = { ...extractedData }
    
    // Remove skipped fields from final data
    for (const fieldName of skippedFields) {
      delete (finalData as any)[fieldName]
    }
    
    // Add skippedFields metadata
    if (skippedFields.length > 0) {
      (finalData as any).skippedFields = skippedFields
    }
    
    // FEATURE: Add reminderDays and notes to confirmation data
    ;(finalData as any).reminderDays = reminderDays
    ;(finalData as any).notes = notes.trim() || null
    
    onConfirm(finalData)
  }

  // Handle reminder day toggle (same logic as AddItemModal)
  const handleReminderDayToggle = (day: number) => {
    setReminderDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day].sort((a, b) => b - a) // Sort descending
      }
    })
  }

  // Set default reminder days based on category
  const getDefaultReminderDays = (category: string): number[] => {
    if (category === 'medicine') {
      return [30, 7, 0] // Medicine defaults
    }
    return [7] // Default for other categories
  }

  // Update reminder days when category changes
  useEffect(() => {
    if (extractedData?.category) {
      const defaultDays = getDefaultReminderDays(extractedData.category)
      // Only set default if reminderDays is empty or still at default [7]
      if (reminderDays.length === 0 || (reminderDays.length === 1 && reminderDays[0] === 7)) {
        setReminderDays(defaultDays)
      }
    }
  }, [extractedData?.category])

  const getConfidenceColor = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High':
        return 'bg-green-100 text-green-700'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'Low':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getConfidencePercentage = (confidence: 'High' | 'Medium' | 'Low', percentage?: number): number => {
    if (percentage !== undefined) return percentage
    switch (confidence) {
      case 'High':
        return 90
      case 'Medium':
        return 60
      case 'Low':
        return 30
      default:
        return 50
    }
  }

  const renderFieldCard = (
    label: string,
    fieldName: string,
    fieldData: FieldWithConfidence | string | null | undefined,
    confidence?: 'High' | 'Medium' | 'Low',
    isRequired: boolean = false
  ) => {
    // Handle both old format (string) and new format (FieldWithConfidence)
    let value: string | null = null
    let fieldConfidence: 'High' | 'Medium' | 'Low' = confidence || 'Medium'
    let confidencePercentage: number | undefined = undefined
    
    if (typeof fieldData === 'string') {
      value = fieldData
    } else if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
      value = fieldData.value
      fieldConfidence = fieldData.confidence || confidence || 'Medium'
      confidencePercentage = fieldData.confidencePercentage
    } else {
      // fieldData is null/undefined - set empty value but still show field
      value = null
      fieldConfidence = 'Low'
    }
    
    // NEVER return null - always show field, even if empty
    // Empty fields will show placeholder text
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '')

    const fieldState = fieldStates[fieldName] || { confirmed: false, skipped: false, edited: false, value }
    const isEditing = editingField === fieldName
    const isConfirmed = fieldState.confirmed
    const isSkipped = fieldState.skipped
    const displayValue = fieldState.edited ? fieldState.value : (value || '')
    const confPercentage = getConfidencePercentage(fieldConfidence, confidencePercentage)
    const showPlaceholder = isEmpty && !isEditing

    return (
      <div className={`mb-4 p-4 rounded-lg border-2 ${
        isConfirmed 
          ? 'bg-blue-50 border-blue-200' 
          : isSkipped 
          ? 'bg-gray-50 border-gray-200 opacity-60' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-900">
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            {!isRequired && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                Optional
              </span>
            )}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(fieldConfidence)}`}>
            {fieldConfidence} ({confPercentage}%)
          </span>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveEdit(fieldName)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                ✓ Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <p className={`font-medium ${showPlaceholder ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                {showPlaceholder ? 'Not detected – please enter manually' : displayValue}
              </p>
            </div>
            <div className="flex gap-2">
              {!isConfirmed && !isSkipped && (
                <>
                  <button
                    onClick={() => handleConfirmField(fieldName)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                  >
                    <span>✓</span> Confirm
                  </button>
                  <button
                    onClick={() => handleEdit(fieldName, displayValue)}
                    className="px-3 py-1.5 bg-orange-200 text-orange-700 text-sm rounded hover:bg-orange-300 flex items-center gap-1"
                  >
                    <span>✎</span> Edit
                  </button>
                  {/* LAYER 6: Enable Skip button if field.required === false */}
                  {!isRequired && (
                    <button
                      onClick={() => handleSkipField(fieldName)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      Skip
                    </button>
                  )}
                </>
              )}
              {isConfirmed && (
                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded">
                  ✓ Confirmed
                </span>
              )}
              {isSkipped && (
                <span className="px-3 py-1.5 bg-gray-200 text-gray-600 text-sm rounded">
                  Skipped
                </span>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // LAYER 5: Dynamic fields based on category (NO HARD CODING)
  const CATEGORY_FIELDS: Record<string, Array<{ key: string; required: boolean }>> = {
    other: [ // Generic fields for other category (when no product name detected)
      { key: 'field1', required: false },
      { key: 'field2', required: false },
      { key: 'field3', required: false },
      { key: 'expiryDate', required: true },
    ],
    other_license: [ // License fields (other category with license detection)
      { key: 'documentName', required: true },
      { key: 'licenseNumber', required: true },
      { key: 'holderName', required: false },
      { key: 'dateOfBirth', required: false },
      { key: 'expiryDate', required: true },
    ],
    medicine: [
      { key: 'productName', required: true },
      { key: 'manufacturingDate', required: false },
      { key: 'expiryDate', required: true },
      { key: 'batchNumber', required: false },
    ],
    warranty: [
      { key: 'productName', required: true },
      { key: 'purchaseDate', required: true },
      { key: 'expiryDate', required: true },
    ],
    insurance: [
      { key: 'policyNumber', required: true },
      { key: 'provider', required: false },
      { key: 'expiryDate', required: true },
    ],
    subscription: [
      { key: 'serviceName', required: true },
      { key: 'planType', required: false },
      { key: 'expiryDate', required: true },
    ],
    amc: [
      { key: 'serviceType', required: true },
      { key: 'providerName', required: false },
      { key: 'expiryDate', required: true },
    ],
  }

  // Get category-specific fields based on schema
  const getCategoryFields = () => {
    // STEP 2: Category must never default to "other" without checking extractedData
    let category = extractedData.category || 'other'
    
    // Re-evaluate category based on extractedData keys
    let categoryForFields = category
    if (category === 'other') {
      const data = extractedData as any // Type assertion for dynamic properties
      const hasLicenseNumber = data.licenseNumber?.value || data.dlNumber?.value
      const hasDateOfBirth = data.dateOfBirth?.value || data.dob?.value
      const hasDateOfIssue = data.dateOfIssue?.value || data.issueDate?.value
      const hasProductName = data.productName?.value || data.medicineName?.value
      
      if (hasLicenseNumber || (hasDateOfBirth && hasDateOfIssue)) {
        // Has license fields - use license-specific fields
        categoryForFields = 'other_license'
      } else if (hasProductName) {
        // Has product name - re-evaluate category based on product
        const hasExpiryDate = extractedData.expiryDate?.value
        const hasBatchNumber = data.batchNumber?.value
        
        if (hasExpiryDate && hasProductName) {
          if (hasBatchNumber || data.medicineName?.value) {
            categoryForFields = 'medicine'
          } else if (data.purchaseDate?.value) {
            categoryForFields = 'warranty'
          } else {
            categoryForFields = 'medicine' // Default to medicine if has product name and expiry
          }
        } else if (hasExpiryDate && data.purchaseDate?.value) {
          categoryForFields = 'warranty'
        }
        // If product name exists but doesn't match other categories, keep as "other" with generic fields
      } else {
        // No product name, no license fields - use generic fields (Field 1, Field 2, Field 3)
        categoryForFields = 'other'
      }
    }
    
    const categoryLower = categoryForFields.toLowerCase()
    const fields: Array<{ label: string; fieldName: string; fieldData: any; isRequired: boolean }> = []
    const seenFields = new Set<string>() // Track seen fields to prevent duplicates

    // LAYER 6: Confirmation modal fix - render ONLY from CATEGORY_FIELDS
    // STEP 3: Single source of truth - ONLY read from extractedData
    // Determine visible fields based on category
    const visibleFields = CATEGORY_FIELDS[categoryLower] || CATEGORY_FIELDS.other
    
    // Map visible fields to display fields
    for (const fieldDef of visibleFields) {
      const fieldKey = fieldDef.key
      
      // Skip if already added (prevent duplicates)
      if (seenFields.has(fieldKey)) continue
      seenFields.add(fieldKey)
      
      // LAYER 6: For each field:
      // value = extractedData[field.key]?.value ?? ""
      // confidence = extractedData[field.key]?.confidence ?? "Low"
      const fieldData = (extractedData as any)[fieldKey]
      
      // Extract value and confidence
      let value = ''
      let confidence: 'High' | 'Medium' | 'Low' = 'Low'
      
      if (fieldData) {
        if (typeof fieldData === 'object' && fieldData !== null && 'value' in fieldData) {
          value = fieldData.value || ''
          confidence = fieldData.confidence || 'Low'
        } else if (typeof fieldData === 'string') {
          value = fieldData
          confidence = 'Medium'
        }
      }
      
      // LAYER 6: ALWAYS render input even if value is empty
      // Format label from field key
      // 🔧 FIX: Custom label mapping for better UX
      const labelMap: Record<string, string> = {
        productName: 'Product Name',
        manufacturingDate: 'Manufacturing Date',
        expiryDate: 'Expiry Date',
        batchNumber: 'Batch Number',
        purchaseDate: 'Purchase Date',
        documentName: 'Document Name',
        licenseNumber: 'License Number',
        holderName: 'Holder Name',
        dateOfBirth: 'Date of Birth',
        dateOfIssue: 'Date of Issue',
        policyNumber: 'Policy Number',
        provider: 'Provider',
        serviceName: 'Service Name',
        planType: 'Plan Type',
        serviceType: 'Service Type',
        providerName: 'Provider Name',
        field1: 'Field 1',
        field2: 'Field 2',
        field3: 'Field 3',
      }
      const label = labelMap[fieldKey] || fieldKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
      
      fields.push({
        label,
        fieldName: fieldKey,
        fieldData: { value, confidence },
        isRequired: fieldDef.required,
      })
    }
    
    // Always show expiry date first (required) - PINNED TO TOP
    const expiryIndex = fields.findIndex(f => f.fieldName === 'expiryDate')
    if (expiryIndex > 0) {
      const expiryField = fields.splice(expiryIndex, 1)[0]
      fields.unshift(expiryField)
    } else if (expiryIndex === -1) {
      // Add expiry date if missing
      fields.unshift({
        label: 'Expiry Date',
        fieldName: 'expiryDate',
        fieldData: extractedData.expiryDate || { value: '', confidence: 'Low' },
        isRequired: true,
      })
    }

    // Always show category field at the end (only once)
    if (!seenFields.has('category')) {
      fields.push({
        label: 'Category',
        fieldName: 'category',
        fieldData: extractedData.category || category,
        isRequired: false,
      })
    }

    return fields
  }

  const categoryFields = getCategoryFields()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Confirm Extracted Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and confirm the extracted data. You can edit or skip any field.
          </p>
        </div>

        <div className="p-6">
          {/* Warnings */}
          {extractedData.warnings && extractedData.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Warnings</p>
              <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                {extractedData.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category confidence warning */}
          {extractedData.categoryConfidencePercentage !== undefined && extractedData.categoryConfidencePercentage < 40 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-orange-800">
                ⚠️ Low category confidence ({extractedData.categoryConfidencePercentage}%). Please verify the category is correct.
              </p>
            </div>
          )}

          {/* Render all fields - Expiry Date pinned to top */}
          {/* STEP 6: Fix duplicate key warning - use category + fieldName */}
          {categoryFields.map((field, index) => {
            const category = extractedData.category || 'other'
            const uniqueKey = `${category}-${field.fieldName}-${index}`
            
            if (field.fieldName === 'expiryDate') {
              return (
                <div key={uniqueKey}>
                  {renderFieldCard(
                    field.label,
                    field.fieldName,
                    extractedData.expiryDate?.value,
                    extractedData.expiryDate?.confidence,
                    true
                  )}
                </div>
              )
            } else if (field.fieldName === 'category') {
              return (
                <div key={uniqueKey} className="mb-4 p-4 rounded-lg border-2 bg-white border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">{field.label}</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(
                      extractedData.categoryConfidence || 'Medium'
                    )}`}>
                      {extractedData.categoryConfidence || 'Medium'} ({extractedData.categoryConfidencePercentage || 0}%)
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-gray-900 font-medium capitalize">{field.fieldData || extractedData.category || 'other'}</p>
                  </div>
                </div>
              )
            } else {
              return (
                <div key={uniqueKey}>
                  {renderFieldCard(
                    field.label,
                    field.fieldName,
                    field.fieldData,
                    undefined,
                    field.isRequired
                  )}
                </div>
              )
            }
          })}

          {/* FEATURE: Reminder Days and Notes Section - Show at bottom of extracted fields */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
            
            {/* Reminder Days */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Days <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Select when you want to be reminded before expiry</p>
              <div className="flex gap-2 flex-wrap">
                {[7, 15, 30].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleReminderDayToggle(day)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      reminderDays.includes(day)
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day} days
                  </button>
                ))}
              </div>
              {reminderDays.length === 0 && (
                <p className="mt-2 text-xs text-red-600">Please select at least one reminder day</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="ocr-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                id="ocr-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional details..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Validate reminder days
              if (reminderDays.length === 0) {
                alert('Please select at least one reminder day')
                return
              }

              // LAYER 6: On Skip - mark field as skipped, DO NOT send skipped fields to backend
              const skippedFields: string[] = []
              for (const [fieldName, state] of Object.entries(fieldStates)) {
                if (state.skipped) {
                  skippedFields.push(fieldName)
                }
              }
              
              // Remove skipped fields from extractedData before sending
              const dataToSend = { ...extractedData }
              for (const fieldName of skippedFields) {
                delete (dataToSend as any)[fieldName]
              }
              
              // Add skippedFields metadata (for backend to ignore)
              ;(dataToSend as any).skippedFields = skippedFields
              
              // FEATURE: Add reminderDays and notes to confirmation data
              ;(dataToSend as any).reminderDays = reminderDays
              ;(dataToSend as any).notes = notes.trim() || null
              
              onConfirm(dataToSend)
            }}
            className="px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Apply Confirmed Fields
          </button>
        </div>
      </div>
    </div>
  )
}
