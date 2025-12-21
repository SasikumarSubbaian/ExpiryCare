export type PlanType = 'free' | 'pro' | 'family'

export interface PlanLimits {
  maxItems: number
  maxFamilyMembers: number
  allowsMedicine: boolean
  allowsDocuments: boolean
  allowsSharing: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxItems: 5,
    maxFamilyMembers: 0,
    allowsMedicine: false,
    allowsDocuments: false,
    allowsSharing: false,
  },
  pro: {
    maxItems: -1, // Unlimited
    maxFamilyMembers: 0,
    allowsMedicine: true,
    allowsDocuments: true,
    allowsSharing: false,
  },
  family: {
    maxItems: -1, // Unlimited
    maxFamilyMembers: 5,
    allowsMedicine: true,
    allowsDocuments: true,
    allowsSharing: true,
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

