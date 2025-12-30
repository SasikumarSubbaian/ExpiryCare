/**
 * Server Environment Validation
 * Validates required environment variables at build time
 * NEVER throws during request handling - only at build/startup
 */

export interface EnvValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

/**
 * Validates required server environment variables
 * Throws ONLY at build time, never during request handling
 */
export function validateServerEnv(): EnvValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  // Required for Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Optional but recommended for OCR
  if (!process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
    errors.push('GOOGLE_CLOUD_VISION_CREDENTIALS not set - OCR will be unavailable')
  } else {
    // Validate base64 format
    try {
      const decoded = Buffer.from(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
        errors.push('GOOGLE_CLOUD_VISION_CREDENTIALS is invalid - missing required fields')
      }
    } catch (err) {
      errors.push('GOOGLE_CLOUD_VISION_CREDENTIALS is not valid base64 JSON')
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    errors,
  }
}

/**
 * Validates environment at build time (throws if critical vars missing)
 * Call this in next.config.js or at app startup
 */
export function assertServerEnv(): void {
  const result = validateServerEnv()
  
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables: ${result.missing.join(', ')}\n` +
      `Errors: ${result.errors.join(', ')}`
    )
  }
  
  if (result.errors.length > 0) {
    console.warn('Environment validation warnings:', result.errors)
  }
}

