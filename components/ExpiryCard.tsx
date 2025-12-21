'use client'

import { format } from 'date-fns'
import { Expiry } from './Dashboard'

type Status = {
  status: 'expired' | 'today' | 'urgent' | 'soon' | 'upcoming'
  days: number
}

type ExpiryCardProps = {
  expiry: Expiry
  status: Status
  onEdit: () => void
  onDelete: () => void
}

const categoryColors = {
  warranty: 'bg-blue-100 text-blue-800',
  insurance: 'bg-green-100 text-green-800',
  medicine: 'bg-red-100 text-red-800',
  subscription: 'bg-purple-100 text-purple-800',
}

const statusColors = {
  expired: 'bg-red-50 border-red-200',
  today: 'bg-orange-50 border-orange-200',
  urgent: 'bg-yellow-50 border-yellow-200',
  soon: 'bg-blue-50 border-blue-200',
  upcoming: 'bg-gray-50 border-gray-200',
}

const statusLabels = {
  expired: 'Expired',
  today: 'Expires Today',
  urgent: 'Urgent',
  soon: 'Soon',
  upcoming: 'Upcoming',
}

export default function ExpiryCard({ expiry, status, onEdit, onDelete }: ExpiryCardProps) {
  const categoryLabel = expiry.category.charAt(0).toUpperCase() + expiry.category.slice(1)

  return (
    <div className={`bg-white rounded-lg border-2 p-4 ${statusColors[status.status]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{expiry.name}</h3>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${categoryColors[expiry.category]}`}>
            {categoryLabel}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-600 text-sm"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 text-sm"
            aria-label="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Expiry Date:</span>
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(expiry.expiry_date), 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`text-sm font-medium ${
            status.status === 'expired' ? 'text-red-600' :
            status.status === 'today' || status.status === 'urgent' ? 'text-orange-600' :
            'text-gray-900'
          }`}>
            {statusLabels[status.status]}
            {status.status !== 'expired' && status.status !== 'today' && ` (${status.days} days)`}
            {status.status === 'expired' && ` (${status.days} days ago)`}
          </span>
        </div>
        {expiry.notes && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">{expiry.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

