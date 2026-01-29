import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoThumbnail from "@/components/VideoThumbnail";
import { Play } from "lucide-react";

const jarvisVideos = [
  {
    id: "cDaGBD_5AvA",
    title: "Jarvis Complete Setup Guide",
    description: "Learn how to install and configure Jarvis AI Assistant step by step.",
  },
];

const myraVideos = [
  {
    id: "xw1IQJGzWI8",
    title: "MYRA Complete Setup Guide",
    description: "Complete walkthrough for setting up MYRA Personal Assistant.",
  },
  {
    id: "coUcGoNQb24",
    title: "MYRA EXE Setup Video",
    description: "Step-by-step guide for MYRA EXE installation and setup.",
  },
  {
    id: "6VK8oCE-Vok",
    title: "MYRA 2.0 Setup Guide",
    description: "Latest setup tutorial for the new MYRA 2.0 version with enhanced features.",
  },
];

const DemoVideos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary font-display text-sm tracking-wider mb-6">
              <Play size={16} />
              VIDEO TUTORIALS
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="gradient-text">Demo Videos</span> & Tutorials
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Watch step-by-step guides to set up and master your AI voice assistant. Learn all features and get the most out of Jarvis & MYRA.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Jarvis Videos Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary text-glow-cyan">Jarvis</span> Tutorials
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Complete video guides for the Jarvis AI System Assistant. From installation to advanced features.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jarvisVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <VideoThumbnail
                  videoId={video.id}
                  title={video.title}
                  variant="jarvis"
                />
                <div className="mt-4">
                  <h3 className="font-display text-lg font-semibold mb-2">{video.title}</h3>
                  <p className="text-muted-foreground text-sm">{video.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MYRA Videos Section */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="text-secondary text-glow-purple">MYRA</span> Tutorials
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Step-by-step video guides for MYRA Personal Voice Assistant. Perfect for getting started quickly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myraVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <VideoThumbnail
                  videoId={video.id}
                  title={video.title}
                  variant="myra"
                />
                <div className="mt-4">
                  <h3 className="font-display text-lg font-semibold mb-2">{video.title}</h3>
                  <p className="text-muted-foreground text-sm">{video.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 text-center"
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
              More Tutorials <span className="gradient-text">Coming Soon</span>
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We're constantly adding new video tutorials covering advanced features, tips & tricks, and use cases. Stay tuned!
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DemoVideos;
