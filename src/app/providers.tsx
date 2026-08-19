"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppChrome from "./app-chrome";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created in useState (not module scope) so each session gets its own
  // client and it isn't shared across concurrent server requests.
  const [queryClient] = useState(() => new QueryClient());

  return (
    // refetchOnWindowFocus=false + a 5-minute refetchInterval instead of the next-auth
    // defaults (focus-refetch on, no interval): the site's navbar/admin pages don't need
    // session state to update the instant a tab regains focus, and focus events were the
    // dominant source of /api/auth/session traffic. signIn()/signOut() still update the
    // client session immediately regardless of these settings - login/logout is unaffected.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={5 * 60}>
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
