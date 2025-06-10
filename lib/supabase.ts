import { createClient } from "@supabase/supabase-js"

// For development/demo purposes, we'll use placeholder values
// In production, these should be set as environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uvxflcpildarezuitqjx.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2eGZsY3BpbGRhcmV6dWl0cWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNTkyMzksImV4cCI6MjA2MzczNTIzOX0.6fPQJ8uTpcz2CZBYJOBWDEHg2y70I33FipYhcAtCsZA"

// Create Supabase client
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or Anon Key")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public'
    }
  })
}

export const supabase = createSupabaseClient()
