"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";
import { Check, ChevronRight, Mic, ShieldCheck, Infinity as InfinityIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesSummary from "@/components/SalesSummary";
import type { CorePhase } from "@/components/home/VoiceCore";
import { INTRO_DONE_EVENT, isIntroDone } from "@/components/LoadingScreen";

// WebGL is client-only and not needed for first paint — load it after the text is on screen.
const VoiceCore = dynamic(() => import("@/components/home/VoiceCore"), { ssr: false, loading: () => null });

/** Real things Jarvis/MYRA do (see data/features.ts), shown as the core "speaks". */
const COMMANDS = [
  { say: "Open Chrome and search today's weather", done: "Chrome opened with the weather" },
  { say: "Send WhatsApp to Rahul: running 10 minutes late", done: "WhatsApp message sent" },
  { say: "Set volume to 40 percent", done: "Volume set to 40%" },
  { say: "Shut down the PC in 10 minutes", done: "Shutdown scheduled for 10 minutes" },
];

const TRUST = [
  { icon: InfinityIcon, label: "One-time payment" },
  { icon: RefreshCw, label: "Free updates" },
  { icon: ShieldCheck, label: "Secure Razorpay checkout" },
];

const HEADLINE = ["Your PC,", "run entirely", "by voice."];

/** Soft CSS stand-in shown before WebGL loads, and permanently if WebGL is unavailable. */
function CoreFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center [perspective:900px]" aria-hidden="true">
      {/* Transform-only CSS motion so the core still breathes when WebGL is unavailable. */}
      <div className="absolute h-[70%] w-[70%] rounded-full border border-primary/25 animate-[core-orbit_14s_linear_infinite] [transform-style:preserve-3d]" />
      <div className="h-[46%] w-[46%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#ff6b6b,#7f1d1d_55%,#1a0304_80%)] shadow-[0_0_120px_20px_rgba(220,38,38,0.35)] animate-[core-breathe_4.5s_ease-in-out_infinite]" />
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-primary motion-safe:animate-[voicebar_0.9s_ease-in-out_infinite]"
          style={{ height: "100%", animationDelay: `${i * 0.12}s`, animationPlayState: active ? "running" : "paused", transform: active ? undefined : "scaleY(0.3)" }}
        />
      ))}
    </span>
  );
}

const HeroSection = () => {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<CorePhase>("listening");
  const [cycle, setCycle] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);
  // Hold the WebGL core until the intro loader is gone: it would otherwise render hidden behind the
  // loader and compete with it for the GPU/CPU, making the intro stutter and last longer.
  const [introDone, setIntroDone] = useState(false);
  /** Entrance transition; instant under reduced motion (the start state must match SSR either way). */
  const enter = (t: Transition): Transition => (reduceMotion ? { duration: 0 } : t);
  useEffect(() => {
    if (isIntroDone()) {
      setIntroDone(true);
      return;
    }
    const on = () => setIntroDone(true);
    window.addEventListener(INTRO_DONE_EVENT, on);
    // Safety net: never leave the hero empty if the event is somehow missed.
    const fallback = setTimeout(on, 6000);
    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, on);
      clearTimeout(fallback);
    };
  }, []);

  const command = COMMANDS[(Math.max(cycle, 1) - 1) % COMMANDS.length];
  const showCommand = cycle > 0;

  return (
    <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          {/* Copy */}
          <div className="relative z-10 text-center lg:text-left">
            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.4rem] [perspective:800px]">
              {HEADLINE.map((line, i) => (
                <motion.span
                  key={line}
                  className="block origin-bottom"
                  initial={{ opacity: 0, y: 28, rotateX: -55 }}
                  animate={introDone ? { opacity: 1, y: 0, rotateX: 0 } : undefined}
                  transition={enter({ duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] })}
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={introDone ? { opacity: 1, y: 0 } : undefined}
              transition={enter({ duration: 0.6, delay: 0.45 })}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0"
            >
              Jarvis and MYRA open apps, send WhatsApp messages, control volume and power, and run your daily tasks when you ask out loud.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={introDone ? { opacity: 1, y: 0 } : undefined}
              transition={enter({ duration: 0.6, delay: 0.55 })}
              className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link href="/pricing">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                  <span>Buy Jarvis for ₹899</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/pricing#myra-buy">
                <Button variant="glass" size="xl" className="group w-full sm:w-auto">
                  <span>Get MYRA for ₹999</span>
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={introDone ? { opacity: 1 } : undefined}
              transition={enter({ duration: 0.6, delay: 0.7 })}
              className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start"
            >
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon size={15} className="text-primary" aria-hidden="true" /> {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* 3D voice core with live command bubbles */}
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={introDone ? { opacity: 1, scale: 1 } : undefined}
            transition={enter({ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] })}
            className="relative mx-auto aspect-square w-full max-w-[520px]"
          >
            <CoreFallback />
            {introDone && !webglFailed && (
              <VoiceCore
                className="absolute inset-0"
                onUnsupported={() => setWebglFailed(true)}
                onPhase={(p, c) => {
                  setPhase(p);
                  setCycle(c);
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-2 px-4" aria-live="polite">
              <AnimatePresence mode="popLayout">
                {showCommand && (
                  <motion.div
                    key={`say-${cycle}`}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-md"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Mic size={14} aria-hidden="true" />
                    </span>
                    <span className="truncate text-sm text-foreground/90">&ldquo;{command.say}&rdquo;</span>
                    <Waveform active={phase === "speaking"} />
                  </motion.div>
                )}
                {showCommand && phase === "listening" && (
                  <motion.div
                    key={`done-${cycle}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm text-emerald-300 backdrop-blur-md"
                  >
                    <Check size={14} aria-hidden="true" /> {command.done}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="mt-14 md:mt-16">
          <SalesSummary />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
