"use client";

import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MyraAndroidDownload from "@/components/MyraAndroidDownload";

const steps = [
  { title: "Sign in", desc: "Use the same codeninjavik.in account you use on the website." },
  { title: "Download the APK", desc: "The file downloads straight from our release CDN — it resumes if your network drops." },
  { title: "Allow the install", desc: "Open the downloaded file and tap \"Allow from this source\" if Android asks." },
];

const DownloadPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-8 md:pt-36 md:pb-10 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
              <Smartphone size={30} className="text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Download MYRA for Android
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Android APK — direct from our official release.</p>
          </motion.div>
        </div>
      </section>

      <MyraAndroidDownload showHeading={false} className="pb-16 md:pb-20" />

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

      <Footer />
    </div>
  );
};

export default DownloadPage;
