"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, VideoOff } from "lucide-react";
import VideoModal from "./VideoModal";

interface VideoThumbnailProps {
  videoId: string;
  title: string;
  variant?: "jarvis" | "myra";
}

const VideoThumbnail = ({ videoId, title, variant = "jarvis" }: VideoThumbnailProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // `maxresdefault` only exists for some uploads, and nothing exists at all once
  // a video is removed — one attempt, then a styled placeholder. Chaining a
  // second YouTube URL just doubled the 404s in the console.
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {thumbnailFailed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
              <VideoOff className="w-10 h-10 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60 px-4 text-center line-clamp-2">{title}</span>
            </div>
          ) : (
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setThumbnailFailed(true)}
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-colors duration-300" />

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center ${
                variant === "jarvis"
                  ? "bg-primary/90 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.5)] group-hover:shadow-[0_0_50px_hsl(var(--neon-cyan)/0.7)]"
                  : "bg-secondary/90 shadow-[0_0_30px_hsl(var(--neon-purple)/0.5)] group-hover:shadow-[0_0_50px_hsl(var(--neon-purple)/0.7)]"
              } backdrop-blur-sm transition-all duration-300`}
            >
              <Play className="w-8 h-8 md:w-10 md:h-10 text-background ml-1" fill="currentColor" />
            </motion.div>
          </div>

          {/* Duration badge (optional visual) */}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-xs font-medium">
            Watch Now
          </div>
        </div>
      </motion.div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoId={videoId}
        title={title}
      />
    </>
  );
};

export default VideoThumbnail;
