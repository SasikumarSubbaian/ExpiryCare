// Handwriting Detection Service
// Uses heuristics to detect handwritten vs printed text before OCR

import sharp from 'sharp'

export type ImageType = 'handwritten' | 'printed'

export interface HandwritingDetectionResult {
  imageType: ImageType
  confidence: number // 0-100
  features: {
    characterSpacingVariance: number
    baselineVariance: number
    textSlant: number
    strokeWidthVariance: number
  }
}

/**
 * Detect if image contains handwritten text using heuristics
 * 
 * Heuristics:
 * 1. Irregular character spacing (handwriting has variable spacing)
 * 2. Slanted text (handwriting often has slant)
 * 3. Inconsistent baseline (handwriting doesn't follow straight line)
 * 4. Variable stroke width (handwriting has more variation)
 */
export async function detectHandwriting(
  imageBuffer: Buffer
): Promise<HandwritingDetectionResult> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (width === 0 || height === 0) {
      return {
        imageType: 'printed',
        confidence: 50,
        features: {
          characterSpacingVariance: 0,
          baselineVariance: 0,
          textSlant: 0,
          strokeWidthVariance: 0,
        },
      }
    }

    // Convert to grayscale for analysis
    const grayscaleBuffer = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .raw()
      .toBuffer()

    // Analyze image for handwriting characteristics
    const features = await analyzeImageFeatures(
      grayscaleBuffer,
      width,
      height
    )

    // Calculate handwriting score (0-100)
    // Higher score = more likely handwritten
    const handwritingScore = calculateHandwritingScore(features)

    // Threshold: > 60 = handwritten, <= 60 = printed
    const threshold = 60
    const imageType: ImageType = handwritingScore > threshold ? 'handwritten' : 'printed'
    const confidence = Math.abs(handwritingScore - 50) * 2 // Convert to 0-100

    return {
      imageType,
      confidence: Math.min(100, Math.max(0, confidence)),
      features,
    }
  } catch (error: any) {
    console.error('[Handwriting Detection] Error:', error)
    // Default to printed on error
    return {
      imageType: 'printed',
      confidence: 50,
      features: {
        characterSpacingVariance: 0,
        baselineVariance: 0,
        textSlant: 0,
        strokeWidthVariance: 0,
      },
    }
  }
}

/**
 * Analyze image features for handwriting detection
 */
async function analyzeImageFeatures(
  imageData: Buffer,
  width: number,
  height: number
): Promise<HandwritingDetectionResult['features']> {
  // Sample analysis points (for performance, analyze subset of image)
  const sampleRate = Math.max(1, Math.floor(Math.min(width, height) / 200))
  const samples: number[] = []

  // Extract pixel values along horizontal lines (baseline analysis)
  const baselinePoints: number[] = []
  const textLines: number[][] = []

  // Sample horizontal lines for baseline detection
  for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += sampleRate * 5) {
    const linePixels: number[] = []
    let lineStart = -1
    let lineEnd = -1

    for (let x = 0; x < width; x += sampleRate) {
      const idx = y * width + x
      if (idx < imageData.length) {
        const pixel = imageData[idx]
        linePixels.push(pixel)

        // Detect text regions (dark pixels)
        if (pixel < 128) {
          if (lineStart === -1) lineStart = x
          lineEnd = x
        }
      }
    }

    if (lineStart !== -1 && lineEnd !== -1) {
      // Calculate baseline (center of text line)
      const baseline = (lineStart + lineEnd) / 2
      baselinePoints.push(baseline)
      textLines.push(linePixels)
    }
  }

  // 1. Calculate baseline variance (handwriting has inconsistent baseline)
  const baselineVariance = calculateVariance(baselinePoints)

  // 2. Calculate character spacing variance
  const characterSpacingVariance = calculateCharacterSpacingVariance(textLines)

  // 3. Calculate text slant (handwriting often slants)
  const textSlant = calculateTextSlant(imageData, width, height, sampleRate)

  // 4. Calculate stroke width variance (handwriting has more variation)
  const strokeWidthVariance = calculateStrokeWidthVariance(imageData, width, height, sampleRate)

  return {
    characterSpacingVariance,
    baselineVariance,
    textSlant,
    strokeWidthVariance,
  }
}

