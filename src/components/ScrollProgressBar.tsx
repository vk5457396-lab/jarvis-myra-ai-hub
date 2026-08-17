"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin fixed bar across the very top of the viewport that fills as the user scrolls the page. */
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left bg-gradient-neon z-[60] pointer-events-none"
    />
  );
};

export default ScrollProgressBar;
