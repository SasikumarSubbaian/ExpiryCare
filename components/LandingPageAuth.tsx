'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

type LandingPageAuthProps = {
  children: (props: { user: User | null; userName: string }) => React.ReactNode
}

/**
 * Client-only component that handles user authentication
 * This prevents SSR crashes from Supabase auth calls
 */
export default function LandingPageAuth({ children }: LandingPageAuthProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>('User')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()
        
        if (!error && data?.user) {
          setUser(data.user)
          
          // Get user name
          let name = data.user.email?.split('@')[0] || 'User'
          
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', data.user.id)
              .single()
            
            if (profile?.full_name) {
              name = profile.full_name
            } else if (data.user.user_metadata?.full_name) {
              name = data.user.user_metadata.full_name
            } else if (data.user.user_metadata?.name) {
              name = data.user.user_metadata.name
            }
          } catch {
            // Profile fetch failed - use metadata
            if (data.user.user_metadata?.full_name) {
              name = data.user.user_metadata.full_name
            } else if (data.user.user_metadata?.name) {
              name = data.user.user_metadata.name
            }
          }
          
          setUserName(name)
        }
      } catch (error) {
        // Auth failed - continue as guest
        console.error('[LandingPageAuth] Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  // Show loading state or render children with user data
  if (loading) {
    // Return static content while loading (matches guest view)
    return <>{children({ user: null, userName: 'User' })}</>
  }

  return <>{children({ user, userName })}</>
}

