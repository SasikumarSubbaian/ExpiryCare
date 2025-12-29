'use client'

import { useState } from 'react'

export interface ExtractedField {
  name: string
  label: string
  value: string | null
  confidence: number
  isRequired?: boolean
  isHighlighted?: boolean // For expiry date
}

export interface AIExtractionData {
  expiryDate: string | null
  expiryConfidence: number
  companyName: string | null
  companyConfidence: number
  itemCategory: string | null
  productName: string | null
  detectedKeywords: string[]
}

type FieldAction = 'confirm' | 'edit' | 'skip'

interface FieldState {
  action: FieldAction | null
  editedValue: string | null
}

type AIExtractionConfirmationModalProps = {
  isOpen: boolean
  data: AIExtractionData
  onConfirm: (confirmedFields: Partial<{
    expiryDate: string | null
    companyName: string | null
    itemCategory: string | null
    productName: string | null
  }>) => void
  onCancel: () => void
}

/**
 * Get confidence level label and color
 */
function getConfidenceLevel(confidence: number): {
  label: 'High' | 'Medium' | 'Low'
  color: string
  bgColor: string
} {
  if (confidence >= 70) {
    return {
      label: 'High',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    }
  } else if (confidence >= 50) {
    return {
      label: 'Medium',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    }
  } else {
    return {
      label: 'Low',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    }
  }
}

