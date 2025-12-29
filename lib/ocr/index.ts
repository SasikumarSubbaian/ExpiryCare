/**
 * OCR Module Exports
 * Central export point for all OCR functionality
 */

// Core services
export { GoogleVisionService, getGoogleVisionService } from './googleVision'
export { preprocessImage, validateImageFile } from './imagePreprocessing'

// Category and extraction
export type { Category } from './categorySchemas'
export {
  categorySchemas,
  getAllowedFields,
  isFieldAllowed,
  isFieldForbidden,
} from './categorySchemas'
export { predictCategory, getPredictionConfidence } from './categoryPredictor'
export type { ExpiryDateResult, ConfidenceLevel } from './expiryExtractor'
export { extractExpiryDate } from './expiryExtractor'
export type { ExtractedData } from './extractors'
export { extractByCategory } from './extractors'

// Abuse protection and pricing
export {
  validateFile,
  generateFileHash,
  checkOCRLimit,
  logOCRCall,
  checkDuplicateFile,
  checkRateLimit,
  type FileValidationResult,
  type RateLimitResult,
} from './abuseProtection'
export {
  canUploadDocument,
  canAddLifeItem,
  canUseOCR,
  canSendWhatsAppReminder,
  type CanUploadDocumentResult,
  type CanAddLifeItemResult,
  type CanUseOCRResult,
  type CanSendWhatsAppResult,
} from './pricingLogic'

