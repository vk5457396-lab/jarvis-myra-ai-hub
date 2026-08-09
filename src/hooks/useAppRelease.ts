"use client";

import { useEffect, useState } from "react";

export interface ReleaseInfo {
  version_name: string;
  version_code: number;
  release_notes: string | null;
  file_size_mb: number | null;
  updated_at: string;
}

/** Shared loader for the published Android release, used by every download surface. */
export function useAppRelease() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/app/release")
      .then((res) => res.json())
      .then((body) => {
        if (active && body?.success) setRelease(body.data as ReleaseInfo);
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
