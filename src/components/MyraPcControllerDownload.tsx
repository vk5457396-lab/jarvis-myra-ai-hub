"use client";

import { motion } from "framer-motion";
import { Monitor, DownloadCloud, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePcRelease } from "@/hooks/usePcRelease";
import { myraPcControllerFeatures } from "@/data/features";

const BANNER = "/assets/myra-pc/promo-banner.png";

interface MyraPcControllerDownloadProps {
  /** Section heading + badge. Turn off when the page already introduces the block. */
  showHeading?: boolean;
  /** Feature bullet list — off on the dedicated /download page, on elsewhere. */
  showFeatures?: boolean;
  className?: string;
}

const ACCENT = "0 84% 55%";

/**
 * The single MYRA PC Controller (.exe) download block. Rendered on the home page, the pricing
 * page, /download and /products so all four stay in sync. Always free, no login/payment gate —
 * mirrors MyraAndroidDownload's layout but there's nothing to buy or unlock here.
 */
const MyraPcControllerDownload = ({
  showHeading = true,
  showFeatures = true,
  className = "",
}: MyraPcControllerDownloadProps) => {
  const { release, loading } = usePcRelease();

  const handleDownload = () => {
    if (!release?.download_url) return;
    window.open(release.download_url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {showHeading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border font-display text-sm tracking-wider mb-4"
              style={{ borderColor: `hsla(${ACCENT}, 0.3)`, color: `hsla(${ACCENT}, 1)` }}
            >
              <Monitor size={16} /> PC CONTROLLER
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Control Your <span className="text-red-400">PC</span> from MYRA Android
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Free desktop companion for Windows — connect it to the MYRA Android app and control your PC&apos;s screen, files and apps right from your phone.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
              <div
                className="absolute inset-[-200%]"
                style={{
                  background: `conic-gradient(from 0deg, hsla(${ACCENT}, 0.35), transparent 40%, hsla(28,92%,55%,0.35), transparent 80%)`,
                }}
              />
            </div>
            <div
              className="relative rounded-[calc(1rem-1px)] m-px overflow-hidden"
              style={{ background: `linear-gradient(165deg, hsla(${ACCENT}, 0.05) 0%, hsla(0,0%,7%,0.97) 100%)` }}
            >
              <img src={BANNER} alt="MYRA PC Controller" className="w-full aspect-video object-cover" loading="lazy" />

              <div className="p-6 md:p-8">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-red-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/25 shrink-0">
                        <Monitor size={26} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-xl font-black text-foreground leading-tight">MYRA PC Controller</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {release?.version_name ? `v${release.version_name}` : "Windows .exe"}
                          {release?.file_size_mb ? ` • ${release.file_size_mb} MB` : ""} • Windows 10/11
                        </p>
                      </div>
                      <span className="ml-auto text-[10px] font-display font-black px-3 py-1.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-300 shrink-0">
                        FREE
                      </span>
                    </div>

                    {showFeatures && (
                      <ul className="space-y-2.5 mb-6">
                        {myraPcControllerFeatures.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <span className="w-4 h-4 rounded-md bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={9} className="text-white" strokeWidth={3} />
                            </span>
                            <span className="text-sm text-foreground/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {release?.download_url ? (
                      <Button
                        onClick={handleDownload}
                        className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 font-display font-bold gap-2 h-12"
                      >
                        <DownloadCloud size={18} /> Download MYRA PC Controller (.exe)
                      </Button>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        <Sparkles size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Download link coming soon.</p>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground text-center mt-5 leading-relaxed">
                      After the download finishes, open the file and allow{" "}
                      <span className="text-foreground/70">&quot;More info → Run anyway&quot;</span> if Windows SmartScreen asks.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MyraPcControllerDownload;
