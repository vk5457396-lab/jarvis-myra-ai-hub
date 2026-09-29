"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const logo = "/assets/logo.png";
const BRAND = "CODENINJAVIK".split("");

/** Shown for at least this long so the intro reads as intentional, never longer than MAX_MS. */
const MIN_MS = 1100;
const MAX_MS = 2600;

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

/** Fired once the intro has fully exited, so heavy visuals (the hero's WebGL core) start only then. */
export const INTRO_DONE_EVENT = "cnv:intro-done";

function announceIntroDone() {
  (window as unknown as { __cnvIntroDone?: boolean }).__cnvIntroDone = true;
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

/** True once the intro has finished (or immediately if it already did earlier in this page view). */
export function isIntroDone(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as { __cnvIntroDone?: boolean }).__cnvIntroDone;
}

/**
 * Site intro: a CSS-3D gyroscope (three rings spinning on different axes around a glowing core) that
 * flies toward the viewer when the page is ready. Pure CSS transforms, so it paints on the very
 * first frame — no WebGL chunk to wait for. Progress follows the real page load (window `load`),
 * clamped between MIN_MS and MAX_MS. Everything is deterministic (no Math.random in render), which
 * also removes the hydration mismatch the old particle loader caused.
 */
const RINGS = [
  { size: "15rem", anim: "gyro-a 5.5s linear infinite", color: "hsl(0 72% 51% / 0.55)", dot: "hsl(0 90% 65%)" },
  { size: "12.5rem", anim: "gyro-b 7s linear infinite", color: "hsl(350 65% 50% / 0.5)", dot: "hsl(350 90% 70%)" },
  { size: "18rem", anim: "gyro-c 9s linear infinite", color: "hsl(0 0% 100% / 0.14)", dot: "hsl(0 0% 100%)" },
];

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    // performance.now() counts from navigation start, so MIN/MAX are measured from when the visitor
    // opened the page — not from when React finished hydrating (which can take seconds on slow phones).
    const start = 0;
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener("load", onLoad);

    let raf = 0;
    let shown = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const ready = (loaded && elapsed >= MIN_MS) || elapsed >= MAX_MS;
      // Ease toward 90% while loading, then run to 100% once ready.
      const target = ready ? 100 : Math.min(90, (elapsed / MAX_MS) * 100 + 15);
      shown += (target - shown) * (ready ? 0.25 : 0.08);
      if (ready && shown > 99.5) shown = 100;
      setProgress(shown);
      if (shown >= 100 && !doneRef.current) {
        doneRef.current = true;
        setTimeout(() => setVisible(false), 150);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        announceIntroDone();
        onLoadingComplete();
      }}
    >
      {visible && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          aria-label="Loading CodeNinjaVik"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(ellipse at 50% 42%, hsl(0 40% 10%) 0%, hsl(0 0% 4%) 60%, hsl(0 0% 2%) 100%)" }}
        >
          {/* Floor grid in perspective for depth */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 [perspective:600px]" aria-hidden="true">
            <div
              className="absolute inset-x-[-50%] bottom-[-10%] h-[140%] origin-bottom opacity-40"
              style={{
                transform: "rotateX(72deg)",
                backgroundImage:
                  "linear-gradient(hsl(0 72% 51% / 0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(0 72% 51% / 0.25) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "linear-gradient(to top, black 10%, transparent 75%)",
                WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 75%)",
              }}
            />
          </div>

          {/* Gyroscope */}
          <motion.div
            exit={reduceMotion ? { opacity: 0 } : { scale: 2.6, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
            className="relative flex h-72 w-72 items-center justify-center [perspective:1000px]"
          >
            <div
              className="relative flex h-full w-full items-center justify-center [transform-style:preserve-3d] motion-reduce:![animation-duration:14s]"
              style={{ animation: "gyro-tilt 6s ease-in-out infinite" }}
            >
              {RINGS.map((r, i) => (
                <div
                  key={i}
                  className="absolute rounded-full [transform-style:preserve-3d] motion-reduce:![animation-duration:24s]"
                  style={{
                    width: r.size,
                    height: r.size,
                    border: `2px solid ${r.color}`,
                    boxShadow: `0 0 24px ${r.color}`,
                    // Reduced motion slows the rings right down (CSS media query, so SSR and client match).
                    animation: r.anim,
                  }}
                  aria-hidden="true"
                >
                  <span
                    className="absolute left-1/2 top-[-6px] h-3 w-3 -translate-x-1/2 rounded-full"
                    style={{ background: r.dot, boxShadow: `0 0 14px 3px ${r.dot}` }}
                  />
                </div>
              ))}

              {/* Core */}
              <div
                className="relative h-28 w-28 rounded-full p-[3px] motion-reduce:![animation:none]"
                style={{
                  background: "conic-gradient(from 200deg, hsl(0 90% 60%), hsl(350 70% 40%), hsl(0 90% 60%))",
                  boxShadow: "0 0 60px 10px hsl(0 72% 51% / 0.45), 0 0 140px 30px hsl(0 72% 51% / 0.2)",
                  animation: "core-breathe 2.4s ease-in-out infinite",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="h-full w-full rounded-full object-cover" width={112} height={112} />
              </div>
            </div>
          </motion.div>

          {/* Brand, letters flip up in 3D */}
          <h1 className="mt-10 flex font-display text-3xl font-extrabold tracking-[0.2em] text-foreground sm:text-4xl [perspective:600px]" aria-hidden="true">
            {BRAND.map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block origin-bottom"
                initial={{ opacity: 0, rotateX: -90, y: 12 }}
                animate={{ opacity: 1, rotateX: 0, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.55, delay: 0.15 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                style={{ color: i < 4 ? "hsl(0 80% 60%)" : undefined }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">AI voice assistants for your PC and phone</p>

          {/* Real progress */}
          <div className="mt-8 w-56" aria-hidden="true">
            <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full origin-left rounded-full bg-gradient-to-r from-primary to-rose-400"
                style={{ transform: `scaleX(${progress / 100})`, boxShadow: "0 0 12px hsl(0 72% 51% / 0.8)" }}
              />
            </div>
            <p className="mt-2 text-center text-xs tabular-nums text-muted-foreground">{Math.round(progress)}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
