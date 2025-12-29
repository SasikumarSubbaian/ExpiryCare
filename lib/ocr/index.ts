// OCR Service - Main exports
// Only export modules that are required for Google Vision OCR

// Export types first
export * from './types'

// Export core OCR services
export * from './image-preprocessing'
export * from './tesseract-service'
export * from './mlkit-service'

// Export regex extractor (used by API routes)
export { regexExtract, type ExtractedData } from './regexExtractor'

// Export handwriting services
export * from './handwriting-detection'
export * from './handwriting-preprocessing'
export * from './handwriting-ocr'

// Export expiry detection (used by API routes)
export { detectExpiryDate, type ExpiryDetectionResult } from './expiryDetection'

// pdf-converter is optional (requires canvas/pdfjs-dist) - not exported to avoid build errors
// Import directly from './pdf-converter' if needed (with dynamic import)
// handwriting-detection is also available via dynamic import for optional usage

