import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Guard against missing env variables - return null instead of throwing
  // This allows pages to render even if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase Client] Missing environment variables:',
      {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      }
    )
    // Return a mock client that will fail gracefully
    return null as any
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error(
      `[Supabase Client] Invalid URL format: "${supabaseUrl}"`
    )
    return null as any
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('[Supabase Client] Error creating client:', error)
    return null as any
  }
}

