import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { supabase } from "@/lib/supabase/client";

/**
 * Runtime-safe loader.
 * If deployment env vars are missing, touching the client throws.
 * We catch that so the UI can still render.
 */
export async function getSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  if (typeof window === "undefined") return null;
  try {
    void supabase.auth;
    return supabase;
  } catch {
    // Missing build-time env vars in some deployments can break client init.
    // Callers should handle null (we can fall back to direct backend-function calls).
    return null;
  }
}
