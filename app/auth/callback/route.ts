import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    if (!supabase) {
      console.error('Failed to create Supabase client')
      return NextResponse.redirect(new URL('/login?error=config_error', request.url))
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const user = data.user
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name ||
                      user.user_metadata?.display_name ||
                      null
      
      // Check if this is OAuth (Google) - OAuth emails are pre-verified
      const isOAuth = user.app_metadata?.provider === 'google'
      
      // Update or create profile
      // For email confirmation: email_confirmed_at is set by Supabase automatically
      // For OAuth: emails are already verified
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName || user.user_metadata?.full_name || '',
          email_verified: isOAuth || !!user.email_confirmed_at, // Verified if OAuth or email confirmed
        }, {
          onConflict: 'id'
        })
      
      // Redirect to dashboard after successful auth
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL('/login?error=oauth_error', request.url))
}

