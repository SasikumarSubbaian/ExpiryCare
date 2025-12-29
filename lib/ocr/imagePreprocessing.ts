// Image Preprocessing for OCR Accuracy
// Uses sharp to enhance images before OCR processing

let sharp: any = null

try {
  sharp = require('sharp')
} catch {
  // sharp not available - graceful degradation
}

export interface PreprocessingOptions {
  maxDimension?: number
  autoRotate?: boolean
  grayscale?: boolean
  contrast?: number
  sharpen?: boolean
}

const DEFAULT_OPTIONS: Required<PreprocessingOptions> = {
  maxDimension: 2000,
  autoRotate: true,
  grayscale: true,
  contrast: 1.2,
  sharpen: true,
}

/**
 * Preprocess image for better OCR accuracy
 * - Auto rotate based on EXIF
 * - Resize to max 2000px (maintains aspect ratio)
 * - Convert to grayscale
 * - Enhance contrast
 * - Apply sharpening
 */
export async function preprocessImageForOCR(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  // If sharp is not available, return original buffer
  if (!sharp) {
    console.warn('[Image Preprocessing] sharp not available, skipping preprocessing')
    return imageBuffer
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    let pipeline = sharp(imageBuffer)

    // 1. Auto rotate based on EXIF orientation
    if (opts.autoRotate) {
      pipeline = pipeline.rotate() // Auto-rotates based on EXIF
    }

    // 2. Resize to max dimension (maintains aspect ratio)
    if (opts.maxDimension) {
      pipeline = pipeline.resize(opts.maxDimension, opts.maxDimension, {
        fit: 'inside', // Maintains aspect ratio, fits within dimensions
        withoutEnlargement: true, // Don't upscale small images
      })
    }

    // 3. Convert to grayscale (better for OCR)
    if (opts.grayscale) {
      pipeline = pipeline.greyscale()
    }

    // 4. Enhance contrast
    if (opts.contrast && opts.contrast !== 1) {
      pipeline = pipeline.modulate({
        brightness: 1,
        saturation: 0, // Already grayscale
        hue: 0,
      })
      // Apply contrast using linear adjustment
      pipeline = pipeline.linear(opts.contrast, -(128 * opts.contrast) + 128)
    }

    // 5. Apply sharpening (enhances text edges)
    if (opts.sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2,
      })
    }

    // Convert to buffer
    const processedBuffer = await pipeline.toBuffer()

    console.log('[Image Preprocessing] Image processed successfully', {
      originalSize: imageBuffer.length,
      processedSize: processedBuffer.length,
      options: opts,
    })

    return processedBuffer
  } catch (error: any) {
    console.error('[Image Preprocessing] Error processing image:', error.message)
    // Return original buffer on error (graceful degradation)
    return imageBuffer
  }
}

/**
 * Get image metadata (dimensions, format)
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width?: number
  height?: number
  format?: string
  size: number
}> {
  if (!sharp) {
    return { size: imageBuffer.length }
  }

  try {
    const metadata = await sharp(imageBuffer).metadata()
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
    }
  } catch (error: any) {
    console.error('[Image Preprocessing] Error getting metadata:', error.message)
    return { size: imageBuffer.length }
  }
}

