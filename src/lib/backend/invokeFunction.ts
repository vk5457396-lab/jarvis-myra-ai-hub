import { getSupabaseClient } from "@/lib/supabase/getClient";

type InvokeResult<T> = { data: T | null; error: Error | null };

// Fallback for deployments where env vars were not injected at build time.
// These values are publishable and safe to ship to the client.
const FALLBACK_FUNCTIONS_BASE_URL = "https://bsgsrfuunponyqdykafv.supabase.co/functions/v1";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZ3NyZnV1bnBvbnlxZHlrYWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMDY0MjksImV4cCI6MjA4Mjc4MjQyOX0.9-e1q5507-TEbwE9a6Wj3BHd7QKJE-5N6MahUAlUvWk";

async function invokeViaFetch<T>(functionName: string, body: unknown): Promise<InvokeResult<T>> {
  try {
    const res = await fetch(`${FALLBACK_FUNCTIONS_BASE_URL}/${functionName}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: FALLBACK_ANON_KEY,
        authorization: `Bearer ${FALLBACK_ANON_KEY}`,
      },
      body: JSON.stringify(body ?? {}),
    });

    const text = await res.text();
    const maybeJson = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const message =
        (typeof maybeJson === "object" && maybeJson && "error" in maybeJson
          ? String((maybeJson as any).error)
          : text) || `Request failed (${res.status})`;
      return { data: null, error: new Error(message) };
    }

    return { data: (maybeJson as T) ?? (null as any), error: null };
  } catch (e: any) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Prefer the generated client (when env vars exist), otherwise fall back to direct function calls.
 */
export async function invokeBackendFunction<T = any>(
  functionName: string,
  body: unknown
): Promise<InvokeResult<T>> {
  const supabase = await getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    return { data: (data as T) ?? null, error: error ? new Error(error.message) : null };
  }

  return invokeViaFetch<T>(functionName, body);
}
