// OCR Service - Main exports
export * from './types'
export * from './image-preprocessing'
// pdf-converter is optional (requires canvas/pdfjs-dist) - not exported to avoid build errors
// Import directly from './pdf-converter' if needed
export * from './tesseract-service'
export * from './mlkit-service'
export * from './regexExtractor' // Export regexExtractor for use in API routes
export * from './handwriting-detection'
export * from './handwriting-preprocessing'
export * from './handwriting-ocr'

