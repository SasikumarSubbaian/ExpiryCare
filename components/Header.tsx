import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
                <Link
                  href="/dashboard"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-0"
                >
                  Dashboard
                </Link>
                <SignOutButton />
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
