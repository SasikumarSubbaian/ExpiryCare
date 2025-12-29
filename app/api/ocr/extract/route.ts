import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OCR API endpoint to extract text from uploaded documents
// Uses Tesseract.js for free OCR processing
// Optimized for performance with faster settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPG, WEBP, or PDF' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    let imageDataUrl: string

    // Handle PDF files - convert first page to image
    if (file.type === 'application/pdf') {
      console.log('[OCR] Processing PDF file...')
      try {
        // Import canvas first to check availability
        let createCanvas: any
        try {
          const canvasModule = await import('canvas')
          createCanvas = canvasModule.createCanvas
          console.log('[OCR] Canvas module loaded successfully')
        } catch (canvasError: any) {
          console.error('[OCR] Canvas import failed:', canvasError)
          return NextResponse.json(
            { 
              success: false,
              error: 'PDF processing is not available in this environment. Please upload an image (PNG, JPG) of your document instead.',
              suggestion: 'Take a screenshot or photo of your PDF document and upload that.',
              details: canvasError.message
            },
            { status: 400 }
          )
        }

        // Convert PDF first page to image using pdfjs-dist
        console.log('[OCR] Loading PDF.js library...')
        const pdfjsLib = await import('pdfjs-dist')
        
        // For Node.js, configure worker (optional but recommended)
        try {
          if (typeof window === 'undefined') {
            // Try to disable worker for Node.js (simpler, works in most cases)
            // Or use a CDN worker URL
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
            console.log('[OCR] PDF.js worker configured for Node.js')
          }
        } catch (workerError: any) {
          console.warn('[OCR] Worker setup warning (may work without worker):', workerError.message)
        }
        
        console.log('[OCR] Loading PDF document...')
        const arrayBuffer = await file.arrayBuffer()
        
        // Load PDF - use simple options that work in Node.js
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0, // Reduce logging
        })
        
        const pdf = await loadingTask.promise
        console.log(`[OCR] PDF loaded successfully, ${pdf.numPages} page(s) found`)
        
        const page = await pdf.getPage(1) // Get first page
        console.log('[OCR] Rendering PDF page to image...')
        
        // Render PDF page to image with reasonable scale (1.5x for speed/quality balance)
        const viewport = page.getViewport({ scale: 1.5 })
        
        // Create canvas with the viewport dimensions
        const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
        const context = canvas.getContext('2d')
        
        // Fill white background (PDFs often have transparent backgrounds)
        context.fillStyle = '#FFFFFF'
        context.fillRect(0, 0, canvas.width, canvas.height)
        
        // Render the PDF page - convert canvas context to PDF.js format
        const renderContext = {
          canvasContext: context as any,
          viewport: viewport
        }
        
        await page.render(renderContext).promise
        console.log('[OCR] PDF page rendered successfully to canvas')
        
        // Convert canvas to base64 image (PNG format)
        const imageBuffer = canvas.toBuffer('image/png')
        const base64 = imageBuffer.toString('base64')
        imageDataUrl = `data:image/png;base64,${base64}`
        console.log(`[OCR] PDF converted to image, size: ${imageBuffer.length} bytes`)
      } catch (pdfError: any) {
        console.error('[OCR] PDF processing error:', pdfError)
        console.error('[OCR] Error stack:', pdfError.stack)
        console.error('[OCR] Error details:', {
          message: pdfError.message,
          name: pdfError.name,
          code: pdfError.code
        })
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to process PDF file. Please try uploading an image (PNG, JPG) of your document instead.',
            details: pdfError.message || 'Unknown PDF processing error',
            suggestion: 'Take a screenshot or photo of your PDF document and upload that.'
          },
          { status: 400 }
        )
      }
    } else {
      // Convert image file to base64 for Tesseract
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Aggressively optimize image for faster OCR (resize to max 1500px)
      // Large images slow down OCR significantly - smaller = much faster
      try {
        const sharp = await import('sharp').catch(() => null)
        
        if (sharp) {
          // Get image metadata first to check size
          const metadata = await sharp.default(buffer).metadata()
          console.log(`[OCR] Original image size: ${metadata.width}x${metadata.height}`)
          
          // Resize to max 1500px (aggressive optimization for speed)
          // This is the sweet spot: fast OCR while maintaining good accuracy
          const optimizedBuffer = await sharp.default(buffer)
            .resize(1500, 1500, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .png({ quality: 90, compressionLevel: 6 }) // Optimized PNG
            .toBuffer()
          
          const optimizedMetadata = await sharp.default(optimizedBuffer).metadata()
          console.log(`[OCR] Optimized image size: ${optimizedMetadata.width}x${optimizedMetadata.height}`)
          
          const base64 = optimizedBuffer.toString('base64')
          imageDataUrl = `data:image/png;base64,${base64}`
        } else {
          // Fallback: use image as-is
          console.warn('[OCR] Sharp not available, using original image (may be slower)')
          const base64 = buffer.toString('base64')
          imageDataUrl = `data:${file.type};base64,${base64}`
        }
      } catch (optimizeError) {
        // If optimization fails, use original image
        console.warn('[OCR] Image optimization failed, using original:', optimizeError)
        const base64 = buffer.toString('base64')
        imageDataUrl = `data:${file.type};base64,${base64}`
      }
    }

    // Use Tesseract.js for OCR with optimized settings for speed
    console.log('[OCR] Starting OCR processing...')
    const startTime = Date.now()
    
    // Dynamic import to avoid bundling issues
    const { createWorker } = await import('tesseract.js')
    
    let worker: any = null
    
    try {
      console.log('[OCR] Initializing Tesseract worker...')
      
      // Create worker - Tesseract.js v5+ API
      worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          // Log progress for debugging
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            console.log(`[OCR] Progress: ${progress}%`)
          } else if (m.status) {
            console.log(`[OCR] Status: ${m.status}`)
          }
        }
      })

      // Set OCR parameters for maximum speed
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text (fastest)
        tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only (faster)
      })

      console.log('[OCR] Recognizing text from image...')
      
      // Add timeout to prevent hanging (30 seconds max)
      const OCR_TIMEOUT = 30000
      const recognizePromise = worker.recognize(imageDataUrl)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR processing timeout - image may be too large or complex')), OCR_TIMEOUT)
      )
      
      // Recognize text from image with timeout
      const { data: { text } } = await Promise.race([recognizePromise, timeoutPromise]) as any
      
      const processingTime = Date.now() - startTime
      console.log(`[OCR] Completed in ${processingTime}ms`)
      console.log(`[OCR] Extracted text length: ${text.length} characters`)
      if (text.length > 0) {
        console.log(`[OCR] First 200 chars: ${text.substring(0, 200)}`)
      } else {
        console.warn('[OCR] WARNING: No text extracted!')
      }
      
      await worker.terminate()

      // Check if we got any text
      if (!text || text.trim().length === 0) {
        console.warn('[OCR] No text extracted from image')
        return NextResponse.json({
          success: false,
          error: 'No text could be extracted from the image. Please ensure the image is clear and contains readable text.',
          rawText: '',
          extractedData: {},
        })
      }

      // Extract structured data from OCR text
      console.log('[OCR] Extracting structured data from text...')
      const extractedData = extractItemDetails(text)
      console.log('[OCR] Extracted data:', extractedData)

      return NextResponse.json({
        success: true,
        rawText: text.substring(0, 1000), // Limit raw text in response
        extractedData,
      })
    } catch (ocrError: any) {
      console.error('[OCR] Error during OCR processing:', ocrError)
      console.error('[OCR] Error stack:', ocrError.stack)
      
      // Try to clean up worker if it exists
      if (worker) {
        try {
          await worker.terminate().catch(() => {})
        } catch (cleanupError) {
          console.warn('[OCR] Error during cleanup:', cleanupError)
        }
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to process document with OCR',
          details: ocrError.message || 'Unknown OCR error',
          suggestion: 'Please try uploading a clearer image or fill the form manually.'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in OCR extraction:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Extract structured data from OCR text
function extractItemDetails(text: string) {
  const extracted: {
    title?: string
    expiryDate?: string
    category?: string
    notes?: string
  } = {}

  // Extract expiry date (various formats) - improved patterns
  const datePatterns = [
    // Patterns with keywords first (most specific)
    /(?:expir[yi]?\s*(?:date|on)?\s*:?\s*)(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:valid\s*(?:until|till|upto|till)?\s*:?\s*)(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:expires?\s*:?\s*)(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:valid\s*(?:from|from date)?\s*:?\s*)(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:till|until)\s*:?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    // Date patterns without keywords (less specific but catches more)
    /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g, // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    /(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g, // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    // Indian date format patterns
    /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/g, // DD-MM-YYYY (4-digit year)
  ]

  let foundDate: string | null = null

  for (const pattern of datePatterns) {
    const regex = new RegExp(pattern)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const dateStr = match[1] || match[0]
      if (dateStr) {
        // Clean the date string
        const cleanedDate = dateStr.replace(/[^\d\/\-\.]/g, '').trim()
        
        // Validate and normalize the date
        const normalizedDate = normalizeDate(cleanedDate)
        if (normalizedDate && isValidDate(normalizedDate)) {
          foundDate = normalizedDate
          break
        }
      }
    }
    if (foundDate) break
  }

  if (foundDate) {
    extracted.expiryDate = foundDate
  }

  // Extract title/product name (improved patterns)
  const titlePatterns = [
    // Patterns with keywords
    /(?:product|item|name|title|warranty|insurance|model|brand)\s*:?\s*([A-Za-z0-9\s\-]{3,50})/i,
    /(?:warranty\s*(?:for|of)?|insurance\s*(?:for|of)?)\s*:?\s*([A-Za-z0-9\s\-]{3,50})/i,
    // First capitalized line (common in documents)
    /^([A-Z][A-Za-z0-9\s\-]{3,50})/m,
    // Lines that look like product names (all caps or title case)
    /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,5})/m,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Filter out common false positives
      if (candidate.length >= 3 && 
          !candidate.toLowerCase().includes('expir') &&
          !candidate.toLowerCase().includes('valid') &&
          !candidate.toLowerCase().includes('date')) {
        extracted.title = candidate
        break
      }
    }
  }

  // Detect category from keywords
  const categoryKeywords = {
    warranty: ['warranty', 'guarantee', 'warrant'],
    insurance: ['insurance', 'policy', 'coverage'],
    medicine: ['medicine', 'medication', 'drug', 'prescription'],
    subscription: ['subscription', 'renewal', 'membership'],
  }

  const lowerText = text.toLowerCase()
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      extracted.category = category
      break
    }
  }

  // Extract notes (remaining text)
  if (text.length > 50) {
    extracted.notes = text.substring(0, 500).trim() // Limit to 500 chars
  }

  return extracted
}

