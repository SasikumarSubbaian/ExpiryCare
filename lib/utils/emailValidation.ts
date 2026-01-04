/**
 * Email Validation Utility
 * Production-ready email validation for ExpiryCare
 * 
 * Validates email format strictly and prevents common invalid patterns
 */

/**
 * Strict email regex pattern
 * Rejects:
 * - abc@
 * - abc@gmail
 * - abc@.com
 * - abc@gmail..com
 * - Spaces
 * - Multiple @ symbols
 * - Invalid TLDs
 */
const EMAIL_REGEX = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

/**
 * Disposable email domains (common ones - can be extended)
 * These are temporary email services that should be blocked
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'yopmail.com',
  'getnada.com',
  'mohmal.com',
  'fakeinbox.com',
]

export interface EmailValidationResult {
  valid: boolean
  error?: string
  normalized?: string
}

/**
 * Frontend email validation
 * Validates email format and shows real-time errors
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email is required',
    }
  }

  // Trim whitespace
  const trimmed = email.trim()

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Email is required',
    }
  }

  // Check for spaces
  if (trimmed.includes(' ')) {
    return {
      valid: false,
      error: 'Email cannot contain spaces',
    }
  }

  // Check for multiple @ symbols
  const atCount = (trimmed.match(/@/g) || []).length
  if (atCount !== 1) {
    return {
      valid: false,
      error: atCount === 0 ? 'Email must contain @ symbol' : 'Email can only contain one @ symbol',
    }
  }

  // Check for invalid patterns
  if (trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return {
      valid: false,
      error: 'Email format is invalid',
    }
  }

  // Check for consecutive dots
  if (trimmed.includes('..')) {
    return {
      valid: false,
      error: 'Email cannot contain consecutive dots',
    }
  }

  // Check for dot before or after @
  const [localPart, domain] = trimmed.split('@')
  if (!localPart || !domain) {
    return {
      valid: false,
      error: 'Email format is invalid',
    }
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      valid: false,
      error: 'Email format is invalid',
    }
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return {
      valid: false,
      error: 'Email format is invalid',
    }
  }

  // Check for valid TLD (at least 2 characters)
  const domainParts = domain.split('.')
  if (domainParts.length < 2) {
    return {
      valid: false,
      error: 'Email must have a valid domain (e.g., example.com)',
    }
  }

  const tld = domainParts[domainParts.length - 1]
  if (tld.length < 2) {
    return {
      valid: false,
      error: 'Email domain must have a valid extension',
    }
  }

  // Regex validation
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    }
  }

  // Normalize email (lowercase)
  const normalized = trimmed.toLowerCase()

  // Check for disposable emails (optional - can be disabled for testing)
  if (process.env.NODE_ENV === 'production') {
    const domainLower = domain.toLowerCase()
    if (DISPOSABLE_EMAIL_DOMAINS.some(disposable => domainLower.includes(disposable))) {
      return {
        valid: false,
        error: 'Disposable email addresses are not allowed',
      }
    }
  }

  return {
    valid: true,
    normalized,
  }
}

/**
 * Backend email validation (server-side)
 * Never trust frontend alone - always validate on backend
 */
export function validateEmailBackend(email: string): EmailValidationResult {
  // Same validation as frontend
  const frontendResult = validateEmail(email)

  if (!frontendResult.valid) {
    return frontendResult
  }

  // Additional backend checks
  const normalized = frontendResult.normalized!

  // Check email length (RFC 5321 limit)
  if (normalized.length > 254) {
    return {
      valid: false,
      error: 'Email address is too long',
    }
  }

  // Check local part length (RFC 5321 limit)
  const [localPart] = normalized.split('@')
  if (localPart.length > 64) {
    return {
      valid: false,
      error: 'Email address is invalid',
    }
  }

  return {
    valid: true,
    normalized,
  }
}

/**
 * Normalize email for storage
 * Converts to lowercase and trims whitespace
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }
  return email.trim().toLowerCase()
}
