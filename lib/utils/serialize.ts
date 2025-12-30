/**
 * Utility functions to ensure data is serializable for Next.js Server Components
 * Prevents runtime errors from Date, BigInt, undefined, null, etc.
 */

/**
 * Converts a value to a serializable format
 * - Date -> ISO string
 * - BigInt -> string
 * - undefined -> null
 * - Functions -> removed
 */
export function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return String(value)
  }

  if (typeof value === 'function') {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue).filter(v => v !== undefined)
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      const serialized = serializeValue(val)
      if (serialized !== undefined) {
        result[key] = serialized
      }
    }
    return result
  }

  return value
}

/**
 * Ensures an array is serializable and returns a plain array
 */
export function serializeArray<T>(arr: T[] | null | undefined): T[] {
  if (!arr || !Array.isArray(arr)) {
    return []
  }
  return arr.map(item => serializeValue(item) as T).filter(item => item !== null && item !== undefined) as T[]
}

/**
 * Ensures an object is serializable
 */
export function serializeObject<T extends Record<string, unknown>>(obj: T | null | undefined): T {
  if (!obj || typeof obj !== 'object') {
    return {} as T
  }
  return serializeValue(obj) as T
}

