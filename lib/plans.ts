export type PlanType = 'free' | 'pro' | 'family'

export interface PlanLimits {
  maxItems: number
  maxOcrUploads: number // Max document uploads (OCR calls) for FREE plan
  maxOcrPerDay: number // Max OCR calls per day for PRO plan
  maxOcrPerMonth: number // Max OCR calls per month for PRO plan
  maxFamilyMembers: number
  allowsMedicine: boolean
  allowsDocuments: boolean
  allowsSharing: boolean
  allowsEmailReminders: boolean
  allowsWhatsAppReminders: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxItems: 10, // Max 10 life items
    maxOcrUploads: 5, // Max 5 document uploads (OCR calls)
    maxOcrPerDay: 0, // Not applicable for FREE
    maxOcrPerMonth: 0, // Not applicable for FREE
    maxFamilyMembers: 0,
    allowsMedicine: false,
    allowsDocuments: true, // Can upload but limited to 5
    allowsSharing: false,
    allowsEmailReminders: true,
    allowsWhatsAppReminders: false,
  },
  pro: {
    maxItems: -1, // Unlimited
    maxOcrUploads: -1, // Unlimited (with fair usage limits)
    maxOcrPerDay: 10, // Max 10 OCR calls per day
    maxOcrPerMonth: 200, // Max 200 OCR calls per month
    maxFamilyMembers: 5, // Up to 5 family members
    allowsMedicine: true,
    allowsDocuments: true,
    allowsSharing: true,
    allowsEmailReminders: true,
    allowsWhatsAppReminders: true,
  },
  family: {
    maxItems: -1, // Unlimited
    maxOcrUploads: -1, // Unlimited (with fair usage limits)
    maxOcrPerDay: 10, // Max 10 OCR calls per day
    maxOcrPerMonth: 200, // Max 200 OCR calls per month
    maxFamilyMembers: 5,
    allowsMedicine: true,
    allowsDocuments: true,
    allowsSharing: true,
    allowsEmailReminders: true,
    allowsWhatsAppReminders: true,
  },
}

export const PLAN_PRICES = {
  free: 0,
  pro: 299, // ₹299/year
  family: 499, // ₹499/year
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canAddItem(plan: PlanType, currentItemCount: number): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(plan)
  
  if (limits.maxItems === -1) {
    return { allowed: true }
  }
  
  if (currentItemCount >= limits.maxItems) {
    return {
      allowed: false,
      reason: `Free plan allows only ${limits.maxItems} items. Upgrade to Pro for unlimited items.`,
    }
  }
  
  return { allowed: true }
}

export function canAddFamilyMember(plan: PlanType, currentMemberCount: number): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(plan)
  
  if (!limits.allowsSharing) {
    return {
      allowed: false,
      reason: 'Family sharing requires Family plan. Upgrade to share with family members.',
    }
  }
  
  if (limits.maxFamilyMembers === -1) {
    return { allowed: true }
  }
  
  if (currentMemberCount >= limits.maxFamilyMembers) {
    return {
      allowed: false,
      reason: `Family plan allows up to ${limits.maxFamilyMembers} family members.`,
    }
  }
  
  return { allowed: true }
}

export function canUseMedicine(plan: PlanType): boolean {
  return getPlanLimits(plan).allowsMedicine
}

export function canUploadDocuments(plan: PlanType): boolean {
  return getPlanLimits(plan).allowsDocuments
}

export function canChooseFile(plan: PlanType, currentFileCount: number): { allowed: boolean; reason?: string } {
  // All plans can choose files, but Free plan has a limit of 5
  if (plan === 'free') {
    if (currentFileCount >= 5) {
      return {
        allowed: false,
        reason: 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders',
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Check if user can upload a document (OCR call)
 * FREE: Max 5 OCR uploads total
 * PRO: Unlimited with fair usage (10/day, 200/month)
 */
export async function canUploadDocument(
  userId: string,
  plan: PlanType,
  getOcrCount: (userId: string) => Promise<number>,
  getOcrCountToday?: (userId: string) => Promise<number>,
  getOcrCountThisMonth?: (userId: string) => Promise<number>
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getPlanLimits(plan)

  // FREE Plan: Check total OCR uploads
  if (plan === 'free') {
    const totalOcrCount = await getOcrCount(userId)
    if (totalOcrCount >= limits.maxOcrUploads) {
      return {
        allowed: false,
        reason: 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders',
      }
    }
  }

  // PRO Plan: Check daily and monthly limits
  if (plan === 'pro' || plan === 'family') {
    if (getOcrCountToday && getOcrCountThisMonth) {
      const todayCount = await getOcrCountToday(userId)
      const monthCount = await getOcrCountThisMonth(userId)

      if (todayCount >= limits.maxOcrPerDay) {
        return {
          allowed: false,
          reason: `Daily limit reached (${limits.maxOcrPerDay} scans/day). Please try again tomorrow or upgrade for higher limits.`,
        }
      }

      if (monthCount >= limits.maxOcrPerMonth) {
        return {
          allowed: false,
          reason: `Monthly limit reached (${limits.maxOcrPerMonth} scans/month). Please try again next month or contact support.`,
        }
      }
    }
  }

  return { allowed: true }
}

/**
 * Check if user can add a life item
 * FREE: Max 10 items
 * PRO: Unlimited
 */
export function canAddLifeItem(plan: PlanType, currentItemCount: number): { allowed: boolean; reason?: string } {
  const limits = getPlanLimits(plan)

  if (limits.maxItems === -1) {
    return { allowed: true }
  }

  if (currentItemCount >= limits.maxItems) {
    return {
      allowed: false,
      reason: `Free plan allows only ${limits.maxItems} items. Upgrade to Pro for unlimited items.`,
    }
  }

  return { allowed: true }
}

/**
 * Check if user can use OCR
 * Same as canUploadDocument but with different naming for clarity
 */
export async function canUseOCR(
  userId: string,
  plan: PlanType,
  getOcrCount: (userId: string) => Promise<number>,
  getOcrCountToday?: (userId: string) => Promise<number>,
  getOcrCountThisMonth?: (userId: string) => Promise<number>
): Promise<{ allowed: boolean; reason?: string }> {
  return canUploadDocument(userId, plan, getOcrCount, getOcrCountToday, getOcrCountThisMonth)
}

/**
 * Check if user can send WhatsApp reminders
 * FREE: Disabled
 * PRO: Enabled
 */
export function canSendWhatsAppReminder(plan: PlanType): boolean {
  return getPlanLimits(plan).allowsWhatsAppReminders
}

