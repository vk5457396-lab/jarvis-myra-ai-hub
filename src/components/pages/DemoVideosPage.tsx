"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoThumbnail from "@/components/VideoThumbnail";
import { Play, Sparkles } from "lucide-react";

const tutorials = [
  {
    id: "nyUVa692EIs",
    title: "MYRA Full Setup Video",
    description: "Full end-to-end setup walkthrough for MYRA, from install to first use.",
    variant: "myra" as const,
    tag: "MYRA",
  },
  {
    id: "A_4LBZHH8nE",
    title: "API Setup Video",
    description: "How to get and configure your own API keys for MYRA's AI providers.",
    variant: "myra" as const,
    tag: "API KEYS",
  },
];

const DemoVideos = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-14 md:pt-40 md:pb-16 relative overflow-hidden">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-primary text-xs font-semibold tracking-wide mb-5">
              <Play size={14} />
              VIDEO TUTORIALS
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-[1.1]">
              Learn by <span className="gradient-text">watching</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Short, practical walkthroughs for setting up Jarvis &amp; MYRA — install, configure your API keys, and get running in minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Video grid */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tutorials.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-2xl glass-card p-3 hover:border-primary/30 transition-colors duration-300"
              >
                <div className="relative">
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-semibold tracking-wider text-primary border border-primary/30">
                    {video.tag}
                  </span>
                  <VideoThumbnail videoId={video.id} title={video.title} variant={video.variant} />
                </div>
                <div className="pt-4 px-1 pb-1">
                  <h3 className="font-display text-base font-semibold mb-1.5 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{video.description}</p>
                </div>
              </motion.div>
            ))}

            {/* Jarvis — coming soon card, same grid cell size as the video cards above */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: tutorials.length * 0.08 }}
              className="rounded-2xl border border-dashed border-white/15 p-3 flex flex-col"
            >
              <div className="aspect-video rounded-xl bg-white/[0.03] flex flex-col items-center justify-center gap-2 text-center px-6">
                <Sparkles className="text-primary" size={22} />
                <span className="text-sm text-muted-foreground">Jarvis video tutorials are in the works</span>
              </div>
              <div className="pt-4 px-1 pb-1">
                <h3 className="font-display text-base font-semibold mb-1.5 text-muted-foreground">Jarvis Setup Guide</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Coming soon — check back shortly.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DemoVideos;
