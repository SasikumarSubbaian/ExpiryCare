import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // Check if supabase client was created successfully
    if (!supabase || typeof supabase.auth !== 'object') {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // Update profile with name from Google OAuth if available
      const user = data.user
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name ||
                      user.user_metadata?.display_name ||
                      null
      
      if (fullName && supabase.from && typeof supabase.from === 'function') {
        // Update or create profile with name
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: fullName,
            }, {
              onConflict: 'id'
            })
        } catch (profileError) {
          // Profile update failed, but auth succeeded - continue
          console.error('[Auth Callback] Profile update error:', profileError)
        }
      }
      
      // Redirect to dashboard after successful OAuth
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
}

