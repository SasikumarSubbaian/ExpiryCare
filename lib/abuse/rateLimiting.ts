// Rate Limiting
// In-memory rate limiting (for MVP - use Redis in production)

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check rate limit
 * @param key - Unique identifier (user ID or IP address)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and reset time
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, newEntry)
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback (won't work in serverless, but good for development)
  return 'unknown'
}

/**
 * Rate limit middleware for OCR API (5 requests/min/user)
 */
export function checkOcrRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(`ocr:${userId}`, 5, 60 * 1000) // 5 requests per minute
}

/**
 * Rate limit middleware for Upload API (10 requests/min/IP)
 */
export function checkUploadRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimit(`upload:${ip}`, 10, 60 * 1000) // 10 requests per minute
}

