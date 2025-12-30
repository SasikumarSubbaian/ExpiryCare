'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Auth context type
type AuthContextType = {
  user: User | null
  userName: string
  loading: boolean
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  userName: 'User',
  loading: true,
})

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
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
        console.error('[AuthProvider] Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userName, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  return useContext(AuthContext)
}

