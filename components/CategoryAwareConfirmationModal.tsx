'use client'

import { useState } from 'react'
import { CategoryKey, getCategorySchema, FIELD_LABELS } from '@/lib/categorySchemas'
import type { SchemaExtractedData } from '@/lib/extractBySchema'

export interface CategoryAwareExtractionData extends SchemaExtractedData {
  categoryConfidence?: number
}

type FieldAction = 'confirm' | 'edit' | 'skip'

interface FieldState {
  action: FieldAction | null
  editedValue: string | null
}

type CategoryAwareConfirmationModalProps = {
  isOpen: boolean
  data: CategoryAwareExtractionData
  onConfirm: (confirmedFields: Record<string, string | null>) => void
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

export default function CategoryAwareConfirmationModal({
  isOpen,
  data,
  onConfirm,
  onCancel,
}: CategoryAwareConfirmationModalProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({})

  if (!isOpen) return null

  // Get category schema
  const schema = getCategorySchema(data.category)
  const allFields = [...schema.requiredFields, ...schema.optionalFields]

  // Build field list dynamically based on category schema
  const fields = allFields
    .map((fieldName) => {
      const value = data[fieldName as keyof SchemaExtractedData] as string | null
      const isRequired = schema.requiredFields.includes(fieldName)
      const label = FIELD_LABELS[fieldName] || fieldName

      return {
        name: fieldName,
        label,
        value,
        confidence: fieldName === 'expiryDate' ? data.confidence : 0,
        isRequired,
        isHighlighted: fieldName === 'expiryDate', // Highlight expiry date
      }
    })
    .filter((field) => {
      // Always show required fields (even if empty)
      if (field.isRequired) {
        return true
      }
      // For "other" category, always show documentType (even if null) so user can enter it
      if (data.category === 'other' && field.name === 'documentType') {
        return true
      }
      // Only show optional fields if they have values
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
    const confirmedFields: Record<string, string | null> = {}

    fields.forEach((field) => {
      const state = fieldStates[field.name]
      if (!state) return

      // Skip fields that were skipped
      if (state.action === 'skip') {
        return
      }

      // Use edited value if field was edited, otherwise use original value
      if (state.action === 'edit' && state.editedValue !== null && state.editedValue.trim() !== '') {
        confirmedFields[field.name] = state.editedValue.trim()
      } else if (state.action === 'confirm' || state.action === null) {
        // If no action taken, treat as confirmed (for required fields)
        if (field.value !== null && field.value !== '') {
          confirmedFields[field.name] = field.value
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Confirm Extracted Information</h2>
              <p className="text-sm text-gray-600 mt-1">
                Category: <span className="font-medium">{schema.displayName}</span>
                {data.categoryConfidence && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Confidence: {data.categoryConfidence}%)
                  </span>
                )}
              </p>
            </div>
            <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {schema.description}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
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
                        title={field.confidence >= 70 ? 'High confidence - Safe to auto-fill' : 'Please review carefully'}
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
                    <div
                      className={`text-sm font-medium ${
                        field.name === 'expiryDate' && !field.value
                          ? 'text-red-600 italic'
                          : 'text-gray-900'
                      }`}
                    >
                      {field.value ||
                        (field.name === 'expiryDate'
                          ? 'Not detected - Please enter manually'
                          : 'Not detected')}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {!isEditing && !isConfirmed && !isSkipped && (
                      <>
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
                        <button
                          type="button"
                          onClick={() => handleFieldAction(field.name, 'edit')}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
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

