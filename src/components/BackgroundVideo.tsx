import aiBackgroundVideo from "@/assets/ai-background.mp4";

const BackgroundVideo = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover opacity-50"
        style={{ 
          filter: "saturate(1.2) contrast(1.1)",
        }}
      >
        <source src={aiBackgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Dark overlay for better content readability */}
      <div className="absolute inset-0 bg-background/50" />
    </div>
  );
};

export default BackgroundVideo;
