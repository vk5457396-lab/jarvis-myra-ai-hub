"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Mic, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesSummary from "@/components/SalesSummary";

const logo = "/assets/logo.png";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: glowY }}
          animate={{ x: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[620px] h-[620px] rounded-full bg-primary/10 blur-[140px]"
        />
      </div>

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container mx-auto px-4 relative z-10">
        {/* Centered text block */}
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-primary/30 mb-7"
          >
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary/90 tracking-wide">
              Next-gen AI voice automation
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6 text-balance"
          >
            <span className="text-foreground">Your PC, run entirely by</span>{" "}
            <span className="gradient-text">voice</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-9"
          >
            Automate daily tasks, control apps, and get things done hands-free with{" "}
            <span className="text-primary font-semibold">Jarvis</span> &amp;{" "}
            <span className="text-foreground font-semibold">MYRA</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/pricing">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                <span>Buy Jarvis — ₹799</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="glass" size="xl" className="group w-full sm:w-auto">
                <span>Buy MYRA — ₹799</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Full-width product panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative mt-16 md:mt-20 max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl glass-card p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative shrink-0"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-neon blur-2xl opacity-40" />
                <img
                  src={logo}
                  alt="AI Assistant"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/50 shadow-neon-cyan relative z-10"
                />
              </motion.div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl glass"
                >
                  <span className="p-2 rounded-lg bg-primary/15 text-primary"><Mic size={18} /></span>
                  <span className="text-sm text-foreground/80">"Open Chrome and search for..."</span>
                </motion.div>
                <motion.div
                  animate={{ x: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl glass"
                >
                  <span className="p-2 rounded-lg bg-primary/15 text-primary"><Cpu size={18} /></span>
                  <span className="text-sm text-foreground/80">System command executed</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sales stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14"
        >
          <SalesSummary />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
