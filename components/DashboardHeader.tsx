import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Image from 'next/image'
import SignOutButton from './SignOutButton'

type DashboardHeaderProps = {
  user: User
  userName?: string
}

export default function DashboardHeader({ user, userName }: DashboardHeaderProps) {
  // Get display name: prefer userName prop, then user metadata, then email
  const displayName = userName || 
    user.user_metadata?.full_name || 
    user.user_metadata?.name || 
    user.email?.split('@')[0] || 
    'User'

  return (
    <div className="mb-6 sm:mb-8">
      {/* Logo and Brand */}
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="ExpiryCare Logo" 
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain"
            />
          </div>
          <span className="text-lg font-semibold text-gray-900 tracking-tight">ExpiryCare</span>
        </Link>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back, {displayName}
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  )
}

