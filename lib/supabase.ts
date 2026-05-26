import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

/**
 * Checks if Supabase has been configured with environmental variables.
 * Allows graceful fallback during local development or when env variables are not yet provided.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl.length > 0 && 
    supabaseUrl !== "https://placeholder-url.supabase.co" &&
    !supabaseUrl.includes("your-supabase-project") &&
    supabaseAnonKey.length > 0 && 
    supabaseAnonKey !== "placeholder-anon-key" &&
    !supabaseAnonKey.includes("your-supabase-anon-key")
  )
}

// Initialize Supabase Client with fallbacks to prevent runtime crashes when not yet configured
export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
)
