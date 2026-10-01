"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useAppRelease } from "@/hooks/useAppRelease";
import { startAppDownload } from "@/lib/appDownload";
import { getStoredReferralCode } from "@/lib/referral";
import { showPaymentFailed } from "@/lib/paymentFailed";

export const MYRA_LIFETIME_PLAN = "membership";
export const MYRA_LIFETIME_PRICE = 999;

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

/** In-flight /api/myra/download-access request shared by every mounted copy of the hook. */
let accessRequest: Promise<{ ok: boolean; json: any }> | null = null;

/**
 * The one copy of MYRA for Android's buy → access key → APK download flow, shared by every surface
 * that sells or downloads the app (the classic download card and the Play-Store-style listing), so
 * the paywall can never differ between them.
 */
export function useMyraPurchase() {
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

  // Remembered per browser session for 10 minutes: every MYRA surface on every page used to call
  // /api/myra/download-access (a Firestore read). Safe to cache client-side because the APK
  // endpoint re-checks access server-side on every download.
  const cacheKey = session?.user?.email ? `myra-access:${session.user.email.toLowerCase()}` : null;
  const ACCESS_TTL_MS = 10 * 60_000;
  const remember = (has: boolean, key: string | null) => {
    if (!cacheKey) return;
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ has, key, at: Date.now() }));
    } catch {
      // storage blocked — just refetch next time
    }
  };

  const checkAccess = async () => {
    if (cacheKey) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (cached && Date.now() - cached.at < ACCESS_TTL_MS) {
          setHasAccess(!!cached.has);
          setIssuedKey(cached.key ?? null);
          return;
        }
      } catch {
        // fall through to the network
      }
    }
    setCheckingAccess(true);
    try {
      // Several MYRA surfaces can mount on one page; share one request between them.
      accessRequest ??= fetch("/api/myra/download-access")
        .then(async (res) => ({ ok: res.ok, json: await res.json() }))
        .finally(() => {
          accessRequest = null;
        });
      const { ok, json } = await accessRequest;
      if (ok && json.success) {
        setHasAccess(!!json.data.has_access);
        setIssuedKey(json.data.key ?? null);
        remember(!!json.data.has_access, json.data.key ?? null);
      }
    } catch {
      // Leave hasAccess null - the buy button stays the safe default until this succeeds.
    } finally {
      setCheckingAccess(false);
    }
  };

  useEffect(() => {
    if (session?.user) checkAccess();
  }, [session?.user]);

  const buy = async () => {
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
        body: JSON.stringify({ plan: MYRA_LIFETIME_PLAN }),
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
              plan: MYRA_LIFETIME_PLAN,
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
          toast.success(`Payment successful — your access key: ${verifyJson.data.key}`, {
            description: "It's saved on your dashboard too.",
            duration: 12000,
            action: { label: "Dashboard", onClick: () => router.push("/dashboard") },
          });
          setHasAccess(true);
          setIssuedKey(verifyJson.data.key);
          remember(true, verifyJson.data.key);
        },
        modal: { ondismiss: () => setBuying(false) },
      });
      checkout.on("payment.failed", (response: any) => {
        setBuying(false);
        showPaymentFailed(response);
      });
      checkout.open();
    } catch {
      toast.error("Could not start payment. Try again.");
    } finally {
      setBuying(false);
    }
  };

  const download = async () => {
    if (!session?.user) {
      router.push(`/login?next=${encodeURIComponent("/download#myra-android")}`);
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

  return {
    session,
    status,
    release,
    loading,
    hasAccess,
    checkingAccess,
    issuedKey,
    buying,
    downloading,
    fallbackUrl,
    buy,
    download,
    // Come back to the MYRA listing after signing in, ready to buy.
    login: () => router.push(`/login?next=${encodeURIComponent("/download#myra-android")}`),
  };
}
