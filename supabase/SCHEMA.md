# Database Schema Documentation

## Overview

This document describes the database schema for ExpiryCare MVP.

## Tables

### 1. profiles (Extends Supabase auth.users)

Extends the Supabase `auth.users` table with additional profile information.

**Columns:**
- `id` (UUID, PRIMARY KEY) - References `auth.users(id)`
- `email` (TEXT, nullable) - User email
- `full_name` (TEXT, nullable) - User's full name
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Features:**
- Automatically created when a user signs up (via trigger)
- Row Level Security (RLS) enabled
- Users can only view/update their own profile

---

### 2. life_items

Main table for tracking expiry items (warranties, insurance, medicines, subscriptions).

**Columns:**
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `user_id` (UUID, NOT NULL) - References `auth.users(id)`
- `title` (TEXT, NOT NULL) - Item title/name
- `category` (TEXT, NOT NULL) - One of: 'warranty', 'insurance', 'medicine', 'subscription'
- `expiry_date` (DATE, NOT NULL) - When the item expires
- `reminder_days` (INTEGER[], NOT NULL) - Array of days before expiry to send reminders (default: [7])
- `notes` (TEXT, nullable) - Additional notes
- `document_url` (TEXT, nullable) - URL to uploaded document/image
- `person_name` (TEXT, nullable) - For medicine category, who the medicine is for
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_life_items_user_id` - On user_id
- `idx_life_items_expiry_date` - On expiry_date
- `idx_life_items_category` - On category
- `idx_life_items_user_category` - Composite on (user_id, category)

**Features:**
- Row Level Security (RLS) enabled
- Users can only access their own items
- `reminder_days` is an array to support multiple reminder days (e.g., [7, 3, 1])

---

### 3. family_members

Manages family members who can view items (viewer role).

**Columns:**
- `id` (UUID, PRIMARY KEY) - Auto-generated
- `user_id` (UUID, NOT NULL) - References `auth.users(id)` (the owner)
- `email` (TEXT, NOT NULL) - Family member's email
- `role` (TEXT, NOT NULL) - Currently only 'viewer' (can be extended)
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Constraints:**
- Unique constraint on `(user_id, email)` - prevents duplicate family members

**Indexes:**
- `idx_family_members_user_id` - On user_id
- `idx_family_members_email` - On email

**Features:**
- Row Level Security (RLS) enabled
- Users can only manage their own family members

---

## Security

All tables have **Row Level Security (RLS)** enabled with policies ensuring:

1. **SELECT**: Users can only view their own records
2. **INSERT**: Users can only insert records with their own user_id
3. **UPDATE**: Users can only update their own records
4. **DELETE**: Users can only delete their own records

## Triggers

### Automatic Profile Creation
When a new user signs up via Supabase Auth, a trigger automatically creates a corresponding profile record.

### Automatic Timestamp Updates
All tables have triggers that automatically update the `updated_at` timestamp on record updates.

## Usage Examples

### Insert a life_item
```sql
INSERT INTO life_items (user_id, title, category, expiry_date, reminder_days, person_name)
VALUES (
  auth.uid(),
  'iPhone 14 Warranty',
  'warranty',
  '2025-12-31',
  ARRAY[30, 7, 1],
  NULL
);
```

### Insert a family member
```sql
INSERT INTO family_members (user_id, email, role)
VALUES (
  auth.uid(),
  'family@example.com',
  'viewer'
);
```

### Query user's life items
```sql
SELECT * FROM life_items
WHERE user_id = auth.uid()
ORDER BY expiry_date ASC;
```

## Migration

Run the migration file `002_core_schema.sql` in your Supabase SQL Editor to create all tables, indexes, policies, and triggers.

