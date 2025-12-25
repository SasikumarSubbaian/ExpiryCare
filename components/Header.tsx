'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SignOutButton from './SignOutButton'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])
  
  const isDashboard = pathname === '/dashboard'
  const isHomePage = pathname === '/'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
            ExpiryCare
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                {/* Hide Dashboard link when already on dashboard page */}
                {!isDashboard && (
                  <Link
                    href="/dashboard"
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-0"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Hide Sign out in header when on home page (hero section has it) */}
                {!isHomePage && <SignOutButton />}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-0"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
