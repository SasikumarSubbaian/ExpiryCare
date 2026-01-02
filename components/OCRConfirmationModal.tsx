'use client'

import { useState } from 'react'
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
    const isEmpty = value === null || value === undefined || (typeof value === 'string' && value.trim() === '')

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

  // Get category-specific fields based on schema
  const getCategoryFields = () => {
    const category = extractedData.category || 'other'
    const categoryLower = category.toLowerCase()
    const fields: Array<{ label: string; fieldName: string; fieldData: any; isRequired: boolean }> = []
    const seenFields = new Set<string>() // Track seen fields to prevent duplicates

    // Import category field map
    // Use dynamic import to avoid SSR issues
    let categoryFieldKeys: string[] = []
    try {
      const categoryFieldMap = require('@/lib/ocr/categoryFieldMap')
      categoryFieldKeys = categoryFieldMap.getFieldsForCategory(category)
    } catch (e) {
      // Fallback to default fields
      categoryFieldKeys = ['expiryDate', 'documentName']
    }
    
    // Get extractedFields from API response (new format)
    // extractedFields is the new format from API (result object)
    // extractedData is the legacy format
    const extractedFields = extractedData.extractedFields || {}
    
    // Map field keys to display fields
    for (const fieldKey of categoryFieldKeys) {
      // Skip if already added (prevent duplicates)
      if (seenFields.has(fieldKey)) continue
      seenFields.add(fieldKey)
      
      // Get field value from extractedFields or legacy format
      let fieldValue: any = null
      let isRequired = fieldKey === 'expiryDate' || fieldKey === 'documentName' || fieldKey === 'medicineName' || fieldKey === 'productName'
      
      // Try new format first (extractedFields from API)
      if (extractedFields[fieldKey]) {
        fieldValue = extractedFields[fieldKey]
      } else {
        // Try legacy format from extractedData
        const legacyKey = fieldKey === 'documentProvider' ? 'issuer' : 
                         fieldKey === 'dateOfBirth' ? 'dob' :
                         fieldKey === 'dateOfIssue' ? 'issueDate' :
                         fieldKey === 'licenseNumber' ? 'dlNumber' :
                         fieldKey
        const legacyData = (extractedData as any)[legacyKey]
        if (legacyData) {
          // Handle both object format { value, confidence } and direct value
          if (typeof legacyData === 'object' && legacyData !== null && 'value' in legacyData) {
            fieldValue = legacyData
          } else {
            fieldValue = { value: legacyData, confidence: 'Medium' }
          }
        } else {
          // Empty field - show editable input
          fieldValue = { value: '', confidence: 'Low' }
        }
      }
      
      // Format label from field key
      const label = fieldKey
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
      
      fields.push({
        label,
        fieldName: fieldKey,
        fieldData: fieldValue,
        isRequired,
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
          {/* Fix duplicate keys by using category + fieldName + index */}
          {categoryFields.map((field, index) => {
            const uniqueKey = `${extractedData.category || 'other'}-${field.fieldName}-${index}`
            
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
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(extractedData)}
            className="px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Apply Confirmed Fields
          </button>
        </div>
      </div>
    </div>
  )
}
