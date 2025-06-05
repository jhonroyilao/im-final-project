import { createClient } from "@supabase/supabase-js"

// For development/demo purposes, we'll use placeholder values
// In production, these should be set as environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

// Create a mock client for demo purposes if real credentials aren't available
const createSupabaseClient = () => {
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn("Supabase client creation failed, using mock client for demo")
    // Return a mock client for demo purposes
    return {
      auth: {
        signUp: async () => ({ data: { user: { id: "demo-user" } }, error: null }),
        signIn: async () => ({ data: { user: { id: "demo-user" } }, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        insert: async () => ({ error: null }),
        select: async () => ({ data: [], error: null }),
        update: async () => ({ error: null }),
        delete: async () => ({ error: null }),
      }),
    } as any
  }
}

export const supabase = createSupabaseClient()

// Types for our database
export interface User {
  id: string
  email: string
  role: "student" | "faculty" | "admin"
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  student_number: string
  first_name: string
  middle_name?: string
  surname: string
}

export interface Faculty {
  id: string
  user_id: string
  faculty_number: string
  first_name: string
  middle_name?: string
  surname: string
}

export interface Room {
  id: string
  room_number: string
  capacity: number
  description?: string
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  total_quantity: number
  available_quantity: number
  category?: string
}

export interface Reservation {
  id: string
  user_id: string
  room_id: string
  reservation_date: string
  time_start: string
  time_end: string
  number_of_students: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  file_url?: string
  created_at: string
}
