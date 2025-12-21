import LoadingSpinner from './LoadingSpinner'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    </div>
  )
}

