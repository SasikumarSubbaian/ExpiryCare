export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      life_items: {
        Row: {
          id: string
          user_id: string
          title: string
          category: 'warranty' | 'insurance' | 'amc' | 'medicine' | 'subscription' | 'other'
          expiry_date: string
          reminder_days: number[]
          notes: string | null
          document_url: string | null
          person_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category: 'warranty' | 'insurance' | 'amc' | 'medicine' | 'subscription' | 'other'
          expiry_date: string
          reminder_days?: number[]
          notes?: string | null
          document_url?: string | null
          person_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: 'warranty' | 'insurance' | 'medicine' | 'subscription'
          expiry_date?: string
          reminder_days?: number[]
          notes?: string | null
          document_url?: string | null
          person_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          role?: 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          role?: 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
