/**
 * Password validation utility
 * Industry-standard password rules
 */

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password against industry standards
 * Requirements:
 * - Min 8 characters
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character (@$!%*?&)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get user-friendly password validation message
 */
export function getPasswordValidationMessage(password: string): string {
  const validation = validatePassword(password)
  
  if (validation.valid) {
    return 'Password meets all requirements'
  }

  return validation.errors.join('. ')
}

