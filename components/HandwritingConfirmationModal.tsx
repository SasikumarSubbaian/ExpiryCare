'use client'

import { useState } from 'react'

type HandwritingConfirmationModalProps = {
  isOpen: boolean
  detectedText: string
  detectedExpiryDate: string | null
  reasoningConfidence: number
  reasoning?: string
  onConfirm: (expiryDate: string) => void
  onEdit: () => void
  onReject: () => void
}

/**
 * Handwriting Confirmation Modal
 * Shows detected handwritten text and expiry date for user confirmation
 */
export default function HandwritingConfirmationModal({
  isOpen,
  detectedText,
  detectedExpiryDate,
  reasoningConfidence,
  reasoning,
  onConfirm,
  onEdit,
  onReject,
}: HandwritingConfirmationModalProps) {
  const [manualDate, setManualDate] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (detectedExpiryDate) {
      onConfirm(detectedExpiryDate)
    }
  }

  const handleManualSubmit = () => {
    if (manualDate && /^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
      onConfirm(manualDate)
    }
  }

  const handleReject = () => {
    setShowManualInput(true)
  }

  // Highlight expiry date in text if found
  const highlightExpiryInText = () => {
    if (!detectedExpiryDate || !detectedText) {
      return detectedText
    }

    // Try to find the date pattern in the text
    const datePatterns = [
      // DD/MM/YY
      /\d{2}\/\d{2}\/\d{2}/g,
      // DD/MM/YYYY
      /\d{2}\/\d{2}\/\d{4}/g,
      // MM/YY
      /\d{2}\/\d{2}/g,
      // Month names
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}/gi,
    ]

    let highlightedText = detectedText
    for (const pattern of datePatterns) {
      highlightedText = highlightedText.replace(pattern, (match) => {
        return `<mark class="bg-yellow-200 font-semibold">${match}</mark>`
      })
    }

    return highlightedText
  }

  const confidenceColor =
    reasoningConfidence >= 70
      ? 'text-green-600'
      : reasoningConfidence >= 50
      ? 'text-yellow-600'
      : 'text-orange-600'

  const confidenceLabel =
    reasoningConfidence >= 70
      ? 'High'
      : reasoningConfidence >= 50
      ? 'Medium'
      : 'Low'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">Confirm Expiry Date</h3>
          <p className="text-sm text-gray-600 mt-1">
            Please verify the detected expiry date from your handwritten document
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Detected Text Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detected Text
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px]">
              <div
                className="text-sm text-gray-800 whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightExpiryInText() }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Highlighted text shows detected dates
            </p>
          </div>

          {/* Detected Expiry Date Section */}
          {detectedExpiryDate ? (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Detected Expiry Date
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-700">
                      {new Date(detectedExpiryDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-sm text-blue-600">
                      ({detectedExpiryDate})
                    </span>
                  </div>
                  {reasoning && (
                    <p className="text-xs text-blue-700 mt-2 italic">
                      "{reasoning}"
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${confidenceColor}`}>
                    {confidenceLabel} Confidence
                  </div>
                  <div className={`text-lg font-bold ${confidenceColor}`}>
                    {reasoningConfidence}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600 text-xl">⚠</span>
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    No expiry date detected
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {reasoning || 'Could not find a valid expiry date in the text'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Input (if rejected) */}
          {showManualInput && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-orange-900 mb-2">
                Enter Expiry Date Manually
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full px-3 py-2 text-base text-gray-900 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-orange-700 mt-2">
                Please enter the expiry date in YYYY-MM-DD format
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {!showManualInput ? (
              <>
                {detectedExpiryDate ? (
                  <>
                    <button
                      type="button"
                      onClick={onReject}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Not Correct
                    </button>
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Date
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium"
                    >
                      ✓ Yes, This is Correct
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onReject}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Enter Manually
                    </button>
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualInput(false)
                    setManualDate('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!manualDate || !/^\d{4}-\d{2}-\d{2}$/.test(manualDate)}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Use This Date
                </button>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Tip:</strong> If the detected date is incorrect, you can edit it or enter
              the correct date manually. The system uses context to detect dates, so verification
              helps ensure accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

