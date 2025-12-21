'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, isPast, isToday } from 'date-fns'
import ExpiryForm from './ExpiryForm'
import ExpiryCard from './ExpiryCard'

export type Expiry = {
  id: string
  category: 'warranty' | 'insurance' | 'medicine' | 'subscription'
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
    router.push('/signin')
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

  const getExpiryStatus = (expiryDate: string) => {
    const date = new Date(expiryDate)
    const daysUntil = differenceInDays(date, new Date())
    
    if (isPast(date) && !isToday(date)) return { status: 'expired', days: Math.abs(daysUntil) }
    if (isToday(date)) return { status: 'today', days: 0 }
    if (daysUntil <= 7) return { status: 'urgent', days: daysUntil }
    if (daysUntil <= 30) return { status: 'soon', days: daysUntil }
    return { status: 'upcoming', days: daysUntil }
  }

  const categories = [
    { value: 'all' as const, label: 'All', count: expiries.length },
    { value: 'warranty' as const, label: 'Warranty', count: expiries.filter(e => e.category === 'warranty').length },
    { value: 'insurance' as const, label: 'Insurance', count: expiries.filter(e => e.category === 'insurance').length },
    { value: 'medicine' as const, label: 'Medicine', count: expiries.filter(e => e.category === 'medicine').length },
    { value: 'subscription' as const, label: 'Subscription', count: expiries.filter(e => e.category === 'subscription').length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ExpiryCare</h1>
              <p className="text-sm text-gray-600 mt-1">Track your important expiries</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            + Add Expiry
          </button>
        </div>

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Expiries List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredExpiries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No expiries found. Add your first expiry to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

