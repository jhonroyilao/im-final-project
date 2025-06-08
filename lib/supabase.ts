import { createClient } from "@supabase/supabase-js"

// For development/demo purposes, we'll use placeholder values
// In production, these should be set as environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uvxflcpildarezuitqjx.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2eGZsY3BpbGRhcmV6dWl0cWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNTkyMzksImV4cCI6MjA2MzczNTIzOX0.6fPQJ8uTpcz2CZBYJOBWDEHg2y70I33FipYhcAtCsZA"

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
