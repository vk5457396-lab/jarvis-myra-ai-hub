"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, DownloadCloud, LogIn, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ReleaseInfo {
  version_name: string;
  version_code: number;
  release_notes: string | null;
  file_size_mb: number | null;
  updated_at: string;
}

const DownloadPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loadingRelease, setLoadingRelease] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/app/release")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setRelease(body.data);
      })
      .finally(() => setLoadingRelease(false));
  }, []);

  const handleDownload = async () => {
    if (!session?.user) { router.push("/login"); return; }

    setDownloading(true);
    try {
      const res = await fetch("/api/app/release/download");

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.message || "Download failed. Try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CodeNinjaVik-${release?.version_name || "app"}.apk`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch {
      toast.error("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 max-w-xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <Smartphone size={30} className="text-white" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Download the App
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Android APK — direct from our official release.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.3), transparent 40%, hsla(263,70%,58%,0.3), transparent 80%)" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>

                {loadingRelease ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : release ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-display tracking-wider">LATEST VERSION</p>
                        <p className="text-xl font-display font-black text-foreground">v{release.version_name}</p>
                      </div>
                      {release.file_size_mb && (
                        <span className="text-xs font-display font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                          {release.file_size_mb} MB
                        </span>
                      )}
                    </div>

                    {release.release_notes && (
                      <div className="mb-5 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">WHAT'S NEW</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-line">{release.release_notes}</p>
                      </div>
                    )}

                    {status === "loading" ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                      </div>
                    ) : session?.user ? (
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 font-display font-bold gap-2 h-12"
                      >
                        {downloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
                        {downloading ? "Preparing download..." : "Download APK"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => router.push("/login")}
                          className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary font-display font-bold gap-2 h-12"
                        >
                          <LogIn size={18} /> Login to Download
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                          <ShieldCheck size={12} /> Login required — keeps downloads secure and trackable.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No release published yet. Check back soon.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DownloadPage;
