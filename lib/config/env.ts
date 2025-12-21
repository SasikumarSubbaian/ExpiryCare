/**
 * Environment Configuration Utility
 * 
 * Centralized configuration for environment-specific settings.
 * Use this to access environment variables and feature flags.
 */

/**
 * Get the current environment
 */
export function getEnvironment(): 'development' | 'production' | 'test' {
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Get Supabase configuration
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return {
    url,
    anonKey,
    serviceRoleKey, // May be undefined in client-side code
  }
}

/**
 * Get Resend email configuration
 */
export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ExpiryCare <onboarding@resend.dev>'

  if (!apiKey) {
    throw new Error('Missing Resend API key. Please set RESEND_API_KEY')
  }

  return {
    apiKey,
    fromEmail,
  }
}

/**
 * Feature flags
 */
export const featureFlags = {
  /**
   * Enable beta features (only in development by default)
   */
  enableBetaFeatures: (): boolean => {
    if (isDevelopment()) {
      return process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true'
    }
    return process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true'
  },

  /**
   * Enable debug mode (only in development by default)
   */
  enableDebugMode: (): boolean => {
    if (isDevelopment()) {
      return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE !== 'false'
    }
    return process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true'
  },
}

/**
 * Logging configuration
 */
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  const level = process.env.NEXT_PUBLIC_LOG_LEVEL || (isDevelopment() ? 'debug' : 'error')
  return level as 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Environment-specific settings
 */
export const envConfig = {
  environment: getEnvironment(),
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  supabase: getSupabaseConfig(),
  resend: getResendConfig(),
  features: featureFlags,
  logLevel: getLogLevel(),
}

/**
 * Validate all required environment variables are set
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required Supabase variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Service role key is required for reminder API
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required for reminder functionality')
  }

  // Resend is required for email reminders
  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required for email reminders')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate on module load (only in development)
if (isDevelopment()) {
  const validation = validateEnvironment()
  if (!validation.valid) {
    console.warn('⚠️  Environment validation warnings:')
    validation.errors.forEach((error) => console.warn(`  - ${error}`))
  }
}

