"use client";

import { usePathname } from "next/navigation";
import { usePricing } from "@/hooks/usePricing";

const FLOWERS = 22;
const BULB_COLORS = ["#ffd43b", "#ff8a1f", "#ff4d6d", "#fff0b3", "#ff9f1c"];
/** Hanging lanterns sit near the edges so they never cover the page's headline text. */
const LANTERNS: { left: string; delay: string; scale: number; hue: "red" | "gold" }[] = [
  { left: "1.5%", delay: "0s", scale: 1, hue: "red" },
  { left: "6.5%", delay: "-1.4s", scale: 0.8, hue: "gold" },
  { left: "93%", delay: "-0.7s", scale: 0.8, hue: "gold" },
  { left: "97.5%", delay: "-2.1s", scale: 1, hue: "red" },
];

/** Falling marigold petals and sparkles. Fixed table: no randomness, so server and client agree. */
const FALLERS = Array.from({ length: 18 }, (_, i) => {
  const kind = i % 3 === 0 ? "spark" : "petal";
  return {
    left: `${(i * 37 + 7) % 100}%`,
    delay: `${-((i * 2.3) % 16)}s`,
    duration: `${15 + ((i * 3) % 11)}s`,
    sway: `${((i % 2 ? 1 : -1) * (24 + ((i * 7) % 40)))}px`,
    size: kind === "spark" ? 9 + (i % 3) * 3 : 11 + (i % 4) * 3,
    kind,
    color: kind === "spark" ? "#fff0b3" : i % 2 ? "#ff9f1c" : "#ffb703",
    /* Half of them are hidden on phones to keep the page calm. */
    hideSmall: i % 2 === 1,
  };
});

function Marigold({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="#f77f00">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="12" cy="5.5" rx="3.2" ry="5" transform={`rotate(${i * 45} 12 12)`} />
        ))}
      </g>
      <g fill="#ffb703">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="12" cy="7.2" rx="2.4" ry="3.6" transform={`rotate(${i * 45 + 22.5} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="3" fill="#d00000" />
      <circle cx="12" cy="12" r="1.3" fill="#ffd166" />
    </svg>
  );
}

function Lantern({ hue }: { hue: "red" | "gold" }) {
  const body = hue === "red" ? "#c1121f" : "#e58e00";
  const rib = hue === "red" ? "#ffd166" : "#fff0b3";
  return (
    <svg width="30" height="58" viewBox="0 0 30 58" aria-hidden="true">
      <defs>
        <radialGradient id={`lg-${hue}`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#fff6c9" stopOpacity="0.95" />
          <stop offset="1" stopColor={body} />
        </radialGradient>
      </defs>
      <path d="M15 0v8" stroke="#ffd166" strokeWidth="1.2" />
      <rect x="9" y="8" width="12" height="4" rx="1.5" fill="#ffb703" />
      <path d="M15 12c11 0 14 8 14 16s-3 16-14 16S1 36 1 28s4-16 14-16z" fill={`url(#lg-${hue})`} />
      <path d="M15 12c-5 3-6 9-6 16s1 13 6 16M15 12c5 3 6 9 6 16s-1 13-6 16" stroke={rib} strokeWidth="1" fill="none" opacity="0.8" />
      <rect x="9" y="44" width="12" height="3.5" rx="1.5" fill="#ffb703" />
      <path d="M11 47.5v7M15 47.5v9M19 47.5v7" stroke="#ffd166" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11" cy="55" r="1.4" fill="#ff4d6d" />
      <circle cx="15" cy="57" r="1.4" fill="#ff4d6d" />
      <circle cx="19" cy="55" r="1.4" fill="#ff4d6d" />
    </svg>
  );
}

/**
 * Site-wide Diwali decoration while a sale is announced or live: a marigold toran with fairy
 * lights and jhalar tassels under the navbar, swinging lanterns at the edges, and slowly falling
 * petals and sparkles. Everything animates with transform/opacity only (compositor, no layout),
 * is pointer-events:none so it never blocks the page, and is removed for reduced motion.
 */
