// OCR Service - Main exports
export * from './types'
export * from './image-preprocessing'
// pdf-converter is optional (requires canvas/pdfjs-dist) - export conditionally
// export * from './pdf-converter' // Commented out - optional dependency
export * from './tesseract-service'
export * from './mlkit-service'
export * from './handwriting-detection'
export * from './handwriting-preprocessing'
export * from './handwriting-ocr'

// Re-export pdf-converter only if needed (avoids build-time resolution)
export { convertPdfToImage } from './pdf-converter'

