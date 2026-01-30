import { useEffect, useRef } from "react";
import aiBackgroundVideo from "@/assets/ai-background.mp4";

const BackgroundVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Force video to play on mount
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
        style={{ 
          opacity: 0.45,
          filter: "saturate(1.3) contrast(1.1)",
        }}
      >
        <source src={aiBackgroundVideo} type="video/mp4" />
      </video>
      {/* Dark overlay for better content readability */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
};

export default BackgroundVideo;
