"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DownloadCloud, ExternalLink, Loader2, LogIn, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppRelease } from "@/hooks/useAppRelease";
import { startAppDownload, openDownload } from "@/lib/appDownload";

const THUMB = "/assets/myra-app/promo-thumb.png";
const BANNER = "/assets/myra-app/promo-banner.png";
const SCREENSHOTS = ["/assets/myra-app/screens-app.png", "/assets/myra-app/screens-auth.png"];

/**
 * Promotional preview card for /download: a collapsed thumbnail that expands
 * into the full banner, a screenshot gallery, and the download button.
 * Images are static files shipped with the site (public/assets/myra-app) —
 * not Blob/MongoDB-backed — so this card keeps working regardless of Blob
 * storage state.
 */
const MyraAppGalleryCard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { release } = useAppRelease();
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setDownloading(true);
    const result = await startAppDownload();
    setDownloading(false);

    if (!result.ok) {
      toast.error(result.message || "Download failed. Please try again.");
      return;
    }
    setFallbackUrl(result.url ?? null);
    toast.success("Download started — check your notification tray.");
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-background/40 backdrop-blur-md">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="relative block w-full aspect-video group"
        >
          <img src={THUMB} alt="MYRA — Your AI Assistant" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-background/30 group-hover:bg-background/10 transition-colors flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-sm font-display font-bold text-white shadow-lg">
              <Play size={16} fill="currentColor" /> Tap to preview
            </span>
          </div>
        </button>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <div className="relative">
              <img src={BANNER} alt="MYRA — Your AI Assistant" className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Close preview"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              {SCREENSHOTS.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt="MYRA app screenshot"
                  className="w-full aspect-video object-cover rounded-lg border border-white/10"
                  loading="lazy"
                />
              ))}
            </div>

            <div className="px-4 pb-4">
              {status === "loading" ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              ) : session?.user ? (
                <>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-bold gap-2 h-12"
                  >
                    {downloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
                    {downloading ? "Getting your link..." : release ? `Download MYRA v${release.version_name}` : "Download MYRA"}
                  </Button>
                  {fallbackUrl && (
                    <button
                      onClick={() => openDownload(fallbackUrl)}
                      className="w-full text-xs text-muted-foreground hover:text-emerald-300 transition-colors mt-2.5 inline-flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={12} /> Download didn&apos;t start? Tap here
                    </button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary font-display font-bold gap-2 h-12"
                >
                  <LogIn size={18} /> Login to Download
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default MyraAppGalleryCard;
