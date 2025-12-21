import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please check your environment variables.'
    )
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    throw new Error(
      `Invalid Supabase URL format. Expected full URL like "https://xxx.supabase.co", got: "${supabaseUrl}". Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.`
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

