/**
 * Plan configuration - Single source of truth
 * Used by Home page, Upgrade page, and backend enforcement
 */

export interface Plan {
  id: 'free' | 'pro'
  name: string
  price: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Up to 10 life items',
      'Email reminders',
      'Expiry tracking dashboard',
      '5 document uploads (OCR)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    features: [
      'Unlimited items',
      'Email & WhatsApp reminders',
      'Medicine tracking',
      'Unlimited document uploads',
      'Family sharing (up to 5 members)',
      'Priority support',
    ],
  },
]

/**
 * Get plan by ID
 */
export function getPlan(planId: 'free' | 'pro'): Plan | undefined {
  return PLANS.find((p) => p.id === planId)
}

/**
 * Get upgrade plans (excludes current plan)
 */
export function getUpgradePlans(currentPlanId?: 'free' | 'pro'): Plan[] {
  return PLANS.filter((p) => p.id !== currentPlanId)
}

