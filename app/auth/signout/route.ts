import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.error('Error during sign out:', error)
    // Continue with redirect even if sign out fails
  }
  return redirect('/')
}