/**
 * Calculate variance of a number array
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length

  return Math.sqrt(variance) // Return standard deviation
}

/**
 * Calculate character spacing variance
 * Handwriting has irregular spacing between characters
 */
function calculateCharacterSpacingVariance(textLines: number[][]): number {
  if (textLines.length === 0) return 0

  const spacingValues: number[] = []

  for (const line of textLines) {
    let lastTextPixel = -1

    for (let i = 0; i < line.length; i++) {
      if (line[i] < 128) {
        // Dark pixel (text)
        if (lastTextPixel !== -1) {
          const spacing = i - lastTextPixel
          if (spacing > 1) {
            // Gap between characters
            spacingValues.push(spacing)
          }
        }
        lastTextPixel = i
      }
    }
  }

  return calculateVariance(spacingValues)
}

/**
 * Calculate text slant angle
 * Handwriting often has slant (italic-like)
 */
function calculateTextSlant(
  imageData: Buffer,
  width: number,
  height: number,
  sampleRate: number
): number {
  // Sample vertical edges to detect slant
  const edgeAngles: number[] = []

  for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x += sampleRate * 10) {
    let firstEdge = -1
    let lastEdge = -1

    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += sampleRate) {
      const idx = y * width + x
      if (idx < imageData.length && imageData[idx] < 128) {
        if (firstEdge === -1) firstEdge = y
        lastEdge = y
      }
    }

    if (firstEdge !== -1 && lastEdge !== -1) {
      // Check adjacent columns for slant
      const nextX = Math.min(x + sampleRate * 5, width - 1)
      let nextFirstEdge = -1

      for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += sampleRate) {
        const idx = y * width + nextX
        if (idx < imageData.length && imageData[idx] < 128) {
          if (nextFirstEdge === -1) nextFirstEdge = y
        }
      }

      if (nextFirstEdge !== -1) {
        const angle = Math.atan2(nextFirstEdge - firstEdge, nextX - x) * (180 / Math.PI)
        edgeAngles.push(angle)
      }
    }
  }

  // Calculate average slant (handwriting typically has 5-15 degree slant)
  if (edgeAngles.length === 0) return 0

  const avgSlant = edgeAngles.reduce((a, b) => a + b, 0) / edgeAngles.length
  return Math.abs(avgSlant) // Return absolute value
}

/**
 * Calculate stroke width variance
 * Handwriting has more variable stroke width
 */
function calculateStrokeWidthVariance(
  imageData: Buffer,
  width: number,
  height: number,
  sampleRate: number
): number {
  const strokeWidths: number[] = []

  // Sample vertical strokes
  for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x += sampleRate * 5) {
    let currentStroke = 0
    let maxStroke = 0

    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += sampleRate) {
      const idx = y * width + x
      if (idx < imageData.length) {
        if (imageData[idx] < 128) {
          // Dark pixel (part of stroke)
          currentStroke++
        } else {
          // Light pixel (end of stroke)
          if (currentStroke > 0) {
            maxStroke = Math.max(maxStroke, currentStroke)
            currentStroke = 0
          }
        }
      }
    }

    if (maxStroke > 0) {
      strokeWidths.push(maxStroke)
    }
  }

  return calculateVariance(strokeWidths)
}

/**
 * Calculate handwriting score from features
 * Returns 0-100, where > 60 indicates handwritten
 */
function calculateHandwritingScore(
  features: HandwritingDetectionResult['features']
): number {
  let score = 50 // Start neutral

  // Baseline variance (higher = more handwritten)
  // Normalize: variance > 5 pixels = handwritten indicator
  if (features.baselineVariance > 5) {
    score += Math.min(20, features.baselineVariance * 2)
  }

  // Character spacing variance (higher = more handwritten)
  // Normalize: variance > 3 = handwritten indicator
  if (features.characterSpacingVariance > 3) {
    score += Math.min(20, features.characterSpacingVariance * 3)
  }

  // Text slant (5-15 degrees = handwritten indicator)
  if (features.textSlant > 5 && features.textSlant < 20) {
    score += Math.min(15, features.textSlant)
  }

  // Stroke width variance (higher = more handwritten)
  if (features.strokeWidthVariance > 2) {
    score += Math.min(15, features.strokeWidthVariance * 2)
  }

  return Math.min(100, Math.max(0, score))
}

