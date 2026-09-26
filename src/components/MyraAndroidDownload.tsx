"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Smartphone,
  DownloadCloud,
  LogIn,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppRelease } from "@/hooks/useAppRelease";
import { startAppDownload, openDownload } from "@/lib/appDownload";
import { myraAndroidFeatures } from "@/data/features";
import { getStoredReferralCode } from "@/lib/referral";

const LIFETIME_PLAN = "membership";
const LIFETIME_PRICE = 999;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

interface MyraAndroidDownloadProps {
  /** Section heading + badge. Turn off when the page already introduces the block. */
  showHeading?: boolean;
  /** Feature bullet list — off on the dedicated /download page, on elsewhere. */
  showFeatures?: boolean;
  className?: string;
}

const ACCENT = "152 70% 50%";

/**
 * The single MYRA Android download block. Rendered on the home page, the
 * pricing page and /download so all three stay in sync — there is only one
 * copy of the download logic to keep working.
 */
const MyraAndroidDownload = ({
  showHeading = true,
  showFeatures = true,
  className = "",
}: MyraAndroidDownloadProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { release, loading } = useAppRelease();
  const [downloading, setDownloading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Free for anyone who's ever paid before (in-app purchase, admin grant, or an earlier website
  // key) - see /api/myra/download-access. null while unchecked/checking, so the paid-vs-free UI
  // never flashes the wrong state before the check lands.
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [buying, setBuying] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);

  const checkAccess = async () => {
    setCheckingAccess(true);
    try {
      const res = await fetch("/api/myra/download-access");
      const json = await res.json();
      if (res.ok && json.success) {
        setHasAccess(!!json.data.has_access);
        setIssuedKey(json.data.key ?? null);
      }
    } catch {
      // Leave hasAccess null - the buy button stays the safe default until this succeeds.
    } finally {
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (session?.user) checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  const handleBuyLifetime = async () => {
    setBuying(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast.error("Could not load payment gateway.");
        return;
      }
      const orderRes = await fetch("/api/myra/website-purchase/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: LIFETIME_PLAN }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        toast.error(orderJson.message || "Could not start payment");
        return;
      }
      const order = orderJson.data;

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "MYRA",
        description: "MYRA for Android - lifetime access",
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#10b981" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/myra/website-purchase/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              plan: LIFETIME_PLAN,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              referral_code: getStoredReferralCode(),
            }),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok || !verifyJson.success) {
            toast.error(verifyJson.message || "Payment succeeded but key issuance failed. Contact support.");
            return;
          }
          toast.success(`Payment successful — your access key: ${verifyJson.data.key}`);
          setHasAccess(true);
          setIssuedKey(verifyJson.data.key);
        },
        modal: { ondismiss: () => setBuying(false) },
      });
      checkout.open();
    } catch {
      toast.error("Could not start payment. Try again.");
    } finally {
      setBuying(false);
    }
  };

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
    <section className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

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
              <Smartphone size={16} /> ANDROID APP
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Get <span className="text-emerald-400">MYRA</span> on Your Phone
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              One-time ₹999, lifetime access. Sign in, pay once, download the APK — your voice assistant lives in your pocket forever.
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
                  background: `conic-gradient(from 0deg, hsla(${ACCENT}, 0.35), transparent 40%, hsla(168,75%,45%,0.35), transparent 80%)`,
                }}
              />
            </div>
            <div
              className="relative rounded-[calc(1rem-1px)] m-px p-6 md:p-8"
              style={{ background: `linear-gradient(165deg, hsla(${ACCENT}, 0.05) 0%, hsla(0,0%,7%,0.97) 100%)` }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                </div>
              ) : release ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                      <Smartphone size={26} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xl font-black text-foreground leading-tight">MYRA for Android</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        v{release.version_name}
                        {release.file_size_mb ? ` • ${release.file_size_mb} MB` : ""} • Android 8.0+
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] font-display font-black px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 shrink-0">
                      {session?.user && hasAccess ? "UNLOCKED" : `₹${LIFETIME_PRICE} · LIFETIME`}
                    </span>
                  </div>

                  {showFeatures && (
                    <ul className="space-y-2.5 mb-6">
                      {myraAndroidFeatures.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span className="w-4 h-4 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={9} className="text-white" strokeWidth={3} />
                          </span>
                          <span className="text-sm text-foreground/70">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {release.release_notes && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">WHAT&apos;S NEW</p>
                      <p className="text-sm text-foreground/80 whitespace-pre-line">{release.release_notes}</p>
                    </div>
                  )}

                  {status === "loading" ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : !session?.user ? (
                    <>
                      <Button
                        onClick={() => router.push("/login")}
                        className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary font-display font-bold gap-2 h-12"
                      >
                        <LogIn size={18} /> Login to Continue
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                        <ShieldCheck size={12} /> Login required — keeps downloads secure and trackable.
                      </p>
                    </>
                  ) : checkingAccess || hasAccess === null ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 size={18} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : hasAccess ? (
                    <>
                      <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-bold gap-2 h-12"
                      >
                        {downloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
                        {downloading ? "Getting your link..." : "Download APK"}
                      </Button>
                      {fallbackUrl && (
                        <button
                          onClick={() => openDownload(fallbackUrl)}
                          className="w-full text-xs text-muted-foreground hover:text-emerald-300 transition-colors mt-3 inline-flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink size={12} /> Download didn&apos;t start? Tap here
                        </button>
                      )}
                      {issuedKey && (
                        <p className="text-[11px] text-muted-foreground text-center mt-3">
                          Your access key ({issuedKey}) is also on your{" "}
                          <button onClick={() => router.push("/dashboard")} className="underline hover:text-emerald-300">
                            dashboard
                          </button>{" "}
                          any time.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleBuyLifetime}
                        disabled={buying}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-display font-bold gap-2 h-12"
                      >
                        {buying ? <Loader2 size={18} className="animate-spin" /> : <IndianRupee size={18} />}
                        {buying ? "Opening payment..." : `Buy MYRA — ₹${LIFETIME_PRICE} (Lifetime)`}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
                        <ShieldCheck size={12} /> One-time payment. You&apos;ll get an access key + the download instantly.
                      </p>
                    </>
                  )}

                  <p className="text-[11px] text-muted-foreground text-center mt-5 leading-relaxed">
                    After the download finishes, open the file and allow{" "}
                    <span className="text-foreground/70">&quot;Install unknown apps&quot;</span> if Android asks.
                  </p>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No release published yet. Check back soon.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MyraAndroidDownload;
