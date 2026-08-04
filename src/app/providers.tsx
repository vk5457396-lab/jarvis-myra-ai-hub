"use client";

import { useState } from "react";
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppChrome>{children}</AppChrome>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
