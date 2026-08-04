"use client";

import { Suspense, useState } from "react";
import BackgroundVideo from "@/components/BackgroundVideo";
import LoadingScreen from "@/components/LoadingScreen";
import CursorGlow from "@/components/CursorGlow";
import ReferralBanner from "@/components/ReferralBanner";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      {!isLoading && <BackgroundVideo />}
      {!isLoading && <CursorGlow />}
      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>
      {children}
    </>
  );
}
