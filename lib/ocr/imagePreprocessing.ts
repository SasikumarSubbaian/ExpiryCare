import sharp from 'sharp'

/**
 * Preprocesses images for better OCR accuracy
 * - Auto-rotates based on EXIF
 * - Resizes to max 2000px (maintains aspect ratio)
 * - Converts to grayscale
 * - Enhances contrast and sharpening
 */
export async function preprocessImage(
  inputBuffer: Buffer,
  maxDimension: number = 2000
): Promise<Buffer> {
  try {
    let image = sharp(inputBuffer)

    // Get image metadata
    const metadata = await image.metadata()
    const { width, height } = metadata

    if (!width || !height) {
      throw new Error('Unable to read image dimensions')
    }

    // Calculate resize dimensions (maintain aspect ratio)
    let newWidth = width
    let newHeight = height

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        newWidth = maxDimension
        newHeight = Math.round((height / width) * maxDimension)
      } else {
        newHeight = maxDimension
        newWidth = Math.round((width / height) * maxDimension)
      }
    }

    // Process image: auto-rotate, resize, grayscale, enhance contrast
    const processedBuffer = await image
      .rotate() // Auto-rotate based on EXIF
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .greyscale() // Convert to grayscale for better OCR
      .normalise() // Normalize contrast
      .sharpen() // Sharpen edges
      .toBuffer()

    return processedBuffer
  } catch (error: any) {
    console.error('Image preprocessing error:', error)
    throw new Error(`Failed to preprocess image: ${error.message}`)
  }
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' }
  }

  // Check file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload PNG, JPG, or PDF' }
  }

  return { valid: true }
}

