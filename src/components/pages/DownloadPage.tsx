"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoThumbnail from "@/components/VideoThumbnail";
import { MyraAndroidListing, MyraPcListing } from "@/components/download/MyraListings";

const steps = [
  { title: "Sign in", desc: "Use the same codeninjavik.in account you use on the website." },
  { title: "Download the APK", desc: "The file downloads straight from our release CDN — it resumes if your network drops." },
  { title: "Allow the install", desc: "Open the downloaded file and tap \"Allow from this source\" if Android asks." },
];

const setupVideos = [
  {
    id: "nyUVa692EIs",
    title: "MYRA Full Setup Video",
    description: "Full end-to-end setup walkthrough for MYRA, from install to first use.",
  },
  {
    id: "A_4LBZHH8nE",
    title: "API Setup Video",
    description: "How to get and configure your own API keys for MYRA's AI providers.",
  },
];

const DownloadPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Play-Store-style listings: MYRA for Android, then the free PC Controller */}
      <main className="container mx-auto max-w-6xl px-4 pt-28 md:pt-36">
        <MyraAndroidListing />
        <hr className="my-16 border-white/10" />
        <MyraPcListing />
      </main>

      <div className="h-16 md:h-24" />

      {/* How to install */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto grid gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-5 flex items-start gap-4"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-display font-black text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display font-bold text-foreground text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup videos */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
              <span className="gradient-text">Setup</span> Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {setupVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <VideoThumbnail videoId={video.id} title={video.title} variant="myra" />
                  <div className="mt-3">
                    <h3 className="font-display text-base font-semibold">{video.title}</h3>
                    <p className="text-muted-foreground text-sm">{video.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DownloadPage;
