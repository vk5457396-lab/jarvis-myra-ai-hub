import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Read-only server-side client using the public anon/publishable key —
 * safe for Server Components (e.g. generateMetadata). Never use the
 * service-role key here; that's reserved for src/app/api/_lib/utils/supabase.ts.
 */
export function getSupabaseServerReadonlyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
