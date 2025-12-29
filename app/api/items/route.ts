// Items API Route
// Handles adding life items with pricing enforcement
// Backend enforcement: Do NOT trust frontend alone

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { getItemCount } from '@/lib/supabase/plans'
import { canAddLifeItem } from '@/lib/plans'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'AUTH_REQUIRED',
          message: 'Authentication required. Please log in to add items.',
        },
        { status: 401 }
      )
    }

    // Step 2: Get request body
    const body = await request.json()
    const { title, category, expiry_date, reminder_days, notes, person_name, document_url } = body

    // Step 3: Validate required fields
    if (!title || !category || !expiry_date || !reminder_days || !Array.isArray(reminder_days)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields: title, category, expiry_date, and reminder_days are required.',
        },
        { status: 400 }
      )
    }

    // Step 4: Get user plan and check item limits
    const userPlan = await getUserPlan(user.id)
    const currentItemCount = await getItemCount(user.id)
    const itemCheck = canAddLifeItem(userPlan, currentItemCount)

    if (!itemCheck.allowed) {
      return NextResponse.json(
        {
          error: 'ITEM_LIMIT_EXCEEDED',
          message: itemCheck.reason || 'Item limit exceeded. Please upgrade to Pro plan.',
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Step 5: Insert item
    const { data: insertedItem, error: insertError } = await supabase
      .from('life_items')
      .insert({
        user_id: user.id,
        title,
        category,
        expiry_date,
        reminder_days,
        notes: notes || null,
        person_name: person_name || null,
        document_url: document_url || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Items API] Insert error:', insertError)
      return NextResponse.json(
        {
          error: 'INSERT_FAILED',
          message: insertError.message || 'Failed to add item. Please try again.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        item: insertedItem,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Items API] Error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error.message || 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}

