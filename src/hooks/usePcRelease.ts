"use client";

import { useEffect, useState } from "react";
import { cachedJson } from "@/lib/cachedJson";

export interface PcReleaseInfo {
  download_url: string;
  version_name: string | null;
  file_size_mb: number | null;
  updated_at: string;
}

/** Shared loader for the published MYRA PC Controller (.exe) release, used by every download surface. */
export function usePcRelease() {
  const [release, setRelease] = useState<PcReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    cachedJson("/api/pc/release", 10 * 60_000)
      .then((body) => {
        if (active && body?.success) setRelease(body.data as PcReleaseInfo);
      })
      .catch(() => {
        /* Section renders its "not available" state instead. */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { release, loading };
}
