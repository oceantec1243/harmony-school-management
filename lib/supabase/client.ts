import { createBrowserClient } from "@supabase/ssr"

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build time on the server, env vars may not be available
  // Only use placeholder during actual build (not at runtime)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Check if we're in the browser - if so, there's a real problem
    if (typeof window !== "undefined") {
      console.error("[v0] Supabase environment variables are missing at runtime!")
      console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl)
      console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "present" : "missing")
    }
    // Return placeholder for build only
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return clientInstance
}
