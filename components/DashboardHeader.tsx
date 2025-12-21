import { User } from '@supabase/supabase-js'
import SignOutButton from './SignOutButton'

type DashboardHeaderProps = {
  user: User
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  )
}

