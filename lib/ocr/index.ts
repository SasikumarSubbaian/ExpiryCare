// OCR Service - Main exports
// Only export modules that are required for Google Vision OCR
// Using explicit named exports for better webpack resolution in Vercel

// Export types first - explicit exports for better resolution
export * from './types'
export type { OCRResponse, OCRRequest, OCRError, SupportedFileType, SupportedImageType, ImagePreprocessingOptions } from './types'

// Export core OCR services
export * from './image-preprocessing'
export * from './tesseract-service'

// Export ML Kit service (Google Cloud Vision) - EXPLICIT exports for webpack resolution
export { extractTextWithMLKit, isMLKitConfigured } from './mlkit-service'

// Export regex extractor (used by API routes) - EXPLICIT export
export { regexExtract } from './regexExtractor'
export type { ExtractedData } from './regexExtractor'

// Export handwriting services - EXPLICIT exports
export { detectHandwriting } from './handwriting-detection'
export type { ImageType, HandwritingDetectionResult } from './handwriting-detection'
export * from './handwriting-preprocessing'
export * from './handwriting-ocr'

// Export expiry detection (used by API routes) - EXPLICIT export
export { detectExpiryDate } from './expiryDetection'
export type { ExpiryDetectionResult } from './expiryDetection'

// pdf-converter is optional (requires canvas/pdfjs-dist) - not exported to avoid build errors
// Import directly from '@/lib/ocr/pdf-converter' if needed (with dynamic import)
// Note: Dynamic imports should use explicit paths: '@/lib/ocr/pdf-converter'

