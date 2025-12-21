import { format, differenceInDays, isToday } from 'date-fns'

type LifeItem = {
  id: string
  title: string
  category: 'warranty' | 'insurance' | 'amc' | 'medicine' | 'subscription' | 'other'
  expiry_date: string
  reminder_days: number[]
  notes: string | null
  document_url: string | null
  person_name: string | null
  user_id?: string
}

type ItemsSectionProps = {
  title: string
  subtitle: string
  items: LifeItem[]
  emptyMessage: string
  emptySubtext: string
}

const categoryColors = {
  warranty: 'bg-blue-100 text-blue-800',
  insurance: 'bg-green-100 text-green-800',
  amc: 'bg-teal-100 text-teal-800',
  medicine: 'bg-red-100 text-red-800',
  subscription: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
}

const categoryLabels = {
  warranty: 'Warranty',
  insurance: 'Insurance',
  amc: 'AMC',
  medicine: 'Medicine',
  subscription: 'Subscription',
  other: 'Other',
}

type ExpiryStatus = 'expired' | 'expiring-soon' | 'active'

const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  const days = differenceInDays(expiry, today)
  
  if (days < 0 || isToday(expiry)) return 'expired'
  if (days <= 30) return 'expiring-soon'
  return 'active'
}

const getStatusConfig = (status: ExpiryStatus, days: number) => {
  switch (status) {
    case 'expired':
      return {
        icon: '⚠️',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        badgeColor: 'bg-red-100 text-red-800',
        label: isToday(new Date()) ? 'Expires Today' : 'Expired',
      }
    case 'expiring-soon':
      if (days <= 7) {
        return {
          icon: '🔴',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          badgeColor: 'bg-orange-100 text-orange-800',
          label: 'Urgent',
        }
      }
      return {
        icon: '🟡',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        label: 'Expiring Soon',
      }
    case 'active':
      return {
        icon: '✅',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-100 text-green-800',
        label: 'Active',
      }
  }
}

export default function ItemsSection({
  title,
  subtitle,
  items,
  emptyMessage,
  emptySubtext,
}: ItemsSectionProps) {
  const getDaysUntil = (expiryDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const days = differenceInDays(expiry, today)
    
    if (isToday(expiry)) return 'Today'
    if (days < 0) return `${Math.abs(days)} days ago`
    return `${days} days`
  }

  // Determine section status for header styling
  const sectionStatus = title === 'Expired' ? 'expired' : 
                       title === 'Expiring Soon' ? 'expiring-soon' : 
                       'active'

  const sectionConfig = getStatusConfig(sectionStatus, 0)

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${sectionConfig.borderColor}`}>
      <div className={`px-4 sm:px-6 py-4 border-b ${sectionConfig.borderColor} ${sectionConfig.bgColor}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{sectionConfig.icon}</span>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="max-w-sm mx-auto">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {emptyMessage}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {emptySubtext}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {items.map((item) => {
            const status = getExpiryStatus(item.expiry_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const expiry = new Date(item.expiry_date)
            expiry.setHours(0, 0, 0, 0)
            const days = differenceInDays(expiry, today)
            const statusConfig = getStatusConfig(status, days)

            return (
              <div 
                key={item.id} 
                className={`px-4 sm:px-6 py-4 transition-colors border-l-4 ${statusConfig.borderColor} ${
                  status === 'expired' ? 'hover:bg-red-50' :
                  status === 'expiring-soon' ? (days <= 7 ? 'hover:bg-orange-50' : 'hover:bg-yellow-50') :
                  'hover:bg-green-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base">{statusConfig.icon}</span>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[item.category]}`}>
                        {categoryLabels[item.category]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.badgeColor}`}>
                        {statusConfig.label}
                      </span>
                      {item.category === 'medicine' && item.person_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                          👤 {item.person_name}
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {item.notes}
                      </p>
                    )}
                    {item.document_url && (
                      <div className="mt-2">
                        <a
                          href={item.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                          📄 View Document
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 sm:flex-shrink-0">
                    <p className={`text-sm sm:text-base font-semibold ${statusConfig.textColor}`}>
                      {getDaysUntil(item.expiry_date)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {format(new Date(item.expiry_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
