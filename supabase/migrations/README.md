# Database Migrations

This directory contains SQL migration files for setting up the ExpiryCare database schema.

## Migration Files

### 001_initial_schema.sql
Initial schema with expiries table (legacy - can be removed if not needed).

### 002_core_schema.sql
Core MVP schema with:
- `profiles` - Extends Supabase auth.users
- `life_items` - Main table for tracking expiry items
- `family_members` - Family member management

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for MVP)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `002_core_schema.sql`
4. Click **Run** to execute

### Option 2: Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

## Schema Overview

### profiles
Extends Supabase auth.users with additional profile information.
- Automatically created when a user signs up (via trigger)
- Contains: id, email, full_name, timestamps

### life_items
Main table for tracking expiry items.
- Fields: id, user_id, title, category, expiry_date, reminder_days (array), notes, document_url, person_name, timestamps
- Categories: warranty, insurance, medicine, subscription
- reminder_days is an integer array to support multiple reminder days

### family_members
Manages family members who can view items.
- Fields: id, user_id, email, role, timestamps
- Role: viewer (can be extended later)
- Unique constraint on (user_id, email)

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only access their own data
- All operations (SELECT, INSERT, UPDATE, DELETE) are restricted to the authenticated user's own records

