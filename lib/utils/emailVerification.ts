/**
 * Email Verification Utility
 * Helper functions to check email verification status
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Check if user's email is verified
 * Returns true if verified, false otherwise
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.email_verified === true
  } catch (error) {
    console.error('[EmailVerification] Error checking verification status:', error)
    return false
  }
}

/**
 * Get user's email verification status
 * Returns the full profile with verification status
 */
export async function getEmailVerificationStatus(userId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('email_verified, email')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      emailVerified: data.email_verified === true,
      email: data.email,
    }
  } catch (error) {
    console.error('[EmailVerification] Error getting verification status:', error)
    return null
  }
}
