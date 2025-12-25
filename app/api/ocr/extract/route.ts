import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OCR API endpoint to extract text from uploaded documents
// Uses Tesseract.js for free OCR processing
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPG, or PDF' },
        { status: 400 }
      )
    }

    // Convert file to base64 for Tesseract
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Use Tesseract.js for OCR
    // Dynamic import to avoid bundling issues
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng') // English language

    try {
      const { data: { text } } = await worker.recognize(dataUrl)
      await worker.terminate()

      // Extract structured data from OCR text
      const extractedData = extractItemDetails(text)

      return NextResponse.json({
        success: true,
        rawText: text,
        extractedData,
      })
    } catch (ocrError: any) {
      console.error('OCR Error:', ocrError)
      return NextResponse.json(
        { 
          error: 'Failed to process document',
          details: ocrError.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in OCR extraction:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

  // Extract expiry date (various formats)
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g, // DD-MM-YYYY, DD/MM/YYYY
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g, // YYYY-MM-DD, YYYY/MM/DD
    /(expir[yi]?\s*(?:date|on)?\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}))/gi,
    /(valid\s*(?:until|till|upto)?\s*:?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}))/gi,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      extracted.expiryDate = match[0].replace(/[^\d\/-]/g, '').trim()
      break
    }
  }

  // Extract title/product name (usually first line or after keywords)
  const titlePatterns = [
    /(?:product|item|name|title|warranty|insurance)\s*:?\s*([A-Za-z0-9\s]+)/i,
    /^([A-Z][A-Za-z0-9\s]{3,30})/m,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      extracted.title = match[1].trim()
      break
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

