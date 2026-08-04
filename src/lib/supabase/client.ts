import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

let client: SupabaseClient<Database> | null = null;

function createBrowserClient(): SupabaseClient<Database> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

function getClient(): SupabaseClient<Database> {
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client accessed during server render');
  }
  if (!client) {
    client = createBrowserClient();
  }
  return client;
}

// A lazily-constructed singleton exposed via Proxy so existing call sites
// (`supabase.auth...`, `supabase.from(...)`) don't need to change, while the
// real client — which touches `window.localStorage` — is only ever built the
// first time it's actually used (always client-side, e.g. inside useEffect).
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
