import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if supabase client was created successfully
    if (supabase && typeof supabase.auth === 'object' && typeof supabase.auth.signOut === 'function') {
      await supabase.auth.signOut()
    }
  } catch (error) {
    // Even if signout fails, redirect to home
    console.error('[SignOut] Error:', error)
  }
  
  return redirect('/')
}

