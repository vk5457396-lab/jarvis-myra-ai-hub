import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from './response';

let client: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the service role key.
 * Credentials come exclusively from Vercel environment variables and are never
 * shipped to the browser or the Android app. Separate instance from the
 * frontend's browser client (src/lib/supabase/client.ts) — never import that here.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw ApiError.internal('Backend is not configured.', 'SUPABASE_NOT_CONFIGURED');
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'myra-vercel-api' } },
  });

  return client;
}
