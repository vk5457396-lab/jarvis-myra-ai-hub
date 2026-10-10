"use client";

import { usePathname } from "next/navigation";
import { usePricing } from "@/hooks/usePricing";

const COLORS = ["#ffd43b", "#ff8a1f", "#ff4d6d", "#ffe9a8", "#ff9f1c"];
const BULBS = 26;

/**
 * Site-wide string of fairy lights hanging under the navbar while a sale is announced or live.
 * Transform/opacity-free twinkle (box-shadow is static, only opacity animates) and fully
 * disabled for reduced-motion. Pointer-events are off so it never blocks the navbar or page.
 */
export default function DiwaliGarland() {
  const pathname = usePathname();
  const { phase } = usePricing();
  if ((phase !== "upcoming" && phase !== "live") || pathname?.startsWith("/admin")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 h-8 overflow-hidden md:top-20" aria-hidden="true">
      <style>{`
        @keyframes bulb-twinkle{0%,100%{opacity:1}50%{opacity:.35}}
        .garland-bulb{animation:bulb-twinkle 2.4s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.garland-bulb{animation:none}}
      `}</style>
      <div className="absolute inset-x-[-2%] -top-3 h-7 rounded-b-[50%] border-b border-amber-300/40" />
      <div className="relative flex h-full items-start justify-between px-2">
        {Array.from({ length: BULBS }, (_, i) => {
          const c = COLORS[i % COLORS.length];
          // Sag in the middle like a hanging string.
          const drop = 4 + Math.round(10 * Math.sin((i / (BULBS - 1)) * Math.PI));
          return (
            <span key={i} className="flex flex-col items-center" style={{ marginTop: drop - 4 }}>
              <span className="h-2 w-px bg-amber-300/40" />
              <span
                className="garland-bulb block h-2.5 w-2 rounded-full"
                style={{ background: c, boxShadow: `0 0 10px 2px ${c}99`, animationDelay: `${(i % 7) * 0.33}s` }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