// Normalize date string to YYYY-MM-DD format
function normalizeDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim().length === 0) return null

  // Remove any non-digit characters except separators
  const cleaned = dateStr.replace(/[^\d\/\-\.]/g, '').trim()
  if (cleaned.length === 0) return null

  // Split by common separators
  const parts = cleaned.split(/[-\/\.]/).filter(p => p.length > 0)
  
  if (parts.length !== 3) return null

  let day: number, month: number, year: number

  // Determine format: DD-MM-YYYY or YYYY-MM-DD
  if (parts[0].length === 4) {
    // YYYY-MM-DD format
    year = parseInt(parts[0], 10)
    month = parseInt(parts[1], 10)
    day = parseInt(parts[2], 10)
  } else {
    // DD-MM-YYYY format
    day = parseInt(parts[0], 10)
    month = parseInt(parts[1], 10)
    year = parseInt(parts[2], 10)
    
    // Handle 2-digit years
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year
    }
  }

  // Validate ranges
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1900 || year > 2100) return null

  // Format as YYYY-MM-DD
  const monthStr = month.toString().padStart(2, '0')
  const dayStr = day.toString().padStart(2, '0')
  
  return `${year}-${monthStr}-${dayStr}`
}

// Validate if date string is a valid date
function isValidDate(dateStr: string): boolean {
  if (!dateStr || dateStr.length !== 10) return false
  
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return false
  
  // Check if the date string matches the parsed date (prevents invalid dates like 2024-02-30)
  const [year, month, day] = dateStr.split('-').map(Number)
  return date.getFullYear() === year && 
         date.getMonth() + 1 === month && 
         date.getDate() === day
}

