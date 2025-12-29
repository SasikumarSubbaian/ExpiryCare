'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import Link from 'next/link'
import ExpiryForm from './ExpiryForm'
import ExpiryCard from './ExpiryCard'
import Image from 'next/image'

export type Expiry = {
  id: string
  category: 'warranty' | 'insurance' | 'medicine' | 'subscription' | 'amc' | 'other'
  name: string
  expiry_date: string
  reminder_days: number
  notes: string | null
}

type CategoryFilter = 'all' | Expiry['category']

export default function Dashboard() {
  const [expiries, setExpiries] = useState<Expiry[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingExpiry, setEditingExpiry] = useState<Expiry | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadExpiries()
  }, [])

  const loadExpiries = async () => {
    try {
      const { data, error } = await supabase
        .from('expiries')
        .select('*')
        .order('expiry_date', { ascending: true })

      if (error) throw error
      setExpiries(data || [])
    } catch (error) {
      console.error('Error loading expiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expiry?')) return

    const { error } = await supabase.from('expiries').delete().eq('id', id)
    if (error) {
      alert('Error deleting expiry: ' + error.message)
      return
    }
    loadExpiries()
  }

  const handleEdit = (expiry: Expiry) => {
    setEditingExpiry(expiry)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingExpiry(null)
    loadExpiries()
  }

  const filteredExpiries = categoryFilter === 'all' 
    ? expiries 
    : expiries.filter(e => e.category === categoryFilter)

  const getExpiryStatus = (expiryDate: string): { status: 'expired' | 'today' | 'urgent' | 'soon' | 'upcoming'; days: number } => {
    const date = new Date(expiryDate)
    const daysUntil = differenceInDays(date, new Date())
    
    if (isPast(date) && !isToday(date)) return { status: 'expired', days: Math.abs(daysUntil) }
    if (isToday(date)) return { status: 'today', days: 0 }
    if (daysUntil <= 7) return { status: 'urgent', days: daysUntil }
    if (daysUntil <= 30) return { status: 'soon', days: daysUntil }
    return { status: 'upcoming', days: daysUntil }
  }

  const categories = [
    { value: 'all' as const, label: 'All', count: expiries.length, icon: '📋' },
    { value: 'warranty' as const, label: 'Warranty', count: expiries.filter(e => e.category === 'warranty').length, icon: '🛡️' },
    { value: 'insurance' as const, label: 'Insurance', count: expiries.filter(e => e.category === 'insurance').length, icon: '📄' },
    { value: 'medicine' as const, label: 'Medicine', count: expiries.filter(e => e.category === 'medicine').length, icon: '💊' },
    { value: 'subscription' as const, label: 'Subscription', count: expiries.filter(e => e.category === 'subscription').length, icon: '📱' },
  ]

  // Calculate stats
  const stats = {
    total: expiries.length,
    expired: expiries.filter(e => {
      const status = getExpiryStatus(e.expiry_date)
      return status.status === 'expired'
    }).length,
    urgent: expiries.filter(e => {
      const status = getExpiryStatus(e.expiry_date)
      return status.status === 'urgent' || status.status === 'today'
    }).length,
    upcoming: expiries.filter(e => {
      const status = getExpiryStatus(e.expiry_date)
      return status.status === 'upcoming' || status.status === 'soon'
    }).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-gray-200/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Image 
                  src="/logo.png" 
                  alt="ExpiryCare Logo" 
                  width={48}
                  height={48}
                  className="h-10 w-10 lg:h-12 lg:w-12 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  ExpiryCare
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Track your important expiries</p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-danger-600 mt-1">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-danger-100 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-warning-600 mt-1">{stats.urgent}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-success-600 mt-1">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white gradient-primary rounded-xl shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Expiry
          </button>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  categoryFilter === cat.value
                    ? 'gradient-primary text-white shadow-medium scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-300 hover:scale-105'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  categoryFilter === cat.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Expiries List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your expiries...</p>
          </div>
        ) : filteredExpiries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No expiries found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {categoryFilter === 'all' 
                ? "Get started by adding your first expiry item. It only takes a minute!"
                : `No ${categories.find(c => c.value === categoryFilter)?.label.toLowerCase()} items found. Try another category.`
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white gradient-primary rounded-xl shadow-medium hover:shadow-large transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Expiry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExpiries.map((expiry) => {
              const status = getExpiryStatus(expiry.expiry_date)
              return (
                <ExpiryCard
                  key={expiry.id}
                  expiry={expiry}
                  status={status}
                  onEdit={() => handleEdit(expiry)}
                  onDelete={() => handleDelete(expiry.id)}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <ExpiryForm
          expiry={editingExpiry}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
