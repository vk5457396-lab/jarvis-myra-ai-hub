"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppChrome from "./app-chrome";
import { installAuthHintFetch } from "@/lib/authHint";

// Before SessionProvider's first session fetch: signed-out visitors skip /api/auth/session.
installAuthHintFetch();

export function Providers({ children }: { children: React.ReactNode }) {
  // Created in useState (not module scope) so each session gets its own
  // client and it isn't shared across concurrent server requests.
  const [queryClient] = useState(() => new QueryClient());

  return (
    // Session is fetched once per page load — no focus refetch and no polling. The 5-minute
    // interval made every open tab call /api/auth/session 12x an hour; it was the #1 function
    // in production logs (2026-09-30). signIn()/signOut() still update the client session
    // immediately, so login/logout is unaffected.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppChrome>{children}</AppChrome>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
