// Image preprocessing utilities using Sharp
import sharp from 'sharp'

export interface PreprocessingOptions {
  maxWidth?: number
  maxHeight?: number
  grayscale?: boolean
  normalize?: boolean
  deskew?: boolean
}

const DEFAULT_OPTIONS: Required<PreprocessingOptions> = {
  maxWidth: 1600, // Aggressive downscaling to prevent OCR timeout
  maxHeight: 1600,
  grayscale: true,
  normalize: true,
  deskew: false, // Deskewing requires more complex processing
}

/**
 * Preprocess image for better OCR accuracy
 * - Resize to reasonable size
 * - Convert to grayscale
 * - Normalize contrast
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  let pipeline = sharp(imageBuffer)

  // Resize if needed (maintains aspect ratio)
  if (opts.maxWidth || opts.maxHeight) {
    pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert to grayscale for better OCR accuracy
  if (opts.grayscale) {
    pipeline = pipeline.greyscale()
  }

  // Normalize contrast (enhance text visibility)
  if (opts.normalize) {
    pipeline = pipeline.normalize()
  }

  // Convert to PNG for consistent format
  const processedBuffer = await pipeline.png().toBuffer()

  return processedBuffer
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width: number
  height: number
  format: string
}> {
  const metadata = await sharp(imageBuffer).metadata()
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  }
}