export default function AIExtractionConfirmationModal({
  isOpen,
  data,
  onConfirm,
  onCancel,
}: AIExtractionConfirmationModalProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})

  if (!isOpen) return null

  // Build field list with confidence scores
  const fields: ExtractedField[] = [
    {
      name: 'expiryDate',
      label: 'Expiry Date',
      value: data.expiryDate,
      confidence: data.expiryConfidence,
      isRequired: true,
      isHighlighted: true, // Highlight expiry date
    },
    {
      name: 'companyName',
      label: 'Company Name',
      value: data.companyName,
      confidence: data.companyConfidence,
      isRequired: false,
    },
    {
      name: 'productName',
      label: 'Product Name',
      value: data.productName,
      confidence: 0, // Product name doesn't have explicit confidence
      isRequired: false,
    },
    {
      name: 'itemCategory',
      label: 'Category',
      value: data.itemCategory,
      confidence: 0, // Category doesn't have explicit confidence
      isRequired: false,
    },
  ].filter((field) => {
    // For expiry date, show it even if null (so user knows it wasn't detected)
    if (field.name === 'expiryDate') {
      return true
    }
    // For other fields, only show if they have values
    return field.value !== null && field.value !== undefined && field.value !== ''
  })

  // Initialize field states
  if (Object.keys(fieldStates).length === 0 && fields.length > 0) {
    const initialStates: Record<string, FieldState> = {}
    fields.forEach((field) => {
      initialStates[field.name] = {
        action: null,
        editedValue: field.value,
      }
    })
    setFieldStates(initialStates)
  }

  const handleFieldAction = (fieldName: string, action: FieldAction) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        action,
      },
    }))
  }

  const handleEditValue = (fieldName: string, value: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        editedValue: value,
        action: 'edit',
      },
    }))
  }

  const handleConfirm = () => {
    const confirmedFields: Partial<{
      expiryDate: string | null
      companyName: string | null
      itemCategory: string | null
      productName: string | null
    }> = {}

    fields.forEach((field) => {
      const state = fieldStates[field.name]
      if (!state) return

      // Skip fields that were skipped
      if (state.action === 'skip') {
        return
      }

      // Use edited value if field was edited, otherwise use original value
      if (state.action === 'edit' && state.editedValue !== null && state.editedValue.trim() !== '') {
        confirmedFields[field.name as keyof typeof confirmedFields] = state.editedValue.trim()
      } else if (state.action === 'confirm' || state.action === null) {
        // If no action taken, treat as confirmed (for required fields)
        // BUT: For required fields with no value, don't allow confirmation
        if (field.value !== null && field.value !== '') {
          confirmedFields[field.name as keyof typeof confirmedFields] = field.value
        } else if (field.isRequired) {
          // Required field with no value - this should not happen if validation is correct
          console.warn(`Required field ${field.name} has no value but was confirmed`)
        }
      }
    })

    onConfirm(confirmedFields)
  }

  const allFieldsHandled = fields.every((field) => {
    const state = fieldStates[field.name]
    // For expiry date that wasn't detected, MUST be edited (cannot skip or confirm null)
    if (field.name === 'expiryDate' && !field.value) {
      return state && state.action === 'edit' && state.editedValue && state.editedValue.trim() !== ''
    }
    return state && (state.action === 'confirm' || state.action === 'edit' || state.action === 'skip')
  })

  const hasRequiredFields = fields.some((field) => field.isRequired)
  const requiredFieldsHandled = fields
    .filter((field) => field.isRequired)
    .every((field) => {
      const state = fieldStates[field.name]
      // For expiry date that wasn't detected, MUST be edited with a valid value
      if (field.name === 'expiryDate' && !field.value) {
        return state && state.action === 'edit' && state.editedValue && state.editedValue.trim() !== ''
      }
      // For other required fields, must be confirmed or edited with a value
      if (state?.action === 'edit') {
        return state.editedValue && state.editedValue.trim() !== ''
      }
      return state && (state.action === 'confirm' && field.value !== null && field.value !== '')
    })

  const canConfirm = allFieldsHandled && (!hasRequiredFields || requiredFieldsHandled)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Confirm Extracted Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and confirm the extracted data. You can edit or skip any field.
          </p>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium">
                  We couldn't confidently detect expiry. Please enter manually.
                </p>
              </div>
              <p className="text-gray-500">No fields were extracted from the document.</p>
            </div>
          ) : (
            fields.map((field) => {
              const state = fieldStates[field.name] || { action: null, editedValue: field.value }
              const confidenceLevel = getConfidenceLevel(field.confidence)
              const isEditing = state.action === 'edit'
              const isConfirmed = state.action === 'confirm'
              const isSkipped = state.action === 'skip'

              return (
                <div
                  key={field.name}
                  className={`border rounded-lg p-4 ${
                    field.isHighlighted
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Field Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.isHighlighted && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                          Important
                        </span>
                      )}
                    </div>
                    {field.confidence > 0 && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${confidenceLevel.bgColor} ${confidenceLevel.color}`}
                      >
                        {confidenceLevel.label} ({field.confidence}%)
                      </span>
                    )}
                  </div>

                  {/* Field Value / Edit Input */}
                  {isEditing ? (
                    <input
                      type={field.name === 'expiryDate' ? 'date' : 'text'}
                      value={state.editedValue || ''}
                      onChange={(e) => handleEditValue(field.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div className={`text-sm font-medium ${
                      field.name === 'expiryDate' && !field.value
                        ? 'text-red-600 italic'
                        : 'text-gray-900'
                    }`}>
                      {field.value || (field.name === 'expiryDate' ? 'Not detected - Please enter manually' : 'Not detected')}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {!isEditing && !isConfirmed && !isSkipped && (
                      <>
                        {/* Always show Confirm button - enabled if field has value (required or optional) */}
                        <button
                          type="button"
                          onClick={() => field.value && handleFieldAction(field.name, 'confirm')}
                          disabled={!field.value}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            field.value
                              ? 'text-white bg-green-600 hover:bg-green-700 cursor-pointer'
                              : 'text-gray-400 bg-gray-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          ✓ Confirm
                        </button>
                        {/* Always show Edit button - always clickable */}
                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.name, 'edit')}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        {/* Don't show Skip for required fields, especially expiry date when not detected */}
                        {!field.isRequired && field.value && (
                          <button
                            type="button"
                            onClick={() => handleFieldAction(field.name, 'skip')}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-md transition-colors"
                          >
                            Skip
                          </button>
                        )}
                      </>
                    )}

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleFieldAction(field.name, 'confirm')}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        ✓ Save Edit
                      </button>
                    )}

                    {isConfirmed && (
                      <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                        ✓ Confirmed
                      </span>
                    )}

                    {isSkipped && (
                      <span className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                        Skipped
                      </span>
                    )}

                    {(isEditing || isConfirmed || isSkipped) && (
                      <button
                        type="button"
                        onClick={() =>
                          setFieldStates((prev) => ({
                            ...prev,
                            [field.name]: { action: null, editedValue: field.value },
                          }))
                        }
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-md transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}

          {/* Detected Keywords */}
          {data.detectedKeywords && data.detectedKeywords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Detected Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {data.detectedKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Confirmed Fields
          </button>
        </div>
      </div>
    </div>
  )
}

