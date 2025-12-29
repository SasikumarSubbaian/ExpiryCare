// OCR Service - Main exports
// Only export modules that are required for Google Vision OCR
export * from './types'
export * from './image-preprocessing'
export * from './tesseract-service'
export * from './mlkit-service'
export * from './regexExtractor'
export * from './handwriting-detection'
export * from './handwriting-preprocessing'
export * from './handwriting-ocr'

// pdf-converter is optional (requires canvas/pdfjs-dist) - not exported to avoid build errors
// Import directly from './pdf-converter' if needed (with dynamic import)

