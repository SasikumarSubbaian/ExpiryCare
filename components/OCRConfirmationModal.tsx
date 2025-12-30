'use client'

import { useState } from 'react'
import type { Category } from '@/lib/ocr/categorySchemas'

type FieldWithConfidence = {
  value: string | null
  confidence: 'High' | 'Medium' | 'Low'
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
  insurerName?: FieldWithConfidence
  serviceType?: FieldWithConfidence
  providerName?: FieldWithConfidence
  serviceName?: FieldWithConfidence
  planType?: FieldWithConfidence
  medicineName?: FieldWithConfidence
  brandName?: FieldWithConfidence
  documentType?: FieldWithConfidence
  warnings?: string[]
}

type OCRConfirmationModalProps = {
  isOpen: boolean
  extractedData: ExtractedData | null
  onConfirm: (data: ExtractedData) => void
  onCancel: () => void
  onEdit: (field: string, value: string) => void
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

  if (!isOpen || !extractedData) return null

  const handleEdit = (field: string, currentValue: string | null) => {
    setEditingField(field)
    setEditValue(currentValue || '')
  }

  const handleSaveEdit = () => {
    if (editingField) {
      onEdit(editingField, editValue)
      setEditingField(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  const getConfidenceColor = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High':
        return 'text-green-600 bg-green-50'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'Low':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const renderField = (
    label: string,
    fieldName: string,
    fieldData: FieldWithConfidence | string | null | undefined,
    confidence?: 'High' | 'Medium' | 'Low'
  ) => {
    // Handle both old format (string) and new format (FieldWithConfidence)
    let value: string | null = null
    let fieldConfidence: 'High' | 'Medium' | 'Low' = confidence || 'Medium'
    
    if (typeof fieldData === 'string') {
      value = fieldData
    } else if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
      value = fieldData.value
      fieldConfidence = fieldData.confidence || confidence || 'Medium'
    } else if (fieldData === null || fieldData === undefined) {
      return null
    }
    
    if (value === null || value === undefined || value.trim() === '') return null

    const isEditing = editingField === fieldName

    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          <span
            className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(
              fieldConfidence
            )}`}
          >
            {fieldConfidence} Confidence
          </span>
        </label>
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
            <button
              onClick={handleSaveEdit}
              className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
            <span className="text-gray-900">{value}</span>
            <button
              onClick={() => handleEdit(fieldName, value)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Confirm Extracted Data</h2>
          <p className="text-sm text-gray-600 mt-1">
            Please review and confirm the extracted information. You can edit any field before
            confirming.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Warnings */}
          {extractedData.warnings && extractedData.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Warnings</p>
              <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                {extractedData.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(
                  extractedData.categoryConfidence
                )}`}
              >
                {extractedData.categoryConfidence} Confidence
                {extractedData.categoryConfidencePercentage !== undefined && (
                  <span className="ml-1">({extractedData.categoryConfidencePercentage}%)</span>
                )}
              </span>
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 capitalize">
              {extractedData.category}
            </div>
          </div>

          {/* Expiry Date (Always shown) */}
          {renderField(
            'Expiry Date',
            'expiryDate',
            extractedData.expiryDate.value,
            extractedData.expiryDate.confidence
          )}

          {/* Category-specific fields - ONLY show allowed fields per schema */}
          {extractedData.category === 'warranty' && (
            <>
              {renderField('Product Name', 'productName', extractedData.productName)}
              {renderField('Company Name', 'companyName', extractedData.companyName)}
            </>
          )}

          {extractedData.category === 'insurance' && (
            <>
              {renderField('Policy Type', 'policyType', extractedData.policyType)}
              {renderField('Insurer Name', 'insurerName', extractedData.insurerName)}
            </>
          )}

          {extractedData.category === 'amc' && (
            <>
              {renderField('Service Type', 'serviceType', extractedData.serviceType)}
              {renderField('Provider Name', 'providerName', extractedData.providerName)}
            </>
          )}

          {extractedData.category === 'subscription' && (
            <>
              {/* CRITICAL: Subscription only shows serviceName per requirements */}
              {renderField('Service Name', 'serviceName', extractedData.serviceName)}
            </>
          )}

          {extractedData.category === 'medicine' && (
            <>
              {renderField('Medicine Name', 'medicineName', extractedData.medicineName)}
              {renderField('Brand Name', 'brandName', extractedData.brandName)}
            </>
          )}

          {extractedData.category === 'other' && (
            <>
              {/* CRITICAL: Other category shows ONLY expiry date - no other fields */}
              <p className="text-sm text-gray-500 italic">
                Only expiry date is extracted for "Other" category documents to protect privacy.
              </p>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(extractedData)}
            className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Confirm & Use Data
          </button>
        </div>
      </div>
    </div>
  )
}

