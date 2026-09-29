"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * Pointer-driven 3D tilt with a moving light glare. Children opt into depth with <Layer depth={n}>.
 * Only runs on precise pointers (mouse/trackpad) and never under prefers-reduced-motion — on touch the
 * card simply renders flat, so nothing depends on hover.
 */
export function Tilt3D({
  children,
  className = "",
  max = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches && !reduceMotion);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduceMotion]);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 160, damping: 18, mass: 0.6 });
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const glareX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 55%)`;

  // While a button is pressed the card must hold perfectly still: if it tilts between pointerdown and
  // pointerup, the release lands on a different element and the browser never fires `click`.
  const pressed = useRef(false);

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || pressed.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const freeze = () => {
    pressed.current = true;
    px.set(sx.get());
    py.set(sy.get());
    sx.jump(sx.get());
    sy.jump(sy.get());
  };
  const release = () => {
    pressed.current = false;
  };
  const reset = () => {
    pressed.current = false;
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className={`[perspective:1200px] ${className}`}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerDownCapture={freeze}
        onPointerUpCapture={release}
        onPointerCancel={release}
        onPointerLeave={reset}
        style={enabled ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="relative h-full will-change-transform"
      >
        {children}
        {glare && enabled && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
            style={{ background: glareBg, borderRadius: "inherit" }}
          />
        )}
      </motion.div>
    </div>
  );
}

/** Lifts its content toward the viewer inside a Tilt3D (no effect when tilt is off). */
export function Layer({ depth = 30, className = "", children }: { depth?: number; className?: string; children: ReactNode }) {
  return (
    <div className={className} style={{ transform: `translateZ(${depth}px)`, transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
