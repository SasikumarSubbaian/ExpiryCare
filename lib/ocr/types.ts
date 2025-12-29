// TypeScript types for OCR service

export interface OCRRequest {
  file: File
}

export interface OCRResponse {
  rawText: string
  confidence: number
  imageType?: 'handwritten' | 'printed' // Detected before OCR
}

export interface OCRError {
  error: string
  code: 'UNSUPPORTED_FILE_TYPE' | 'OCR_FAILURE' | 'FILE_TOO_LARGE' | 'INVALID_FILE' | 'PROCESSING_ERROR'
  details?: string
}

export type SupportedImageType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp'
export type SupportedFileType = SupportedImageType | 'application/pdf'

export interface ImagePreprocessingOptions {
  maxWidth?: number
  maxHeight?: number
  grayscale?: boolean
  normalize?: boolean
  deskew?: boolean
}

