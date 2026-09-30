"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Code that navigates with router.push can call this so the bar shows for it too. */
export function startNavigationProgress() {
  window.dispatchEvent(new Event("cnv:nav-start"));
}

/**
 * Thin top progress bar that starts the instant an internal link is clicked and finishes when the
 * new route renders. Without it, the App Router keeps showing the old page until the next one is
 * ready, so on slow phones a click looked like it did nothing.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const start = () => {
      setState("running");
      clearTimeout(safety.current);
      safety.current = setTimeout(() => setState("idle"), 20000); // never stick forever
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("cnv:nav-start", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("cnv:nav-start", start);
      clearTimeout(safety.current);
    };
  }, []);

  // Route changed → finish and fade out.
  useEffect(() => {
    setState((s) => (s === "running" ? "done" : s));
    const t = setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 350);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[10000] h-[3px]"
      style={{ opacity: state === "idle" ? 0 : 1, transition: "opacity 300ms ease" }}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-primary via-rose-400 to-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
        style={{
          transform: `scaleX(${state === "running" ? 0.85 : state === "done" ? 1 : 0})`,
          // Grows quickly at first then crawls, so it keeps moving on slow networks.
          transition: state === "running" ? "transform 8s cubic-bezier(0.08, 0.82, 0.17, 1)" : state === "done" ? "transform 200ms ease-out" : "none",
        }}
      />
    </div>
  );
}
