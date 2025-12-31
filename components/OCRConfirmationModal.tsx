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
  warnings?: string[]
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

  if (!isOpen || !extractedData) return null

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
    } else if (fieldData === null || fieldData === undefined) {
      return null
    }
    
    if (value === null || value === undefined || value.trim() === '') return null

    const fieldState = fieldStates[fieldName] || { confirmed: false, skipped: false, edited: false, value }
    const isEditing = editingField === fieldName
    const isConfirmed = fieldState.confirmed
    const isSkipped = fieldState.skipped
    const displayValue = fieldState.edited ? fieldState.value : value
    const confPercentage = getConfidencePercentage(fieldConfidence, confidencePercentage)

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
              <p className="text-gray-900 font-medium">{displayValue}</p>
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
    const category = extractedData.category.toLowerCase()
    const fields: Array<{ label: string; fieldName: string; fieldData: any; isRequired: boolean }> = []

    // Always show expiry date first (required) - PINNED TO TOP
    fields.push({
      label: 'Expiry Date',
      fieldName: 'expiryDate',
      fieldData: extractedData.expiryDate.value,
      isRequired: true,
    })

    // Category-specific fields - show all extracted fields
    if (category === 'medicine') {
      if (extractedData.medicineName) {
        fields.push({
          label: 'Medicine Name',
          fieldName: 'medicineName',
          fieldData: extractedData.medicineName,
          isRequired: true,
        })
      }
      if (extractedData.companyName) {
        fields.push({
          label: 'Manufacturer',
          fieldName: 'companyName',
          fieldData: extractedData.companyName,
          isRequired: true,
        })
      }
      if (extractedData.brandName) {
        fields.push({
          label: 'Brand Name',
          fieldName: 'brandName',
          fieldData: extractedData.brandName,
          isRequired: false,
        })
      }
    } else if (category === 'warranty') {
      if (extractedData.productName) {
        fields.push({
          label: 'Product Name',
          fieldName: 'productName',
          fieldData: extractedData.productName,
          isRequired: true,
        })
      }
      if (extractedData.companyName) {
        fields.push({
          label: 'Company Name',
          fieldName: 'companyName',
          fieldData: extractedData.companyName,
          isRequired: true,
        })
      }
    } else if (category === 'insurance') {
      if (extractedData.policyNumber) {
        fields.push({
          label: 'Policy Number',
          fieldName: 'policyNumber',
          fieldData: extractedData.policyNumber,
          isRequired: true,
        })
      }
      if (extractedData.provider) {
        fields.push({
          label: 'Insurance Provider',
          fieldName: 'provider',
          fieldData: extractedData.provider,
          isRequired: true,
        })
      }
      // Legacy field names
      if (extractedData.insurerName) {
        fields.push({
          label: 'Insurer Name',
          fieldName: 'insurerName',
          fieldData: extractedData.insurerName,
          isRequired: false,
        })
      }
    } else if (category === 'amc') {
      if (extractedData.serviceType) {
        fields.push({
          label: 'Service Type',
          fieldName: 'serviceType',
          fieldData: extractedData.serviceType,
          isRequired: true,
        })
      }
      if (extractedData.providerName) {
        fields.push({
          label: 'Provider Name',
          fieldName: 'providerName',
          fieldData: extractedData.providerName,
          isRequired: true,
        })
      }
    } else if (category === 'subscription') {
      if (extractedData.serviceName) {
        fields.push({
          label: 'Service Name',
          fieldName: 'serviceName',
          fieldData: extractedData.serviceName,
          isRequired: true,
        })
      }
      if (extractedData.planType) {
        fields.push({
          label: 'Plan Type',
          fieldName: 'planType',
          fieldData: extractedData.planType,
          isRequired: false,
        })
      }
    } else if (category === 'other') {
      if (extractedData.documentName) {
        fields.push({
          label: 'Document Name',
          fieldName: 'documentName',
          fieldData: extractedData.documentName,
          isRequired: true,
        })
      }
      if (extractedData.issuer) {
        fields.push({
          label: 'Issued By',
          fieldName: 'issuer',
          fieldData: extractedData.issuer,
          isRequired: false,
        })
      }
    }

    // Always show category field at the end
    fields.push({
      label: 'Category',
      fieldName: 'category',
      fieldData: extractedData.category,
      isRequired: false,
    })

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
          {categoryFields.map((field) => {
            if (field.fieldName === 'expiryDate') {
              return (
                <div key={field.fieldName}>
                  {renderFieldCard(
                    field.label,
                    field.fieldName,
                    extractedData.expiryDate.value,
                    extractedData.expiryDate.confidence,
                    true
                  )}
                </div>
              )
            } else if (field.fieldName === 'category') {
              return (
                <div key={field.fieldName} className="mb-4 p-4 rounded-lg border-2 bg-white border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">{field.label}</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(
                      extractedData.categoryConfidence
                    )}`}>
                      {extractedData.categoryConfidence} ({extractedData.categoryConfidencePercentage || 0}%)
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-gray-900 font-medium capitalize">{field.fieldData}</p>
                  </div>
                </div>
              )
            } else {
              return (
                <div key={field.fieldName}>
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
