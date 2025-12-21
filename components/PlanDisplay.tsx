'use client'

import { PlanType, PLAN_PRICES, getPlanLimits } from '@/lib/plans'
import Link from 'next/link'

type PlanDisplayProps = {
  plan: PlanType
  itemCount: number
  familyMemberCount: number
}

export default function PlanDisplay({ plan, itemCount, familyMemberCount }: PlanDisplayProps) {
  const limits = getPlanLimits(plan)
  const maxItems = limits.maxItems === -1 ? 'Unlimited' : limits.maxItems
  const maxFamily = limits.maxFamilyMembers === -1 ? 'Unlimited' : limits.maxFamilyMembers

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </h3>
          <p className="text-sm text-gray-500">
            {plan === 'free' ? 'Free forever' : `₹${PLAN_PRICES[plan]}/year`}
          </p>
        </div>
        {plan !== 'family' && (
          <Link
            href="/upgrade"
            className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Life Items:</span>
          <span className="font-medium text-gray-900">
            {itemCount} / {maxItems}
          </span>
        </div>
        {plan === 'family' && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Family Members:</span>
            <span className="font-medium text-gray-900">
              {familyMemberCount} / {maxFamily}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Medicine Tracking:</span>
          <span className={limits.allowsMedicine ? 'text-green-600' : 'text-gray-400'}>
            {limits.allowsMedicine ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Document Upload:</span>
          <span className={limits.allowsDocuments ? 'text-green-600' : 'text-gray-400'}>
            {limits.allowsDocuments ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Family Sharing:</span>
          <span className={limits.allowsSharing ? 'text-green-600' : 'text-gray-400'}>
            {limits.allowsSharing ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
  )
}

