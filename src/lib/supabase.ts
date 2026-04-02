import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Singleton Supabase browser client.
 *
 * Uses createBrowserClient from @supabase/ssr so that auth tokens are stored
 * in cookies (not only localStorage). This is required for Next.js middleware
 * (createServerClient) to read the session server-side and enforce role-based
 * routing correctly.
 */
export const supabase = createBrowserClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);
