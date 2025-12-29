// Duplicate Detection
// Uses SHA-256 hashing to detect and reuse OCR results for identical files

import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export interface OcrCacheEntry {
  file_hash: string
  ocr_text: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  created_at: string
}

/**
 * Generate SHA-256 hash for file buffer
 */
export function generateFileHash(fileBuffer: Buffer): string {
  return createHash('sha256').update(fileBuffer).digest('hex')
}

/**
 * Check if OCR result exists for this file hash
 */
export async function getCachedOcrResult(
  fileHash: string
): Promise<OcrCacheEntry | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('ocr_cache')
      .select('file_hash, ocr_text, confidence, created_at')
      .eq('file_hash', fileHash)
      .single()

    // If table doesn't exist, return null (graceful degradation)
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return null
      }
      return null
    }

    if (!data) {
      return null
    }

    return data as OcrCacheEntry
  } catch (error: any) {
    // Graceful degradation - if cache fails, continue without it
    return null
  }
}

/**
 * Store OCR result in cache
 */
export async function cacheOcrResult(
  fileHash: string,
  ocrText: string,
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
): Promise<void> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('ocr_cache').insert({
      file_hash: fileHash,
      ocr_text: ocrText,
      confidence,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Ignore duplicate key errors (race condition) and table not found
      if (
        !error.message.includes('duplicate') &&
        !error.message.includes('unique') &&
        !error.message.includes('relation') &&
        !error.message.includes('does not exist')
      ) {
        // Only log non-expected errors
        console.error('[Duplicate Detection] Error caching result:', error.message)
      }
    }
  } catch (error: any) {
    // Don't throw - caching is non-critical, graceful degradation
    if (!error?.message?.includes('relation') && !error?.message?.includes('does not exist')) {
      console.error('[Duplicate Detection] Error caching result:', error?.message)
    }
  }
}

