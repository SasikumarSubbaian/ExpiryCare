'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Global Application Error:', error)
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    if (error.digest) {
      console.error('Error Digest:', error.digest)
    }
  }, [error])

  return (
    <html lang="en-IN">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-red-500 mb-2">500</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Critical Error</h1>
              <p className="text-gray-600 mb-4">
                A critical error occurred. Please refresh the page or contact support.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-left">
                  <p className="text-sm font-mono text-red-800 break-all">
                    <strong>Error:</strong> {error.message}
                  </p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-700 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={reset}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

