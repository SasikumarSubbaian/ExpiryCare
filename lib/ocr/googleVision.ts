import { ImageAnnotatorClient } from '@google-cloud/vision'

/**
 * Google Vision OCR Service
 * Uses DOCUMENT_TEXT_DETECTION for better accuracy on documents
 */
export class GoogleVisionService {
  private client: ImageAnnotatorClient | null = null

  constructor() {
    // Initialize client if credentials are available
    try {
      if (process.env.GOOGLE_VISION_API_KEY) {
        // Use API key (simpler, works with Vercel)
        this.client = new ImageAnnotatorClient({
          apiKey: process.env.GOOGLE_VISION_API_KEY,
        })
      } else if (process.env.GOOGLE_VISION_CREDENTIALS) {
        // Use service account JSON from environment variable (for Vercel)
        const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS)
        this.client = new ImageAnnotatorClient({
          credentials,
        })
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use service account file path (for local development)
        this.client = new ImageAnnotatorClient()
      }
    } catch (error) {
      console.error('Failed to initialize Google Vision client:', error)
      this.client = null
    }
  }

  /**
   * Extracts text from image using Google Vision OCR
   */
  async extractText(imageBuffer: Buffer): Promise<string> {
    if (!this.client) {
      throw new Error(
        'Google Vision client not initialized. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_VISION_API_KEY environment variable.'
      )
    }

    try {
      // Note: Image preprocessing is now done in the API route before calling this
      // Perform OCR with document text detection
      const [result] = await this.client.documentTextDetection({
        image: { content: imageBuffer },
        imageContext: {
          languageHints: ['en'], // English language hint
        },
      })

      // Extract full text annotation
      const fullTextAnnotation = result.fullTextAnnotation

      if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return ''
      }

      // Normalize text: uppercase, fix common OCR errors
      let normalizedText = fullTextAnnotation.text
        .toUpperCase()
        .replace(/O(?=\d)/g, '0') // O before digit → 0
        .replace(/(?<=\d)O/g, '0') // O after digit → 0
        .replace(/l(?=\d)/g, '1') // lowercase l before digit → 1
        .replace(/(?<=\d)l/g, '1') // lowercase l after digit → 1
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()

      return normalizedText
    } catch (error: any) {
      console.error('Google Vision OCR error:', error)
      throw new Error(`OCR extraction failed: ${error.message}`)
    }
  }

  /**
   * Checks if Google Vision is available
   */
  isAvailable(): boolean {
    return this.client !== null
  }
}

// Singleton instance
let visionServiceInstance: GoogleVisionService | null = null

export function getGoogleVisionService(): GoogleVisionService {
  if (!visionServiceInstance) {
    visionServiceInstance = new GoogleVisionService()
  }
  return visionServiceInstance
}

