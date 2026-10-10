"use client";

import { Suspense, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import CursorGlow from "@/components/CursorGlow";
import ReferralBanner from "@/components/ReferralBanner";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import SiteOfferPopup from "@/components/SiteOfferPopup";
import NavigationProgress from "@/components/NavigationProgress";
import DiwaliGarland from "@/components/DiwaliGarland";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      {!isLoading && <CursorGlow />}
      {!isLoading && <ScrollProgressBar />}
      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>
      <SiteOfferPopup ready={!isLoading} />
      <DiwaliGarland />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </>
  );
}
