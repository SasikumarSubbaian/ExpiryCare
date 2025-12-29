// File Validation Utilities
// Validates file size, dimensions, and PDF pages to prevent abuse

// Note: sharp and pdf-lib are optional dependencies
// If not available, validation will be more lenient
let sharp: any = null
let PDFDocument: any = null

try {
  sharp = require('sharp')
} catch {
  // sharp not available
}

try {
  PDFDocument = require('pdf-lib').PDFDocument
} catch {
  // pdf-lib not available
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  width?: number
  height?: number
  pageCount?: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGE_DIMENSION = 4000 // 4000px
const MAX_PDF_PAGES = 5

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number): { valid: boolean; error?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds the maximum allowed size of 10MB. Please use a smaller file.',
    }
  }
  return { valid: true }
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  imageBuffer: Buffer
): Promise<FileValidationResult> {
  if (!sharp) {
    // If sharp is not available, skip dimension validation
    return { valid: true }
  }

  try {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      return {
        valid: false,
        error: `Image is too large. Maximum size is ${MAX_IMAGE_DIMENSION}px. Please use a smaller image.`,
        width,
        height,
      }
    }

    return {
      valid: true,
      width,
      height,
    }
  } catch (error: any) {
    return {
      valid: false,
      error: 'Could not read image. Please ensure the file is a valid image.',
    }
  }
}

/**
 * Validate PDF page count
 */
export async function validatePdfPages(pdfBuffer: Buffer): Promise<FileValidationResult> {
  if (!PDFDocument) {
    // If pdf-lib is not available, skip page count validation
    return { valid: true }
  }

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pageCount = pdfDoc.getPageCount()

    if (pageCount > MAX_PDF_PAGES) {
      return {
        valid: false,
        error: `PDF has too many pages. Maximum allowed is ${MAX_PDF_PAGES} pages. Please use a shorter document.`,
        pageCount,
      }
    }

    return {
      valid: true,
      pageCount,
    }
  } catch (error: any) {
    return {
      valid: false,
      error: 'Could not read PDF. Please ensure the file is a valid PDF document.',
    }
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  fileBuffer: Buffer
): Promise<FileValidationResult> {
  // 1. Validate file size
  const sizeCheck = validateFileSize(file.size)
  if (!sizeCheck.valid) {
    return sizeCheck
  }

  // 2. Validate based on file type
  if (file.type.startsWith('image/')) {
    return await validateImageDimensions(fileBuffer)
  } else if (file.type === 'application/pdf') {
    return await validatePdfPages(fileBuffer)
  }

  // For other file types, only size validation applies
  return { valid: true }
}