export default function DiwaliGarland() {
  const pathname = usePathname();
  const { phase } = usePricing();
  if ((phase !== "upcoming" && phase !== "live") || pathname?.startsWith("/admin")) return null;

  return (
    <>
      <style>{`
        @keyframes dw-twinkle{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes dw-swing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
        @keyframes dw-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
        @keyframes dw-fall{
          0%{transform:translate3d(0,-8vh,0) rotate(0deg);opacity:0}
          8%{opacity:.9}
          50%{transform:translate3d(var(--sx),52vh,0) rotate(200deg)}
          92%{opacity:.85}
          100%{transform:translate3d(0,108vh,0) rotate(400deg);opacity:0}
        }
        @keyframes dw-spark{0%,100%{scale:.6}50%{scale:1.15}}
        .dw-bulb{animation:dw-twinkle 2.4s ease-in-out infinite}
        .dw-swing{transform-origin:50% 0;animation:dw-swing 4.6s ease-in-out infinite;will-change:transform}
        .dw-sway{transform-origin:50% 0;animation:dw-sway 5.4s ease-in-out infinite}
        .dw-fall{position:absolute;top:0;animation:dw-fall linear infinite;will-change:transform,opacity}
        .dw-spark{animation:dw-spark 1.8s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){
          .dw-bulb,.dw-swing,.dw-sway,.dw-spark{animation:none}
          .dw-fall-layer{display:none}
        }
        .dw-str{height:var(--len)}
        @media (max-width:640px){.dw-small-hide{display:none}.dw-str{height:min(var(--len),8px)}}
      `}</style>

      {/* Falling petals + sparkles, behind the navbar and the garland. */}
      <div className="dw-fall-layer pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden="true">
        {FALLERS.map((f, i) => (
          <span
            key={i}
            className={`dw-fall ${f.hideSmall ? "dw-small-hide" : ""}`}
            style={{ left: f.left, animationDuration: f.duration, animationDelay: f.delay, ["--sx" as any]: f.sway }}
          >
            {f.kind === "petal" ? (
              <span
                className="block"
                style={{
                  width: f.size,
                  height: f.size * 1.5,
                  background: `radial-gradient(ellipse at 40% 30%, #fff1b8, ${f.color} 60%, #e85d04)`,
                  borderRadius: "70% 30% 70% 30% / 60% 40% 60% 40%",
                  filter: "drop-shadow(0 0 3px rgba(255,160,40,.5))",
                }}
              />
            ) : (
              <svg className="dw-spark" width={f.size} height={f.size} viewBox="0 0 20 20">
                <path d="M10 0c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10C5.2 9.4 9.4 5.2 10 0z" fill={f.color} />
              </svg>
            )}
          </span>
        ))}
      </div>

      {/* Toran: marigold string, fairy lights, jhalar tassels and lanterns. */}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-40 h-0 md:top-20" aria-hidden="true">
        {/* the string the flowers hang on */}
        <div className="absolute inset-x-[-3%] -top-5 h-8 rounded-b-[50%] border-b-2 border-amber-500/60" />

        <div className="relative flex items-start justify-between px-1">
          {Array.from({ length: FLOWERS }, (_, i) => {
            const t = i / (FLOWERS - 1);
            const sag = Math.round(12 * Math.sin(t * Math.PI));
            const c = BULB_COLORS[i % BULB_COLORS.length];
            // Short tassels in the middle (where the headline sits), longer toward the edges.
            const edge = Math.abs(t - 0.5) * 2;
            const len = 6 + Math.round(24 * edge) + (i % 3) * 3;
            return (
              <span
                key={i}
                className={`dw-sway flex flex-col items-center ${i % 2 ? "dw-small-hide" : ""}`}
                style={{ marginTop: sag - 2, animationDelay: `${-(i % 6) * 0.7}s` }}
              >
                <Marigold size={22 + (i % 2) * 3} />
                <span className="dw-str -mt-0.5 block w-px bg-gradient-to-b from-amber-300/80 to-amber-500/30" style={{ ["--len" as any]: `${len}px` }} />
                <span className="block h-1.5 w-1.5 rounded-full bg-amber-300" />
                <span
                  className="block h-3 w-2 bg-rose-500"
                  style={{ clipPath: "polygon(50% 0,100% 100%,0 100%)", background: i % 2 ? "#ff4d6d" : "#ffb703" }}
                />
                <span
                  className="dw-bulb mt-1 block h-2 w-1.5 rounded-full"
                  style={{ background: c, boxShadow: `0 0 10px 2px ${c}99`, animationDelay: `${(i % 7) * 0.33}s` }}
                />
              </span>
            );
          })}
        </div>

        {LANTERNS.map((l, i) => (
          <span key={i} className="absolute -top-1 -translate-x-1/2" style={{ left: l.left }}>
            <span className="dw-swing block" style={{ animationDelay: l.delay, scale: String(l.scale) }}>
              <Lantern hue={l.hue} />
            </span>
          </span>
        ))}
      </div>
    </>
  );
}
