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

const categoryConfig = {
  warranty: { 
    color: 'from-blue-500 to-blue-600', 
    bg: 'bg-blue-50', 
    text: 'text-blue-700',
    icon: '🛡️',
    label: 'Warranty'
  },
  insurance: { 
    color: 'from-green-500 to-green-600', 
    bg: 'bg-green-50', 
    text: 'text-green-700',
    icon: '📄',
    label: 'Insurance'
  },
  medicine: { 
    color: 'from-red-500 to-red-600', 
    bg: 'bg-red-50', 
    text: 'text-red-700',
    icon: '💊',
    label: 'Medicine'
  },
  subscription: { 
    color: 'from-purple-500 to-purple-600', 
    bg: 'bg-purple-50', 
    text: 'text-purple-700',
    icon: '📱',
    label: 'Subscription'
  },
  amc: { 
    color: 'from-teal-500 to-teal-600', 
    bg: 'bg-teal-50', 
    text: 'text-teal-700',
    icon: '🔧',
    label: 'AMC'
  },
  other: { 
    color: 'from-gray-500 to-gray-600', 
    bg: 'bg-gray-50', 
    text: 'text-gray-700',
    icon: '📋',
    label: 'Other'
  },
}

const statusConfig = {
  expired: { 
    bg: 'bg-danger-50', 
    border: 'border-danger-200', 
    badge: 'bg-danger-100 text-danger-700',
    label: 'Expired',
    icon: '⚠️'
  },
  today: { 
    bg: 'bg-warning-50', 
    border: 'border-warning-200', 
    badge: 'bg-warning-100 text-warning-700',
    label: 'Expires Today',
    icon: '🔔'
  },
  urgent: { 
    bg: 'bg-warning-50', 
    border: 'border-warning-200', 
    badge: 'bg-warning-100 text-warning-700',
    label: 'Urgent',
    icon: '⚡'
  },
  soon: { 
    bg: 'bg-primary-50', 
    border: 'border-primary-200', 
    badge: 'bg-primary-100 text-primary-700',
    label: 'Soon',
    icon: '📅'
  },
  upcoming: { 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    badge: 'bg-gray-100 text-gray-700',
    label: 'Upcoming',
    icon: '✓'
  },
}

export default function ExpiryCard({ expiry, status, onEdit, onDelete }: ExpiryCardProps) {
  const category = categoryConfig[expiry.category] || categoryConfig.other
  const statusStyle = statusConfig[status.status]

  return (
    <div className={`group bg-white rounded-2xl border-2 ${statusStyle.border} p-6 shadow-soft hover:shadow-medium card-hover relative overflow-hidden`}>
      {/* Category Badge */}
      <div className="absolute top-0 right-0">
        <div className={`${category.bg} ${category.text} px-3 py-1.5 rounded-bl-2xl rounded-tr-2xl text-xs font-semibold flex items-center gap-1.5`}>
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="absolute top-0 left-0">
        <div className={`${statusStyle.badge} px-3 py-1.5 rounded-br-2xl rounded-tl-2xl text-xs font-semibold flex items-center gap-1.5`}>
          <span>{statusStyle.icon}</span>
          <span>{statusStyle.label}</span>
        </div>
      </div>

      <div className="pt-12">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {expiry.name}
        </h3>

        {/* Expiry Date - Prominent */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Expiry Date</span>
            <span className="text-lg font-bold text-gray-900">
              {format(new Date(expiry.expiry_date), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Days Count */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Time remaining:</span>
            <span className={`font-semibold ${
              status.status === 'expired' ? 'text-danger-600' :
              status.status === 'today' || status.status === 'urgent' ? 'text-warning-600' :
              'text-primary-600'
            }`}>
              {status.status === 'expired' 
                ? `${status.days} days ago` 
                : status.status === 'today'
                ? 'Today'
                : `${status.days} days left`
              }
            </span>
          </div>
        </div>

        {/* Notes */}
        {expiry.notes && (
          <div className="mb-4 pt-4 border-t border-gray-200">
            {expiry.category === 'other' && expiry.notes.includes('Document Type:') && (
              <div className="mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Document Type</span>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {expiry.notes.match(/Document Type:\s*(.+?)(?:\n|$)/)?.[1] || 'N/A'}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{expiry.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all duration-200 hover:scale-105"
            aria-label="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100 transition-all duration-200 hover:scale-105"
            aria-label="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
