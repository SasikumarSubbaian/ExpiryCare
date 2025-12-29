// TypeScript types for AI parsing service

export interface ExpiryDataInput {
  rawText: string
  category?: 'medicine' | 'food' | 'warranty' | 'insurance' | 'subscription' | null
}

export interface ExpiryDataOutput {
  productName: string | null
  expiryDate: string | null // ISO format YYYY-MM-DD
  manufacturingDate: string | null // ISO format YYYY-MM-DD
  batchNumber: string | null
  confidenceScore: number // 0-100
  detectedLabels: string[] // e.g. ["EXP", "BEST BEFORE", "USE BEFORE"]
}

export interface ParseError {
  error: string
  code: 'API_ERROR' | 'JSON_PARSE_ERROR' | 'INVALID_RESPONSE' | 'RATE_LIMIT' | 'AUTH_ERROR'
  details?: string
}

// Expiry date keywords to detect
export const EXPIRY_KEYWORDS = [
  'EXP',
  'EXPIRY',
  'EXPIRES',
  'EXPIRY DATE',
  'USE BEFORE',
  'USE BY',
  'BEST BEFORE',
  'BEST BY',
  'VALID UPTO',
  'VALID UNTIL',
  'VALID TILL',
  'CONSUME BEFORE',
  'CONSUME BY',
  'SELL BY',
  'PACKED ON',
  'MFG',
  'MANUFACTURING',
  'MANUFACTURED',
  'BATCH',
  'BATCH NO',
  'BATCH NUMBER',
  'LOT',
  'LOT NO',
  'LOT NUMBER',
]

