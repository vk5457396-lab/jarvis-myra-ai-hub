import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Runtime-safe loader.
 * If deployment env vars are missing, importing the generated client will throw.
 * We catch that so the UI can still render.
 */
export async function getSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  try {
    const mod = await import("@/integrations/supabase/client");
    return mod.supabase as unknown as SupabaseClient<Database>;
  } catch {
    // Missing build-time env vars in some deployments (e.g. Netlify) can break client init.
    // Callers should handle null (we can fall back to direct backend-function calls).
    return null;
  }
}
