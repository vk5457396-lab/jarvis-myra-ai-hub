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
  } catch (e) {
    console.error("Supabase client failed to initialize (missing env vars?)", e);
    return null;
  }
}
