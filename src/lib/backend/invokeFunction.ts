type InvokeResult<T> = { data: T | null; error: Error | null };

/** Maps the old Supabase Edge Function names to their Next.js API route replacements. */
const ROUTES: Record<string, string> = {
  "create-razorpay-order": "/api/payments/create-order",
  "marketplace-create-order": "/api/marketplace/create-order",
  "send-contact-email": "/api/contact/send",
  "send-telegram-notification": "/api/payments/notify",
};

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/** Same-origin replacement for the old Supabase Edge Function invoker. */
export async function invokeBackendFunction<T = any>(
  functionName: string,
  body: unknown
): Promise<InvokeResult<T>> {
  const path = ROUTES[functionName];
  if (!path) return { data: null, error: new Error(`Unknown function: ${functionName}`) };

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
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
