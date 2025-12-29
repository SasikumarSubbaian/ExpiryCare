'use client'

type LowConfidenceWarningModalProps = {
  isOpen: boolean
  confidence: number
  detectedText?: string
  onRetakePhoto: () => void
  onEnterManually: () => void
  onDismiss?: () => void
}

/**
 * Low Confidence Warning Modal
 * Shows when handwritten OCR confidence is below 50%
 * Provides guidance to improve results or allow manual entry
 */
export default function LowConfidenceWarningModal({
  isOpen,
  confidence,
  detectedText,
  onRetakePhoto,
  onEnterManually,
  onDismiss,
}: LowConfidenceWarningModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-orange-600">⚠</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Low Confidence Detected</h3>
              <p className="text-sm text-gray-600">
                OCR confidence: <span className="font-semibold text-orange-600">{confidence.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900">
              The system couldn't read your handwriting clearly. For better results, please try one of the options below.
            </p>
          </div>

          {/* Detected Text (if any) */}
          {detectedText && detectedText.trim().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What We Detected (may be inaccurate):
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">
                  {detectedText}
                </p>
              </div>
            </div>
          )}

          {/* Improvement Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Tips for Better Results:
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">📸</span>
                <span>
                  <strong>Retake photo:</strong> Ensure the document is flat and fully visible
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">💡</span>
                <span>
                  <strong>Improve lighting:</strong> Use natural light or bright, even lighting
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✍️</span>
                <span>
                  <strong>Write clearly:</strong> Use clear, legible handwriting with good contrast
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">📏</span>
                <span>
                  <strong>Focus on text:</strong> Make sure the expiry date area is in focus
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onRetakePhoto}
              className="w-full px-4 py-3 border border-primary-300 rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium transition-colors"
            >
              📸 Retake Photo
            </button>
            <button
              type="button"
              onClick={onEnterManually}
              className="w-full px-4 py-3 border border-transparent rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium transition-colors"
            >
              ✏️ Enter Details Manually
            </button>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                Use Detected Text Anyway (Not Recommended)
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Low confidence results may contain errors. We recommend retaking the photo
              or entering details manually for accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

