// Handwriting-Optimized Image Preprocessing
// Aggressive preprocessing for better handwritten text recognition

import sharp from 'sharp'

/**
 * Aggressive preprocessing for handwritten text
 * 
 * Techniques:
 * 1. Increase contrast (enhance text visibility)
 * 2. Adaptive thresholding (better binarization)
 * 3. Noise removal (reduce artifacts)
 * 4. Stroke thickening (make thin strokes more visible)
 */
export async function preprocessForHandwriting(
  imageBuffer: Buffer
): Promise<Buffer> {
  try {
    console.log('[Handwriting Preprocessing] Starting aggressive preprocessing...')

    // CRITICAL: Downscale to max 1600px width FIRST (prevents OCR timeout)
    // This is the MOST IMPORTANT step for performance
    const MAX_WIDTH = 1600
    let processed = sharp(imageBuffer)
    
    // Step 0: Aggressively downscale (maintains aspect ratio)
    processed = processed.resize(MAX_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true, // Don't upscale small images
    })
    console.log(`[Handwriting Preprocessing] Image downscaled to max width: ${MAX_WIDTH}px`)

    // Step 1: Convert to grayscale
    processed = processed.greyscale()

    // Step 2: Increase contrast aggressively
    // Use gamma correction and contrast adjustment
    processed = processed
      .gamma(1.2) // Slight gamma boost
      .modulate({
        brightness: 1.1, // Slight brightness increase
        saturation: 0, // Already grayscale
      })

    // Step 3: Normalize (stretch histogram for better contrast)
    processed = processed.normalize()

    // Step 4: Apply sharpening to enhance text edges
    // Note: sharpen uses positional parameters: sigma, flat, jagged
    processed = processed.sharpen(1.5, 1, 2)

    // Step 5: Increase contrast further
    // Use linear contrast adjustment
    processed = processed.linear(1.2, -(128 * 0.2)) // Increase contrast by 20%

    // Step 6: Adaptive thresholding simulation
    // Sharp doesn't have adaptive threshold, so we use high contrast + threshold
    // Convert to high contrast first
    processed = processed
      .threshold(128, {
        grayscale: true,
      })
      .greyscale() // Ensure still grayscale

    // Step 7: Noise removal (morphological operations simulation)
    // Use blur + sharpen to reduce noise while maintaining edges
    processed = processed
      .blur(0.5) // Light blur for noise reduction
      .sharpen(1, 1, 2) // sigma, flat, jagged

    // Step 8: Stroke thickening (dilate operation simulation)
    // Use slight blur + threshold to thicken strokes
    processed = processed
      .blur(0.3) // Very light blur to thicken
      .threshold(120, {
        grayscale: true,
      })

    // Step 9: Final normalization and conversion to PNG
    const processedBuffer = await processed
      .normalize()
      .png({ quality: 100, compressionLevel: 0 }) // Maximum quality
      .toBuffer()

    console.log(
      `[Handwriting Preprocessing] Completed - Size: ${(processedBuffer.length / 1024).toFixed(2)}KB`
    )

    return processedBuffer
  } catch (error: any) {
    console.error('[Handwriting Preprocessing] Error:', error)
    // Fallback to standard preprocessing (with 1600px max width)
    const { preprocessImage } = await import('./image-preprocessing')
    return preprocessImage(imageBuffer, {
      maxWidth: 1600, // Aggressive downscaling for performance
      maxHeight: 1600,
      grayscale: true,
      normalize: true,
    })
  }
}

/**
 * Alternative preprocessing for handwritten text
 * Uses different approach for second OCR pass
 */
export async function preprocessForHandwritingAlternative(
  imageBuffer: Buffer
): Promise<Buffer> {
  try {
    console.log('[Handwriting Preprocessing] Alternative preprocessing...')

    // CRITICAL: Downscale to max 1600px width FIRST (prevents OCR timeout)
    const MAX_WIDTH = 1600
    let processed = sharp(imageBuffer)
    
    // Step 0: Aggressively downscale (maintains aspect ratio)
    processed = processed.resize(MAX_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    // Different approach: More aggressive contrast, less blur
    processed = processed.greyscale()

    // Very high contrast
    processed = processed
      .gamma(1.5) // Higher gamma
      .normalize()
      .linear(1.5, -(128 * 0.3)) // Even higher contrast

    // Less aggressive thresholding
    processed = processed.threshold(110, {
      grayscale: true,
    })

    // Minimal noise removal (preserve more detail)
    processed = processed.sharpen(2, 1, 3) // sigma, flat, jagged

    // Slight stroke thickening
    processed = processed.blur(0.2).threshold(115, {
      grayscale: true,
    })

    const processedBuffer = await processed
      .normalize()
      .png({ quality: 100, compressionLevel: 0 })
      .toBuffer()

    return processedBuffer
  } catch (error: any) {
    console.error('[Handwriting Preprocessing] Alternative error:', error)
    // Fallback (with 1600px max width)
    const { preprocessImage } = await import('./image-preprocessing')
    return preprocessImage(imageBuffer, {
      maxWidth: 1600, // Aggressive downscaling for performance
      maxHeight: 1600,
      grayscale: true,
      normalize: true,
    })
  }
}

