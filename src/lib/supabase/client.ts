/**
 * lib/supabase/client.ts
 * Browser-side Supabase client (singleton).
 * Usage: import { createClient } from '@/lib/supabase/client'
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
