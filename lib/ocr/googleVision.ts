import { ImageAnnotatorClient } from '@google-cloud/vision'

/**
 * Google Vision OCR Service
 * Uses DOCUMENT_TEXT_DETECTION for better accuracy on documents
 * 
 * PRODUCTION-SAFE: Uses environment variables only, no file system access
 */
export class GoogleVisionService {
  private client: ImageAnnotatorClient | null = null

  constructor() {
    // Initialize client if credentials are available
    // CRITICAL: Google Vision SDK does NOT support API key auth
    // MUST use Service Account credentials with explicit projectId
    // CRITICAL: Never use fs.readFile or local JSON files in production
    try {
      // Option 1: Base64 encoded credentials (for Vercel production) - PRIMARY METHOD
      if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
        try {
          // Decode base64 credentials
          const credentialsJson = Buffer.from(
            process.env.GOOGLE_CLOUD_VISION_CREDENTIALS,
            'base64'
          ).toString('utf-8')
          const credentials = JSON.parse(credentialsJson)
          
          // CRITICAL: Must include projectId for Service Account auth
          if (!credentials.project_id) {
            console.error('[GoogleVision] Service account credentials missing project_id')
            this.client = null
            return
          }
          
          // Initialize with explicit credentials and projectId
          this.client = new ImageAnnotatorClient({
            credentials,
            projectId: credentials.project_id,
          })
          console.log('[GoogleVision] Initialized with base64 Service Account credentials')
        } catch (decodeError) {
          console.error('[GoogleVision] Failed to decode base64 credentials:', decodeError)
          this.client = null
        }
      }
      // Option 2: Plain JSON string credentials (fallback)
      else if (process.env.GOOGLE_VISION_CREDENTIALS) {
        try {
          const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS)
          
          // CRITICAL: Must include projectId for Service Account auth
          if (!credentials.project_id) {
            console.error('[GoogleVision] Service account credentials missing project_id')
            this.client = null
            return
          }
          
          this.client = new ImageAnnotatorClient({
            credentials,
            projectId: credentials.project_id,
          })
          console.log('[GoogleVision] Initialized with JSON Service Account credentials')
        } catch (parseError) {
          console.error('[GoogleVision] Failed to parse JSON credentials:', parseError)
          this.client = null
        }
      }
      // Option 3: Local development only (file path - NOT for production)
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
        // Only use file path in local development
        this.client = new ImageAnnotatorClient()
        console.log('[GoogleVision] Initialized with file path (local dev only)')
      }
      else {
        console.warn('[GoogleVision] No Service Account credentials found. Set GOOGLE_CLOUD_VISION_CREDENTIALS (base64 encoded JSON)')
        this.client = null
      }
    } catch (error) {
      console.error('[GoogleVision] Failed to initialize client:', error)
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

